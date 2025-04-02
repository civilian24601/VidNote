import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export default function DiagnosticsPage() {
  const { isAuthenticated, user } = useAuth();
  const [envVariables, setEnvVariables] = useState({
    supabaseUrl: false,
    supabaseAnonKey: false,
    viteSupabaseUrl: false,
    viteSupabaseAnonKey: false,
  });
  const [buckets, setBuckets] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<{
    authenticated: boolean;
    bucketsAccessible: boolean;
    videosUploadable: boolean;
    publicAccess: boolean;
    testError: string | null;
  }>({
    authenticated: false,
    bucketsAccessible: false,
    videosUploadable: false,
    publicAccess: false,
    testError: null,
  });
  const [testVideoUrl, setTestVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState({
    env: true,
    buckets: true,
    tests: false,
  });
  const [expanded, setExpanded] = useState({
    env: false,
    policies: false,
    serverLogs: false,
  });

  // Check environment variables
  useEffect(() => {
    setEnvVariables({
      supabaseUrl: !!import.meta.env.SUPABASE_URL,
      supabaseAnonKey: !!import.meta.env.SUPABASE_ANON_KEY,
      viteSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
      viteSupabaseAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    });
    setLoading(prev => ({ ...prev, env: false }));
  }, []);

  // Check buckets
  useEffect(() => {
    async function checkBuckets() {
      try {
        const { data, error } = await supabase.storage.listBuckets();
        if (error) {
          console.error("Error listing buckets:", error);
          setTestResults(prev => ({ ...prev, testError: error.message }));
        } else {
          setBuckets(data || []);
          // Check if required buckets exist
          const videosExists = data?.some(b => b.name === "videos");
          const thumbnailsExists = data?.some(b => b.name === "thumbnails");
          
          setTestResults(prev => ({
            ...prev,
            bucketsAccessible: true,
            videosUploadable: videosExists && thumbnailsExists,
          }));
        }
      } catch (error: any) {
        console.error("Error checking buckets:", error);
        setTestResults(prev => ({ ...prev, testError: error.message }));
      } finally {
        setLoading(prev => ({ ...prev, buckets: false }));
      }
    }

    checkBuckets();
  }, []);

  // Run tests
  const runTests = async () => {
    setLoading(prev => ({ ...prev, tests: true }));
    setTestResults(prev => ({ ...prev, testError: null }));
    
    try {
      // 1. Check authentication
      const { data: authData, error: authError } = await supabase.auth.getSession();
      const authenticated = !!authData.session || !!user;
      
      if (authError) {
        setTestResults(prev => ({ 
          ...prev, 
          authenticated: false,
          testError: `Authentication error: ${authError.message}` 
        }));
        return;
      }
      
      setTestResults(prev => ({ ...prev, authenticated }));
      
      // 2. Test upload
      // Create a File object instead of a Uint8Array for the test
      const testFileContent = new TextEncoder().encode("This is a test file for diagnostic purposes");
      const testFileBlob = new Blob([testFileContent], { type: 'text/plain' });
      // Create a File from the Blob with a name and last modified date
      const testFile = new File([testFileBlob], `test-file-${Date.now()}.txt`, { 
        type: 'text/plain', 
        lastModified: Date.now() 
      });
      const testFilePath = `test/diagnostic-test-${Date.now()}.txt`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("videos")
        .upload(testFilePath, testFile);
      
      if (uploadError) {
        setTestResults(prev => ({ 
          ...prev, 
          videosUploadable: false,
          testError: `Upload error: ${uploadError.message}` 
        }));
        return;
      }
      
      setTestResults(prev => ({ ...prev, videosUploadable: true }));
      
      // 3. Test public access
      const { data: urlData } = supabase.storage
        .from("videos")
        .getPublicUrl(testFilePath);
      
      setTestVideoUrl(urlData.publicUrl);
      
      try {
        const response = await fetch(urlData.publicUrl, { method: "HEAD" });
        const publicAccessible = response.ok;
        
        setTestResults(prev => ({ ...prev, publicAccess: publicAccessible }));
        
        if (!publicAccessible) {
          setTestResults(prev => ({ 
            ...prev, 
            testError: `Public access error: HTTP ${response.status} ${response.statusText}` 
          }));
        }
      } catch (fetchError: any) {
        setTestResults(prev => ({ 
          ...prev, 
          publicAccess: false,
          testError: `Fetch error: ${fetchError.message}` 
        }));
      }
      
      // Cleanup
      await supabase.storage
        .from("videos")
        .remove([testFilePath]);
    } catch (error: any) {
      console.error("Error running tests:", error);
      setTestResults(prev => ({ ...prev, testError: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, tests: false }));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-8 pb-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">System Diagnostics</h1>
          <p className="text-gray-300 mb-8">
            Troubleshoot your Supabase configuration and storage setup
          </p>
          
          <Card className="glassmorphism text-white border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Environment Variables</span>
                <Button 
                  variant="ghost" 
                  className="p-1 h-8 w-8"
                  onClick={() => setExpanded(prev => ({ ...prev, env: !prev.env }))}
                >
                  <i className={`ri-${expanded.env ? 'subtract' : 'add'}-line text-lg`}></i>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading.env ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <span className="text-gray-300 mr-2">SUPABASE_URL:</span>
                        {envVariables.supabaseUrl ? (
                          <Badge variant="default" className="bg-green-500/20 text-green-400">
                            Available
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Missing</Badge>
                        )}
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-300 mr-2">VITE_SUPABASE_URL:</span>
                        {envVariables.viteSupabaseUrl ? (
                          <Badge variant="default" className="bg-green-500/20 text-green-400">
                            Available
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Missing</Badge>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <span className="text-gray-300 mr-2">SUPABASE_ANON_KEY:</span>
                        {envVariables.supabaseAnonKey ? (
                          <Badge variant="default" className="bg-green-500/20 text-green-400">
                            Available
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Missing</Badge>
                        )}
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-300 mr-2">VITE_SUPABASE_ANON_KEY:</span>
                        {envVariables.viteSupabaseAnonKey ? (
                          <Badge variant="default" className="bg-green-500/20 text-green-400">
                            Available
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Missing</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {expanded.env && (
                    <div className="mt-4 bg-gray-800/50 p-4 rounded-md">
                      <h3 className="text-lg font-medium mb-2">How to fix environment variables</h3>
                      <ol className="list-decimal pl-5 space-y-2 text-gray-300">
                        <li>
                          Open the <code>.env</code> file in the root of your project
                        </li>
                        <li>
                          Ensure it contains the following variables:
                          <pre className="bg-gray-900/80 p-2 rounded mt-1 overflow-x-auto text-xs">
{`# Server-side only variables (not exposed to the browser)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Client-side variables (accessible in browser)
# These must be prefixed with VITE_ to be exposed to the client
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`}
                          </pre>
                        </li>
                        <li>
                          Get these values from your Supabase project dashboard:
                          <ul className="list-disc pl-5 mt-1">
                            <li>Go to <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Supabase Dashboard</a></li>
                            <li>Select your project</li>
                            <li>Go to Project Settings &gt; API</li>
                            <li>Copy the URL, anon key, and service role key</li>
                          </ul>
                        </li>
                      </ol>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
          
          <Card className="glassmorphism text-white border-gray-700 mb-6">
            <CardHeader>
              <CardTitle>Storage Buckets</CardTitle>
            </CardHeader>
            <CardContent>
              {loading.buckets ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Required Buckets</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center">
                          <span className="text-gray-300 mr-2">videos bucket:</span>
                          {buckets.some(b => b.name === "videos") ? (
                            <Badge variant="default" className="bg-green-500/20 text-green-400">
                              Found
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Missing</Badge>
                          )}
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-300 mr-2">thumbnails bucket:</span>
                          {buckets.some(b => b.name === "thumbnails") ? (
                            <Badge variant="default" className="bg-green-500/20 text-green-400">
                              Found
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Missing</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Bucket Visibility</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {buckets.map(bucket => (
                          <div key={bucket.id} className="flex items-center">
                            <span className="text-gray-300 mr-2">{bucket.name}:</span>
                            {bucket.public ? (
                              <Badge variant="default" className="bg-green-500/20 text-green-400">
                                Public
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                                Private
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">How to create/fix buckets</h3>
                    <ol className="list-decimal pl-5 space-y-2 text-gray-300">
                      <li>
                        Go to your <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Supabase Dashboard</a>
                      </li>
                      <li>
                        Select your project
                      </li>
                      <li>
                        Go to Storage in the left sidebar
                      </li>
                      <li>
                        Click "New Bucket" and create buckets named "videos" and "thumbnails"
                      </li>
                      <li>
                        For each bucket, click on it, go to "Settings" tab, and turn on "Public bucket"
                      </li>
                    </ol>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card className="glassmorphism text-white border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Row-Level Security (RLS) Policies</span>
                <Button 
                  variant="ghost" 
                  className="p-1 h-8 w-8"
                  onClick={() => setExpanded(prev => ({ ...prev, policies: !prev.policies }))}
                >
                  <i className={`ri-${expanded.policies ? 'subtract' : 'add'}-line text-lg`}></i>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">
                Row-Level Security (RLS) policies control access to your Supabase storage buckets.
                You need to have the correct policies set up for video uploads and playback to work.
              </p>
              
              {expanded.policies && (
                <div className="bg-gray-800/50 p-4 rounded-md">
                  <h3 className="text-lg font-medium mb-2">Required RLS Policies</h3>
                  <p className="text-gray-300 mb-2">
                    Copy and run these SQL statements in your Supabase SQL Editor:
                  </p>
                  <pre className="bg-gray-900/80 p-4 rounded overflow-x-auto text-xs">
{`-- Allow public read access to videos and thumbnails
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id IN ('videos', 'thumbnails'));

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT 
TO authenticated
USING (bucket_id IN ('videos', 'thumbnails'));

-- Allow users to update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id IN ('videos', 'thumbnails') 
       AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id IN ('videos', 'thumbnails') 
           AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id IN ('videos', 'thumbnails') 
       AND (storage.foldername(name))[1] = auth.uid()::text);`}
                  </pre>
                  
                  <h3 className="text-lg font-medium mt-6 mb-2">How to apply these policies</h3>
                  <ol className="list-decimal pl-5 space-y-2 text-gray-300">
                    <li>
                      Go to your <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Supabase Dashboard</a>
                    </li>
                    <li>
                      Select your project
                    </li>
                    <li>
                      Go to "SQL Editor" in the left sidebar
                    </li>
                    <li>
                      Create a new query
                    </li>
                    <li>
                      Paste the SQL statements above
                    </li>
                    <li>
                      Run the query
                    </li>
                  </ol>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="glassmorphism text-white border-gray-700 mb-6">
            <CardHeader>
              <CardTitle>Run Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">
                Run these tests to verify your Supabase configuration.
              </p>
              
              <Button 
                onClick={runTests} 
                disabled={loading.tests}
                className="btn-gradient"
              >
                {loading.tests ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> Running Tests...</>
                ) : (
                  <>Run Diagnostics</>
                )}
              </Button>
              
              {!loading.tests && (testResults.authenticated || testResults.bucketsAccessible || testResults.videosUploadable || testResults.publicAccess || testResults.testError) && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-medium">Test Results</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <span className="text-gray-300 mr-2">Authentication:</span>
                      {testResults.authenticated ? (
                        <Badge variant="default" className="bg-green-500/20 text-green-400">
                          Successful
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Failed</Badge>
                      )}
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-300 mr-2">Buckets Access:</span>
                      {testResults.bucketsAccessible ? (
                        <Badge variant="default" className="bg-green-500/20 text-green-400">
                          Successful
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Failed</Badge>
                      )}
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-300 mr-2">File Upload:</span>
                      {testResults.videosUploadable ? (
                        <Badge variant="default" className="bg-green-500/20 text-green-400">
                          Successful
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Failed</Badge>
                      )}
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-300 mr-2">Public Access:</span>
                      {testResults.publicAccess ? (
                        <Badge variant="default" className="bg-green-500/20 text-green-400">
                          Successful
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Failed</Badge>
                      )}
                    </div>
                  </div>
                  
                  {testResults.testError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-md p-4 mt-4">
                      <h4 className="font-medium text-red-400 mb-1">Error</h4>
                      <p className="text-gray-300">{testResults.testError}</p>
                    </div>
                  )}
                  
                  {testVideoUrl && (
                    <div className="bg-gray-800/50 p-4 rounded-md mt-4">
                      <h4 className="font-medium text-white mb-1">Test File URL</h4>
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          value={testVideoUrl}
                          readOnly
                          className="w-full bg-gray-900/80 p-2 rounded border border-gray-700 text-gray-300 text-sm"
                        />
                        <Button
                          onClick={() => window.open(testVideoUrl, '_blank')}
                          variant="outline"
                          size="sm"
                          className="text-gray-200 border-gray-700"
                        >
                          <i className="ri-external-link-line"></i>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="glassmorphism text-white border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Check Server Logs</span>
                <Button 
                  variant="ghost" 
                  className="p-1 h-8 w-8"
                  onClick={() => setExpanded(prev => ({ ...prev, serverLogs: !prev.serverLogs }))}
                >
                  <i className={`ri-${expanded.serverLogs ? 'subtract' : 'add'}-line text-lg`}></i>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">
                If you're still having issues, check the server logs for more information.
              </p>
              
              {expanded.serverLogs && (
                <div className="bg-gray-800/50 p-4 rounded-md">
                  <h3 className="text-lg font-medium mb-2">How to check server logs</h3>
                  <ol className="list-decimal pl-5 space-y-2 text-gray-300">
                    <li>
                      Look at the console output in your terminal where the server is running
                    </li>
                    <li>
                      Alternatively, open your browser's developer tools (F12 or Cmd+Option+I)
                    </li>
                    <li>
                      Go to the "Console" tab to see client-side logs
                    </li>
                    <li>
                      Go to the "Network" tab and look for failed requests to your Supabase project
                    </li>
                    <li>
                      Look for any errors related to storage, authentication, or other Supabase services
                    </li>
                  </ol>
                  
                  <h3 className="text-lg font-medium mt-6 mb-2">Common Error Messages</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-red-400">JWT expired</h4>
                      <p className="text-gray-300">Your authentication token has expired. Try logging out and back in.</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-red-400">Bucket not found</h4>
                      <p className="text-gray-300">The specified bucket doesn't exist. Create the required buckets as described above.</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-red-400">Permission denied</h4>
                      <p className="text-gray-300">Missing or incorrect RLS policies. Set up the policies as described above.</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-red-400">HTTP 400 Bad Request</h4>
                      <p className="text-gray-300">Public URL access failed. Make sure your bucket is set to public.</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}