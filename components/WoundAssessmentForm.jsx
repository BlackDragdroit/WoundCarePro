import React, { useState } from 'react';
import { ChevronRight, Save, Plus, Camera } from 'lucide-react';
import { FormInput, FormSelect } from './ui/FormElements';

const WoundAssessmentForm = ({ wound, onCancel, onSave, initialData }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialData || {
    // Dimensions
    length: '', width: '', depth: '',
    // Characteristics
    edges: 'Diffus',
    phase: 'Granulation',
    exudateAmount: 'Kein',
    exudateType: 'N/A',
    surroundings: 'Intakt',
    // Therapy
    cleanser: 'NaCl 0.9%',
    filler: 'Keiner',
    dressing: 'Schaumverband',
    compression: 'Nein',
    compressionType: '',
    frequency: 'Täglich',
    // Misc
    notes: '',
    imageUrl: '' // For demo, we'll store base64 or mock
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // In production, upload to Firebase Storage here and get URL
      // For demo, we use FileReader for immediate preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Form Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50">
         <div>
           <h2 className="text-xl font-bold text-slate-800">{initialData ? 'Beurteilung bearbeiten' : 'Neue Beurteilung'}</h2>
           <p className="text-sm text-slate-500">Ort: {wound.locationName}</p>
         </div>
         <div className="flex gap-2">
           <button onClick={onCancel} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">Abbrechen</button>
           {step < 3 ? (
             <button 
              onClick={() => setStep(step + 1)} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 shadow hover:bg-blue-700"
             >
               Weiter <ChevronRight size={16} />
             </button>
           ) : (
             <button 
              onClick={handleSubmit} 
              className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 shadow hover:bg-green-700"
             >
               <Save size={16} /> Speichern
             </button>
           )}
         </div>
      </div>

      {/* Stepper */}
      <div className="flex border-b">
         {[1, 2, 3].map(i => (
           <div 
            key={i}
            className={`flex-1 py-2 text-center text-sm font-medium border-b-2 transition-colors ${
              step === i ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'
            }`}
           >
             {i === 1 && "1. Befund & Foto"}
             {i === 2 && "2. Charakteristik"}
             {i === 3 && "3. Therapie"}
           </div>
         ))}
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full">
        
        {/* STEP 1: VISUALS & DIMS */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
             <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center">
                {formData.imageUrl ? (
                  <div className="relative inline-block">
                    <img src={formData.imageUrl} alt="Preview" className="max-h-64 rounded shadow" />
                    <button 
                      onClick={() => setFormData(prev => ({...prev, imageUrl: ''}))}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow"
                    >
                      <Plus size={16} className="rotate-45" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2 py-8">
                     <Camera size={48} className="text-slate-300" />
                     <span className="text-blue-600 font-medium">Wundfoto hochladen</span>
                     <span className="text-xs text-slate-400">Klicken für Kamera oder Galerie</span>
                     <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
             </div>

             <div className="grid grid-cols-3 gap-4">
                <FormInput label="Länge (cm)" name="length" value={formData.length} onChange={handleChange} type="number" />
                <FormInput label="Breite (cm)" name="width" value={formData.width} onChange={handleChange} type="number" />
                <FormInput label="Tiefe (cm)" name="depth" value={formData.depth} onChange={handleChange} type="number" />
             </div>
          </div>
        )}

        {/* STEP 2: CHARACTERISTICS */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid md:grid-cols-2 gap-6">
               <FormSelect label="Wundphase" name="phase" value={formData.phase} onChange={handleChange} 
                 options={['Nekrotisch', 'Belegt', 'Granulation', 'Epithelisierung', 'Geschlossen']} 
               />
               <FormSelect label="Wundränder" name="edges" value={formData.edges} onChange={handleChange} 
                 options={['Diffus', 'Glatt', 'Gerollt', 'Mazeriert', 'Unterminiert']} 
               />
               <FormSelect label="Exsudat Menge" name="exudateAmount" value={formData.exudateAmount} onChange={handleChange} 
                 options={['Kein', 'Gering', 'Mäßig', 'Stark']} 
               />
               <FormSelect label="Exsudat Typ" name="exudateType" value={formData.exudateType} onChange={handleChange} 
                 options={['N/A', 'Serös', 'Sanguinös', 'Serosanguinös', 'Eitrig']} 
               />
               <FormSelect label="Wundumgebung" name="surroundings" value={formData.surroundings} onChange={handleChange} 
                 options={['Intakt', 'Rötung (Erythem)', 'Mazeriert', 'Exkoriert', 'Verhärtet']} 
               />
            </div>
            <div className="pt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Allgemeine Beschreibung / Notizen</label>
              <textarea 
                name="notes" 
                value={formData.notes} 
                onChange={handleChange}
                className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                rows={4}
                placeholder="Zusätzliche klinische Beobachtungen..."
              />
            </div>
          </div>
        )}

        {/* STEP 3: THERAPY */}
        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
             <div className="grid md:grid-cols-2 gap-6">
               <FormInput label="Reinigung" name="cleanser" value={formData.cleanser} onChange={handleChange} />
               <FormInput label="Wundfüller" name="filler" value={formData.filler} onChange={handleChange} />
               <FormInput label="Primärverband" name="dressing" value={formData.dressing} onChange={handleChange} />
               <FormInput label="Wechselintervall" name="frequency" value={formData.frequency} onChange={handleChange} />
             </div>
             
             <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
               <div className="flex items-center gap-4 mb-4">
                 <span className="font-medium text-slate-700">Kompressionstherapie?</span>
                 <div className="flex gap-4">
                   <label className="flex items-center gap-2 cursor-pointer">
                     <input type="radio" name="compression" value="Nein" checked={formData.compression === 'Nein'} onChange={handleChange} />
                     <span>Nein</span>
                   </label>
                   <label className="flex items-center gap-2 cursor-pointer">
                     <input type="radio" name="compression" value="Ja" checked={formData.compression === 'Ja'} onChange={handleChange} />
                     <span>Ja</span>
                   </label>
                 </div>
               </div>
               
               {formData.compression === 'Ja' && (
                 <FormSelect label="Art der Kompression" name="compressionType" value={formData.compressionType} onChange={handleChange} 
                   options={['Langzug', 'Kurzzug', 'Mehrlagen', 'Strumpf Kl. I', 'Strumpf Kl. II']} 
                 />
               )}
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default WoundAssessmentForm;
