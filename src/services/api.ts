import { useAuthStore } from '@/stores/authStore';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;

class ApiService {
  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${API_BASE_URL}${endpoint}`;

    // Get access token from store
    const { tokens } = useAuthStore.getState();

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add authorization header if token exists
    if (tokens?.accessToken) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${tokens.accessToken}`,
      };
    }

    const response = await fetch(url, config);

    // Handle token expiration
    if (response.status === 401) {
      // Try to refresh token
      const refreshResult = await this.refreshToken();
      if (refreshResult) {
        // Retry the request with new token
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${refreshResult.accessToken}`,
        };
        const retryResponse = await fetch(url, config);
        if (retryResponse.ok) {
          return retryResponse.json();
        }
      }
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private async refreshToken(): Promise<any> {
    try {
      const { tokens, setTokens, logout } = useAuthStore.getState();
      if (!tokens?.refreshToken) {
        logout();
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/users/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        setTokens(data.tokens);
        return data.tokens;
      } else {
        logout();
        return null;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      useAuthStore.getState().logout();
      return null;
    }
  }

  // Futsals
  async getFutsals() {
    return this.request('/futsals');
  }

  async getFutsal(id: number) {
    return this.request(`/futsals/${id}`);
  }

  // Bookings
  async getBookings(userId?: number) {
    const endpoint = userId ? `/bookings?user_id=${userId}` : '/bookings';
    return this.request(endpoint);
  }

  async getFutsalBookings(futsalId: number) {
    return this.request(`/bookings/futsal/${futsalId}`);
  }

  async createBooking(bookingData: any) {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async updateBooking(bookingId: number, updateData: any) {
    return this.request(`/bookings/user/${bookingId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async cancelBooking(bookingId: number, userId: number) {
    return this.request(`/bookings/user/${bookingId}`, {
      method: 'DELETE',
      body: JSON.stringify({ user_id: userId }),
    });
  }

  async trackBooking(trackingCode: string) {
    return this.request(`/bookings/track/${trackingCode}`);
  }

  // Time Slots
  async getTimeSlots(futsalId: number, date: string, shift: string) {
    if (!shift || shift.trim() === '') {
      throw new Error('Shift parameter is required');
    }
    return this.request(`/time-slots/futsal/${futsalId}/date/${date}/shift/${shift}`);
  }

  async getFutsalSlotsForDate(futsalId: number, date: string) {
    return this.request(`/time-slots/admin/futsal/${futsalId}/date/${date}`);
  }

  async reserveSlot(slotId: number) {
    return this.request(`/time-slots/${slotId}/reserve`, {
      method: 'POST',
    });
  }

  async releaseSlot(slotId: number) {
    return this.request(`/time-slots/${slotId}/release`, {
      method: 'POST',
    });
  }

  async getSlotStatus(slotId: number) {
    return this.request(`/time-slots/${slotId}/status`);
  }

  async closeAllSlotsForDate(futsalId: number, date: string) {
    return this.request(`/time-slots/futsal/${futsalId}/date/${date}/close-all`, {
      method: 'PUT',
    });
  }

  async openAllSlotsForDate(futsalId: number, date: string) {
    return this.request(`/time-slots/futsal/${futsalId}/date/${date}/open-all`, {
      method: 'PUT',
    });
  }

  async updateSlotStatus(slotId: number, status: string) {
    return this.request(`/time-slots/${slotId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Ratings
  async getFutsalRatings(futsalId: number) {
    return this.request(`/ratings/futsal/${futsalId}`);
  }

  async createRating(ratingData: any) {
    return this.request('/ratings', {
      method: 'POST',
      body: JSON.stringify(ratingData),
    });
  }

  async updateRating(ratingId: number, updateData: any) {
    return this.request(`/ratings/${ratingId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteRating(ratingId: number) {
    return this.request(`/ratings/${ratingId}`, {
      method: 'DELETE',
    });
  }

  // OTP
  async generateOTP(contact: string, type: 'email' | 'phone') {
    return this.request('/otp/generate', {
      method: 'POST',
      body: JSON.stringify({ contact, type }),
    });
  }

  async verifyOTP(contact: string, otp: string) {
    return this.request('/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ contact, otp }),
    });
  }

  async checkVerified(contact: string) {
    return this.request(`/otp/check-verified?contact=${encodeURIComponent(contact)}`);
  }

  // Users
  async registerUser(userData: any) {
    return this.request('/users/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async loginUser(credentials: any) {
    return this.request('/users/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async updateUser(userId: number, updateData: any) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async forgotPassword(email: string) {
    return this.request('/users/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(data: any) {
    return this.request('/users/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Futsal Admins
  async loginFutsalAdmin(credentials: any) {
    return this.request('/futsal-admins/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  // Super Admin
  async loginSuperAdmin(credentials: any) {
    return this.request('/superadmin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }
}

export const apiService = new ApiService();