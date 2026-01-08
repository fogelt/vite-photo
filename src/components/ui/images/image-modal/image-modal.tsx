import { useEffect } from 'react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt: string;
}

export const ImageModal = ({ isOpen, onClose, imageUrl, alt }: ImageModalProps) => {
  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 transition-opacity duration-300"
      onClick={onClose}
    >
      <button
        className="absolute top-6 right-6 text-white text-4xl hover:text-gray-300 z-50"
        onClick={onClose}
      >
        &times;
      </button>

      <div className="relative max-w-5xl max-h-[90vh] flex items-center justify-center">
        <img
          src={imageUrl}
          alt={alt}
          className="max-w-full max-h-[90vh] object-contain shadow-2xl animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()} // Prevents closing when clicking the image itself
        />
      </div>
    </div>
  );
};