interface Futsal {
  futsal_id: number;
  name: string;
  latitude?: number;
  longitude?: number;
}

interface LocationModalProps {
  futsal: Futsal;
  distance: number;
  onClose: () => void;
}

export default function LocationModal({ futsal, distance, onClose }: LocationModalProps) {
  const handleShowDirections = () => {
    if (!futsal.latitude || !futsal.longitude) return;

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;

        const url = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLon}&destination=${futsal.latitude},${futsal.longitude}&travelmode=driving`;
        window.open(url, '_blank');
        onClose();
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your current location for directions.');
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 300000
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-sm w-full shadow-2xl">
        <div className="p-4">
          <div className="text-center mb-4">
            <div className="text-4xl mb-3">📍</div>
            <h3 className="text-lg font-bold text-gray-800 mb-3">Location Information</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              You are <span className="font-semibold text-blue-600">{distance.toFixed(2)} km</span> away from <span className="font-semibold">{futsal.name}</span>.
            </p>
            <p className="text-gray-600 text-sm mt-2">
              Would you like to see directions in Google Maps?
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleShowDirections}
              className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-all duration-300 font-semibold text-sm"
            >
              Yes, Show Directions
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600 text-white py-2 px-3 rounded-lg hover:bg-gray-700 transition-all duration-300 font-semibold text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}