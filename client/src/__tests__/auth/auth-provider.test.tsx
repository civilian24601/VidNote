// Tests for AuthProvider context
// client/src/__tests__/auth/auth-provider.test.tsx
import { renderHook, act } from '@testing-library/react-hooks';
import { AuthProvider, useAuth } from '@/auth/auth-context';
import { supabase } from '../../../supabase/client';
import { waitFor } from '@testing-library/react';

// Access the mocked supabase client
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
  });

  it('should initialize with null user and session', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should load user data when session exists', async () => {
    // Mock an existing session
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: {
        username: 'testuser',
        full_name: 'Test User',
        role: 'student',
      },
    };
    
    const mockSession = {
      user: mockUser,
    };
    
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
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

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.user).not.toBeNull();
    });

    expect(result.current.user?.id).toBe('test-user-id');
    expect(result.current.isAuthenticated).toBe(true);
  });
});