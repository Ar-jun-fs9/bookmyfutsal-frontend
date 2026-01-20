import { useState, useEffect } from 'react';

interface Futsal {
   futsal_id: number;
   name: string;
   location: string;
   city: string;
   images?: string[];
   video?: string;
   price_per_hour: number;
   latitude?: number;
   longitude?: number;
   admin_phone?: string;
   opening_hours?: string;
   closing_hours?: string;
   description?: string;
   average_rating?: number;
   total_ratings?: number;
   game_format?: string;
   facilities?: string[];
 }

interface SpecialPrice {
      special_price_id: number;
      futsal_id: number;
      type: string;
      special_date: string | null;
      recurring_days: string[] | null;
      start_time: string | null;
      end_time: string | null;
      special_price: number;
      message?: string;
      offer_message?: string;
      is_offer: boolean;
      created_by: string;
      created_at: string;
      updated_at?: string;
      futsal_name: string;
    }

interface DetailsModalProps {
  futsal: Futsal;
  onClose: () => void;
}

export default function DetailsModal({ futsal, onClose }: DetailsModalProps) {
   const [specialPrices, setSpecialPrices] = useState<SpecialPrice[]>([]);
   const [loadingSpecialPrices, setLoadingSpecialPrices] = useState(false);

   useEffect(() => {
     const fetchSpecialPrices = async () => {
       setLoadingSpecialPrices(true);
       try {
         const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/special-prices/${futsal.futsal_id}`);
         if (response.ok) {
           const data = await response.json();
           setSpecialPrices(data.specialPrices || []);
         }
       } catch (error) {
         console.error('Error fetching special prices:', error);
       } finally {
         setLoadingSpecialPrices(false);
       }
     };

     fetchSpecialPrices();
   }, [futsal.futsal_id]);

   const formatTime = (timeString: string): string => {
     const [hours, minutes] = timeString.split(':').map(Number);
     const period = hours >= 12 ? 'PM' : 'AM';
     const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
     return minutes === 0 ? `${displayHours}${period}` : `${displayHours}:${minutes.toString().padStart(2, '0')}${period}`;
   };

   const formatDate = (dateString: string): string => {
     const date = new Date(dateString);
     return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
   };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 md:p-6">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-2xl font-bold text-gray-800">{futsal.name}</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-3xl hover:bg-gray-100 rounded-lg w-10 h-10 flex items-center justify-center transition-all duration-300"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* Images */}
            {futsal.images && futsal.images.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-3">Images</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {futsal.images.map((img, index) => (
                    <img key={index} src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${img}`} alt={`${futsal.name} ${index + 1}`} className="w-full h-48 object-cover rounded-lg" />
                  ))}
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold mb-3">Basic Information</h4>
                <div className="space-y-2">
                  <p><strong>Name:</strong> {futsal.name}</p>
                  <p><strong>Location:</strong> {futsal.location}, {futsal.city}</p>
                  {futsal.game_format && <p><strong>Game Format:</strong> {futsal.game_format}</p>}
                  {futsal.opening_hours && futsal.closing_hours && (
                    <p><strong>Operating Hours:</strong> {formatTime(futsal.opening_hours)} - {formatTime(futsal.closing_hours)}</p>
                  )}
                  {futsal.admin_phone && <p><strong>Contact:</strong> {futsal.admin_phone}</p>}
                </div>
              </div>

              {/* Price Section */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Pricing</h4>
                <div className="space-y-3">
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="text-green-800 font-medium">Normal Days Price</p>
                    <p className="text-2xl font-bold text-green-600">Rs. {futsal.price_per_hour}/hr</p>
                  </div>
                  {loadingSpecialPrices ? (
                    <p className="text-gray-500">Loading special prices...</p>
                  ) : specialPrices.length > 0 ? (
                    <div className="space-y-2">
                      <p className="font-medium text-gray-700">Special Prices:</p>
                      {specialPrices.map((sp) => {
                        let details = '';
                        if (sp.type === 'date' && sp.special_date) {
                          const date = new Date(sp.special_date);
                          details = date.toISOString().split('T')[0];
                        } else if (sp.type === 'recurring' && sp.recurring_days) {
                          const days = Array.isArray(sp.recurring_days)
                            ? sp.recurring_days
                            : JSON.parse(sp.recurring_days);

                          const dayList = days.map((day: string) => day.toLowerCase()).join(', ');
                          details = `Every : ${dayList}`;
                        } else if (sp.type === 'time_based') {
                          if (sp.special_date) {
                            const date = new Date(sp.special_date);
                            const dateStr = date.toISOString().split('T')[0];
                            details = `${formatTime(sp.start_time!)} - ${formatTime(sp.end_time!)} on ${dateStr}`;
                          } else {
                            details = `Every day : ${formatTime(sp.start_time!)} - ${formatTime(sp.end_time!)}`;
                          }
                        }
                        return (
                          <div key={sp.special_price_id} className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                            <p className="text-xl font-bold text-yellow-600">
                              Rs. {sp.special_price}/hr
                              {sp.message && <span className="text-lg font-bold text-red-600 animate-pulse ml-2">{sp.message}</span>}
                              <span className="text-sm text-yellow-700"> ({details})</span>
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500">No special prices set</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-3">Facilities</h4>
                {futsal.facilities && futsal.facilities.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {futsal.facilities.map((facility, index) => (
                      <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm">
                        {facility}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No facilities information available</p>
                )}
              </div>
            </div>

            {/* Description */}
            {futsal.description && (
              <div>
                <h4 className="text-lg font-semibold mb-3">Description</h4>
                <p className="text-gray-700 leading-relaxed">{futsal.description}</p>
              </div>
            )}

            {/* Video */}
            {futsal.video && (
              <div>
                <h4 className="text-lg font-semibold mb-3">Video</h4>
                <video controls className="w-full max-w-2xl rounded-lg">
                  <source src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${futsal.video}`} type="video/mp4" />
                </video>
              </div>
            )}

            {/* Rating */}
            {futsal.average_rating !== undefined && futsal.average_rating !== null && futsal.total_ratings !== undefined && futsal.total_ratings > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-3">Rating</h4>
                <div className="flex items-center">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className={`w-5 h-5 ${i < Math.floor(futsal.average_rating!) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="ml-2 text-lg font-medium">
                    {futsal.average_rating ? Number(futsal.average_rating).toFixed(1) : '0.0'} ({futsal.total_ratings || 0} reviews)
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-8">
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-all duration-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}