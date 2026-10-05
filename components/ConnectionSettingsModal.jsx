import React, { useState, useEffect } from 'react';
import { Database, Server, Wifi, WifiOff, X, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { normalizeUrl } from '../utils/helpers';
import { apiFetch } from '../utils/apiClient';

const ConnectionSettingsModal = ({ isOpen, onClose, currentMode, currentUrl, onSave }) => {
  const [mode, setMode] = useState(currentMode || 'local');
  const [url, setUrl] = useState(() => normalizeUrl(currentUrl));
  const [testResult, setTestResult] = useState(null); // null | 'success' | 'error'
  const [testError, setTestError] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(currentMode || 'local');
      setUrl(normalizeUrl(currentUrl));
      setTestResult(null);
      setTestError('');
    }
  }, [isOpen, currentMode, currentUrl]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setTestError('');

    const targetUrl = normalizeUrl(url);
    setUrl(targetUrl);

    try {
      const response = await apiFetch(`${targetUrl}/api/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP Fehler! Status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'online' && data.database === 'connected') {
        setTestResult('success');
      } else {
        throw new Error(data.error || 'Datenbank antwortet nicht.');
      }
    } catch (err) {
      console.error(err);
      setTestResult('error');
      setTestError(err.message || 'Verbindung fehlgeschlagen.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    const cleanedUrl = normalizeUrl(url);
    onSave(mode, cleanedUrl);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Verbindungseinstellungen</h2>
              <p className="text-xs text-white/80">Wählen Sie Ihren Speicher-Pfad</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1 px-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {/* Storage Mode Selector Options */}
          <div className="grid grid-cols-2 gap-3">
            
            {/* Mode: Local */}
            <button
              type="button"
              onClick={() => setMode('local')}
              className={`p-4 rounded-xl border text-left flex flex-col gap-2.5 transition-all ${
                mode === 'local'
                  ? 'border-blue-600 bg-blue-50/40 text-blue-900 ring-2 ring-blue-600/20'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Database className={`w-5 h-5 ${mode === 'local' ? 'text-blue-600' : 'text-slate-400'}`} />
              <div>
                <span className="font-bold text-sm block">Lokale Datei</span>
                <span className="text-xxs text-slate-500 block leading-tight mt-0.5">Verschlüsselt (DSGVO) auf diesem Computer.</span>
              </div>
            </button>

            {/* Mode: Synology Server */}
            <button
              type="button"
              onClick={() => setMode('synology')}
              className={`p-4 rounded-xl border text-left flex flex-col gap-2.5 transition-all ${
                mode === 'synology'
                  ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900 ring-2 ring-indigo-600/20'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Server className={`w-5 h-5 ${mode === 'synology' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <div>
                <span className="font-bold text-sm block">Synology NAS</span>
                <span className="text-xxs text-slate-500 block leading-tight mt-0.5">Zentraler Netzwerk-Server für geteilte Nutzung.</span>
              </div>
            </button>

          </div>

          {/* Synology Connection Config Section */}
          {mode === 'synology' ? (
            <div className="space-y-3.5 pt-1 border-t border-slate-100 animate-in fade-in slide-in-from-top-3 duration-200">
              
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Synology Server-URL (inkl. Port)
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="http://192.168.1.100:3000"
                  className="w-full px-4.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono"
                />
                <p className="text-xxs text-slate-400">
                  Geben Sie die lokale IP-Adresse oder den Hostnamen Ihres Servers ein. Standardport der API ist 3000.
                </p>
              </div>

              {/* Health check test trigger */}
              <div className="flex gap-2.5 items-center">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-4.5 py-2 text-xs font-semibold border border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 shrink-0"
                >
                  {isTesting ? 'Wird geprüft...' : 'Verbindung testen'}
                </button>

                {/* Connection Status indicator */}
                <div className="grow">
                  {testResult === 'success' && (
                    <div className="flex items-center gap-1.5 text-green-700 text-xs font-medium">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      <span>Verbindung erfolgreich!</span>
                    </div>
                  )}
                  {testResult === 'error' && (
                    <div className="flex items-start gap-1 pb-0.5 text-red-700 text-xs font-medium leading-relaxed">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="block font-bold">Fehler beim Verbinden.</span>
                        <span className="block text-xxs font-normal text-red-500">{testError}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-slate-600 text-xs leading-relaxed">
              Im <strong>Lokalen Modus</strong> werden alle Ihre Daten hochsicher auf Ihrem lokalen Computer in einer passwortgeschützten Datei gespeichert. Ein Internet- oder Netzwerkzugriff ist nicht erforderlich.
            </div>
          )}

          {/* Action Footer */}
          <div className="flex gap-2.5 pt-3 border-t border-slate-100 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4.5 py-2 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all active:scale-[0.98]"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center gap-1.5 shadow-sm hover:shadow"
            >
              <Save className="w-4 h-4" /> Speichern
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ConnectionSettingsModal;
