import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Code } from '@/components/ui/code';

// Define TypeScript interfaces for Supabase diagnostic API responses
interface SupabaseStatusResponse {
  success: boolean;
  supabaseUrl?: string;
  environment?: string;
  supabaseKeys?: {
    anonKey?: string;
    serviceKey?: string;
  };
  timestamp?: string;
  adminBucketListResult?: {
    error?: string;
    bucketCount?: number;
  };
}

interface BucketStatusResponse {
  exists: boolean;
  message?: string;
  files?: number;
  fileList?: string[];
}

interface FileAccessResponse {
  success: boolean;
  urls?: {
    adminUrl?: string;
    anonUrl?: string;
  };
  diagnostics?: Record<string, any>;
}

interface TestUploadResponse {
  success: boolean;
  message: string;
  result: {
    adminClient: {
      success: boolean;
      error?: string;
      path?: string;
    };
    publicUrl: string | null;
    isAccessible: boolean;
    diagnostics: Record<string, any>;
  };
}

export default function DiagnosticsPage() {
  const [selectedBucket, setSelectedBucket] = useState('videos');
  const [filePath, setFilePath] = useState('');
  const [testFileUrl, setTestFileUrl] = useState('');
  
  // Test Supabase connection
  const { data: supabaseStatus, isLoading: isLoadingSupabase, error: supabaseError, refetch: refetchSupabase } = 
    useQuery<SupabaseStatusResponse>({
      queryKey: ['/api/test-supabase'],
      retry: false
    });
  
  // Test buckets
  const { data: videoBucketStatus, isLoading: isLoadingVideoBucket, refetch: refetchVideoBucket } = 
    useQuery<BucketStatusResponse>({
      queryKey: ['/api/test-buckets', 'videos'],
      queryFn: () => apiRequest('/api/test-buckets?bucket=videos'),
      retry: false
    });
  
  const { data: thumbnailsBucketStatus, isLoading: isLoadingThumbnailsBucket, refetch: refetchThumbnailsBucket } = 
    useQuery<BucketStatusResponse>({
      queryKey: ['/api/test-buckets', 'thumbnails'],
      queryFn: () => apiRequest('/api/test-buckets?bucket=thumbnails'),
      retry: false
    });
  
  // Test file access if a path is selected
  const { data: fileAccessStatus, isLoading: isLoadingFileAccess, refetch: refetchFileAccess } = 
    useQuery<FileAccessResponse>({
      queryKey: ['/api/test-file-access', selectedBucket, filePath],
      queryFn: async () => {
        if (!filePath) {
          return { success: false, urls: undefined, diagnostics: undefined };
        }
        return await apiRequest(`/api/test-file-access?bucket=${selectedBucket}&path=${filePath}`);
      },
      enabled: !!filePath,
      retry: false
    });
  
  // Test upload mutation
  const uploadTestMutation = useMutation({
    mutationFn: (bucketName: string) => {
      return apiRequest({
        url: '/api/test-upload',
        method: 'POST',
        data: { bucket: bucketName }
      });
    },
    onSuccess: (data) => {
      if (data.result?.publicUrl) {
        setTestFileUrl(data.result.publicUrl);
      }
    }
  });
  
  // Handle test upload
  const handleTestUpload = (bucket: string) => {
    uploadTestMutation.mutate(bucket);
  };
  
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Storage Diagnostics</h1>
      
      <Tabs defaultValue="status" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="status">System Status</TabsTrigger>
          <TabsTrigger value="buckets">Storage Buckets</TabsTrigger>
          <TabsTrigger value="file-access">File Access</TabsTrigger>
          <TabsTrigger value="uploads">Test Uploads</TabsTrigger>
        </TabsList>
        
        {/* System Status Tab */}
        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Supabase Connection Status</CardTitle>
              <CardDescription>
                Checks if the application can connect to Supabase
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSupabase ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : supabaseError ? (
                <Alert variant="destructive">
                  <AlertTitle>Connection Failed</AlertTitle>
                  <AlertDescription>
                    Could not connect to Supabase: {supabaseError instanceof Error ? supabaseError.message : 'Unknown error'}
                  </AlertDescription>
                </Alert>
              ) : supabaseStatus?.success ? (
                <div className="space-y-4">
                  <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
                    <AlertTitle className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Connected to Supabase
                    </AlertTitle>
                    <AlertDescription>
                      Successfully connected to your Supabase project.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                    <div className="col-span-2 font-semibold">Connection Details:</div>
                    <div>Supabase URL</div>
                    <div>{supabaseStatus.supabaseUrl || 'Not available'}</div>
                    <div>Environment</div>
                    <div>{supabaseStatus.environment || 'Not specified'}</div>
                    <div>Anon Key</div>
                    <div>{supabaseStatus.supabaseKeys?.anonKey || 'Missing'}</div>
                    <div>Service Key</div>
                    <div>{supabaseStatus.supabaseKeys?.serviceKey || 'Missing'}</div>
                    <div>Timestamp</div>
                    <div>{supabaseStatus.timestamp || 'Not available'}</div>
                  </div>
                  
                  {/* Show bucket list result if available */}
                  {supabaseStatus.adminBucketListResult && (
                    <div className="mt-4 p-4 border rounded-md">
                      <h4 className="font-medium mb-2">Storage Buckets Check</h4>
                      {supabaseStatus.adminBucketListResult.error ? (
                        <div className="text-red-500">Error listing buckets: {supabaseStatus.adminBucketListResult.error}</div>
                      ) : (
                        <div className="text-green-600">
                          Successfully listed buckets. Found {supabaseStatus.adminBucketListResult.bucketCount} buckets.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <Alert variant="destructive">
                  <AlertTitle>No Data</AlertTitle>
                  <AlertDescription>
                    The server returned an empty response. Please check your server logs.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={() => refetchSupabase()}>
                Retest Connection
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Buckets Tab */}
        <TabsContent value="buckets">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Videos Bucket */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Videos Bucket</CardTitle>
                  {!isLoadingVideoBucket && (
                    <Badge variant={videoBucketStatus?.exists ? "default" : "destructive"}>
                      {videoBucketStatus?.exists ? "Exists" : "Missing"}
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  Storage bucket for uploaded videos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingVideoBucket ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status:</div>
                      <div>
                        {videoBucketStatus?.exists ? (
                          <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
                            <AlertDescription>
                              Bucket 'videos' exists. Contains {videoBucketStatus.files || 0} files.
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <Alert variant="destructive">
                            <AlertDescription>
                              {videoBucketStatus?.message || "Bucket 'videos' does not exist"}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                    
                    {videoBucketStatus?.fileList && videoBucketStatus.fileList.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Files ({videoBucketStatus.fileList.length}):</h4>
                        <ScrollArea className="h-[100px] w-full rounded-md border p-2">
                          <ul className="space-y-1 text-sm">
                            {videoBucketStatus.fileList.map((file, i) => (
                              <li key={i} className="truncate">
                                <button 
                                  className="text-blue-500 hover:text-blue-700 hover:underline text-left truncate w-full"
                                  onClick={() => {
                                    setSelectedBucket('videos');
                                    setFilePath(file);
                                  }}
                                >
                                  {file}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </ScrollArea>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button onClick={() => refetchVideoBucket()} variant="outline">
                  Refresh
                </Button>
                <Button onClick={() => handleTestUpload('videos')} disabled={uploadTestMutation.isPending}>
                  {uploadTestMutation.isPending && selectedBucket === 'videos' ? 'Uploading...' : 'Test Upload'}
                </Button>
              </CardFooter>
            </Card>
            
            {/* Thumbnails Bucket */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Thumbnails Bucket</CardTitle>
                  {!isLoadingThumbnailsBucket && (
                    <Badge variant={thumbnailsBucketStatus?.exists ? "default" : "destructive"}>
                      {thumbnailsBucketStatus?.exists ? "Exists" : "Missing"}
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  Storage bucket for video thumbnails
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingThumbnailsBucket ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status:</div>
                      <div>
                        {thumbnailsBucketStatus?.exists ? (
                          <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
                            <AlertDescription>
                              Bucket 'thumbnails' exists. Contains {thumbnailsBucketStatus.files || 0} files.
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <Alert variant="destructive">
                            <AlertDescription>
                              {thumbnailsBucketStatus?.message || "Bucket 'thumbnails' does not exist"}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                    
                    {thumbnailsBucketStatus?.fileList && thumbnailsBucketStatus.fileList.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Files ({thumbnailsBucketStatus.fileList.length}):</h4>
                        <ScrollArea className="h-[100px] w-full rounded-md border p-2">
                          <ul className="space-y-1 text-sm">
                            {thumbnailsBucketStatus.fileList.map((file, i) => (
                              <li key={i} className="truncate">
                                <button 
                                  className="text-blue-500 hover:text-blue-700 hover:underline text-left truncate w-full"
                                  onClick={() => {
                                    setSelectedBucket('thumbnails');
                                    setFilePath(file);
                                  }}
                                >
                                  {file}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </ScrollArea>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button onClick={() => refetchThumbnailsBucket()} variant="outline">
                  Refresh
                </Button>
                <Button onClick={() => handleTestUpload('thumbnails')} disabled={uploadTestMutation.isPending}>
                  {uploadTestMutation.isPending && selectedBucket === 'thumbnails' ? 'Uploading...' : 'Test Upload'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        {/* File Access Tab */}
        <TabsContent value="file-access">
          <Card>
            <CardHeader>
              <CardTitle>Test File Accessibility</CardTitle>
              <CardDescription>
                Check if a specific file can be accessed from the Supabase storage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filePath ? (
                <>
                  <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge variant="outline">{selectedBucket}</Badge>
                      <Badge>{filePath}</Badge>
                    </div>
                    
                    {isLoadingFileAccess ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ) : fileAccessStatus ? (
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-1">File Access:</h4>
                          {fileAccessStatus.success ? (
                            <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
                              <AlertDescription>
                                File is accessible
                              </AlertDescription>
                            </Alert>
                          ) : (
                            <Alert variant="destructive">
                              <AlertDescription>
                                File is not accessible
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-1">URLs:</h4>
                          <div className="space-y-2 text-sm">
                            {fileAccessStatus.urls?.adminUrl && (
                              <div>
                                <div className="font-semibold">Admin URL:</div>
                                <div className="overflow-auto">
                                  <a 
                                    href={fileAccessStatus.urls.adminUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline break-all"
                                  >
                                    {fileAccessStatus.urls.adminUrl}
                                  </a>
                                </div>
                              </div>
                            )}
                            
                            {fileAccessStatus.urls?.anonUrl && (
                              <div>
                                <div className="font-semibold">Public URL:</div>
                                <div className="overflow-auto">
                                  <a 
                                    href={fileAccessStatus.urls.anonUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline break-all"
                                  >
                                    {fileAccessStatus.urls.anonUrl}
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-1">Detailed Diagnostics:</h4>
                          <ScrollArea className="h-[300px] w-full rounded-md border">
                            <div className="p-4">
                              <Code>
                                {JSON.stringify(fileAccessStatus.diagnostics, null, 2)}
                              </Code>
                            </div>
                          </ScrollArea>
                        </div>
                      </div>
                    ) : (
                      <Alert>
                        <AlertDescription>
                          Select a file to test or enter a file path
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setFilePath('')}>
                      Clear Selection
                    </Button>
                    <Button onClick={() => refetchFileAccess()}>
                      Retest Access
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center p-8">
                  <div className="mb-4">
                    <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-medium mb-2">No File Selected</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Select a file from the buckets tab to test its accessibility
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Test Uploads Tab */}
        <TabsContent value="uploads">
          <Card>
            <CardHeader>
              <CardTitle>Test File Uploads</CardTitle>
              <CardDescription>
                Test uploading files to each storage bucket
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Videos Bucket</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Test uploading a small image file to the videos bucket
                    </p>
                    <Button 
                      onClick={() => handleTestUpload('videos')} 
                      disabled={uploadTestMutation.isPending}
                      className="w-full"
                    >
                      {uploadTestMutation.isPending && selectedBucket === 'videos' ? 'Uploading...' : 'Upload Test File'}
                    </Button>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Thumbnails Bucket</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Test uploading a small image file to the thumbnails bucket
                    </p>
                    <Button 
                      onClick={() => handleTestUpload('thumbnails')} 
                      disabled={uploadTestMutation.isPending}
                      className="w-full"
                    >
                      {uploadTestMutation.isPending && selectedBucket === 'thumbnails' ? 'Uploading...' : 'Upload Test File'}
                    </Button>
                  </div>
                </div>
                
                {/* Upload results */}
                {uploadTestMutation.isSuccess && (
                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4">Upload Results</h3>
                    <div className="rounded-md border p-4">
                      {uploadTestMutation.data.success ? (
                        <div className="space-y-4">
                          <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
                            <AlertTitle>Upload Successful</AlertTitle>
                            <AlertDescription>
                              The test file was successfully uploaded to the {uploadTestMutation.data.result.diagnostics.bucketName} bucket.
                            </AlertDescription>
                          </Alert>
                          
                          {testFileUrl && (
                            <div>
                              <h4 className="text-sm font-medium mb-2">Test File URL:</h4>
                              <div className="flex items-center gap-2 mb-4">
                                <div className="flex-grow overflow-hidden">
                                  <a 
                                    href={testFileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline text-sm block truncate"
                                  >
                                    {testFileUrl}
                                  </a>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => window.open(testFileUrl, '_blank')}>
                                  View
                                </Button>
                              </div>
                              
                              <div className="mt-4 p-4 border rounded-md">
                                <h4 className="text-sm font-medium mb-2">Access Test</h4>
                                <div className="text-sm">
                                  <p>Click the button below to test if the file is accessible:</p>
                                  <div className="mt-2">
                                    <Button 
                                      variant="outline" 
                                      onClick={() => {
                                        const img = new Image();
                                        img.onload = () => alert('Image loaded successfully! File is accessible.');
                                        img.onerror = () => alert('Error loading image. File might not be accessible.');
                                        img.src = testFileUrl;
                                      }}
                                      size="sm"
                                    >
                                      Test Accessibility
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div>
                            <h4 className="text-sm font-medium mb-2">Detailed Results:</h4>
                            <ScrollArea className="h-[200px] w-full rounded-md border">
                              <div className="p-4">
                                <Code>
                                  {JSON.stringify(uploadTestMutation.data.result, null, 2)}
                                </Code>
                              </div>
                            </ScrollArea>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Alert variant="destructive">
                            <AlertTitle>Upload Failed</AlertTitle>
                            <AlertDescription>
                              {uploadTestMutation.data.message || 'Unknown error'}
                            </AlertDescription>
                          </Alert>
                          
                          {uploadTestMutation.data.result && (
                            <div>
                              <h4 className="text-sm font-medium mb-2">Detailed Error:</h4>
                              <ScrollArea className="h-[200px] w-full rounded-md border">
                                <div className="p-4">
                                  <Code>
                                    {JSON.stringify(uploadTestMutation.data.result, null, 2)}
                                  </Code>
                                </div>
                              </ScrollArea>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {uploadTestMutation.isError && (
                  <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      {uploadTestMutation.error instanceof Error ? uploadTestMutation.error.message : 'Unknown error'}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* SQL Policies Guide */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Fix Storage Access Issues</h2>
        <Card>
          <CardHeader>
            <CardTitle>Supabase RLS Policies</CardTitle>
            <CardDescription>
              Run these SQL statements in your Supabase SQL Editor to fix storage permission issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] w-full rounded-md border">
              <div className="p-4 text-sm font-mono whitespace-pre">
{`-- Make buckets publicly accessible (read)
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id IN ('videos', 'thumbnails'));

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated Upload" ON storage.objects
FOR INSERT TO authenticated
USING (bucket_id IN ('videos', 'thumbnails'));

-- Allow authenticated users to update files
CREATE POLICY "Authenticated Update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id IN ('videos', 'thumbnails'));

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated Delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id IN ('videos', 'thumbnails'));

-- Tip: If you need more restrictions, you can modify these policies
-- For example, to allow users to only manage their own files:
-- USING (bucket_id IN ('videos', 'thumbnails') AND auth.uid() = owner_id)
`}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}