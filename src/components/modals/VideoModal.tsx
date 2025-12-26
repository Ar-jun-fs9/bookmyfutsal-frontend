interface VideoModalProps {
  futsal: {
    futsal_id: number;
    name: string;
    video?: string;
  } | null;
  onClose: () => void;
}

export default function VideoModal({ futsal, onClose }: VideoModalProps) {
  if (!futsal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-scale-in">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800">{futsal.name} - Video</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl hover:bg-gray-100 rounded-lg w-10 h-10 flex items-center justify-center transition-all duration-300"
          >
            ×
          </button>
        </div>
        <div className="p-6">
          <video
            controls
            className="w-full h-auto max-h-[70vh] rounded-xl shadow-lg"
            src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${futsal.video}`}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>
  );
}