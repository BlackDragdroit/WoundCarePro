import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

const ConfirmationModal = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  isLoading, 
  confirmLabel = 'Bestätigen', 
  cancelLabel = 'Abbrechen',
  variant = 'danger' // 'danger' | 'primary'
}) => {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
        <div className="flex items-start gap-4 mb-4">
          {isDanger && (
            <div className="bg-red-100 p-2 rounded-full text-red-600 shrink-0">
              <AlertTriangle size={24} />
            </div>
          )}
          <div>
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            <p className="text-sm text-slate-600 mt-1">
              {message}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button 
            onClick={onCancel} 
            disabled={isLoading}
            className="flex-1 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button 
            onClick={onConfirm} 
            disabled={isLoading}
            className={`flex-1 py-2 text-white rounded-lg font-medium shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 ${
              isDanger 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>}
            {isLoading ? 'Wird ausgeführt...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
