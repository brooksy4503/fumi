"use client";

import React, { useState, useEffect } from 'react';
import { useHistory } from '@/contexts/HistoryContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function StorageManager() {
  const { getStorageInfo, clearHistory, clearAllStorage, emergencyClearStorage, clearOldHistory } = useHistory();
  const [storageInfo, setStorageInfo] = useState<{
    itemCount: number;
    estimatedSize: number;
    maxItems: number;
    maxSize: number;
    usagePercentage: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshStorageInfo = () => {
    const info = getStorageInfo();
    setStorageInfo(info);
  };

  useEffect(() => {
    refreshStorageInfo();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleClearHistory = async () => {
    setIsLoading(true);
    try {
      clearHistory();
      refreshStorageInfo();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearOldHistory = async () => {
    setIsLoading(true);
    try {
      clearOldHistory(7); // Keep last 7 days
      refreshStorageInfo();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAllStorage = async () => {
    setIsLoading(true);
    try {
      clearAllStorage();
      refreshStorageInfo();
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmergencyClear = async () => {
    setIsLoading(true);
    try {
      emergencyClearStorage();
      refreshStorageInfo();
    } finally {
      setIsLoading(false);
    }
  };

  if (!storageInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Storage Manager</CardTitle>
          <CardDescription>Unable to load storage information</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isNearLimit = storageInfo.usagePercentage > 80;
  const isOverLimit = storageInfo.usagePercentage > 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Storage Manager</CardTitle>
        <CardDescription>
          Manage your generation history storage to prevent quota exceeded errors
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isOverLimit && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription>
              <strong>Storage Quota Exceeded!</strong> Your history storage is over the limit. 
              Clear some history items to continue using the app.
            </AlertDescription>
          </Alert>
        )}
        
        {isNearLimit && !isOverLimit && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertDescription>
              <strong>Storage Nearly Full!</strong> Your history storage is {storageInfo.usagePercentage.toFixed(1)}% full. 
              Consider clearing old history items.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-sm text-gray-600">Current Usage</h4>
            <p className="text-2xl font-bold">{formatBytes(storageInfo.estimatedSize)}</p>
            <p className="text-sm text-gray-500">
              {storageInfo.itemCount} of {storageInfo.maxItems} items
            </p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-gray-600">Storage Limit</h4>
            <p className="text-2xl font-bold">{formatBytes(storageInfo.maxSize)}</p>
            <p className="text-sm text-gray-500">
              {storageInfo.usagePercentage.toFixed(1)}% used
            </p>
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${
              isOverLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(storageInfo.usagePercentage, 100)}%` }}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleClearOldHistory} 
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            Clear Old Items (7+ days)
          </Button>
          <Button 
            onClick={handleClearHistory} 
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            Clear All History
          </Button>
          <Button 
            onClick={handleClearAllStorage} 
            disabled={isLoading}
            variant="destructive"
            size="sm"
          >
            Clear All Storage
          </Button>
          <Button 
            onClick={handleEmergencyClear} 
            disabled={isLoading}
            variant="destructive"
            size="sm"
            className="bg-red-600 hover:bg-red-700"
          >
            Emergency Clear
          </Button>
          <Button 
            onClick={refreshStorageInfo} 
            disabled={isLoading}
            variant="ghost"
            size="sm"
          >
            Refresh
          </Button>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• <strong>Clear Old Items:</strong> Removes history items older than 7 days</p>
          <p>• <strong>Clear All History:</strong> Removes all history but keeps storage structure</p>
          <p>• <strong>Clear All Storage:</strong> Completely clears localStorage (use if experiencing errors)</p>
          <p>• <strong>Emergency Clear:</strong> Clears ALL localStorage data for this domain (last resort)</p>
        </div>
      </CardContent>
    </Card>
  );
}
