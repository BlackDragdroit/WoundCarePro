import React from 'react';
import humanModel from '../assets/human_model.svg';

const BodyMap = ({ onLocationSelect, markers = [], selectedMarkerId }) => {
  const handleMapClick = (e) => {
    if (!onLocationSelect) return;
    
    // Get bounding rect of the container
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Pass only coordinates since we lost specific part detection
    onLocationSelect({ x, y });
  };

  return (
    <div className="relative w-full max-w-xs mx-auto bg-white border rounded-xl shadow-sm overflow-hidden select-none">
      <div 
        className="relative cursor-crosshair bg-slate-50"
        onClick={handleMapClick}
      >
        <img 
          src={humanModel} 
          alt="Körperkarte" 
          className="w-full h-auto drop-shadow-sm pointer-events-none"
        />

        {/* Wound Markers */}
        {markers.map((marker) => (
          <div
            key={marker.id}
            className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shadow-md transition-transform pointer-events-none ${
              selectedMarkerId === marker.id 
                ? 'bg-blue-600 border-white text-white scale-125 z-20' 
                : 'bg-red-500 border-white text-white z-10'
            }`}
            style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
          >
            {markers.indexOf(marker) + 1}
          </div>
        ))}
      </div>
      <div className="p-2 text-center text-xs text-slate-500 bg-slate-50 border-t">
        Körperregion antippen zum Markieren
      </div>
    </div>
  );
};

export default BodyMap;
