import { useState, useCallback } from 'react';

interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
}

interface CreateFutsalFormProps {
  onSuccess: () => void;
  setNotification: React.Dispatch<React.SetStateAction<{message: string, type: 'success' | 'info'} | null>>;
}

export function CreateFutsalForm({ onSuccess, setNotification }: CreateFutsalFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    city: '',
    latitude: '',
    longitude: '',
    phone: '',
    description: '',
    price_per_hour: '',
    game_format: '',
    facilities: [] as string[],
    opening_hours: '',
    closing_hours: ''
  });
  const [customGameFormat, setCustomGameFormat] = useState('');
  const [customFacilities, setCustomFacilities] = useState('');
  
  // Upload state
  const [imageUploads, setImageUploads] = useState<UploadProgress[]>([]);
  const [videoUpload, setVideoUpload] = useState<UploadProgress | null>(null);
  const [uploading, setUploading] = useState(false);
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

  // Function to upload a single file to Cloudinary
  const uploadFile = async (file: File, type: 'image' | 'video', folder: string): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append(type, file);
    formData.append('folder', folder);

    const xhr = new XMLHttpRequest();
    
    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          // Update progress in state
          if (type === 'image') {
            setImageUploads(prev => prev.map(img => 
              img.file === file ? { ...img, progress } : img
            ));
          } else {
            setVideoUpload(prev => prev ? { ...prev, progress } : null);
          }
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          resolve({ url: response.url });
        } else {
          reject(new Error('Upload failed'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', `${process.env.NEXT_PUBLIC_API_URL}/api/upload/${type}`);
      xhr.send(formData);
    });
  };

  // Handle image selection - upload immediately in parallel
  const handleImageChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Get folder name from form data
    const folderName = formData.name ? `bookmyfutsal/${formData.name.replace(/[^a-zA-Z0-9]/g, '_')}` : 'bookmyfutsal/images';

    // Create upload progress entries
    const newUploads: UploadProgress[] = files.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const
    }));

    setImageUploads(prev => [...prev, ...newUploads]);

    // Upload all images in parallel immediately
    const uploadPromises = files.map(async (file, index) => {
      const uploadIndex = imageUploads.length + index;
      
      // Update status to uploading
      setImageUploads(prev => prev.map((img, i) => 
        i === uploadIndex ? { ...img, status: 'uploading' } : img
      ));

      try {
        const result = await uploadFile(file, 'image', folderName);
        
        // Update with completed status and URL
        setImageUploads(prev => prev.map((img, i) => 
          i === uploadIndex ? { ...img, status: 'completed', progress: 100, url: result.url } : img
        ));
        
        return { success: true, url: result.url };
      } catch (error) {
        // Update with error status
        setImageUploads(prev => prev.map((img, i) => 
          i === uploadIndex ? { ...img, status: 'error', error: 'Upload failed' } : img
        ));
        
        return { success: false, url: null };
      }
    });

    await Promise.all(uploadPromises);
  }, [formData.name, imageUploads.length]);

  // Handle video selection - upload immediately
  const handleVideoChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    // Get folder name from form data
    const folderName = formData.name ? `bookmyfutsal/${formData.name.replace(/[^a-zA-Z0-9]/g, '_')}` : 'bookmyfutsal/videos';

    // Create upload progress entry
    setVideoUpload({
      file,
      progress: 0,
      status: 'pending'
    });

    // Update status to uploading
    setVideoUpload({
      file,
      progress: 0,
      status: 'uploading'
    });

    try {
      const result = await uploadFile(file, 'video', folderName);
      
      // Update with completed status and URL
      setVideoUpload({
        file,
        progress: 100,
        status: 'completed',
        url: result.url
      });
    } catch (error) {
      // Update with error status
      setVideoUpload({
        file,
        progress: 0,
        status: 'error',
        error: 'Upload failed'
      });
    }
  }, [formData.name]);

  // Remove an image from uploads
  const removeImage = (index: number) => {
    setImageUploads(prev => prev.filter((_, i) => i !== index));
  };

  // Remove video from uploads
  const removeVideo = () => {
    setVideoUpload(null);
  };

  // Check if all uploads are completed
  const isFormReady = () => {
    const imagesCompleted = imageUploads.every(img => img.status === 'completed');
    const videoCompleted = !videoUpload || videoUpload.status === 'completed';
    return imagesCompleted && videoCompleted;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Get completed image URLs
    const imageUrls = imageUploads
      .filter(img => img.status === 'completed' && img.url)
      .map(img => img.url as string);

    // Get completed video URL
    const videoUrl = videoUpload?.status === 'completed' ? videoUpload.url : null;

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'facilities') {
        data.append(key, JSON.stringify(value));
      } else {
        data.append(key, value as string);
      }
    });

    // Send URLs instead of files
    if (imageUrls.length > 0) {
      data.append('image_urls', JSON.stringify(imageUrls));
    }
    if (videoUrl) {
      data.append('video_url', videoUrl);
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsals`, {
        method: 'POST',
        body: data,
      });

      if (response.ok) {
        setNotification({ message: "Futsal created successfully", type: 'success' });
        onSuccess();
        setFormData({
          name: '', location: '', city: '', latitude: '', longitude: '', phone: '', description: '', price_per_hour: '', game_format: '', facilities: [], opening_hours: '', closing_hours: ''
        });
        setCustomGameFormat('');
        setCustomFacilities('');
        setImageUploads([]);
        setVideoUpload(null);
      } else {
        setNotification({ message: "Error creating futsal", type: 'info' });
      }
    } catch (error) {
      console.error('Error:', error);
      setNotification({ message: "Error creating futsal", type: 'info' });
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="border rounded-lg p-6 bg-white">
      <h3 className="text-lg font-semibold mb-4">Create New Futsal</h3>
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
        
        {/* Images with upload progress */}
        <div>
          <label>Images (up to 5): <input type="file" accept="image/*" multiple onChange={handleImageChange} /></label>
        </div>
        
        {/* Image upload progress */}
        {imageUploads.length > 0 && (
          <div>
            <strong>Image Uploads:</strong>
            <div className="space-y-2 mt-2">
              {imageUploads.map((upload, index) => (
                <div key={index} className="relative border rounded p-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={URL.createObjectURL(upload.file)} alt={`Preview ${index + 1}`} className="w-16 h-16 object-cover" />
                      <div>
                        <p className="text-sm font-medium">{upload.file.name}</p>
                        <p className="text-xs text-gray-500">
                          {upload.status === 'pending' && 'Waiting...'}
                          {upload.status === 'uploading' && `Uploading: ${upload.progress}%`}
                          {upload.status === 'completed' && '✓ Uploaded'}
                          {upload.status === 'error' && '✗ Upload failed'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="bg-red-600 text-white rounded-lg w-6 h-6 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-2 bg-gray-200 rounded overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        upload.status === 'completed' ? 'bg-green-500' : 
                        upload.status === 'error' ? 'bg-red-500' : 
                        'bg-blue-500'
                      }`}
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Video with upload progress */}
        <div>
          <label>Video: <input type="file" accept="video/*" onChange={handleVideoChange} /></label>
        </div>
        
        {videoUpload && (
          <div>
            <strong>Video Upload:</strong>
            <div className="relative border rounded p-2 mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <video controls className="w-24 h-16 object-cover">
                    <source src={URL.createObjectURL(videoUpload.file)} type="video/mp4" />
                  </video>
                  <div>
                    <p className="text-sm font-medium">{videoUpload.file.name}</p>
                    <p className="text-xs text-gray-500">
                      {videoUpload.status === 'pending' && 'Waiting...'}
                      {videoUpload.status === 'uploading' && `Uploading: ${videoUpload.progress}%`}
                      {videoUpload.status === 'completed' && '✓ Uploaded'}
                      {videoUpload.status === 'error' && '✗ Upload failed'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeVideo}
                  className="bg-red-600 text-white rounded-lg w-6 h-6 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
              {/* Progress bar */}
              <div className="mt-2 h-2 bg-gray-200 rounded overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    videoUpload.status === 'completed' ? 'bg-green-500' : 
                    videoUpload.status === 'error' ? 'bg-red-500' : 
                    'bg-blue-500'
                  }`}
                  style={{ width: `${videoUpload.progress}%` }}
                />
              </div>
            </div>
          </div>
        )}
        
        <button 
          type="submit" 
          disabled={loading || !isFormReady()} 
          className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Futsal'}
        </button>
      </form>
    </div>
  );
}
