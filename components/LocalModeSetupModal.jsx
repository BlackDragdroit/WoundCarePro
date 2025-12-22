import React from 'react';
import { Database, Save, X } from 'lucide-react';

const LocalModeSetupModal = ({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  isLoading 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
        <div className="flex items-start gap-4 mb-4">
          <div className="bg-blue-100 p-3 rounded-full text-blue-600 shrink-0">
            <Database size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Lokale Datenbank einrichten</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Für den Offline-Modus benötigen wir einen Speicherort auf Ihrem Gerät. 
              Bitte wählen Sie eine Datei aus oder erstellen Sie eine neue, in der alle Ihre Daten 
              automatisch gesichert werden.
            </p>
            <div className="mt-3 bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-800">
              <strong>Hinweis:</strong> Ihr Browser wird Sie möglicherweise um Erlaubnis bitten, 
              auf diese Datei zugreifen zu dürfen.
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button 
            onClick={onCancel} 
            disabled={isLoading}
            className="flex-1 py-2.5 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Abbrechen
          </button>
          <button 
            onClick={onConfirm} 
            disabled={isLoading}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium shadow-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {isLoading ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                Wird eingerichtet...
              </>
            ) : (
              <>
                <Save size={18} />
                Datenbank wählen
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocalModeSetupModal;
