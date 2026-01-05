import { useState } from 'react';

interface Futsal {
  futsal_id: number;
  name: string;
  location: string;
  city: string;
}

interface CreateFutsalAdminFormProps {
  futsals: Futsal[];
  superAdminId: number;
  setNotification: React.Dispatch<React.SetStateAction<{message: string, type: 'success' | 'info'} | null>>;
  onSuccess: () => void;
}

export function CreateFutsalAdminForm({ futsals, superAdminId, setNotification, onSuccess }: CreateFutsalAdminFormProps) {
  const [formData, setFormData] = useState({
    futsal_name: '',
    location: '',
    city: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    futsal_id: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsal-admins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, super_admin_id: superAdminId }),
      });

      if (response.ok) {
        setNotification({ message: "Futsal admin created successfully", type: 'success' });
        onSuccess();
        setFormData({
          futsal_name: '', location: '', city: '', username: '', email: '', phone: '', password: '', futsal_id: ''
        });
      } else {
        setNotification({ message: "Error creating futsal admin", type: 'info' });
      }
    } catch (error) {
      console.error('Error:', error);
      setNotification({ message: "Error creating futsal admin", type: 'info' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-white">
      <h3 className="text-lg font-semibold mb-4">Create Futsal Admin</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <select value={formData.futsal_id} onChange={(e) => {
          const selectedFutsal = futsals.find(f => f.futsal_id.toString() === e.target.value);
          setFormData({
            ...formData,
            futsal_id: e.target.value,
            futsal_name: selectedFutsal?.name || '',
            location: selectedFutsal?.location || '',
            city: selectedFutsal?.city || ''
          });
        }} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border">
          <option value="">Select Futsal</option>
          {futsals.map((futsal) => (
            <option key={futsal.futsal_id} value={futsal.futsal_id}>{futsal.name}</option>
          ))}
        </select>
        <input type="text" placeholder="Futsal Name" value={formData.futsal_name} readOnly className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border bg-gray-100" />
        <input type="text" placeholder="Location" value={formData.location} readOnly className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border bg-gray-100" />
        <input type="text" placeholder="City" value={formData.city} readOnly className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border bg-gray-100" />
        <input type="text" placeholder="Username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
        <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
        <input type="tel" placeholder="Phone (10 digits starting with 9)" value={formData.phone} maxLength={10} pattern="9[0-9]{9}" onChange={(e) => {
          const value = e.target.value.replace(/\D/g, "");
          if (value.length <= 10 && (value === "" || value.startsWith("9"))) {
            setFormData({ ...formData, phone: value });
          }
        }} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
        <input type="password" placeholder="Password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
        <button type="submit" disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50">
          {loading ? 'Creating...' : 'Create Futsal Admin'}
        </button>
      </form>
    </div>
  );
}