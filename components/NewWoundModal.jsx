import React, { useState } from 'react';
import { X, MapPin } from 'lucide-react';

const NewWoundModal = ({ initialValue, onCancel, onSave }) => {
  const [locationName, setLocationName] = useState(initialValue || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (locationName) {
      onSave(locationName);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fadeIn">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800">Neue Wunde erfassen</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg text-blue-800 text-sm mb-2 flex gap-2 items-start">
             <MapPin size={16} className="mt-0.5 shrink-0" />
             <span>
               Punkt auf Körperkarte gewählt. 
               {initialValue ? ` Region erkannt: ${initialValue}. ` : ''} 
               Bitte bestätigen oder präzisieren Sie die Bezeichnung.
             </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Lokalisation / Bezeichnung</label>
            <input 
              autoFocus
              type="text" 
              required
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="z.B. Linke Ferse, Sakrum..."
            />
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
              Wunde anlegen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewWoundModal;
