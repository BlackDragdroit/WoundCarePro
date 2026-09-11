import React, { useState } from 'react';
import { ChevronRight, Save, Plus, Camera } from 'lucide-react';
import { FormInput, FormSelect } from './ui/FormElements';

// --- UI Components for Multi and Single Selection Pills ---

const MultiSelectPills = ({ label, options, selectedValues = [], onChange }) => {
  const toggleOption = (opt) => {
    if (selectedValues.includes(opt)) {
      onChange(selectedValues.filter(item => item !== opt));
    } else {
      onChange([...selectedValues, opt]);
    }
  };

  return (
    <div>
      <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 tracking-wider">
        {label} <span className="text-[10px] text-slate-400 font-normal lowercase font-sans">(Mehrfachauswahl)</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const isSelected = selectedValues.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggleOption(opt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {isSelected ? '✓ ' : ''}{opt}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const SingleSelectPills = ({ label, options, value, onChange }) => (
  <div>
    <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 tracking-wider">{label}</label>
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const isSelected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              isSelected
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  </div>
);

// --- Multi-Select & Characteristics Parser Helpers ---

const parseMultiSelect = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return String(val).split(',').map(s => s.trim()).filter(Boolean);
};

const parseExudateType = (str) => {
  const result = {
    selected: [],
    custom: ''
  };
  if (!str || str === 'N/A') return { selected: ['Serös'], custom: '' };
  
  const standardTypes = ['Serös', 'Blutig', 'Eitrig'];
  const parts = String(str).split(',').map(s => s.trim()).filter(Boolean);
  
  parts.forEach(p => {
    if (p.startsWith('Sonst:')) {
      if (!result.selected.includes('Sonst')) result.selected.push('Sonst');
      result.custom = p.replace(/^Sonst:\s*/, '').trim();
    } else if (standardTypes.includes(p)) {
      if (!result.selected.includes(p)) result.selected.push(p);
    } else if (p === 'Sonst') {
      if (!result.selected.includes('Sonst')) result.selected.push('Sonst');
    } else {
      if (!result.selected.includes('Sonst')) result.selected.push('Sonst');
      result.custom = p;
    }
  });
  
  if (result.selected.length === 0) {
    result.selected = ['Serös'];
  }
  return result;
};

const serializeExudateType = (selectedArr = [], customText = '') => {
  if (!selectedArr || selectedArr.length === 0) return 'Serös';
  const formatted = selectedArr.map(item => {
    if (item === 'Sonst') {
      return customText ? `Sonst: ${customText}` : 'Sonst';
    }
    return item;
  });
  return formatted.join(', ');
};



// --- Parser & Serializer Helpers ---

const parseCleanser = (str) => {
  const result = {
    spuelung: 'NaCl 0.9%',
    spuelungCustom: '',
    antiseptikum: 'Keines',
    antiseptikumCustom: ''
  };
  if (!str) return result;
  
  const parts = str.split(' / ');
  if (parts.length >= 2) {
    const sp = parts[0].replace(/^Spülung:\s*/, '').trim();
    const ant = parts[1].replace(/^Antiseptikum:\s*/, '').trim();
    
    const standardSpuelungen = ['Actimaris sens.', 'Octenilin', 'Prontosan', 'Granudacyn', 'NaCl 0.9%', 'Keine'];
    if (standardSpuelungen.includes(sp)) {
      result.spuelung = sp;
    } else {
      result.spuelung = 'Sonst';
      result.spuelungCustom = sp;
    }
    
    const standardAntis = ['Actimaris forte', 'Octenisept', 'Betadona Lösung', 'Keines'];
    if (standardAntis.includes(ant)) {
      result.antiseptikum = ant;
    } else {
      result.antiseptikum = 'Sonst';
      result.antiseptikumCustom = ant;
    }
  } else {
    const standardSpuelungen = ['Actimaris sens.', 'Octenilin', 'Prontosan', 'Granudacyn', 'NaCl 0.9%', 'Keine'];
    if (standardSpuelungen.includes(str)) {
      result.spuelung = str;
    } else {
      result.spuelung = 'Sonst';
      result.spuelungCustom = str;
    }
  }
  return result;
};

const serializeFiller = (parts) => {
  const result = [];
  if (parts.alginat && parts.alginat !== 'Keine') {
    result.push(`Alginat: ${parts.alginat === 'Sonst' ? parts.alginatCustom : parts.alginat}`);
  }
  if (parts.hydrofaser && parts.hydrofaser !== 'Keine') {
    result.push(`Hydrofaser: ${parts.hydrofaser === 'Sonst' ? parts.hydrofaserCustom : parts.hydrofaser}`);
  }
  if (parts.gel && parts.gel !== 'Keine') {
    result.push(`Gel: ${parts.gel === 'Sonst' ? parts.gelCustom : parts.gel}`);
  }
  if (parts.sonstFiller) {
    result.push(`Sonstiges: ${parts.sonstFiller}`);
  }
  return result.join(' | ') || 'Keine';
};

const parseFiller = (str) => {
  const result = {
    alginat: 'Keine',
    alginatCustom: '',
    hydrofaser: 'Keine',
    hydrofaserCustom: '',
    gel: 'Keine',
    gelCustom: '',
    sonstFiller: ''
  };
  if (!str || str === 'Keine' || str === 'Keiner') return result;
  
  if (str.includes(':')) {
    const parts = str.split(' | ');
    const standardAlginate = ['Biatain Alginat', 'Kaltostat', 'Silvercel'];
    const standardHydrofaser = ['Aquacel extra', 'Aquacel Ag+extra', 'Exufiber', 'Durofiber'];
    const standardGele = ['Actimaris Gel', 'Prontosan Gel', 'Octenilin Gel', 'Flaminal hydro', 'Flaminal forte'];
    
    parts.forEach(p => {
      const splitIdx = p.indexOf(':');
      if (splitIdx === -1) return;
      const label = p.substring(0, splitIdx).trim();
      const val = p.substring(splitIdx + 1).trim();
      
      if (label === 'Alginat') {
        if (standardAlginate.includes(val)) {
          result.alginat = val;
        } else {
          result.alginat = 'Sonst';
          result.alginatCustom = val;
        }
      } else if (label === 'Hydrofaser') {
        if (standardHydrofaser.includes(val)) {
          result.hydrofaser = val;
        } else {
          result.hydrofaser = 'Sonst';
          result.hydrofaserCustom = val;
        }
      } else if (label === 'Gel') {
        if (standardGele.includes(val)) {
          result.gel = val;
        } else {
          result.gel = 'Sonst';
          result.gelCustom = val;
        }
      } else if (label === 'Sonstiges') {
        result.sonstFiller = val;
      }
    });
  } else {
    result.sonstFiller = str;
  }
  return result;
};

const serializeDressing = (parts) => {
  const result = [];
  if (parts.schaumstoff && parts.schaumstoff !== 'Keine') {
    result.push(`Schaumstoff: ${parts.schaumstoff === 'Sonst' ? parts.schaumstoffCustom : parts.schaumstoff}`);
  }
  if (parts.superabsorber && parts.superabsorber !== 'Keine') {
    result.push(`Superabsorber: ${parts.superabsorber === 'Sonst' ? parts.superabsorberCustom : parts.superabsorber}`);
  }
  if (parts.sonstDressing) {
    result.push(`Sonstiges: ${parts.sonstDressing}`);
  }
  return result.join(' | ') || 'Keine';
};

const parseDressing = (str) => {
  const result = {
    schaumstoff: 'Keine',
    schaumstoffCustom: '',
    superabsorber: 'Keine',
    superabsorberCustom: '',
    sonstDressing: ''
  };
  if (!str || str === 'Keine' || str === 'Keiner') return result;
  
  if (str.includes(':')) {
    const parts = str.split(' | ');
    const standardSchaumstoff = ['Mepilex up', 'Biatain non. Adh.'];
    const standardSuperabsorber = ['Resposorb super', 'Resposorb silicon', 'Cutimed sorbion', 'Cutimed sorbion carbon', 'Mextra'];
    
    parts.forEach(p => {
      const splitIdx = p.indexOf(':');
      if (splitIdx === -1) return;
      const label = p.substring(0, splitIdx).trim();
      const val = p.substring(splitIdx + 1).trim();
      
      if (label === 'Schaumstoff') {
        if (standardSchaumstoff.includes(val)) {
          result.schaumstoff = val;
        } else {
          result.schaumstoff = 'Sonst';
          result.schaumstoffCustom = val;
        }
      } else if (label === 'Superabsorber') {
        if (standardSuperabsorber.includes(val)) {
          result.superabsorber = val;
        } else {
          result.superabsorber = 'Sonst';
          result.superabsorberCustom = val;
        }
      } else if (label === 'Sonstiges') {
        result.sonstDressing = val;
      }
    });
  } else {
    result.sonstDressing = str;
  }
  return result;
};

const parseFrequency = (str) => {
  const common = ['Täglich', 'Wöchentlich', 'Mehrfach täglich', '2-tägig', '3-tägig'];
  if (!str) return { type: 'Täglich', custom: '' };
  if (common.includes(str)) return { type: str, custom: '' };
  return { type: 'Benutzerdefiniert', custom: str };
};

const serializeCompression = (parts) => {
  if (parts.class === 'Kurzzugbandage Klasse 1') {
    return `Kurzzugbandage Kl. 1${parts.unterpolsterung ? ' (mit Unterpolsterung)' : ''}`;
  } else if (parts.class === 'Kurzzugbandage Klasse 2') {
    return `Kurzzugbandage Kl. 2${parts.unterpolsterung ? ' (mit Unterpolsterung)' : ''}`;
  } else if (parts.class === 'Einmalsysteme') {
    const sys = parts.einmalSelect === 'Sonstiges' ? parts.einmalCustom : parts.einmalSelect;
    return `Einmalsystem: ${sys}`;
  } else if (parts.class === 'Andere') {
    return `Andere: ${parts.andereCustom}`;
  }
  return '';
};

const parseCompression = (compression, typeStr) => {
  const result = {
    active: compression === 'Ja',
    class: 'Kurzzugbandage Klasse 1',
    unterpolsterung: false,
    einmalSelect: 'Rosidal 1 C',
    einmalCustom: '',
    andereCustom: ''
  };
  if (compression !== 'Ja' || !typeStr) return result;
  
  if (typeStr.includes('Kurzzugbandage Kl. 1') || typeStr.includes('Kurzzugbandage Klasse 1')) {
    result.class = 'Kurzzugbandage Klasse 1';
    result.unterpolsterung = typeStr.includes('Unterpolsterung');
  } else if (typeStr.includes('Kurzzugbandage Kl. 2') || typeStr.includes('Kurzzugbandage Klasse 2')) {
    result.class = 'Kurzzugbandage Klasse 2';
    result.unterpolsterung = typeStr.includes('Unterpolsterung');
  } else if (typeStr.startsWith('Einmalsystem:')) {
    result.class = 'Einmalsysteme';
    const sys = typeStr.replace('Einmalsystem:', '').trim();
    if (sys === 'Rosidal 1 C' || sys === 'Pütter') {
      result.einmalSelect = sys;
    } else {
      result.einmalSelect = 'Sonstiges';
      result.einmalCustom = sys;
    }
  } else {
    result.class = 'Andere';
    result.andereCustom = typeStr.startsWith('Andere:') ? typeStr.replace('Andere:', '').trim() : typeStr;
  }
  return result;
};

// --- Main component ---

const WoundAssessmentForm = ({ wound, onCancel, onSave, initialData }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(() => {
    const base = initialData || {
      length: '', width: '', depth: '',
      edges: 'Diffus',
      phase: 'Granulation',
      exudateAmount: 'Kein',
      exudateType: 'Serös',
      surroundings: 'Intakt',
      odor: 'Nein',
      cleanser: 'NaCl 0.9%',
      filler: 'Keine',
      dressing: 'Keine',
      compression: 'Nein',
      compressionType: '',
      frequency: 'Täglich',
      subjectiveComplaints: '',
      notes: '',
      imageUrl: ''
    };
    
    const parsedPhase = parseMultiSelect(base.phase);
    const parsedEdges = parseMultiSelect(base.edges);
    const parsedExType = parseExudateType(base.exudateType);
    const parsedSurroundings = parseMultiSelect(base.surroundings);
    const parsedCl = parseCleanser(base.cleanser);
    const parsedFil = parseFiller(base.filler);
    const parsedDr = parseDressing(base.dressing);
    const parsedFreq = parseFrequency(base.frequency);
    const parsedComp = parseCompression(base.compression, base.compressionType);
    
    return {
      ...base,
      phase: parsedPhase.length > 0 ? parsedPhase : ['Granulation'],
      edges: parsedEdges.length > 0 ? parsedEdges : ['Diffus'],
      exudateAmount: base.exudateAmount || 'Kein',
      exudateType: parsedExType.selected,
      exudateTypeCustom: parsedExType.custom,
      surroundings: parsedSurroundings.length > 0 ? parsedSurroundings : ['Intakt'],
      odor: base.odor || 'Nein',

      spuelung: parsedCl.spuelung,
      spuelungCustom: parsedCl.spuelungCustom,
      antiseptikum: parsedCl.antiseptikum,
      antiseptikumCustom: parsedCl.antiseptikumCustom,
      
      alginat: parsedFil.alginat,
      alginatCustom: parsedFil.alginatCustom,
      hydrofaser: parsedFil.hydrofaser,
      hydrofaserCustom: parsedFil.hydrofaserCustom,
      gel: parsedFil.gel,
      gelCustom: parsedFil.gelCustom,
      sonstFiller: parsedFil.sonstFiller,
      
      schaumstoff: parsedDr.schaumstoff,
      schaumstoffCustom: parsedDr.schaumstoffCustom,
      superabsorber: parsedDr.superabsorber,
      superabsorberCustom: parsedDr.superabsorberCustom,
      sonstDressing: parsedDr.sonstDressing,
      
      frequencyType: parsedFreq.type,
      frequencyCustom: parsedFreq.custom,
      
      compressionActive: parsedComp.active,
      compressionClass: parsedComp.class,
      compressionUnterpolsterung: parsedComp.unterpolsterung,
      compressionEinmalSelect: parsedComp.einmalSelect,
      compressionEinmalCustom: parsedComp.einmalCustom,
      compressionAndereCustom: parsedComp.andereCustom
    };
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const finalData = {
      ...formData,
      phase: Array.isArray(formData.phase) ? (formData.phase.join(', ') || 'Granulation') : (formData.phase || 'Granulation'),
      edges: Array.isArray(formData.edges) ? (formData.edges.join(', ') || 'Diffus') : (formData.edges || 'Diffus'),
      exudateAmount: formData.exudateAmount || 'Kein',
      exudateType: serializeExudateType(formData.exudateType, formData.exudateTypeCustom),
      surroundings: Array.isArray(formData.surroundings) ? (formData.surroundings.join(', ') || 'Intakt') : (formData.surroundings || 'Intakt'),
      odor: formData.odor || 'Nein',

      cleanser: `Spülung: ${formData.spuelung === 'Sonst' ? formData.spuelungCustom : formData.spuelung} / Antiseptikum: ${
        formData.antiseptikum === 'Sonst' ? formData.antiseptikumCustom : formData.antiseptikum
      }`,
      
      filler: serializeFiller({
        alginat: formData.alginat,
        alginatCustom: formData.alginatCustom,
        hydrofaser: formData.hydrofaser,
        hydrofaserCustom: formData.hydrofaserCustom,
        gel: formData.gel,
        gelCustom: formData.gelCustom,
        sonstFiller: formData.sonstFiller
      }),
      
      dressing: serializeDressing({
        schaumstoff: formData.schaumstoff,
        schaumstoffCustom: formData.schaumstoffCustom,
        superabsorber: formData.superabsorber,
        superabsorberCustom: formData.superabsorberCustom,
        sonstDressing: formData.sonstDressing
      }),
      
      frequency: formData.frequencyType === 'Benutzerdefiniert' ? formData.frequencyCustom : formData.frequencyType,
      
      compression: formData.compressionActive ? 'Ja' : 'Nein',
      compressionType: formData.compressionActive ? serializeCompression({
        class: formData.compressionClass,
        unterpolsterung: formData.compressionUnterpolsterung,
        einmalSelect: formData.compressionEinmalSelect,
        einmalCustom: formData.compressionEinmalCustom,
        andereCustom: formData.compressionAndereCustom
      }) : ''
    };
    
    onSave(finalData);
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
            {/* Wundphase (Multi-select) */}
            <MultiSelectPills 
              label="Wundphase" 
              options={['Nekrose', 'Fibrin', 'Granulation', 'Epithelisierung', 'Geschlossen']}
              selectedValues={formData.phase}
              onChange={(newVals) => setFormData(prev => ({ ...prev, phase: newVals }))}
            />

            {/* Wundränder (Multi-select) */}
            <MultiSelectPills 
              label="Wundränder" 
              options={['Diffus', 'Glatt', 'Gerollt', 'Mazeriert', 'Unterminiert']}
              selectedValues={formData.edges}
              onChange={(newVals) => setFormData(prev => ({ ...prev, edges: newVals }))}
            />

            <div className="grid md:grid-cols-2 gap-6">
              {/* Exsudat Menge (Single-select) */}
              <SingleSelectPills 
                label="Exsudat Menge" 
                options={['Kein', 'Wenig', 'Mäßig', 'Viel']}
                value={formData.exudateAmount}
                onChange={(val) => setFormData(prev => ({ ...prev, exudateAmount: val }))}
              />

              {/* Geruch (Single-select) */}
              <SingleSelectPills 
                label="Geruch" 
                options={['Nein', 'Ja']}
                value={formData.odor}
                onChange={(val) => setFormData(prev => ({ ...prev, odor: val }))}
              />
            </div>

            {/* Exsudat Typ (Multi-select with custom text) */}
            <div>
              <MultiSelectPills 
                label="Exsudat Typ" 
                options={['Serös', 'Blutig', 'Eitrig', 'Sonst']}
                selectedValues={formData.exudateType}
                onChange={(newVals) => setFormData(prev => ({ ...prev, exudateType: newVals }))}
              />
              {formData.exudateType.includes('Sonst') && (
                <div className="mt-3">
                  <FormInput 
                    label="Eigenes Exsudat-Typ / Freitext" 
                    name="exudateTypeCustom" 
                    value={formData.exudateTypeCustom} 
                    onChange={handleChange}
                    placeholder="Exsudat-Typ näher beschreiben..."
                  />
                </div>
              )}
            </div>

            {/* Wundumgebung (Multi-select) */}
            <MultiSelectPills 
              label="Wundumgebung" 
              options={['Intakt', 'Rötung (Erythem)', 'Mazeriert', 'Exkoriert', 'Verhärtet']}
              selectedValues={formData.surroundings}
              onChange={(newVals) => setFormData(prev => ({ ...prev, surroundings: newVals }))}
            />

            <div className="pt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subjektive Beschwerden</label>
                <textarea 
                  name="subjectiveComplaints" 
                  value={formData.subjectiveComplaints} 
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={2}
                  placeholder="z.B. Schmerzen, Juckreiz, über den Basisstatus hinausgehende Beschwerden..."
                />
              </div>
              <div>
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
          </div>
        )}

        {/* STEP 3: THERAPY */}
        {step === 3 && (
          <div className="space-y-6 animate-fadeIn text-sm">
            {/* 1. Reinigung */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-800 border-b pb-1">Reinigung</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <FormSelect 
                  label="Wundspüllösung" 
                  name="spuelung" 
                  value={formData.spuelung} 
                  onChange={handleChange}
                  options={['NaCl 0.9%', 'Actimaris sens.', 'Octenilin', 'Prontosan', 'Granudacyn', 'Keine', 'Sonst']} 
                />
                <FormSelect 
                  label="Wundantiseptikum" 
                  name="antiseptikum" 
                  value={formData.antiseptikum} 
                  onChange={handleChange}
                  options={['Keines', 'Actimaris forte', 'Octenisept', 'Betadona Lösung', 'Sonst']} 
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {formData.spuelung === 'Sonst' ? (
                  <FormInput 
                    label="Eigene Wundspüllösung" 
                    name="spuelungCustom" 
                    value={formData.spuelungCustom} 
                    onChange={handleChange} 
                    placeholder="Wundspüllösung eingeben..."
                  />
                ) : <div />}
                {formData.antiseptikum === 'Sonst' ? (
                  <FormInput 
                    label="Eigenes Wundantiseptikum" 
                    name="antiseptikumCustom" 
                    value={formData.antiseptikumCustom} 
                    onChange={handleChange} 
                    placeholder="Wundantiseptikum eingeben..."
                  />
                ) : <div />}
              </div>
            </div>

            {/* 2. Primärverband (ehemals Wundfüller) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-800 border-b pb-1">Primärverband</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <FormSelect 
                  label="Alginat" 
                  name="alginat" 
                  value={formData.alginat} 
                  onChange={handleChange}
                  options={['Keine', 'Biatain Alginat', 'Kaltostat', 'Silvercel', 'Sonst']} 
                />
                <FormSelect 
                  label="Hydrofaser" 
                  name="hydrofaser" 
                  value={formData.hydrofaser} 
                  onChange={handleChange}
                  options={['Keine', 'Aquacel extra', 'Aquacel Ag+extra', 'Exufiber', 'Durofiber', 'Sonst']} 
                />
                <FormSelect 
                  label="Gel" 
                  name="gel" 
                  value={formData.gel} 
                  onChange={handleChange}
                  options={['Keine', 'Actimaris Gel', 'Prontosan Gel', 'Octenilin Gel', 'Flaminal hydro', 'Flaminal forte', 'Sonst']} 
                />
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                {formData.alginat === 'Sonst' ? (
                  <FormInput 
                    label="Eigenes Alginat" 
                    name="alginatCustom" 
                    value={formData.alginatCustom} 
                    onChange={handleChange} 
                    placeholder="Freie Eingabe..."
                  />
                ) : <div />}
                {formData.hydrofaser === 'Sonst' ? (
                  <FormInput 
                    label="Eigene Hydrofaser" 
                    name="hydrofaserCustom" 
                    value={formData.hydrofaserCustom} 
                    onChange={handleChange} 
                    placeholder="Freie Eingabe..."
                  />
                ) : <div />}
                {formData.gel === 'Sonst' ? (
                  <FormInput 
                    label="Eigenes Gel" 
                    name="gelCustom" 
                    value={formData.gelCustom} 
                    onChange={handleChange} 
                    placeholder="Freie Eingabe..."
                  />
                ) : <div />}
              </div>

              <div>
                <FormInput 
                  label="Sonstiges (Freitext)" 
                  name="sonstFiller" 
                  value={formData.sonstFiller} 
                  onChange={handleChange} 
                  placeholder="Andere Primärverbände eingeben..."
                />
              </div>
            </div>

            {/* 3. Sekundärverband */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-800 border-b pb-1">Sekundärverband</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <FormSelect 
                  label="Schaumstoff" 
                  name="schaumstoff" 
                  value={formData.schaumstoff} 
                  onChange={handleChange}
                  options={['Keine', 'Mepilex up', 'Biatain non. Adh.', 'Sonst']} 
                />
                <FormSelect 
                  label="Superabsorber" 
                  name="superabsorber" 
                  value={formData.superabsorber} 
                  onChange={handleChange}
                  options={['Keine', 'Resposorb super', 'Resposorb silicon', 'Cutimed sorbion', 'Cutimed sorbion carbon', 'Mextra', 'Sonst']} 
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {formData.schaumstoff === 'Sonst' ? (
                  <FormInput 
                    label="Eigenen Schaumstoff" 
                    name="schaumstoffCustom" 
                    value={formData.schaumstoffCustom} 
                    onChange={handleChange} 
                    placeholder="Freie Eingabe..."
                  />
                ) : <div />}
                {formData.superabsorber === 'Sonst' ? (
                  <FormInput 
                    label="Eigenen Superabsorber" 
                    name="superabsorberCustom" 
                    value={formData.superabsorberCustom} 
                    onChange={handleChange} 
                    placeholder="Freie Eingabe..."
                  />
                ) : <div />}
              </div>

              <div>
                <FormInput 
                  label="Sonstiges (Freitext)" 
                  name="sonstDressing" 
                  value={formData.sonstDressing} 
                  onChange={handleChange} 
                  placeholder="Andere Sekundärverbände..."
                />
              </div>
            </div>

            {/* 4. Wechselintervall */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-800 border-b pb-1">Verbandswechselintervall</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <FormSelect 
                  label="Intervall-Typ" 
                  name="frequencyType" 
                  value={formData.frequencyType} 
                  onChange={handleChange}
                  options={['Täglich', 'Wöchentlich', 'Mehrfach täglich', '2-tägig', '3-tägig', 'Benutzerdefiniert']} 
                />
                {formData.frequencyType === 'Benutzerdefiniert' ? (
                  <FormInput 
                    label="Eigene Intervall-Beschreibung" 
                    name="frequencyCustom" 
                    value={formData.frequencyCustom} 
                    onChange={handleChange} 
                    placeholder="z.B. jeden 2. Donnerstag, nach Bedarf..."
                  />
                ) : <div />}
              </div>
            </div>

            {/* 5. Kompressionstherapie */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-4">
              <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                <h3 className="font-bold text-blue-800">Kompressionstherapie</h3>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                    <input 
                      type="radio" 
                      name="compressionActive" 
                      onChange={() => setFormData(p => ({ ...p, compressionActive: false }))} 
                      checked={!formData.compressionActive} 
                    />
                    <span>Nein</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                    <input 
                      type="radio" 
                      name="compressionActive" 
                      onChange={() => setFormData(p => ({ ...p, compressionActive: true }))} 
                      checked={formData.compressionActive} 
                    />
                    <span>Ja</span>
                  </label>
                </div>
              </div>

              {formData.compressionActive && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormSelect 
                      label="Kompressionsklasse/-art" 
                      name="compressionClass" 
                      value={formData.compressionClass} 
                      onChange={handleChange}
                      options={['Kurzzugbandage Klasse 1', 'Kurzzugbandage Klasse 2', 'Einmalsysteme', 'Andere']} 
                    />
                    
                    {(formData.compressionClass === 'Kurzzugbandage Klasse 1' || formData.compressionClass === 'Kurzzugbandage Klasse 2') && (
                      <div className="flex items-center pt-5">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            name="compressionUnterpolsterung"
                            checked={formData.compressionUnterpolsterung} 
                            onChange={(e) => setFormData(p => ({ ...p, compressionUnterpolsterung: e.target.checked }))}
                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-slate-700">Unterpolsterung aktivieren</span>
                        </label>
                      </div>
                    )}
                    
                    {formData.compressionClass === 'Einmalsysteme' && (
                      <FormSelect 
                        label="System auswählen" 
                        name="compressionEinmalSelect" 
                        value={formData.compressionEinmalSelect} 
                        onChange={handleChange}
                        options={['Rosidal 1 C', 'Pütter', 'Sonstiges']} 
                      />
                    )}
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {formData.compressionClass === 'Einmalsysteme' && formData.compressionEinmalSelect === 'Sonstiges' && (
                      <FormInput 
                        label="Eigenes Einmalsystem" 
                        name="compressionEinmalCustom" 
                        value={formData.compressionEinmalCustom} 
                        onChange={handleChange} 
                        placeholder="Namen des Systems eingeben..."
                      />
                    )}
                    
                    {formData.compressionClass === 'Andere' && (
                      <FormInput 
                        label="Eigene Kompressionstherapie" 
                        name="compressionAndereCustom" 
                        value={formData.compressionAndereCustom} 
                        onChange={handleChange} 
                        placeholder="Kompressionstherapie beschreiben..."
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default WoundAssessmentForm;
