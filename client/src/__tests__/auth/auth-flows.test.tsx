// Tests for registration, login, logout flows
// client/src/__tests__/auth/auth-flows.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '@/auth/auth-context';
import { supabase } from '../../../supabase/client';

// Access the mocked supabase client
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

// Test component to expose auth methods
function AuthTestComponent() {
  const { user, signUp, signIn, signOut, loading } = useAuth();
  
  const handleSignUp = async () => {
    await signUp('test@example.com', 'password123', {
      username: 'testuser',
      full_name: 'Test User',
      role: 'student',
    });
  };
  
  const handleSignIn = async () => {
    await signIn('test@example.com', 'password123');
  };
  
  const handleSignOut = async () => {
    await signOut();
  };
  
  return (
    <div>
      <div data-testid="loading-state">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="user-data">{user ? JSON.stringify(user) : 'No user'}</div>
      <button onClick={handleSignUp} data-testid="signup-button">Sign Up</button>
      <button onClick={handleSignIn} data-testid="signin-button">Sign In</button>
      <button onClick={handleSignOut} data-testid="signout-button">Sign Out</button>
    </div>
  );
}

describe('Authentication Flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    
    // Mock window.location.href setter
    Object.defineProperty(window, 'location', {
      value: { href: jest.fn() },
      writable: true,
    });
  });
  
  it('should handle user registration', async () => {
    const mockUser = {
      id: 'new-user-id',
      email: 'test@example.com',
      user_metadata: {
        username: 'testuser',
        full_name: 'Test User',
        role: 'student',
      },
    };
    
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { 
        user: mockUser,
        session: { user: mockUser },
      },
      error: null,
    });
    
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { 
        session: { user: mockUser }
      },
      error: null,
    });
    
    mockSupabase.from().insert.mockResolvedValue({
      data: null,
      error: null,
    });
    
    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: {
        id: 'new-user-id',
        email: 'test@example.com',
        username: 'testuser',
      },
      error: null,
    });
    
    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
    });
    
    const signUpButton = screen.getByTestId('signup-button');
    userEvent.click(signUpButton);
    
    await waitFor(() => {
      expect(mockSupabase.auth.signUp).toHaveBeenCalled();
      expect(mockSupabase.from().insert).toHaveBeenCalled();
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('user-data')).not.toHaveTextContent('No user');
    });
  });
  
  it('should handle user login', async () => {
    const mockUser = {
      id: 'existing-user-id',
      email: 'test@example.com',
      user_metadata: {
        username: 'testuser',
        full_name: 'Test User',
        role: 'student',
      },
    };
    
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { 
        user: mockUser,
        session: { user: mockUser },
      },
      error: null,
    });
    
    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: {
        id: 'existing-user-id',
        email: 'test@example.com',
        username: 'testuser',
      },
      error: null,
    });
    
    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
    });
    
    const signInButton = screen.getByTestId('signin-button');
    userEvent.click(signInButton);
    
    await waitFor(() => {
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalled();
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('user-data')).not.toHaveTextContent('No user');
    });
  });
  
  it('should handle user logout', async () => {
    // Set up with a logged-in user first
    const mockUser = {
      id: 'existing-user-id',
      email: 'test@example.com',
      user_metadata: {
        username: 'testuser',
        full_name: 'Test User',
        role: 'student',
      },
    };
    
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { 
        session: { user: mockUser }
      },
      error: null,
    });
    
    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: {
        id: 'existing-user-id',
        email: 'test@example.com',
        username: 'testuser',
      },
      error: null,
    });
    
    mockSupabase.auth.signOut.mockResolvedValue({
      error: null,
    });
    
    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>
    );
    
    // Wait for initial auth state to be loaded
    await waitFor(() => {
      expect(screen.getByTestId('user-data')).not.toHaveTextContent('No user');
    });
    
    const signOutButton = screen.getByTestId('signout-button');
    userEvent.click(signOutButton);
    
    await waitFor(() => {
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });
    
    // Check redirection
    expect(window.location.href).toBe('/');
  });
});