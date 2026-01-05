import { useState } from 'react';

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
}

interface EditFutsalFormProps {
  futsal: Futsal;
  onUpdate: (data: FormData) => void;
  onCancel: () => void;
  setNotification: React.Dispatch<React.SetStateAction<{message: string, type: 'success' | 'info'} | null>>;
}

export function EditFutsalForm({ futsal, onUpdate, onCancel, setNotification }: EditFutsalFormProps) {
  const [formData, setFormData] = useState({
    name: futsal.name,
    location: futsal.location,
    city: futsal.city,
    latitude: futsal.latitude?.toString() || '',
    longitude: futsal.longitude?.toString() || '',
    phone: futsal.phone || '',
    description: futsal.description || '',
    price_per_hour: futsal.price_per_hour?.toString() || '',
    game_format: futsal.game_format || '',
    facilities: futsal.facilities || [],
    opening_hours: futsal.opening_hours ? futsal.opening_hours.split(':').slice(0, 2).map(h => h.padStart(2, '0')).join(':') : '',
    closing_hours: futsal.closing_hours ? futsal.closing_hours.split(':').slice(0, 2).map(h => h.padStart(2, '0')).join(':') : ''
  });
  const [customGameFormat, setCustomGameFormat] = useState('');
  const [customFacilities, setCustomFacilities] = useState('');
  const [images, setImages] = useState<FileList | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>(futsal.images || []);
  const [existingVideo, setExistingVideo] = useState<string | null>(futsal.video || null);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [removedVideo, setRemovedVideo] = useState(false);
  const [newImagePreviews, setNewImagePreviews] = useState<File[]>([]);
  const [newVideoPreview, setNewVideoPreview] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const gameFormatOptions = [
    '5 vs 5 on-court',
    '6 vs 6 on-court',
    '7 vs 7 on-court',
    '8 vs 8 on-court',
    '9 vs 9 on-court',
    '10 vs 10 on-field',
    '1 vs 11 on-field'
  ];

  const facilitiesOptions = [
    'Night lighting',
    'Changing rooms',
    'showers',
    'Washrooms / drinking water',
    'Parking facilities',
    'swimming pool',
    'Tournaments',
    'Café / snacks area / seating lounge'
  ];

  const removeImage = (imgPath: string) => {
    setExistingImages(existingImages.filter(img => img !== imgPath));
    setRemovedImages([...removedImages, imgPath]);
  };

  const removeVideo = () => {
    setExistingVideo(null);
    setRemovedVideo(true);
  };

  const handleGameFormatChange = (value: string) => {
    if (value === 'custom') {
      setFormData({ ...formData, game_format: customGameFormat });
    } else {
      setFormData({ ...formData, game_format: value });
      setCustomGameFormat('');
    }
  };

  const handleFacilitiesChange = (facility: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, facilities: [...formData.facilities, facility] });
    } else {
      setFormData({ ...formData, facilities: formData.facilities.filter(f => f !== facility) });
    }
  };

  const addCustomFacility = () => {
    if (customFacilities.trim() && !formData.facilities.includes(customFacilities.trim())) {
      setFormData({ ...formData, facilities: [...formData.facilities, customFacilities.trim()] });
      setCustomFacilities('');
    }
  };

  const removeFacility = (facility: string) => {
    setFormData({ ...formData, facilities: formData.facilities.filter(f => f !== facility) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'facilities') {
        data.append(key, JSON.stringify(value));
      } else {
        data.append(key, value as string);
      }
    });
    if (images) {
      for (let i = 0; i < images.length; i++) {
        data.append('images', images[i]);
      }
    }
    if (video) data.append('video', video);
    data.append('removed_images', JSON.stringify(removedImages));
    data.append('removed_video', removedVideo.toString());

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsals/${futsal.futsal_id}`, {
        method: 'PUT',
        body: data,
      });

      if (response.ok) {
        onUpdate(data);
        setNotification({ message: "Futsal updated successfully", type: 'success' });
      } else {
        setNotification({ message: "Error updating futsal", type: 'info' });
      }
    } catch (error) {
      console.error('Error:', error);
      setNotification({ message: "Error updating futsal", type: 'info' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="text" placeholder="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
      <input type="text" placeholder="Location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
      <input type="text" placeholder="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
      <input type="text" placeholder="Latitude" value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
      <input type="text" placeholder="Longitude" value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
      <input type="tel" placeholder="Phone (10 digits starting with 9)" value={formData.phone} maxLength={10} pattern="9[0-9]{9}" onChange={(e) => {
        const value = e.target.value.replace(/\D/g, "");
        if (value.length <= 10 && (value === "" || value.startsWith("9"))) {
          setFormData({ ...formData, phone: value });
        }
      }} className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
      <input type="number" placeholder="Price per Hour (Rs.)" value={formData.price_per_hour} onChange={(e) => setFormData({ ...formData, price_per_hour: e.target.value })} step="0.01" className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />

      {/* Game Format */}
      <div>
        <label className="block text-sm font-medium mb-2">Game Format</label>
        <select
          value={gameFormatOptions.includes(formData.game_format) ? formData.game_format : 'custom'}
          onChange={(e) => handleGameFormatChange(e.target.value)}
          className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border mb-2"
        >
          <option value="">Select Game Format</option>
          {gameFormatOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
          <option value="custom">Enter Custom Format</option>
        </select>
        {(formData.game_format === '' || !gameFormatOptions.includes(formData.game_format)) && (
          <input
            type="text"
            placeholder="Enter custom game format"
            value={customGameFormat}
            onChange={(e) => {
              setCustomGameFormat(e.target.value);
              setFormData({ ...formData, game_format: e.target.value });
            }}
            className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border"
          />
        )}
      </div>

      {/* Facilities */}
      <div>
        <label className="block text-sm font-medium mb-2">Facilities</label>
        <div className="grid grid-cols-2 gap-2 mb-2">
          {facilitiesOptions.map(option => (
            <label key={option} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.facilities.includes(option)}
                onChange={(e) => handleFacilitiesChange(option, e.target.checked)}
                className="mr-2"
              />
              {option}
            </label>
          ))}
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Add custom facility"
            value={customFacilities}
            onChange={(e) => setCustomFacilities(e.target.value)}
            className="flex-1 p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border"
          />
          <button type="button" onClick={addCustomFacility} className="bg-green-600 text-white px-4 py-2 rounded">
            Add
          </button>
        </div>
        {formData.facilities.length > 0 && (
          <div className="mt-2">
            <strong>Selected Facilities:</strong>
            <div className="flex flex-wrap gap-1 mt-1">
              {formData.facilities.map(facility => (
                <span key={facility} className="bg-blue-100 px-2 py-1 rounded text-sm flex items-center">
                  {facility}
                  <button type="button" onClick={() => removeFacility(facility)} className="ml-1 text-red-600">×</button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <select value={formData.opening_hours} onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border">
          <option value="">Opening Hours</option>
          <option value="06:00">6 AM</option>
          <option value="07:00">7 AM</option>
          <option value="08:00">8 AM</option>
          <option value="09:00">9 AM</option>
          <option value="10:00">10 AM</option>
          <option value="11:00">11 AM</option>
          <option value="12:00">12 PM</option>
          <option value="13:00">1 PM</option>
          <option value="14:00">2 PM</option>
          <option value="15:00">3 PM</option>
          <option value="16:00">4 PM</option>
          <option value="17:00">5 PM</option>
          <option value="18:00">6 PM</option>
          <option value="19:00">7 PM</option>
          <option value="20:00">8 PM</option>
          <option value="21:00">9 PM</option>
          <option value="22:00">10 PM</option>
          <option value="23:00">11 PM</option>
        </select>
        <select value={formData.closing_hours} onChange={(e) => setFormData({ ...formData, closing_hours: e.target.value })} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border">
          <option value="">Closing Hours</option>
          <option value="06:00">6 AM</option>
          <option value="07:00">7 AM</option>
          <option value="08:00">8 AM</option>
          <option value="09:00">9 AM</option>
          <option value="10:00">10 AM</option>
          <option value="11:00">11 AM</option>
          <option value="12:00">12 PM</option>
          <option value="13:00">1 PM</option>
          <option value="14:00">2 PM</option>
          <option value="15:00">3 PM</option>
          <option value="16:00">4 PM</option>
          <option value="17:00">5 PM</option>
          <option value="18:00">6 PM</option>
          <option value="19:00">7 PM</option>
          <option value="20:00">8 PM</option>
          <option value="21:00">9 PM</option>
          <option value="22:00">10 PM</option>
          <option value="23:00">11 PM</option>
        </select>
      </div>
      <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
      {existingImages.length > 0 && (
        <div>
          <strong>Existing Images:</strong>
          <div className="flex flex-wrap gap-2 mt-2">
            {existingImages.map((img, index) => (
              <div key={index} className="relative">
                <img src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${img}`} alt={`Existing ${index + 1}`} className="w-32 h-32 object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(img)}
                  className="absolute top-0 right-0 bg-red-600 text-white rounded-lg w-6 h-6 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {existingVideo && (
        <div>
          <strong>Existing Video:</strong>
          <div className="relative mt-2">
            <video controls className="w-64 h-36">
              <source src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${existingVideo}`} type="video/mp4" />
            </video>
            <button
              type="button"
              onClick={removeVideo}
              className="absolute top-0 right-0 bg-red-600 text-white rounded-lg w-6 h-6 flex items-center justify-center text-xs"
            >
              ×
            </button>
          </div>
        </div>
      )}
      <div>
        <label>Add Images: <input type="file" accept="image/*" multiple onChange={(e) => {
          const files = Array.from(e.target.files || []);
          setImages(e.target.files);
          setNewImagePreviews(files);
        }} /></label>
      </div>
      <div>
        <label>Update Video: <input type="file" accept="video/*" onChange={(e) => {
          const file = e.target.files?.[0] || null;
          setVideo(file);
          setNewVideoPreview(file);
        }} /></label>
      </div>
      {newImagePreviews.length > 0 && (
        <div>
          <strong>New Images to Add:</strong>
          <div className="flex flex-wrap gap-2 mt-2">
            {newImagePreviews.map((file, index) => (
              <div key={index} className="relative">
                <img src={URL.createObjectURL(file)} alt={`New ${index + 1}`} className="w-32 h-32 object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    const newPreviews = newImagePreviews.filter((_, i) => i !== index);
                    setNewImagePreviews(newPreviews);
                    const dt = new DataTransfer();
                    newPreviews.forEach(f => dt.items.add(f));
                    const input = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement;
                    if (input) input.files = dt.files;
                    setImages(dt.files);
                  }}
                  className="absolute top-0 right-0 bg-red-600 text-white rounded-lg w-6 h-6 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {newVideoPreview && (
        <div>
          <strong>New Video to Update:</strong>
          <div className="relative mt-2">
            <video controls className="w-64 h-36">
              <source src={URL.createObjectURL(newVideoPreview)} type="video/mp4" />
            </video>
            <button
              type="button"
              onClick={() => {
                setNewVideoPreview(null);
                setVideo(null);
                const input = document.querySelector('input[type="file"][accept="video/*"]') as HTMLInputElement;
                if (input) input.value = '';
              }}
              className="absolute top-0 right-0 bg-red-600 text-white rounded-lg w-6 h-6 flex items-center justify-center text-xs"
            >
              ×
            </button>
          </div>
        </div>
      )}
      <div className="flex space-x-4">
        <button type="submit" disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50">
          {loading ? 'Updating...' : 'Update Futsal'}
        </button>
        <button type="button" onClick={onCancel} className="bg-gray-600 text-white px-4 py-2 rounded">
          Cancel
        </button>
      </div>
    </form>
  );
}