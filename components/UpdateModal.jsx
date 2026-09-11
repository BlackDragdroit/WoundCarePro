import React, { useState } from 'react';
import { 
  X, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck 
} from 'lucide-react';
import { installTauriUpdate, APP_VERSION } from '../utils/updateChecker';

const UpdateModal = ({ 
  isOpen, 
  onClose, 
  updateInfo, 
  isChecking, 
  onCheckAgain 
}) => {
  const [isInstalling, setIsInstalling] = useState(false);
  const [installStatus, setInstallStatus] = useState('');
  const [installError, setInstallError] = useState(null);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    setIsInstalling(true);
    setInstallError(null);
    try {
      await installTauriUpdate((status, message) => {
        setInstallStatus(message);
      });
    } catch (err) {
      console.error(err);
      setInstallError('Installation fehlgeschlagen. Bitte laden Sie das Installer-Paket manuell herunter.');
      setIsInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Sparkles size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Software-Aktualisierung</h3>
              <p className="text-xs text-slate-500">WundDoku Pro &bull; Version v{APP_VERSION}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={isInstalling}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          
          {/* State 1: Checking */}
          {isChecking && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <RefreshCw className="animate-spin text-blue-600 mb-3" size={36} />
              <p className="text-sm font-semibold text-slate-700">Suche nach neuen Updates auf GitHub...</p>
              <p className="text-xs text-slate-400 mt-1">Bitte gedulden Sie sich einen Moment.</p>
            </div>
          )}

          {/* State 2: Error */}
          {!isChecking && updateInfo?.error && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="text-sm font-bold text-amber-900">Prüfung fehlgeschlagen</h4>
                <p className="text-xs text-amber-700 mt-1">{updateInfo.error}</p>
              </div>
            </div>
          )}

          {/* State 3: Up to Date */}
          {!isChecking && !updateInfo?.error && updateInfo && !updateInfo.shouldUpdate && (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full mb-3">
                <CheckCircle2 size={44} />
              </div>
              <h4 className="text-base font-bold text-slate-800">Sie verwenden bereits die neuste Version!</h4>
              <p className="text-xs text-slate-500 mt-1">
                Installierte Version: <span className="font-semibold text-slate-700">v{APP_VERSION}</span>
              </p>
              {updateInfo.message && (
                <p className="text-xs text-slate-400 mt-2 bg-slate-50 px-3 py-1.5 rounded-lg">
                  {updateInfo.message}
                </p>
              )}
            </div>
          )}

          {/* State 4: Update Available */}
          {!isChecking && updateInfo?.shouldUpdate && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-4 shadow-md flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-white font-medium">
                    Neues Release
                  </span>
                  <h4 className="text-xl font-extrabold mt-1">Version {updateInfo.version}</h4>
                  <p className="text-xs text-blue-100 mt-0.5">
                    Aktuelle Version: v{APP_VERSION}
                  </p>
                </div>
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                  <Download size={28} className="text-white" />
                </div>
              </div>

              {/* Release Notes */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Änderungen & Neuerungen (Release Notes):
                </label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed shadow-inner">
                  {updateInfo.body || 'Keine Detaillierte Beschreibung angegeben.'}
                </div>
              </div>

              {/* Security Banner */}
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                <span>Verifizierter Download direkt vom offiziellen GitHub-Repository.</span>
              </div>

              {installError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                  {installError}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between gap-3">
          {updateInfo?.shouldUpdate ? (
            <>
              {updateInfo.htmlUrl && (
                <a 
                  href={updateInfo.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink size={14} />
                  Auf GitHub ansehen
                </a>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button 
                  onClick={onClose}
                  disabled={isInstalling}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  Später
                </button>

                {updateInfo.isTauri ? (
                  <button 
                    onClick={handleNativeInstall}
                    disabled={isInstalling}
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isInstalling ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>{installStatus || 'Wird installiert...'}</span>
                      </>
                    ) : (
                      <>
                        <Download size={14} />
                        <span>Jetzt installieren & neu starten</span>
                      </>
                    )}
                  </button>
                ) : (
                  <a 
                    href={updateInfo.downloadUrl || updateInfo.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-2 transition-all"
                  >
                    <Download size={14} />
                    <span>Installer herunterladen (.msi)</span>
                  </a>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between w-full">
              <button 
                onClick={onCheckAgain}
                disabled={isChecking}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={14} className={isChecking ? 'animate-spin' : ''} />
                <span>Erneut prüfen</span>
              </button>

              <button 
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors"
              >
                Schließen
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default UpdateModal;
