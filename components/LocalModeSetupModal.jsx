import React from 'react';
import { Database, Save, X, AlertTriangle } from 'lucide-react';

const LocalModeSetupModal = ({ 
  isOpen, 
  onConfirm, 
  onContinueDefault, 
  isLoading,
  isFileSystemSupported = true
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
        <div className="flex items-start gap-4 mb-4">
          <div className={`p-3 rounded-full shrink-0 ${isFileSystemSupported ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
            {isFileSystemSupported ? <Database size={24} /> : <AlertTriangle size={24} />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              {isFileSystemSupported ? 'Speicherort festlegen' : 'Eingeschränkter Speicher-Modus'}
            </h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              {isFileSystemSupported ? (
                <>
                  Standardmäßig werden Ihre Daten im <strong>sicheren lokalen Browser-Speicher</strong> abgelegt (ähnlich wie AppData).
                  <br /><br />
                  Sie können stattdessen jetzt eine lokale Datei auf Ihrem Gerät wählen, in der alle Ihre Daten automatisch gesichert werden.
                </>
              ) : (
                <>
                  Ihr Browser unterstützt das direkte Speichern in Dateien nicht (z.B. aufgrund fehlender HTTPS-Verschlüsselung oder mobiler Einschränkungen).
                  <br /><br />
                  <strong>Ihre Daten werden nur im Browser-Cache gespeichert.</strong>
                  <br />
                  Bitte beachten Sie, dass die Daten verloren gehen können, wenn Sie den Browser-Cache leeren.
                </>
              )}
            </p>
            {isFileSystemSupported && (
              <div className="mt-3 bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-800">
                <strong>Tipp:</strong> Sie können Ihre Daten später jederzeit als ZIP-Datei exportieren.
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          {isFileSystemSupported && (
            <button 
              onClick={onContinueDefault} 
              disabled={isLoading}
              className="flex-1 py-2.5 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Standard beibehalten
            </button>
          )}
          <button 
            onClick={onConfirm} 
            disabled={isLoading}
            className={`flex-1 py-2.5 rounded-lg font-medium shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-colors ${
              isFileSystemSupported 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
          >
            {isLoading ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                Wird eingerichtet...
              </>
            ) : (
              <>
                {isFileSystemSupported ? <Save size={18} /> : <AlertTriangle size={18} />}
                {isFileSystemSupported ? 'Datei auswählen' : 'Verstanden & Fortfahren'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocalModeSetupModal;
