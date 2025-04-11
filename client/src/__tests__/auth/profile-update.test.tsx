// Tests for profile management
// client/src/__tests__/auth/profile-update.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '@/auth/auth-context';
import { supabase } from '../../../supabase/client';

// Access the mocked supabase client
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

// Test component to expose profile update method
function ProfileUpdateTestComponent() {
  const { user, updateProfile, loading } = useAuth();
  
  const handleUpdateProfile = async () => {
    await updateProfile({
      fullName: 'Updated Name',
      bio: 'New bio information',
    });
  };
  
  return (
    <div>
      <div data-testid="loading-state">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="user-data">{user ? JSON.stringify(user) : 'No user'}</div>
      <button onClick={handleUpdateProfile} data-testid="update-button">Update Profile</button>
    </div>
  );
}

describe('Profile Update', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock a logged-in user
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: {
        username: 'testuser',
        full_name: 'Original Name',
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
        full_name: 'Original Name',
        role: 'student',
      },
      error: null,
    });
  });
  
  it('should update user profile', async () => {
    mockSupabase.auth.updateUser.mockResolvedValue({
      data: { user: {} },
      error: null,
    });
    
    mockSupabase.from().update().eq.mockResolvedValue({
      data: null,
      error: null,
    });
    
    // Updated profile data returned after fetch
    const updatedProfile = {
      id: 'test-user-id',
      email: 'test@example.com',
      username: 'testuser',
      full_name: 'Updated Name',
      role: 'student',
      bio: 'New bio information',
    };
    
    // This is for the second call to fetchUserProfile after update
    mockSupabase.from().select().eq().single
      .mockResolvedValueOnce({
        data: {
          id: 'test-user-id',
          email: 'test@example.com',
          username: 'testuser',
          full_name: 'Original Name',
          role: 'student',
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: updatedProfile,
        error: null,
      });
    
    render(
      <AuthProvider>
        <ProfileUpdateTestComponent />
      </AuthProvider>
    );
    
    // Wait for initial auth state to be loaded
    await waitFor(() => {
      expect(screen.getByTestId('user-data')).not.toHaveTextContent('No user');
    });
    
    const updateButton = screen.getByTestId('update-button');
    userEvent.click(updateButton);
    
    await waitFor(() => {
      expect(mockSupabase.auth.updateUser).toHaveBeenCalled();
      expect(mockSupabase.from().update).toHaveBeenCalled();
    });
    
    // Check that the updated profile was fetched
    await waitFor(() => {
      expect(screen.getByTestId('user-data')).toHaveTextContent('Updated Name');
      expect(screen.getByTestId('user-data')).toHaveTextContent('New bio information');
    });
  });
});