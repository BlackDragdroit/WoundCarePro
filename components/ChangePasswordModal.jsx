import React, { useState } from 'react';
import { Lock, X, AlertCircle } from 'lucide-react';

const ChangePasswordModal = ({ isOpen, onClose, onSave }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Das neue Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }

    onSave(newPassword);
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Passwort ändern</h2>
              <p className="text-xs text-white/80">Lokale Datenbank neu verschlüsseln</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-orange-800 text-xs leading-relaxed">
            <strong>Hinweis:</strong> Nach der Änderung wird Ihre Datenbank sofort mit dem neuen Passwort verschlüsselt. Bitte merken Sie sich das neue Passwort gut.
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-505 uppercase tracking-wider text-slate-500">
                Neues Passwort
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mindestens 6 Zeichen"
                className="w-full px-4.5 py-2.5 border border-slate-205 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-505 uppercase tracking-wider text-slate-500">
                Neues Passwort bestätigen
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Passwort wiederholen"
                className="w-full px-4.5 py-2.5 border border-slate-205 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex gap-2.5 pt-3 border-t border-slate-100 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4.5 py-2 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all active:scale-[0.98]"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all active:scale-[0.98] shadow-sm hover:shadow"
            >
              Passwort aktualisieren
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default ChangePasswordModal;
