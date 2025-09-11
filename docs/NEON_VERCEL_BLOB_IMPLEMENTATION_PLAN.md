# **Neon + Vercel Blob Storage Implementation Plan**

## **Overview**
This document outlines the complete implementation plan for replacing localStorage with Neon database + Vercel Blob Storage to handle unlimited video storage and large media files.

## **Auth Integration Touchpoints**

- **Identity requirement**: `userId` must be present on all `history_items` and `media_files`. Plan to make it non-nullable after backfilling. For legacy/anonymous items, decide whether to associate with a pseudo user or restrict access until claimed.
- **Route protection**: Require authentication on all DB-backed and upload routes (`/api/history/*`, `/api/upload`). Enforce in middleware and in the handlers/server components.
- **Authorization rules**: Scope all DB queries and mutations by the authenticated `userId`. Derive `userId` from the session on the server; never trust a client-sent `userId`.
- **Blob scoping**: Generate short‑lived client direct‑upload URLs server-side with a per‑user prefix `users/{userId}/{yyyy}/{mm}/{uuid}.{ext}`. When listing or deleting, validate ownership via DB rows.
- **Rate limiting**: Apply per‑user limits on mutation/upload endpoints (fallback to IP for anonymous if supported).
- **Edge compatibility**: Verify the auth library supports Edge runtime. If not, set `export const runtime = 'nodejs'` for the affected routes or perform auth checks in Node-compatible layers.
- **See also**: `docs/AUTH_INTEGRATION.md` for full auth setup and examples (using Better Auth).

## **Phase 1: Setup & Dependencies**

### **1.1 Install Required Dependencies**
```bash
npm install @vercel/blob @neondatabase/serverless drizzle-orm zod
npm install -D @types/pg drizzle-kit
```

### **1.2 Environment Variables Setup**
Add to `.env.local`:
```env
# Neon Database
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require

# Vercel Blob
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx

# Optional: For development
NEON_DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

> Note: `BLOB_READ_WRITE_TOKEN` must remain server-only. Do not expose it to the client.

## **Phase 2: Database Schema Design**

### **2.1 Drizzle Schema Definition**
```typescript
// src/lib/db/schema.ts
import { pgTable, text, timestamp, jsonb, bigint, integer, index, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Optional enums (replace text columns below if you want strict enums)
export const fileTypeEnum = pgEnum('file_type_enum', ['image', 'video', 'audio']);
export const historyCategoryEnum = pgEnum('history_category_enum', ['image', 'video', 'audio', 'text', 'other']);

export const historyItems = pgTable('history_items', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  modelId: text('model_id').notNull(),
  modelName: text('model_name').notNull(),
  category: text('category').notNull(), // or: historyCategoryEnum('category').notNull()
  provider: text('provider').notNull(),
  prompt: text('prompt').notNull(),
  inputParams: jsonb('input_params').notNull().default(sql`'{}'::jsonb`),
  result: jsonb('result').notNull().default(sql`'{}'::jsonb`),
  metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  createdAtIdx: index('idx_history_items_created_at').on(table.createdAt.desc()),
  modelIdCreatedAtIdx: index('idx_history_items_model_id_created_at').on(table.modelId, table.createdAt.desc()),
  categoryCreatedAtIdx: index('idx_history_items_category_created_at').on(table.category, table.createdAt.desc()),
  searchIdx: index('idx_history_items_search').using('gin',
    sql`to_tsvector('english', ${table.prompt} || ' ' || ${table.modelName} || ' ' || ${table.category})`
  ),
}));

export const mediaFiles = pgTable('media_files', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  historyItemId: text('history_item_id').notNull().references(() => historyItems.id, { onDelete: 'cascade' }),
  fileType: text('file_type').notNull(), // or: fileTypeEnum('file_type').notNull()
  blobUrl: text('blob_url').notNull(),
  originalFilename: text('original_filename'),
  fileSize: bigint('file_size', { mode: 'bigint' }),
  contentType: text('content_type'),
  checksumSha256: text('checksum_sha256'),
  width: integer('width'),
  height: integer('height'),
  duration: integer('duration'), // for video/audio
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  historyItemIdIdx: index('idx_media_files_history_item_id').on(table.historyItemId),
  fileTypeIdx: index('idx_media_files_type').on(table.fileType),
  deletedAtIdx: index('idx_media_files_deleted_at').on(table.deletedAt),
  uniqueBlobPerItem: uniqueIndex('uq_media_files_item_blob').on(table.historyItemId, table.blobUrl),
  uniqueChecksumPerItem: uniqueIndex('uq_media_files_item_checksum').on(table.historyItemId, table.checksumSha256),
}));

