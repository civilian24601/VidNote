import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from '@/lib/supabase';

export default function TestSupabasePage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [envVars, setEnvVars] = useState<Record<string, boolean>>({});
  const [buckets, setBuckets] = useState<string[]>([]);

  // Check environment variables on page load
  useEffect(() => {
    const checkEnvVars = () => {
      const vars = {
        'SUPABASE_URL': !!import.meta.env.SUPABASE_URL,
        'SUPABASE_ANON_KEY': !!import.meta.env.SUPABASE_ANON_KEY,
        'VITE_SUPABASE_URL': !!import.meta.env.VITE_SUPABASE_URL,
        'VITE_SUPABASE_ANON_KEY': !!import.meta.env.VITE_SUPABASE_ANON_KEY
      };
      setEnvVars(vars);
    };
    
    checkEnvVars();
  }, []);

  const checkConnection = async () => {
    setStatus('loading');
    setMessage('Testing Supabase connection...');
    
    try {
      // First check client-side if Supabase is initialized
      // This will always succeed with the current setup
      const isInitialized = supabase && supabase.storage && typeof supabase.storage.from === 'function';
      
      if (!isInitialized) {
        setStatus('error');
        setMessage('Client-side Supabase client is not properly initialized. Check your environment variables.');
        return;
      }
      
      // Check server-side connection by testing bucket existence
      try {
        // This will use our API endpoint which uses the service role key
        const videosResp = await fetch('/api/test-buckets?bucket=videos');
        const videosData = await videosResp.json();
        
        const thumbnailsResp = await fetch('/api/test-buckets?bucket=thumbnails');
        const thumbnailsData = await thumbnailsResp.json();
        
        const foundBuckets: string[] = [];
        
        if (videosData.exists) {
          foundBuckets.push('videos');
        }
        
        if (thumbnailsData.exists) {
          foundBuckets.push('thumbnails');
        }
        
        setBuckets(foundBuckets);
        
        if (foundBuckets.length === 2) {
          setStatus('success');
          setMessage('Successfully verified both required buckets exist!');
        } else if (foundBuckets.length === 0) {
          setStatus('error');
          setMessage('Connected to Supabase, but no required buckets found. Please create "videos" and "thumbnails" buckets.');
        } else {
          setStatus('error');
          const missingBucket = foundBuckets.includes('videos') ? 'thumbnails' : 'videos';
          setMessage(`Connected to Supabase, but the "${missingBucket}" bucket is missing. Please create it.`);
        }
      } catch (error: any) {
        console.error('Error checking buckets:', error);
        setStatus('error');
        setMessage(`Error checking buckets: ${error.message}`);
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      setStatus('error');
      setMessage(`Unexpected error: ${err.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Supabase Connection Test</CardTitle>
          <CardDescription>
            Test the connection to your Supabase project and check for storage buckets
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Environment Variables</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(envVars).map(([key, exists]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${exists ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>{key}: {exists ? 'Available' : 'Missing'}</span>
                </div>
              ))}
            </div>
          </div>
          
          {status === 'success' && (
            <div>
              <h3 className="text-lg font-medium mb-2">Storage Buckets</h3>
              {buckets.length > 0 ? (
                <ul className="list-disc list-inside">
                  {buckets.map(bucket => (
                    <li key={bucket}>{bucket}</li>
                  ))}
                </ul>
              ) : (
                <p>No storage buckets found. You need to create 'videos' and 'thumbnails' buckets.</p>
              )}
            </div>
          )}
          
          {status !== 'idle' && (
            <Alert variant={status === 'error' ? 'destructive' : (status === 'success' ? 'default' : undefined)}>
              <AlertTitle>{status.charAt(0).toUpperCase() + status.slice(1)}</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            onClick={checkConnection}
            disabled={status === 'loading'}
            variant="default"
          >
            {status === 'loading' ? 'Testing...' : 'Test Connection'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}