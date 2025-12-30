import { useState } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';

interface FeedbackModalProps {
  onClose: () => void;
}

export default function FeedbackModal({ onClose }: FeedbackModalProps) {
  const { showNotification } = useNotificationStore();
  const [name, setName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const issueOptions = [
    'Slow loading / performance issues',
    'Booking not working correctly',
    'Payment-related issue',
    'UI/UX confusion',
    'Mobile responsiveness issue',
    'Login / authentication problem',
    'Other'
  ];

  const handleIssueToggle = (issue: string) => {
    setSelectedIssues(prev =>
      prev.includes(issue)
        ? prev.filter(i => i !== issue)
        : [...prev, issue]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      showNotification({ message: "Please select a rating", type: 'info' });
      return;
    }

    if (!message.trim()) {
      showNotification({ message: "Please provide feedback message", type: 'info' });
      return;
    }

    if (message.trim().length < 10) {
      showNotification({ message: "Message must be at least 10 characters long", type: 'info' });
      return;
    }

    if (message.trim().length > 2000) {
      showNotification({ message: "Message must be less than 2000 characters", type: 'info' });
      return;
    }

    if (!isAnonymous && name.trim() && (name.trim().length < 2 || name.trim().length > 100)) {
      showNotification({ message: "Name must be between 2 and 100 characters", type: 'info' });
      return;
    }

    if (!isAnonymous && name.trim() && !/^[a-zA-Z\s]+$/.test(name.trim())) {
      showNotification({ message: "Name can only contain letters and spaces", type: 'info' });
      return;
    }

    setLoading(true);
    try {
      // Collect browser and device info
      const browserInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      };

      const deviceInfo = {
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        pixelRatio: window.devicePixelRatio,
        touchSupport: 'ontouchstart' in window
      };

      const feedbackData = {
        name: isAnonymous ? undefined : name.trim() || undefined,
        is_anonymous: isAnonymous,
        rating,
        selected_issues: selectedIssues,
        message: message.trim(),
        page_url: window.location.href,
        session_id: sessionStorage.getItem('session_id') || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        screen_width: deviceInfo.screenWidth,
        screen_height: deviceInfo.screenHeight,
        viewport_width: deviceInfo.viewportWidth,
        viewport_height: deviceInfo.viewportHeight,
        pixel_ratio: deviceInfo.pixelRatio,
        touch_support: deviceInfo.touchSupport
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData)
      });

      if (response.ok) {
        const data = await response.json();
        showNotification({ message: "Thank you for your feedback!", type: 'success' });
        onClose();

        // Store session ID for future submissions
        if (!sessionStorage.getItem('session_id')) {
          sessionStorage.setItem('session_id', feedbackData.session_id);
        }
      } else {
        let errorMessage = 'Error submitting feedback';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch (parseError) {
          // If response is not JSON (e.g., HTML error page), use status text
          errorMessage = `Error: ${response.status} ${response.statusText}`;
        }
        showNotification({ message: errorMessage, type: 'info' });
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      showNotification({ message: 'Error submitting feedback', type: 'info' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Feedback & Bug Report</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* User Identity Section */}
          <div>
            <h4 className="text-md font-semibold mb-3">User Identity</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="enterName"
                  name="userType"
                  checked={!isAnonymous}
                  onChange={() => setIsAnonymous(false)}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="enterName" className="text-sm">Provide Name (optional)</label>
              </div>
              {!isAnonymous && (
                <input
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={100}
                />
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="anonymous"
                  name="userType"
                  checked={isAnonymous}
                  onChange={() => setIsAnonymous(true)}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="anonymous" className="text-sm">Submit as Anonymous</label>
              </div>
            </div>
          </div>

          {/* Performance Rating Section */}
          <div>
            <h4 className="text-md font-semibold mb-3">Overall Website Performance</h4>
            <div className="flex items-center space-x-1">
              <span className="text-sm font-medium mr-2">Rating:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="text-2xl focus:outline-none transition-colors"
                >
                  <svg
                    className={`w-8 h-8 ${star <= (hoverRating || rating)
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
                {rating > 0 && `${rating} star${rating > 1 ? 's' : ''}`}
              </span>
            </div>
          </div>

          {/* Issue Selection Section */}
          <div>
            <h4 className="text-md font-semibold mb-3">What issues did you encounter? (Select all that apply)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {issueOptions.map((issue) => (
                <label key={issue} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIssues.includes(issue)}
                    onChange={() => handleIssueToggle(issue)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">{issue}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Detailed Feedback Section */}
          <div>
            <h4 className="text-md font-semibold mb-3">Detailed Feedback</h4>
            <textarea
              placeholder="Describe the issue, bug, or suggestion in detail..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={5}
              maxLength={2000}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {message.length}/2000 characters
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || rating === 0 || !message.trim()}
              className="px-6 py-2 bg-linear-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}