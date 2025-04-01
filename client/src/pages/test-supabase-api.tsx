import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const TestSupabaseAPI = () => {
  const [connectionDetails, setConnectionDetails] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [bucketStatus, setBucketStatus] = useState<Record<string, any>>({});
  
  const checkSupabaseConnection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test-supabase');
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Supabase connection test result:', data);
      setConnectionDetails(data);
    } catch (err) {
      console.error('Failed to check Supabase connection:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const checkBucket = async (bucketName: string) => {
    try {
      setBucketStatus(prev => ({
        ...prev,
        [bucketName]: { loading: true, error: null, data: null }
      }));
      
      const response = await fetch(`/api/test-buckets?bucket=${bucketName}`);
      const data = await response.json();
      
      console.log(`Bucket ${bucketName} check result:`, data);
      
      setBucketStatus(prev => ({
        ...prev,
        [bucketName]: { 
          loading: false, 
          error: !response.ok ? data.message : null, 
          data: response.ok ? data : null
        }
      }));
    } catch (err) {
      console.error(`Failed to check bucket ${bucketName}:`, err);
      setBucketStatus(prev => ({
        ...prev,
        [bucketName]: { 
          loading: false, 
          error: err instanceof Error ? err.message : 'Unknown error occurred',
          data: null
        }
      }));
    }
  };
  
  // Status indicator component
  const StatusIndicator = ({ status }: { status: 'success' | 'error' | 'warning' | 'unknown' }) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Success</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Error</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" /> Warning</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800"><AlertCircle className="w-3 h-3 mr-1" /> Unknown</Badge>;
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Supabase Connection Test</h1>
      
      <div className="grid grid-cols-1 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>API Connection Test</CardTitle>
            <CardDescription>
              Check if the Express API server can connect to Supabase correctly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={checkSupabaseConnection} disabled={loading}>
                {loading ? 'Checking...' : 'Test Supabase Connection'}
              </Button>
              
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {connectionDetails && (
                <div className="mt-4 space-y-4">
                  <h3 className="text-lg font-medium">Connection Details:</h3>
                  <div className="bg-gray-50 p-4 rounded-md space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Supabase Client:</span>
                      <StatusIndicator status={connectionDetails.supabaseClientInitialized ? 'success' : 'error'} />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Supabase Admin:</span>
                      <StatusIndicator status={connectionDetails.supabaseAdminInitialized ? 'success' : 'error'} />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Supabase URL:</span>
                      <span>{connectionDetails.supabaseUrl || 'Not configured'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Anon Key:</span>
                      <span>{connectionDetails.supabaseKeys?.anonKey || 'Not configured'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Service Role Key:</span>
                      <span>{connectionDetails.supabaseKeys?.serviceKey || 'Not configured'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Environment:</span>
                      <span>{connectionDetails.environment}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Timestamp:</span>
                      <span>{new Date(connectionDetails.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Storage Buckets:</h3>
                    
                    <div className="space-y-4">
                      {['videos', 'thumbnails'].map(bucket => (
                        <div key={bucket} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => checkBucket(bucket)}
                              disabled={bucketStatus[bucket]?.loading}
                            >
                              Check '{bucket}' bucket
                            </Button>
                            {bucketStatus[bucket]?.loading && <span>Loading...</span>}
                          </div>
                          
                          {bucketStatus[bucket]?.error && (
                            <Alert variant="destructive" className="mt-2">
                              <XCircle className="h-4 w-4" />
                              <AlertTitle>Bucket Error</AlertTitle>
                              <AlertDescription>{bucketStatus[bucket].error}</AlertDescription>
                            </Alert>
                          )}
                          
                          {bucketStatus[bucket]?.data && (
                            <div className="bg-gray-50 p-4 rounded-md mt-2">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">Status:</span>
                                <StatusIndicator status={bucketStatus[bucket].data.exists ? 'success' : 'error'} />
                              </div>
                              <div className="flex justify-between items-center mt-2">
                                <span className="font-medium">Message:</span>
                                <span>{bucketStatus[bucket].data.message}</span>
                              </div>
                              {bucketStatus[bucket].data.exists && (
                                <div className="flex justify-between items-center mt-2">
                                  <span className="font-medium">Files:</span>
                                  <span>{bucketStatus[bucket].data.files}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestSupabaseAPI;