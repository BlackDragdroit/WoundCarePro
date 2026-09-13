import React, { useState } from 'react';
import { X } from 'lucide-react';

const NewPatientModal = ({ onCancel, onSave }) => {
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [svn, setSvn] = useState('');
  const [kassa, setKassa] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (name && dob) {
      try {
        console.log("Submitting form with:", name, dob, svn, kassa);
        await onSave({ name, dob, svn, kassa });
        console.log("onSave completed");
      } catch (err) {
        console.error("Error in onSave:", err);
        alert("Fehler: " + err.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fadeIn">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800">Neuen Patienten aufnehmen</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Vollständiger Name</label>
            <input 
              autoFocus
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="z.B. Maxe Mustermann"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Geburtsdatum</label>
            <input 
              type="date" 
              required
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">SVN (Sozialvers. Nr.)</label>
              <input 
                type="text" 
                value={svn}
                onChange={(e) => setSvn(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="z.B. 1234 010180"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Krankenkasse (Kassa)</label>
              <input 
                type="text" 
                value={kassa}
                onChange={(e) => setKassa(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="z.B. ÖGK, SVS"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Abbrechen
            </button>
            <button 
              type="submit"
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm transition-colors"
            >
              Profil erstellen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewPatientModal;
