// Tests for session management
// client/src/__tests__/auth/session-persistence.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/auth/auth-context';
import { supabase } from '../../../supabase/client';

// Access the mocked supabase client
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

// Simple component to display auth state
function SessionTestComponent() {
  const { user, isAuthenticated, loading } = useAuth();
  
  return (
    <div>
      <div data-testid="loading-state">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="auth-state">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      <div data-testid="user-data">{user ? JSON.stringify(user) : 'No user'}</div>
    </div>
  );
}

describe('Session Persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should maintain session after page reload', async () => {
    // Mock a stored session
    const mockUser = {
      id: 'test-user-id',
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
        id: 'test-user-id',
        email: 'test@example.com',
        username: 'testuser',
        full_name: 'Test User',
        role: 'student',
      },
      error: null,
    });
    
    // First render - initial page load
    const { unmount } = render(
      <AuthProvider>
        <SessionTestComponent />
      </AuthProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('auth-state')).toHaveTextContent('Authenticated');
    });
    
    // Unmount to simulate page navigation/refresh
    unmount();
    
    // Re-render to simulate page reload
    render(
      <AuthProvider>
        <SessionTestComponent />
      </AuthProvider>
    );
    
    // Session should be restored
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('auth-state')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-data')).toHaveTextContent('test-user-id');
    });
    
    // Verify getSession was called twice (once for each render)
    expect(mockSupabase.auth.getSession).toHaveBeenCalledTimes(2);
  });
});