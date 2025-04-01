import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const TestSupabase = () => {
  const [supabaseStatus, setSupabaseStatus] = useState<'loading' | 'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [supabaseDetails, setSupabaseDetails] = useState<any>(null);
  const [bucketTest, setBucketTest] = useState<{[key: string]: {status: string, message: string, files?: number}}>(
    {
      videos: { status: 'pending', message: 'Not tested' },
      thumbnails: { status: 'pending', message: 'Not tested' }
    }
  );
  
  async function checkSupabase() {
    setSupabaseStatus('loading');
    setErrorMessage(null);
    
    try {
      // Create a Supabase client
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // Test a simple operation
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        setSupabaseStatus('error');
        setErrorMessage(`Supabase authentication error: ${error.message}`);
        return;
      }
      
      // Get environment variables
      setSupabaseDetails({
        url: supabaseUrl ? 'Present (masked)' : 'Missing',
        anonKey: supabaseAnonKey ? 'Present (masked)' : 'Missing',
        session: data.session ? 'Active' : 'Not authenticated',
        timestamp: new Date().toISOString()
      });
      
      setSupabaseStatus('success');
    } catch (err) {
      setSupabaseStatus('error');
      setErrorMessage(`Failed to initialize Supabase client: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }
  
  async function testBucket(bucket: string) {
    setBucketTest(prev => ({
      ...prev,
      [bucket]: { status: 'loading', message: 'Testing...' }
    }));
    
    try {
      // Create a new Supabase client
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // List objects in bucket
      const { data, error } = await supabase.storage.from(bucket).list();
      
      if (error) {
        setBucketTest(prev => ({
          ...prev,
          [bucket]: { status: 'error', message: error.message }
        }));
        return;
      }
      
      // Success
      setBucketTest(prev => ({
        ...prev,
        [bucket]: { 
          status: 'success', 
          message: `Successfully accessed bucket`,
          files: data?.length || 0
        }
      }));
    } catch (err) {
      setBucketTest(prev => ({
        ...prev,
        [bucket]: { 
          status: 'error', 
          message: err instanceof Error ? err.message : 'Unknown error'
        }
      }));
    }
  }
  
  useEffect(() => {
    // Check Supabase on mount
    if (!supabaseStatus) {
      checkSupabase();
    }
  }, []);
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Supabase Client Testing</h1>
      
      <div className="grid grid-cols-1 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Client-Side Supabase Connection</CardTitle>
            <CardDescription>
              Testing direct connection from the browser to Supabase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={checkSupabase} disabled={supabaseStatus === 'loading'}>
                {supabaseStatus === 'loading' ? 'Testing...' : 'Test Connection'}
              </Button>
              
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
              
              {supabaseStatus === 'success' && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>
                    Successfully connected to Supabase
                  </AlertDescription>
                </Alert>
              )}
              
              {supabaseDetails && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Connection Details</h3>
                  <div className="bg-muted p-4 rounded-md space-y-2">
                    <div className="flex justify-between">
                      <span>Supabase URL:</span>
                      <span>{supabaseDetails.url}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Anon Key:</span>
                      <span>{supabaseDetails.anonKey}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Session:</span>
                      <span>{supabaseDetails.session}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Timestamp:</span>
                      <span>{new Date(supabaseDetails.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <Separator className="my-6" />
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Storage Buckets</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(bucketTest).map(bucket => (
                  <Card key={bucket}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{bucket}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Status:</span>
                        <span>
                          {bucketTest[bucket].status === 'pending' && (
                            <Badge className="bg-gray-100 text-gray-800">Not Tested</Badge>
                          )}
                          {bucketTest[bucket].status === 'loading' && (
                            <Badge className="bg-blue-100 text-blue-800">Testing...</Badge>
                          )}
                          {bucketTest[bucket].status === 'success' && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" /> Success
                            </Badge>
                          )}
                          {bucketTest[bucket].status === 'error' && (
                            <Badge className="bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3 mr-1" /> Error
                            </Badge>
                          )}
                        </span>
                      </div>
                      
                      {bucketTest[bucket].status === 'success' && (
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Files:</span>
                          <span>{bucketTest[bucket].files}</span>
                        </div>
                      )}
                      
                      {bucketTest[bucket].status === 'error' && (
                        <div className="mt-2 text-sm text-red-600">
                          {bucketTest[bucket].message}
                        </div>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3 w-full"
                        onClick={() => testBucket(bucket)}
                        disabled={bucketTest[bucket].status === 'loading' || supabaseStatus !== 'success'}
                      >
                        Test Bucket
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Note</AlertTitle>
                <AlertDescription>
                  If bucket tests fail but the connection is successful, you may need to check:
                  <ul className="list-disc pl-6 mt-2">
                    <li>The buckets exist in your Supabase project</li>
                    <li>The RLS (Row Level Security) policies allow access</li>
                    <li>The anonymous key has permissions to access storage</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestSupabase;