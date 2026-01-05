interface BlockReasonModalProps {
  isOpen: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function BlockReasonModal({ isOpen, onConfirm, onCancel }: BlockReasonModalProps) {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const reason = (e.target as any).reason.value.trim();
    if (reason) {
      onConfirm(reason);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Enter Reason for Blocking</h3>
        <form onSubmit={handleSubmit}>
          <textarea
            name="reason"
            placeholder="Enter reason for blocking..."
            required
            className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border mb-4"
            rows={4}
          />
          <div className="flex space-x-4">
            <button type="submit" className="flex-1 bg-red-600 text-white py-2 rounded">
              Block User
            </button>
            <button type="button" onClick={onCancel} className="flex-1 bg-gray-600 text-white py-2 rounded">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}