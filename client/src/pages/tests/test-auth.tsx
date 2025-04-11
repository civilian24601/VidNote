// client/src/pages/test-auth.tsx
import React, { useState } from 'react';
import { useAuth } from '../../auth/auth-context';

const testInputStyle = "w-full p-2 border rounded text-black bg-white";
const jsonDisplayStyle = "bg-white p-2 rounded overflow-auto max-h-60 text-black";

export default function TestAuth() {
  const auth = useAuth();
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState({
    fullName: 'Updated Name',
    bio: 'Updated bio information'
  });
  
  // Test functions for each auth operation
  const handleSignUp = async () => {
    try {
      await auth.signUp(email, password, {
        username: 'testuser',
        full_name: 'Test User',
        role: 'student',
      });
      setResult({ success: true, action: 'signup' });
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  const handleSignIn = async () => {
    try {
      await auth.signIn(email, password);
      setResult({ success: true, action: 'signin' });
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  const handleSignOut = async () => {
    try {
      await auth.signOut();
      setResult({ success: true, action: 'signout' });
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  const handleUpdateProfile = async () => {
    try {
      await auth.updateProfile(profileData);
      setResult({ success: true, action: 'update-profile' });
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  const handleClearAuth = () => {
    // Clear Supabase items from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase')) {
        localStorage.removeItem(key);
      }
    });
    // Force reload the page
    window.location.reload();
  };
  
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Auth System Test Harness</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2 text-black">Current Auth State:</h2>
        <pre className={jsonDisplayStyle}>
          {JSON.stringify({ 
            user: auth.user, 
            isAuthenticated: auth.isAuthenticated,
            loading: auth.loading,
            session: auth.session
          }, null, 2)}
        </pre>
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 mb-6">
        <div>
          <label className="block mb-2">Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            className={testInputStyle}
          />
        </div>
        <div>
          <label className="block mb-2">Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            className={testInputStyle}
          />
        </div>
      </div>
      
      <div className="flex flex-wrap gap-4 mb-6">
        <button 
          onClick={handleSignUp}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Sign Up
        </button>
        <button 
          onClick={handleSignIn}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Sign In
        </button>
        <button 
          onClick={handleSignOut}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Sign Out
        </button>
        <button 
          onClick={handleClearAuth}
          className="bg-yellow-500 text-white px-4 py-2 rounded"
        >
          Reset Auth State
        </button>
      </div>
      
      <div className="mb-6">
        <h2 className="font-semibold mb-2">Profile Update Test:</h2>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 mb-4">
          <div>
            <label className="block mb-2">Full Name</label>
            <input 
              type="text" 
              value={profileData.fullName} 
              onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
              className={testInputStyle}
            />
          </div>
          <div>
            <label className="block mb-2">Bio</label>
            <input 
              type="text" 
              value={profileData.bio} 
              onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
              className={testInputStyle}
            />
          </div>
        </div>
        <button 
          onClick={handleUpdateProfile}
          className="bg-purple-500 text-white px-4 py-2 rounded"
          disabled={!auth.isAuthenticated}
        >
          Update Profile
        </button>
      </div>
      
      {result && (
        <div className="mb-6 p-4 bg-green-100 rounded">
          <h2 className="font-semibold mb-2">Result:</h2>
          <pre className={jsonDisplayStyle}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      {error && (
        <div className="p-4 bg-red-100 rounded">
          <h2 className="font-semibold mb-2">Error:</h2>
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      <div className="mt-8 border-t pt-4">
        <h2 className="font-semibold mb-4">Test Instructions:</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li><strong>Registration Test</strong>: Enter a new email/password, click Sign Up, verify you're logged in and check Supabase for the new user</li>
          <li><strong>Login Test</strong>: Log out, then enter credentials and click Sign In, verify you're properly logged in</li>
          <li><strong>Logout Test</strong>: Click Sign Out, verify auth state is cleared</li>
          <li><strong>Session Persistence</strong>: After login, refresh the page and verify you remain logged in</li>
          <li><strong>Profile Update</strong>: While logged in, change the profile fields, click Update Profile, verify changes in auth state and Supabase</li>
        </ol>
      </div>
    </div>
  );
}