
import React, { useState, useEffect, useRef } from 'react';
import { RotateCw, Edit2, Check, Download, Trash2, X } from 'lucide-react';
import humanModelFront from '../assets/Human_Muscle_Front.svg';
import humanModelBack from '../assets/Human_Muscle_Back.svg';
import defaultRegions from '../assets/defaultBodyRegions.json';
import { getBodyPartFromCoords } from '../utils/bodyPartMapper';

const BodyMap = ({ onLocationSelect, markers = [], selectedMarkerId }) => {
  const [view, setView] = useState('front'); // 'front' | 'back'
  
  // === EDITOR STATE ===
  const [editMode, setEditMode] = useState(false);
  const [regions, setRegions] = useState([]);
  const [drawingRegion, setDrawingRegion] = useState(null); // { cx, cy, r }
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Load regions from localStorage on mount, fallback to defaultRegions
  useEffect(() => {
    const saved = localStorage.getItem('woundCare_bodyRegions');
    if (saved) {
      try {
        setRegions(JSON.parse(saved));
      } catch (e) { 
        console.error("Failed to load regions", e);
        setRegions(defaultRegions);
      }
    } else {
      setRegions(defaultRegions);
    }
  }, []);

  // Save regions to localStorage whenever they change
  useEffect(() => {
    if (regions.length > 0) {
      localStorage.setItem('woundCare_bodyRegions', JSON.stringify(regions));
    }
  }, [regions]);

  // === MOUSE HANDLERS FOR DRAWING ===
  const handleMouseDown = (e) => {
    if (!editMode) {
      // NORMAL MODE: Handle Selection
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      // Use the regions for detection
      const partName = getBodyPartFromCoords(x, y, view, regions);
      
      // If no part found in custom regions, maybe fallback? 
      // For now, if no regions defined, partName is null.
      
      if (onLocationSelect) {
        onLocationSelect({ x, y, view, partName: partName || "Unbekannt" });
      }
      return;
    }

    // EDIT MODE: Start Drawing
    e.preventDefault(); // prevent text selection
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width) * 100;
    const cy = ((e.clientY - rect.top) / rect.height) * 100;
    
    setIsDrawing(true);
    setDrawingRegion({ cx, cy, r: 0, view });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !editMode) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = ((e.clientX - rect.left) / rect.width) * 100;
    const currentY = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Calculate radius (distance from center)
    const dist = Math.hypot(currentX - drawingRegion.cx, currentY - drawingRegion.cy);
    
    setDrawingRegion(prev => ({ ...prev, r: dist }));
  };

  const handleMouseUp = (e) => {
    if (!isDrawing || !editMode) return;
    setIsDrawing(false);
    
    // If radius is too small, ignore (accidental click)
    if (drawingRegion.r < 1) {
      setDrawingRegion(null);
      return;
    }

    // Prompt for Name
    // Using simple browser prompt for speed - can replace with modal later
    const name = window.prompt("Name der Körperregion:", "Neue Region");
    
    if (name) {
      const newRegion = {
        id: Date.now().toString(),
        name,
        view: drawingRegion.view,
        cx: drawingRegion.cx,
        cy: drawingRegion.cy,
        r: drawingRegion.r,
        type: 'circle'
      };
      setRegions(prev => [...prev, newRegion]);
    }
    
    setDrawingRegion(null);
  };

  // Delete a region
  const deleteRegion = (e, id) => {
    e.stopPropagation();
    if (window.confirm("Region löschen?")) {
      setRegions(prev => prev.filter(r => r.id !== id));
    }
  };

  // Export JSON
  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(regions, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "bodyRegions.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };
  
  const toggleView = (e) => {
    e.stopPropagation();
    setView(v => v === 'front' ? 'back' : 'front');
  };

  // Filter markers and regions for current view
  const visibleMarkers = markers.filter(m => (m.view || 'front') === view);
  const visibleRegions = regions.filter(r => r.view === view);

  return (
    <div className="relative w-full mx-auto bg-white border rounded-xl shadow-sm overflow-hidden select-none">
      
      {/* Top Controls */}
      <div className="absolute top-2 right-2 z-20 flex gap-2">
        {/* Toggle View */}
        <button onClick={toggleView} className="p-1.5 bg-white/90 backdrop-blur rounded shadow border hover:bg-white text-slate-600" title="Ansicht drehen">
          <RotateCw size={16} />
        </button>
        
        {/* Edit Button */}
        <button 
           onClick={() => setEditMode(!editMode)} 
           className={`p-1.5 rounded shadow border transition-colors ${editMode ? 'bg-blue-600 text-white border-blue-700' : 'bg-white/90 text-slate-600 hover:bg-white'}`}
           title={editMode ? "Editor beenden" : "Regionen bearbeiten"}
        >
          {editMode ? <Check size={16} /> : <Edit2 size={16} />}
        </button>

        {/* Export Button (Only in Edit Mode) */}
        {editMode && (
          <button onClick={handleExport} className="p-1.5 bg-white/90 backdrop-blur rounded shadow border hover:bg-white text-slate-600" title="Konfiguration speichern">
            <Download size={16} />
          </button>
        )}
      </div>
       
      <div className="absolute top-2 left-2 z-10 pointer-events-none">
        <span className="px-2 py-1 bg-white/80 backdrop-blur rounded text-[10px] font-bold text-slate-500 uppercase shadow-sm border mr-2">
          {view === 'front' ? 'Vorderseite' : 'Rückseite'}
        </span>
        {editMode && (
           <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-[10px] font-bold shadow-sm border border-blue-200">
             EDITOR AKTIV
           </span>
        )}
      </div>

      <div 
        className={`relative bg-slate-50 ${editMode ? 'cursor-crosshair' : 'cursor-default'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp} // Stop drawing if leaving area
      >
        <img 
          src={view === 'front' ? humanModelFront : humanModelBack} 
          alt={view === 'front' ? "Körper Vorderseite" : "Körper Rückseite"} 
          className="w-full h-auto drop-shadow-sm pointer-events-none"
          draggable={false}
        />
        
        {/* Render Regions (Edit Mode) */}
        {editMode && visibleRegions.map(params => (
           <div
             key={params.id}
             className="absolute border-2 border-blue-500 bg-blue-500/20 rounded-full group hover:bg-blue-500/40 z-10 transition-colors"
             style={{
               left: `${params.cx - params.r}%`,
               top: `${params.cy - params.r}%`,
               width: `${params.r * 2}%`,
               height: `${params.r * 2}%` // Assuming square container aspect ratio approx?? 
               // Issue: calculated radius is %, relying on width. If height != width, standard circle in % might look oval.
               // For now assuming Aspect Ratio is handled by img being responsive but relative container. 
               // Actually css aspect-ratio: 1/1 on the circle div helps if container isn't square? 
               // Let's rely on simple % for now. SVG is usually square-ish.
             }}
             title={params.name}
           >
             {/* Label on Hover */}
             <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
               {params.name}
             </span>
             
             {/* Delete Button */}
             <button 
               onClick={(e) => deleteRegion(e, params.id)}
               className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 hover:scale-110 transition-all"
               title="Löschen"
             >
               <X size={12} />
             </button>
           </div>
        ))}
        
        {/* Render Active Drawing */}
        {drawingRegion && (
           <div
             className="absolute border-2 border-red-500 bg-red-500/20 rounded-full z-20 pointer-events-none"
             style={{
               left: `${drawingRegion.cx - drawingRegion.r}%`,
               top: `${drawingRegion.cy - drawingRegion.r}%`,
               width: `${drawingRegion.r * 2}%`,
               height: `${drawingRegion.r * 2}%`
             }}
           />
        )}

        {/* Wound Markers (Normal Mode only? Or always?) Let's show them but below Edit UI */}
        {!editMode && visibleMarkers.map((marker) => (
          <div
            key={marker.id}
            className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shadow-md pointer-events-none z-10 ${
              selectedMarkerId === marker.id 
                ? 'bg-blue-600 border-white text-white scale-125' 
                : 'bg-red-500 border-white text-white'
            }`}
            style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
          >
            {markers.indexOf(marker) + 1}
          </div>
        ))}
      </div>
      
      <div className="p-2 text-center text-xs text-slate-500 bg-slate-50 border-t">
        {editMode ? "Ziehen zum Erstellen von Regionen" : "Körperregion antippen zum Markieren"}
      </div>
    </div>
  );
};

export default BodyMap;
