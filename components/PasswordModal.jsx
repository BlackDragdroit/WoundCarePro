import React, { useState } from 'react';
import { Lock, ShieldAlert, KeyRound, Check, AlertCircle, Server, Trash2 } from 'lucide-react';

const PasswordModal = ({ 
  isOpen, 
  mode, 
  onSubmit, 
  onResetDatabase, 
  onSwitchToSynology, 
  error, 
  isLoading 
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError('');

    if (!password) {
      setLocalError('Geben Sie ein Passwort ein.');
      return;
    }

    if (mode === 'setup') {
      if (password.length < 6) {
        setLocalError('Das Passwort muss mindestens 6 Zeichen lang sein.');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('Die Passwörter stimmen nicht überein.');
        return;
      }
    }

    onSubmit(password);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className={`p-6 text-white ${mode === 'setup' ? 'bg-indigo-600' : 'bg-blue-600'} flex items-center gap-4`}>
          <div className="p-3 bg-white/10 rounded-xl">
            {mode === 'setup' ? <KeyRound className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-xl font-bold">
              {mode === 'setup' ? 'Datenbank-Schutz einrichten' : 'Datenbank entsperren'}
            </h2>
            <p className="text-xs text-white/80 mt-0.5">
              {mode === 'setup' ? 'Datensicherheit nach DSGVO standardmäßig' : 'Geben Sie Ihr Passwort ein, um fortzufahren'}
            </p>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {(error || localError) && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2.5 items-start text-red-800 text-sm">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span>{localError || error}</span>
            </div>
          )}

          {mode === 'setup' ? (
            <>
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5 flex gap-3 text-indigo-900 text-xs leading-relaxed mb-1">
                <ShieldAlert className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                  <span className="font-semibold block mb-0.5">Wichtiger DSGVO-Hinweis:</span>
                  Ihre Patientendaten sowie alle Wundbilder werden lokal auf Ihrem Gerät verschlüsselt (AES-256). 
                  Da kein Cloud-Dienst genutzt wird, gibt es keine „Passwort vergessen“-Funktion. 
                  Bitte notieren Sie Ihr Passwort sicher.
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Passwort festlegen</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="Mindestens 6 Zeichen"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Passwort bestätigen</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="Passwort erneut eingeben"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </>
          ) : (
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Passwort</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                placeholder="Ihr Passwort eingeben"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                autoFocus
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all focus:outline-none hover:shadow-md active:scale-[0.98] ${
              mode === 'setup' 
                ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500' 
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
            } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : mode === 'setup' ? (
              <>
                <Check className="w-4 h-4" /> Verschlüsselung aktivieren
              </>
            ) : (
              'Datenbank entsperren'
            )}
          </button>

          {/* Alternative options when unlocking to avoid lockout */}
          {mode === 'unlock' && (
            <div className="pt-3 border-t border-slate-100 space-y-2 text-center">
              <p className="text-xxs text-slate-400 font-medium">Passwort vergessen oder Server nutzen?</p>
              <div className="flex flex-col gap-2">
                {onSwitchToSynology && (
                  <button
                    type="button"
                    onClick={onSwitchToSynology}
                    disabled={isLoading}
                    className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <Server className="w-4 h-4 text-indigo-600" />
                    Zu Synology NAS / Server wechseln
                  </button>
                )}

                {onResetDatabase && (
                  <button
                    type="button"
                    onClick={onResetDatabase}
                    disabled={isLoading}
                    className="w-full py-2.5 px-3 bg-red-50/60 hover:bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                    Neuen lokalen Speicher anlegen (Daten zurücksetzen)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Alternative option on setup mode: allow switching directly to online server */}
          {mode === 'setup' && onSwitchToSynology && (
            <div className="pt-3 border-t border-slate-100 space-y-2 text-center">
              <p className="text-xxs text-slate-400 font-medium">Zentrale Praxis- oder Klinik-Datenbank nutzen?</p>
              <button
                type="button"
                onClick={onSwitchToSynology}
                disabled={isLoading}
                className="w-full py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <Server className="w-4 h-4 text-indigo-600" />
                Stattdessen online mit Synology NAS verbinden
              </button>
            </div>
          )}

        </form>
      </div>
    </div>
  );
};

export default PasswordModal;
