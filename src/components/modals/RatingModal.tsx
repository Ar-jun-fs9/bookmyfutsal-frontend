import { useState, useEffect } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';

interface ConfirmModal {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
}

interface Futsal {
  futsal_id: number;
  name: string;
  description?: string;
}

interface RatingModalProps {
  futsal: Futsal;
  onClose: () => void;
  onRatingSubmitted: () => void;
}

interface Rating {
  id: number;
  rating: number;
  comment?: string;
  users: string;
  created_at: string;
  updated_at?: string;
}

export default function RatingModal({ futsal, onClose, onRatingSubmitted }: RatingModalProps) {
  const { showNotification } = useNotificationStore();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasRated, setHasRated] = useState<boolean | null>(null);
  const [userName, setUserName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [userExistingRating, setUserExistingRating] = useState<Rating | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmModal, setConfirmModal] = useState<ConfirmModal>({ isOpen: false, message: '', onConfirm: () => {} });

  useEffect(() => {
    fetchRatings();
    checkUserRating();
  }, [futsal.futsal_id]);

  const fetchRatings = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ratings/futsal/${futsal.futsal_id}`);
      if (response.ok) {
        const data = await response.json();
        setRatings(data);
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  const checkUserRating = async () => {
    try {
      const user = sessionStorage.getItem('user');
      const userData = user ? JSON.parse(user) : null;

      if (userData) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ratings/futsal/${futsal.futsal_id}`);
        if (response.ok) {
          const futsalRatings = await response.json();
          const userRating = futsalRatings.find((r: Rating) => r.id === userData.user_id);
          if (userRating) {
            setHasRated(true);
            setUserExistingRating(userRating);
            setUserRating(userRating.rating);
            setComment(userRating.comment || '');
          } else {
            setHasRated(false);
            setUserExistingRating(null);
          }
        }
      } else {
        const storedRatingInfo = localStorage.getItem(`rating_${futsal.futsal_id}`);
        if (storedRatingInfo) {
          try {
            const ratingInfo = JSON.parse(storedRatingInfo);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ratings/futsal/${futsal.futsal_id}`);
            if (response.ok) {
              const futsalRatings = await response.json();
              let userRating = futsalRatings.find((r: Rating) => r.id === ratingInfo.rating_id);
              if (!userRating) {
                userRating = futsalRatings.find((r: Rating) =>
                  r.users === ratingInfo.users && r.users === ratingInfo.users_type
                );
              }
              if (userRating) {
                setHasRated(true);
                setUserExistingRating(userRating);
                setUserRating(userRating.rating);
                setComment(userRating.comment || '');
                setUserName(userRating.users !== 'Anonymous' ? userRating.users : '');
                setIsAnonymous(userRating.users === 'Anonymous');
              } else {
                setHasRated(false);
                setUserExistingRating(null);
                localStorage.removeItem(`rating_${futsal.futsal_id}`);
              }
            }
          } catch (error) {
            setHasRated(false);
            setUserExistingRating(null);
            localStorage.removeItem(`rating_${futsal.futsal_id}`);
          }
        } else {
          setHasRated(false);
          setUserExistingRating(null);
        }
      }
    } catch (error) {
      console.error('Error checking user rating:', error);
      setHasRated(false);
    }
  };

  const generateAnonymousToken = () => {
    return 'Anonymous_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  };

  const handleUpdateRating = async () => {
    if (!userExistingRating) return;
    if (userRating === 0) {
      showNotification({ message: "Please select a rating", type: 'info' });
      return;
    }

    setLoading(true);
    try {
      const user = sessionStorage.getItem('user');
      const userData = user ? JSON.parse(user) : null;

      let users = null;
      let users_type = null;

      if (userData) {
        users = `${userData.first_name} ${userData.last_name}`;
        users_type = 'registered user';
      } else {
        if (isAnonymous) {
          users = 'Anonymous';
          users_type = 'anonymous user';
        } else {
          users = userName.trim() || generateAnonymousToken();
          users_type = 'anonymous user';
        }
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ratings/${userExistingRating.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: userRating,
          comment: comment.trim() || null,
          users: users,
          users_type: users_type
        })
      });

      if (response.ok) {
        const data = await response.json();
        showNotification({ message: "Rating updated successfully!", type: 'success' });

        const user = sessionStorage.getItem('user');
        if (!user) {
          const updatedRatingInfo = {
            rating_id: userExistingRating.id,
            futsal_id: futsal.futsal_id,
            users: users,
            users_type: users_type,
            timestamp: Date.now()
          };
          localStorage.setItem(`rating_${futsal.futsal_id}`, JSON.stringify(updatedRatingInfo));
        }

        setUserExistingRating(data.rating);
        onRatingSubmitted();
        fetchRatings();
        setIsEditing(false);
      } else {
        const error = await response.json();
        showNotification({ message: error.message || 'Error updating rating', type: 'info' });
      }
    } catch (error) {
      console.error('Error updating rating:', error);
      showNotification({ message: "Error updating rating", type: 'info' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRating = async () => {
    if (!userExistingRating) return;

    setConfirmModal({
      isOpen: true,
      message: 'Are you sure you want to delete your rating?',
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });
        setLoading(true);
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ratings/${userExistingRating.id}`, {
            method: 'DELETE'
          });

          if (response.ok) {
            showNotification({ message: "Rating deleted successfully!", type: 'success' });
            setHasRated(false);
            setUserExistingRating(null);
            setUserRating(0);
            setComment('');
            setUserName('');
            setIsAnonymous(false);

            const user = sessionStorage.getItem('user');
            if (!user) {
              localStorage.removeItem(`rating_${futsal.futsal_id}`);
            }

            onRatingSubmitted();
            fetchRatings();
          } else {
            showNotification({ message: "Error deleting rating", type: 'info' });
          }
        } catch (error) {
          console.error('Error deleting rating:', error);
          showNotification({ message: "Error deleting rating", type: 'info' });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleSubmitRating = async () => {
    if (userRating === 0) {
      showNotification({ message: "Please select a rating", type: 'info' });
      return;
    }

    setLoading(true);
    try {
      const user = sessionStorage.getItem('user');
      const userData = user ? JSON.parse(user) : null;

      let users = null;
      let users_type = null;

      if (userData) {
        users = `${userData.first_name} ${userData.last_name}`;
        users_type = 'registered user';
      } else {
        if (isAnonymous) {
          users = 'Anonymous';
          users_type = 'anonymous user';
        } else {
          users = userName.trim() || generateAnonymousToken();
          users_type = 'anonymous user';
        }
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          futsal_id: futsal.futsal_id,
          user_id: userData?.user_id || null,
          users: users,
          users_type: users_type,
          rating: userRating,
          comment: comment.trim() || null
        })
      });

      if (response.ok) {
        const data = await response.json();
        showNotification({ message: "Rating submitted successfully!", type: 'success' });
        setHasRated(true);
        setUserExistingRating(data.rating);

        const ratingInfo = {
          rating_id: data.rating.id,
          futsal_id: futsal.futsal_id,
          users: users,
          users_type: users_type,
          timestamp: Date.now()
        };
        localStorage.setItem(`rating_${futsal.futsal_id}`, JSON.stringify(ratingInfo));

        onRatingSubmitted();
        fetchRatings();
        setUserRating(0);
        setComment('');
        setUserName('');
        setIsAnonymous(false);
      } else {
        const error = await response.json();
        showNotification({ message: error.message || 'Error submitting rating', type: 'info' });
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      showNotification({ message: "Error submitting rating", type: 'info' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">{futsal.name}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h4 className="text-md font-semibold mb-2">Description</h4>
            <p className="text-gray-700">{futsal.description || 'No description available.'}</p>
          </div>

          <div className="mb-6">
            <h4 className="text-md font-semibold mb-2">
              {hasRated === null ? 'Loading Rating Status...' : hasRated ? 'Your Rating' : 'Create New Rating'}
            </h4>
            {hasRated === null ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-lg h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Checking rating status...</span>
              </div>
            ) : hasRated && userExistingRating ? (
              <div className="space-y-4">
                {!isEditing ? (
                  <div className="border rounded p-4 bg-blue-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg key={star} className={`w-4 h-4 ${star <= userExistingRating.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="ml-2 text-sm font-medium">
                          {userExistingRating.rating} star{userExistingRating.rating > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setIsEditing(true)}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={handleDeleteRating}
                          disabled={loading}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                        >
                          {loading ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                    {userExistingRating.comment && (
                      <p className="text-sm text-gray-700 mt-2">{userExistingRating.comment}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {userExistingRating.updated_at && new Date(userExistingRating.updated_at) > new Date(userExistingRating.created_at) ?
                        `Updated on: ${new Date(userExistingRating.updated_at).toLocaleDateString()}` :
                        `Rated on: ${new Date(userExistingRating.created_at).toLocaleDateString()}`
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(() => {
                      const user = sessionStorage.getItem('user');
                      const userData = user ? JSON.parse(user) : null;
                      return !userData && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="enterName"
                              name="userType"
                              checked={!isAnonymous}
                              onChange={() => setIsAnonymous(false)}
                            />
                            <label htmlFor="enterName" className="text-sm">Enter User Name</label>
                          </div>
                          {!isAnonymous && (
                            <input
                              type="text"
                              placeholder="User Name"
                              value={userName}
                              onChange={(e) => setUserName(e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900"
                              required={!isAnonymous}
                            />
                          )}

                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="anonymous"
                              name="userType"
                              checked={isAnonymous}
                              onChange={() => setIsAnonymous(true)}
                            />
                            <label htmlFor="anonymous" className="text-sm">Anonymous User</label>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-medium">Rating:</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setUserRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="text-2xl focus:outline-none"
                        >
                          <svg
                            className={`w-8 h-8 ${star <= (hoverRating || userRating)
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                              }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-gray-600">
                        {userRating > 0 && `${userRating} star${userRating > 1 ? 's' : ''}`}
                      </span>
                    </div>

                    <textarea
                      placeholder="Comment (optional)"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900"
                      rows={3}
                      maxLength={500}
                    />

                    <div className="flex space-x-4">
                      <button
                        onClick={handleUpdateRating}
                        disabled={loading || userRating === 0}
                        className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                      >
                        {loading ? 'Updating...' : 'Update Rating'}
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="bg-gray-600 text-white px-4 py-2 rounded"
                      >
                        Cancel Edit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {(() => {
                  const user = sessionStorage.getItem('user');
                  const userData = user ? JSON.parse(user) : null;
                  return !userData && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="enterName"
                          name="userType"
                          checked={!isAnonymous}
                          onChange={() => setIsAnonymous(false)}
                        />
                        <label htmlFor="enterName" className="text-sm">Enter User Name</label>
                      </div>
                      {!isAnonymous && (
                        <input
                          type="text"
                          placeholder="User Name"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900"
                          required={!isAnonymous}
                        />
                      )}

                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="anonymous"
                          name="userType"
                          checked={isAnonymous}
                          onChange={() => setIsAnonymous(true)}
                        />
                        <label htmlFor="anonymous" className="text-sm">Anonymous User</label>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex items-center space-x-1">
                  <span className="text-sm font-medium">Rating:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setUserRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="text-2xl focus:outline-none"
                    >
                      <svg
                        className={`w-8 h-8 ${star <= (hoverRating || userRating)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                          }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {userRating > 0 && `${userRating} star${userRating > 1 ? 's' : ''}`}
                  </span>
                </div>

                <textarea
                  placeholder="Comment (optional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900"
                  rows={3}
                  maxLength={500}
                />

                <div className="flex space-x-4">
                  <button
                    onClick={handleSubmitRating}
                    disabled={loading || userRating === 0}
                    className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Rating'}
                  </button>
                  <button
                    onClick={onClose}
                    className="bg-gray-600 text-white px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-md font-semibold mb-2">Reviews ({ratings.length})</h4>
            {ratings.length === 0 ? (
              <p className="text-gray-500">No reviews yet. Be the first to rate!</p>
            ) : (
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {ratings.map((rating) => (
                  <div key={rating.id} className="border-b pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg key={star} className={`w-4 h-4 ${star <= rating.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="ml-2 text-sm font-medium">
                          {rating.users}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(rating.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {rating.comment && (
                      <p className="text-sm text-gray-700 mt-1">{rating.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 text-center shadow-2xl">
            <p className="text-gray-800 mb-6 text-sm">{confirmModal.message}</p>
            <div className="flex space-x-3 justify-center">
              <button
                onClick={() => setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} })}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}