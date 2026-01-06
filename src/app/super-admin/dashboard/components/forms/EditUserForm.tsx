import { useState } from 'react';

interface EditUserFormProps {
  user: any;
  updateUser: (id: number, formData: any) => Promise<{success: boolean, error?: string}>;
  onUpdate: (data: any) => void;
  onCancel: () => void;
  setNotification: React.Dispatch<React.SetStateAction<{message: string, type: 'success' | 'info'} | null>>;
}

export function EditUserForm({ user, updateUser, onUpdate, onCancel, setNotification }: EditUserFormProps) {
  const [formData, setFormData] = useState({
    first_name: user.first_name,
    last_name: user.last_name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${user.user_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onUpdate(formData);
        setNotification({ message: "User updated successfully", type: 'success' });
      } else {
        setNotification({ message: "Error updating user", type: 'info' });
      }
    } catch (error) {
      console.error('Error:', error);
      setNotification({ message: "Error updating user", type: 'info' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="text" placeholder="First Name" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
      <input type="text" placeholder="Last Name" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
      <input type="text" placeholder="Username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
      <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
      <input type="tel" placeholder="Phone (10 digits starting with 9)" value={formData.phone} maxLength={10} pattern="9[0-9]{9}" onChange={(e) => {
        const value = e.target.value.replace(/\D/g, "");
        if (value.length <= 10 && (value === "" || value.startsWith("9"))) {
          setFormData({ ...formData, phone: value });
        }
      }} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
      <input type="password" placeholder="New Password (leave empty)" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
      <div className="flex space-x-4">
        <button type="submit" disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50">
          {loading ? 'Updating...' : 'Update User'}
        </button>
        <button type="button" onClick={onCancel} className="bg-gray-600 text-white px-4 py-2 rounded">
          Cancel
        </button>
      </div>
    </form>
  );
}