// Relations
export const historyItemsRelations = relations(historyItems, ({ many }) => ({
  mediaFiles: many(mediaFiles),
}));

export const mediaFilesRelations = relations(mediaFiles, ({ one }) => ({
  historyItem: one(historyItems, {
    fields: [mediaFiles.historyItemId],
    references: [historyItems.id],
  }),
}));

// Types
export type HistoryItem = typeof historyItems.$inferSelect;
export type NewHistoryItem = typeof historyItems.$inferInsert;
export type MediaFile = typeof mediaFiles.$inferSelect;
export type NewMediaFile = typeof mediaFiles.$inferInsert;
```

### **2.2 Drizzle Configuration**
```typescript
// src/lib/db/index.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

### **2.3 Drizzle Kit Configuration**
```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

## **Phase 3: Core Services Implementation**

### **3.1 Database Service with Drizzle**
```typescript
// src/services/database.ts
import { db } from '@/lib/db';
import { historyItems, mediaFiles, type HistoryItem, type NewHistoryItem, type MediaFile, type NewMediaFile } from '@/lib/db/schema';
import { eq, desc, and, or, like, sql } from 'drizzle-orm';

export class DatabaseService {
  private static instance: DatabaseService;

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // History CRUD operations
  async createHistoryItem(item: Omit<NewHistoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = crypto.randomUUID();
    await db.insert(historyItems).values({
      ...item,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return id;
  }

  async getHistoryItems(limit?: number, offset?: number): Promise<HistoryItem[]> {
    let query = db.select().from(historyItems).orderBy(desc(historyItems.createdAt));
    
    if (limit) query = query.limit(limit);
    if (offset) query = query.offset(offset);
    
    return await query;
  }

  async getHistoryItem(id: string): Promise<HistoryItem | null> {
    const result = await db.select().from(historyItems).where(eq(historyItems.id, id)).limit(1);
    return result[0] || null;
  }

  async updateHistoryItem(id: string, updates: Partial<NewHistoryItem>): Promise<boolean> {
    const result = await db
      .update(historyItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(historyItems.id, id));
    return result.rowCount > 0;
  }

  async deleteHistoryItem(id: string): Promise<boolean> {
    const result = await db.delete(historyItems).where(eq(historyItems.id, id));
    return result.rowCount > 0;
  }

  async searchHistory(query: string): Promise<HistoryItem[]> {
    return await db
      .select()
      .from(historyItems)
      .where(
        sql`to_tsvector('english', ${historyItems.prompt} || ' ' || ${historyItems.modelName} || ' ' || ${historyItems.category}) @@ plainto_tsquery('english', ${query})`
      )
      .orderBy(desc(historyItems.timestamp));
  }

  async filterByModel(modelId: string): Promise<HistoryItem[]> {
    return await db
      .select()
      .from(historyItems)
      .where(eq(historyItems.modelId, modelId))
      .orderBy(desc(historyItems.createdAt));
  }

  async filterByCategory(category: string): Promise<HistoryItem[]> {
    return await db
      .select()
      .from(historyItems)
      .where(eq(historyItems.category, category))
      .orderBy(desc(historyItems.createdAt));
  }

  // Media file operations
  async createMediaFile(file: Omit<NewMediaFile, 'id' | 'createdAt'>): Promise<string> {
    const id = crypto.randomUUID();
    await db.insert(mediaFiles).values({
      ...file,
      id,
      createdAt: new Date(),
    });
    return id;
  }

  async getMediaFiles(historyItemId: string): Promise<MediaFile[]> {
    return await db
      .select()
      .from(mediaFiles)
      .where(eq(mediaFiles.historyItemId, historyItemId))
      .orderBy(desc(mediaFiles.createdAt));
  }

  async deleteMediaFile(id: string): Promise<boolean> {
    const result = await db.delete(mediaFiles).where(eq(mediaFiles.id, id));
    return result.rowCount > 0;
  }

  // Get history items with their media files
  async getHistoryItemsWithMedia(limit?: number, offset?: number) {
    return await db
      .select()
      .from(historyItems)
      .leftJoin(mediaFiles, eq(historyItems.id, mediaFiles.historyItemId))
      .orderBy(desc(historyItems.createdAt))
      .limit(limit || 50)
      .offset(offset || 0);
  }
}
```

### **3.2 Vercel Blob Service**
```typescript
// src/services/blob-storage.ts
import { put, del, list } from '@vercel/blob';

export class BlobStorageService {
  private static instance: BlobStorageService;

  public static getInstance(): BlobStorageService {
    if (!BlobStorageService.instance) {
      BlobStorageService.instance = new BlobStorageService();
    }
    return BlobStorageService.instance;
  }

  // Prefer direct client uploads; keep server-side upload as a fallback
  async getClientUploadUrl(params: { path?: string; contentType: string; maxSize?: number; checksumSha256?: string }): Promise<{ uploadUrl: string; id: string; expiresAt: string }>
  async uploadFile(file: File, path?: string): Promise<BlobUploadResult> // fallback path for small files
  async deleteFile(url: string): Promise<boolean>
  async listFiles(prefix?: string): Promise<BlobFile[]>
  async getSignedUrl(url: string): Promise<string> // short-lived, private-by-default access
}
```

### **3.3 New History Storage Service**
```typescript
// src/services/history-storage-cloud.ts
export class CloudHistoryStorage {
  private static instance: CloudHistoryStorage;
  private db: DatabaseService;
  private blob: BlobStorageService;

  // Replace localStorage methods with cloud equivalents
  async addItem(item: Omit<HistoryItem, 'id' | 'timestamp'>): Promise<string>
  async getAllHistory(): Promise<HistoryItem[]>
  async removeItem(id: string): Promise<boolean>
  async clearHistory(): Promise<void>
  async searchHistory(query: string): Promise<HistoryItem[]>
  // ... all other methods from localStorage version
}
```

## **Phase 4: API Routes**

```typescript
// For all DB-backed API routes
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
```

### **4.1 History Management API**
```typescript
// src/app/api/history/route.ts
export async function GET() // Get all history
export async function POST() // Create new history item
export async function DELETE() // Clear all history
// Notes:
// - Validate payloads with Zod
// - Use rate limiting on mutating endpoints
// - Prefer cursor-based pagination: /api/history?cursor=<id>&limit=50
// - Support idempotency keys on POST/PUT via header: Idempotency-Key
// - Require auth; derive userId from server session, never from client input
```

### **4.2 Individual History Item API**
```typescript
// src/app/api/history/[id]/route.ts
export async function GET() // Get specific item
export async function PUT() // Update item
export async function DELETE() // Delete item
```

### **4.3 File Upload API (Enhanced)**
```typescript
// src/app/api/upload/route.ts (enhance existing)
// Add support for Vercel Blob storage
// Prefer generating short-lived client direct-upload URLs (private by default)
// Keep server-side upload fallback for small files
// Validate content-type and max size with Zod
// Return structured response with: { uploadUrl | blobUrl, signedUrl, checksumSha256, width, height, duration }
// Use deterministic paths: users/{userId}/{yyyy}/{mm}/{uuid}.{ext}
// When listing blobs, paginate using Blob API cursors
// Require auth; userId is derived from server session, not request body
```

### **4.4 Search & Filter API**
```typescript
// src/app/api/history/search/route.ts
export async function GET() // Search history with filters
// Notes:
// - Support cursor-based pagination: ?q=...&cursor=...&limit=...
// - Consider returning { items, nextCursor }
// - Consider a stored/generated tsvector column for faster search at scale
```

## **Phase 5: Database Migration & Setup**

### **5.1 Drizzle Migration Commands**
```bash
# Generate migration files
npx drizzle-kit generate

# Apply migrations to database
npx drizzle-kit push

# View database in Drizzle Studio
npx drizzle-kit studio
```

Add scripts to `package.json` for convenience:
```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

### **5.2 Migration Script**
```typescript
// src/scripts/migrate-to-cloud.ts
import { DatabaseService } from '@/services/database';
import { BlobStorageService } from '@/services/blob-storage';

// 1. Read existing localStorage data
// 2. Upload media files to Vercel Blob
// 3. Create database records using Drizzle
// 4. Verify migration success
// 5. Clear localStorage (optional)
```

### **5.3 Gradual Migration**
- Keep localStorage as fallback during transition
- Implement feature flag to switch between storage methods
- Monitor for any issues during migration

## **Phase 6: Updated Components**

### **6.1 Enhanced HistoryContext**
```typescript
// Update src/contexts/HistoryContext.tsx
// Replace localStorage calls with cloud storage
// Add loading states for network operations
// Handle offline/online states
// Add retry logic for failed operations
// Use cursor-based fetching with SWR/React Query for scalability
```

### **6.2 File Upload Components**
```typescript
// Update src/components/FileField.tsx
// Add progress indicators for large file uploads
// Handle upload failures gracefully
// Show upload status to users
// Pre-validate file type/size before requesting an upload URL
```

## **Phase 7: Performance Optimizations**

### **7.1 Caching Strategy**
- Cache frequently accessed history items
- Implement pagination for large history lists
- Use React Query or SWR for data fetching

### **7.2 Image/Video Optimization**
- Generate thumbnails for videos
- Compress images before upload
- Use Vercel's image optimization

## **Phase 8: Monitoring & Analytics**

### **8.1 Storage Monitoring**
- Track storage usage in Vercel Blob
- Monitor database query performance
- Set up alerts for storage limits
// Consider Vercel Cron jobs for background tasks

### **8.2 Error Handling**
- Comprehensive error logging
- User-friendly error messages
- Automatic retry mechanisms
// Add background jobs:
// - Orphan blob sweeper (blobs without DB rows)
// - Soft-deleted media finalizer (delete from Blob, then hard-delete DB)
// - Periodic signed URL validity checks if needed
// Instrument with Sentry for error monitoring across API and client

## **Implementation Timeline**

1. **Week 1**: Setup Neon database, install dependencies, create basic schema
2. **Week 2**: Implement core services (Database, Blob Storage, Cloud History Storage)
3. **Week 3**: Create API routes and update components
4. **Week 4**: Migration script, testing, and performance optimization

## **Cost Estimation**

- **Neon Pro**: You already have this
- **Vercel Blob**: ~$0.15/GB stored + $0.40/GB bandwidth
- **Estimated monthly cost**: $5-20 depending on usage

## **Benefits of This Approach**

1. **Unlimited storage** for videos and large files
2. **Global CDN** for fast media delivery
3. **Scalable** - handles growth automatically
4. **Reliable** - no localStorage quota issues
5. **Searchable** - full-text search in PostgreSQL
6. **Backup** - data is safely stored in the cloud
7. **Type Safety** - Drizzle provides full TypeScript type inference
8. **Developer Experience** - IntelliSense, auto-completion, and compile-time error checking
9. **Migration Management** - Easy database schema versioning and migrations
10. **Query Builder** - Type-safe SQL queries with excellent performance
11. **Relations** - Built-in support for table relationships and joins
12. **Studio** - Visual database management with Drizzle Studio

## **Migration Checklist**

- [ ] Install dependencies (`@vercel/blob`, `@neondatabase/serverless`, `drizzle-orm`, `drizzle-kit`)
- [ ] Set up environment variables
- [ ] Create Drizzle schema and configuration
- [ ] Generate and apply database migrations
- [ ] Implement DatabaseService with Drizzle
- [ ] Implement BlobStorageService
- [ ] Create CloudHistoryStorage service
- [ ] Build API routes for history management
- [ ] Enhance file upload API
- [ ] Update HistoryContext to use cloud storage
- [ ] Create migration script
- [ ] Test with large video files
- [ ] Deploy and monitor
 - [ ] Edge runtime + forced dynamic for DB-backed routes
 - [ ] Zod validation in API routes
 - [ ] Direct-to-Blob client uploads (private by default) with signed URLs
 - [ ] Rate limiting on upload and mutation endpoints
 - [ ] Integrate auth provider and expose userId on server
 - [ ] Protect `/api/history/*` and `/api/upload` with auth
 - [ ] Scope all DB queries/mutations by authenticated userId
 - [ ] Enforce per-user blob path prefix and ownership checks
 - [ ] Backfill userId for legacy rows; decide anonymous strategy
 - [ ] Verify auth library compatibility with Edge or set Node runtime per route

## **File Structure Changes**

```
src/
├── lib/
│   └── db/
│       ├── index.ts            # Drizzle database connection
│       └── schema.ts           # Drizzle schema definitions
├── services/
│   ├── database.ts              # Neon database service with Drizzle
│   ├── blob-storage.ts          # Vercel Blob service
│   └── history-storage-cloud.ts # Cloud history storage
├── app/api/
│   ├── history/
│   │   ├── route.ts            # History CRUD
│   │   ├── [id]/route.ts       # Individual items
│   │   └── search/route.ts     # Search & filter
│   └── upload/route.ts         # Enhanced file upload
 │   └── cron/                  # Background cron endpoints (optional)
 │       ├── sweep-orphans/route.ts
 │       └── finalize-deletes/route.ts
├── scripts/
│   └── migrate-to-cloud.ts     # Migration script
├── drizzle/                    # Generated migration files
└── drizzle.config.ts           # Drizzle Kit configuration
```

## **Next Steps**

1. Review and approve this plan
2. Set up Neon database connection
3. Install required dependencies (including Drizzle)
4. Create Drizzle schema and configuration
5. Generate and apply database migrations
6. Begin implementation with Phase 1
7. Test each phase before proceeding to the next

---

*This plan provides a complete roadmap for migrating from localStorage to a scalable cloud-based storage solution using Neon, Drizzle ORM, and Vercel Blob.*
