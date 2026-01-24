import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

interface Contact {
  id: number;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  phone: string | null;
  ip_address: string;
  user_agent: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export function useContacts() {
  const { tokens } = useAuthStore();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contact`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts);
        setError(null);
      } else if (response.status === 401) {
        setError('Unauthorized');
      } else {
        setError('Failed to fetch contacts');
      }
    } catch (err) {
      setError('Error fetching contacts');
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteContact = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contact/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });

      if (response.ok) {
        setContacts(contacts.filter(c => c.id !== id));
        return { success: true };
      } else {
        return { success: false, error: 'Error deleting contact' };
      }
    } catch (err) {
      console.error('Error deleting contact:', err);
      return { success: false, error: 'Error deleting contact' };
    }
  };

  const markAsRead = async (id: number, isRead: boolean) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contact/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_read: isRead })
      });

      if (response.ok) {
        setContacts(contacts.map(c => c.id === id ? { ...c, is_read: isRead } : c));
        return { success: true };
      } else {
        return { success: false, error: 'Error updating contact status' };
      }
    } catch (err) {
      console.error('Error updating contact status:', err);
      return { success: false, error: 'Error updating contact status' };
    }
  };

  useEffect(() => {
    if (tokens?.accessToken) {
      fetchContacts();
    }
  }, [tokens?.accessToken]);

  return {
    contacts,
    loading,
    error,
    deleteContact,
    markAsRead,
    refetch: fetchContacts
  };
}