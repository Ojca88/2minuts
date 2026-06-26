'use client';

import LoadingSpinner from './LoadingSpinner';

interface UpdateButtonProps {
  isUpdating: boolean;
  showSuccess: boolean;
  onUpdate: () => void;
}

export default function UpdateButton({ isUpdating, showSuccess, onUpdate }: UpdateButtonProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={onUpdate}
        disabled={isUpdating}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-xl transition-all active:scale-95 disabled:active:scale-100 shadow-sm flex items-center justify-center gap-2"
      >
        {isUpdating ? (
          <>
            <LoadingSpinner />
            <span>Actualizando...</span>
          </>
        ) : (
          <>
            <span>🔄</span>
            <span>Actualizar Noticias</span>
          </>
        )}
      </button>
      {showSuccess && (
        <p className="text-sm text-green-600 font-medium animate-fade-in">
          ✓ Noticias actualizadas correctamente
        </p>
      )}
    </div>
  );
}
