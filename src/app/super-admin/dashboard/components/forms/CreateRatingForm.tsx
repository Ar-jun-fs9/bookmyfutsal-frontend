import { useState } from 'react';

interface CreateRatingFormProps {
  futsals: any[];
  onSuccess: () => void;
  onCancel: () => void;
  setNotification: React.Dispatch<React.SetStateAction<{message: string, type: 'success' | 'info'} | null>>;
}

export function CreateRatingForm({ futsals, onSuccess, onCancel, setNotification }: CreateRatingFormProps) {
  const [selectedFutsalId, setSelectedFutsalId] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [userName, setUserName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          futsal_id: selectedFutsalId,
          user_id: null, // Admin-created ratings are always anonymous
          users: isAnonymous ? 'Anonymous' : userName.trim(),
          users_type: 'super admin created',
          rating,
          comment: comment.trim() || null
        }),
      });

      if (response.ok) {
        setNotification({ message: "Rating created successfully", type: 'success' });
        onSuccess();
      } else {
        const error = await response.json();
        setNotification({ message: error.message || 'Error creating rating', type: 'info' });
      }
    } catch (error) {
      console.error('Error:', error);
      setNotification({ message: "Error creating rating", type: 'info' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h4 className="text-lg font-semibold">Create New Rating</h4>

      <select
        value={selectedFutsalId}
        onChange={(e) => setSelectedFutsalId(e.target.value)}
        required
        className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border"
      >
        <option value="">Select Futsal</option>
        {futsals.map((futsal) => (
          <option key={futsal.futsal_id} value={futsal.futsal_id}>
            {futsal.name}
          </option>
        ))}
      </select>

      <div className="space-y-2">
        <label className="flex items-center">
          <input
            type="radio"
            checked={!isAnonymous}
            onChange={() => setIsAnonymous(false)}
            className="mr-2"
          />
          Enter User Name
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            checked={isAnonymous}
            onChange={() => setIsAnonymous(true)}
            className="mr-2"
          />
          Anonymous User
        </label>
      </div>

      {!isAnonymous && (
        <input
          type="text"
          placeholder="User Name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          required
          className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border"
        />
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Rating:</label>
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="text-2xl focus:outline-none"
            >
              <svg
                className={`w-8 h-8 ${star <= rating
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
            {rating} star{rating > 1 ? 's' : ''}
          </span>
        </div>
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
        <button type="submit" disabled={loading || !selectedFutsalId || (!isAnonymous && !userName.trim())} className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50">
          {loading ? 'Creating...' : 'Create Rating'}
        </button>
        <button type="button" onClick={onCancel} className="bg-gray-600 text-white px-4 py-2 rounded">
          Cancel
        </button>
      </div>
    </form>
  );
}