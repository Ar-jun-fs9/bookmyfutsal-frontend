import { formatTime } from '../../utils/bookingUtils';

interface Futsal {
  futsal_id: number;
  name: string;
  location: string;
  city: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  description?: string;
  images?: string[];
  video?: string;
  price_per_hour: number;
  game_format?: string;
  facilities?: string[];
  opening_hours?: string;
  closing_hours?: string;
  last_updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

interface FutsalDetailsModalProps {
  isOpen: boolean;
  futsal: Futsal | null;
  onClose: () => void;
}

export function FutsalDetailsModal({ isOpen, futsal, onClose }: FutsalDetailsModalProps) {
  if (!isOpen || !futsal) return null;

  return (
    <div className="fixed top-16 inset-x-0 z-50 mt-1 p-4 backdrop-blur-sm">
      <div className="bg-white p-6 rounded max-w-4xl w-full mx-auto max-h-[calc(100vh-5rem)] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Futsal Details</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <strong>Name:</strong> {futsal.name}
            </div>
            <div>
              <strong>Location:</strong> {futsal.location}
            </div>
            <div>
              <strong>City:</strong> {futsal.city}
            </div>
            <div>
              <strong>Phone:</strong> {futsal.phone || 'N/A'}
            </div>
            <div>
              <strong>Latitude:</strong> {futsal.latitude || 'N/A'}
            </div>
            <div>
              <strong>Longitude:</strong> {futsal.longitude || 'N/A'}
            </div>
            <div>
              <strong>Price per Hour:</strong> Rs. {futsal.price_per_hour || 'N/A'}
            </div>
            <div>
              <strong>Game Format:</strong> {futsal.game_format || 'N/A'}
            </div>
            <div className="col-span-2">
              <strong>Facilities:</strong> {futsal.facilities && futsal.facilities.length > 0 ? futsal.facilities.join(', ') : 'N/A'}
            </div>
            <div>
              <strong>Opening Hours:</strong> {futsal.opening_hours ? formatTime(futsal.opening_hours) : 'N/A'}
            </div>
            <div>
              <strong>Closing Hours:</strong> {futsal.closing_hours ? formatTime(futsal.closing_hours) : 'N/A'}
            </div>
            <div>
              <strong>Last Updated By:</strong> {futsal.last_updated_by || 'N/A'}
            </div>
            <div>
              <strong>Created At:</strong> {futsal.created_at ? new Date(futsal.created_at).toLocaleString() : 'N/A'}
            </div>
            <div>
              <strong>Updated At:</strong> {futsal.updated_at ? new Date(futsal.updated_at).toLocaleString() : 'N/A'}
            </div>
          </div>
          <div>
            <strong>Description:</strong>
            <p className="mt-1">{futsal.description || 'N/A'}</p>
          </div>
          {futsal.images && futsal.images.length > 0 && (
            <div>
              <strong>Images:</strong>
              <div className="flex flex-wrap gap-2 mt-2">
                {futsal.images.map((img, index) => (
                  <img key={index} src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${img}`} alt={`${futsal.name} ${index + 1}`} className="w-32 h-32 object-cover" />
                ))}
              </div>
            </div>
          )}
          {futsal.video && (
            <div>
              <strong>Video:</strong>
              <div className="mt-2">
                <video controls className="w-64 h-36">
                  <source src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${futsal.video}`} type="video/mp4" />
                </video>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}