import { useState } from 'react';

interface EditRatingFormProps {
  rating: any;
  onUpdate: (rating: number, comment: string, users?: string, users_type?: string) => void;
  onCancel: () => void;
}

export function EditRatingForm({ rating, onUpdate, onCancel }: EditRatingFormProps) {
  const [userRating, setUserRating] = useState(rating.rating);
  const [comment, setComment] = useState(rating.comment || '');
  const [users, setUsers] = useState(rating.users || '');
  const [users_type, setUsersType] = useState(rating.users_type || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    onUpdate(userRating, comment, users, users_type);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {rating.users_type !== 'registered user' && (
        <input
          type="text"
          placeholder="User Name"
          value={users}
          onChange={(e) => setUsers(e.target.value)}
          required
          className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border"
        />
      )}

      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setUserRating(star)}
            className="text-2xl focus:outline-none"
          >
            <svg
              className={`w-8 h-8 ${star <= userRating
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
          {userRating} star{userRating > 1 ? 's' : ''}
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
        <button type="submit" disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50">
          {loading ? 'Updating...' : 'Update Rating'}
        </button>
        <button type="button" onClick={onCancel} className="bg-gray-600 text-white px-4 py-2 rounded">
          Cancel
        </button>
      </div>
    </form>
  );
}