import React, { useState, useEffect, useMemo } from 'react';
import { RotateCw, Edit2, Check, Download, Trash2, X, Activity, Plus } from 'lucide-react';
import defaultRegions from '../assets/defaultBodyRegions.json';
import { getBodyPartFromCoords, getRegionFromCoords, isWoundInRegion } from '../utils/bodyPartMapper';
import { STATUS_COLORS, STATUS_TRANSLATION } from '../utils/constants';
import { BODY_MODELS_DATA } from './bodyModelsData';

const BodyMap = ({ 
  onLocationSelect, 
  markers = [], 
  selectedMarkerId, 
  onSelectMarker,
  initialGender = 'male'
}) => {
  const [view, setView] = useState('front'); // 'front' | 'back'
  const [gender, setGender] = useState(initialGender); // 'male' | 'female'
  const [selectedRegionId, setSelectedRegionId] = useState(null);
  const [hoveredZoneId, setHoveredZoneId] = useState(null);
  const [activePopoverRegion, setActivePopoverRegion] = useState(null);

  // Scalability / Size preference (compact: 350px, normal: 420px, large: 490px)
  const [scale, setScale] = useState(() => {
    return localStorage.getItem('woundCare_bodyMapScale') || 'normal';
  });

  const handleScaleChange = (newScale) => {
    setScale(newScale);
    localStorage.setItem('woundCare_bodyMapScale', newScale);
  };

  const heightClass = useMemo(() => {
    if (scale === 'compact') return 'h-[350px]';
    if (scale === 'large') return 'h-[490px]';
    return 'h-[420px]';
  }, [scale]);

  // === EDITOR STATE ===
  const [editMode, setEditMode] = useState(false);
  const [regions, setRegions] = useState([]);
  const [drawingRegion, setDrawingRegion] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Sync gender if initialGender changes (e.g. switching patient)
  useEffect(() => {
    if (initialGender) {
      setGender(initialGender);
    }
  }, [initialGender]);

  // Load regions from localStorage on mount, fallback to defaultRegions
  useEffect(() => {
    const saved = localStorage.getItem('woundCare_bodyRegions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const hasBack = Array.isArray(parsed) && parsed.some(r => r.view === 'back');
        if (!hasBack || parsed.length < defaultRegions.length) {
          setRegions(defaultRegions);
        } else {
          setRegions(parsed);
        }
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

  // Active SVG model data from pre-generated vector dataset
  const modelKey = `${gender}_${view}`;
  const modelData = useMemo(() => {
    return BODY_MODELS_DATA[modelKey] || BODY_MODELS_DATA.male_front;
  }, [modelKey]);

  // Filter markers for current view
  const visibleMarkers = useMemo(() => {
    return markers.filter(m => (m.view || 'front') === view);
  }, [markers, view]);

  // Map wounds to regions of the active model
  const woundsByRegion = useMemo(() => {
    const map = {};
    if (!modelData?.zoneRects) return map;

    for (const [zoneId, rect] of Object.entries(modelData.zoneRects)) {
      map[zoneId] = visibleMarkers.filter(m => {
        // Direct regionId match
        if (m.regionId && m.regionId === zoneId) return true;

        // Name match
        if (m.locationName && rect.name &&
            m.locationName.trim().toLowerCase() === rect.name.trim().toLowerCase()) {
          return true;
        }

        // Coordinate distance match
        if (typeof m.x === 'number' && typeof m.y === 'number') {
          const dist = Math.hypot(m.x - rect.cx, m.y - rect.cy);
          return dist <= 9;
        }

        return false;
      });
    }
    return map;
  }, [modelData, visibleMarkers]);

  // Determine active selected region ID (from direct click or active selected wound marker)
  const activeSelectedRegionId = useMemo(() => {
    if (selectedRegionId) return selectedRegionId;
    if (!selectedMarkerId) return null;

    if (modelData?.zoneRects) {
      for (const [zoneId] of Object.entries(modelData.zoneRects)) {
        if (woundsByRegion[zoneId]?.some(m => m.id === selectedMarkerId)) {
          return zoneId;
        }
      }
    }
    return null;
  }, [selectedRegionId, selectedMarkerId, modelData, woundsByRegion]);

  // Handle clicking on an anatomical region of the SVG
  const handleRegionClick = (zoneId, rect) => {
    if (editMode) return;

    setSelectedRegionId(zoneId);
    const regionWounds = woundsByRegion[zoneId] || [];

    if (regionWounds.length > 0) {
      // Area has wounds: toggle popover with list of wounds
      setActivePopoverRegion(prev => prev?.id === zoneId ? null : { id: zoneId, ...rect });
    } else {
      // Area has no wounds: close popover and trigger new wound creation for this region
      setActivePopoverRegion(null);
      if (onLocationSelect) {
        onLocationSelect({
          x: rect.cx,
          y: rect.cy,
          view,
          partName: rect.name,
          regionId: zoneId
        });
      }
    }
  };

  // === MOUSE HANDLERS FOR EDIT MODE ===
  const handleMouseDown = (e) => {
    if (!editMode) return;

    e.preventDefault();
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

    const dist = Math.hypot(currentX - drawingRegion.cx, currentY - drawingRegion.cy);
    setDrawingRegion(prev => ({ ...prev, r: dist }));
  };

  const handleMouseUp = () => {
    if (!isDrawing || !editMode) return;
    setIsDrawing(false);

    if (drawingRegion.r < 1) {
      setDrawingRegion(null);
      return;
    }

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

  const deleteRegion = (e, id) => {
    e.stopPropagation();
    if (window.confirm("Region löschen?")) {
      setRegions(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(regions, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "bodyRegions.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const toggleView = (e) => {
    e.stopPropagation();
    setView(v => v === 'front' ? 'back' : 'front');
    setSelectedRegionId(null);
    setActivePopoverRegion(null);
  };

  return (
    <div className="relative w-full mx-auto bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden select-none">
      
      {/* Top Left Controls: Gender Switch (Male / Female) & Active Region Badge */}
      <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 flex-wrap">
        {/* Gender Switch (Male / Female) */}
        <div className="flex bg-white/95 backdrop-blur-md rounded-lg shadow-sm border border-slate-200 p-0.5 text-xs font-semibold">
          <button
            onClick={(e) => { e.stopPropagation(); setGender('male'); }}
            className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 ${
              gender === 'male'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
            title="Männliches Körpermodell"
          >
            <span>♂</span>
            <span className="hidden sm:inline">Männlich</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setGender('female'); }}
            className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 ${
              gender === 'female'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
            title="Weibliches Körpermodell"
          >
            <span>♀</span>
            <span className="hidden sm:inline">Weiblich</span>
          </button>
        </div>

        {/* Selected Region / Editor Badge */}
        {activeSelectedRegionId && modelData?.zoneRects?.[activeSelectedRegionId] && (
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-[10px] font-bold shadow-xs border border-red-200 animate-in fade-in">
            {modelData.zoneRects[activeSelectedRegionId].name}
          </span>
        )}
        {editMode && (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold shadow-xs border border-blue-200">
            EDITOR
          </span>
        )}
      </div>

      {/* Top Right Controls Bar */}
      <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 flex-wrap justify-end">
        {/* View Toggle (Front / Back) */}
        <button 
          onClick={toggleView} 
          className="px-2 py-1 bg-white/95 backdrop-blur-md rounded-lg shadow-sm border border-slate-200 hover:bg-white text-slate-700 flex items-center gap-1 text-xs font-medium transition-colors" 
          title="Ansicht drehen"
        >
          <RotateCw size={13} className="text-blue-600" />
          <span className="hidden sm:inline">{view === 'front' ? 'Rückseite' : 'Vorderseite'}</span>
        </button>

        {/* Scale Toggle (S / M / L) */}
        <div className="flex bg-white/95 backdrop-blur-md rounded-lg shadow-sm border border-slate-200 p-0.5 text-xs font-semibold">
          <button
            onClick={(e) => { e.stopPropagation(); handleScaleChange('compact'); }}
            className={`px-1.5 py-0.5 rounded transition-all text-[10px] ${
              scale === 'compact' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Kompakt (350px Höhe)"
          >
            S
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleScaleChange('normal'); }}
            className={`px-1.5 py-0.5 rounded transition-all text-[10px] ${
              scale === 'normal' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Mittel (420px Höhe)"
          >
            M
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleScaleChange('large'); }}
            className={`px-1.5 py-0.5 rounded transition-all text-[10px] ${
              scale === 'large' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Groß (490px Höhe)"
          >
            L
          </button>
        </div>
        
        {/* Edit Button */}
        <button 
          onClick={() => {
            setEditMode(!editMode);
            setActivePopoverRegion(null);
          }} 
          className={`p-1.5 rounded-lg shadow-sm border transition-colors ${
            editMode 
              ? 'bg-blue-600 text-white border-blue-700' 
              : 'bg-white/95 text-slate-600 hover:bg-white border-slate-200'
          }`}
          title={editMode ? "Editor beenden" : "Regionen bearbeiten"}
        >
          {editMode ? <Check size={14} /> : <Edit2 size={14} />}
        </button>

        {/* Export Button (Only in Edit Mode) */}
        {editMode && (
          <button 
            onClick={handleExport} 
            className="p-1.5 bg-white/95 backdrop-blur-md rounded-lg shadow-sm border border-slate-200 hover:bg-white text-slate-600" 
            title="Konfiguration speichern"
          >
            <Download size={14} />
          </button>
        )}
      </div>

      {/* Main Interactive Canvas */}
      <div 
        className="relative bg-slate-50 flex items-center justify-center pt-12 pb-3 px-3 min-h-[380px]"
        onClick={() => {
          if (!editMode) {
            setSelectedRegionId(null);
            setActivePopoverRegion(null);
          }
        }}
      >
        {/* Figure Wrapper - bounds match the SVG exactly */}
        <div 
          className={`relative w-fit mx-auto ${editMode ? 'cursor-crosshair' : 'cursor-default'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Native Inline Interactive SVG Model */}
          <svg
            viewBox={modelData.viewBox}
            className={`${heightClass} w-auto max-w-full drop-shadow-sm select-none transition-all duration-300 block`}
            style={{ overflow: 'visible' }}
          >
            <defs>
              {/* WoundCarePro Signature Medical Body Gradient */}
              <linearGradient id={`bodyGrad_${modelKey}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#eff6ff" />
                <stop offset="45%" stopColor="#dbeafe" />
                <stop offset="85%" stopColor="#bfdbfe" />
                <stop offset="100%" stopColor="#93c5fd" />
              </linearGradient>

              {/* Selected Anatomical Region Gradient (Red Highlight) */}
              <linearGradient id={`selectedGrad_${modelKey}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>

              {/* Region With Wounds Gradient (WoundCarePro Signature Medical Blue) */}
              <linearGradient id={`woundGrad_${modelKey}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>

              {/* ClipPaths for all anatomical body regions */}
              {Object.entries(modelData.zoneRects).map(([zoneId, rect]) => (
                <clipPath key={zoneId} id={`clip-${modelKey}-${zoneId}`}>
                  <rect x={rect.rx} y={rect.ry} width={rect.rw} height={rect.rh} />
                </clipPath>
              ))}
            </defs>

            {/* LAYER 1: Interactive Anatomical Body Regions */}
            <g id={`body-regions-${modelKey}`}>
              {Object.entries(modelData.zoneRects).map(([zoneId, rect]) => {
                const regionWounds = woundsByRegion[zoneId] || [];
                const hasWounds = regionWounds.length > 0;
                const isSelected = activeSelectedRegionId === zoneId;
                const isHovered = hoveredZoneId === zoneId;

                let fill = `url(#bodyGrad_${modelKey})`;
                let stroke = "none";
                let strokeWidth = 0;

                if (isSelected) {
                  // Marked in vivid RED as requested!
                  fill = `url(#selectedGrad_${modelKey})`;
                  stroke = "#b91c1c";
                  strokeWidth = 2;
                } else if (hasWounds) {
                  // Marked in characteristic WoundCarePro blue!
                  fill = `url(#woundGrad_${modelKey})`;
                  stroke = "#1d4ed8";
                  strokeWidth = 1.5;
                } else if (isHovered) {
                  // Interactive hover highlight
                  fill = "#93c5fd";
                  stroke = "#3b82f6";
                  strokeWidth = 1;
                }

                return (
                  <path
                    key={zoneId}
                    id={`region-${modelKey}-${zoneId}`}
                    d={modelData.silhouetteD}
                    clipPath={`url(#clip-${modelKey}-${zoneId})`}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    className="cursor-pointer transition-colors duration-150"
                    onMouseEnter={() => setHoveredZoneId(zoneId)}
                    onMouseLeave={() => setHoveredZoneId(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRegionClick(zoneId, rect);
                    }}
                  >
                    <title>
                      {rect.name}{hasWounds ? ` (${regionWounds.length} Wunde${regionWounds.length > 1 ? 'n' : ''})` : ''}
                    </title>
                  </path>
                );
              })}
            </g>

            {/* LAYER 2: Anatomical Contour Lines (Remain Crisp Jet Black) */}
            <g className="pointer-events-none select-none" fill="#0f172a">
              {modelData.contourPaths.map((p, idx) => (
                <path 
                  key={idx} 
                  d={p.d} 
                  fillRule={p.evenOdd ? 'evenodd' : undefined} 
                />
              ))}
            </g>

            {/* LAYER 3: Wound Count Badges at region center (cx, cy) */}
            {!editMode && Object.entries(modelData.zoneRects).map(([zoneId, rect]) => {
              const regionWounds = woundsByRegion[zoneId] || [];
              if (regionWounds.length === 0) return null;

              const isSelected = activeSelectedRegionId === zoneId;
              const badgeX = (rect.cx / 100) * modelData.w;
              const badgeY = (rect.cy / 100) * modelData.h;
              const count = regionWounds.length;

              return (
                <g 
                  key={`badge-${zoneId}`} 
                  transform={`translate(${badgeX}, ${badgeY})`}
                  className="cursor-pointer pointer-events-auto transition-transform hover:scale-110"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRegionClick(zoneId, rect);
                  }}
                >
                  <circle 
                    r={22} 
                    fill={isSelected ? "#ef4444" : "#2563eb"} 
                    stroke="#ffffff" 
                    strokeWidth={3} 
                    className="filter drop-shadow-md"
                  />
                  <text 
                    textAnchor="middle" 
                    dy="5.5" 
                    fill="#ffffff" 
                    fontSize="16" 
                    fontWeight="bold" 
                    fontFamily="system-ui, -apple-system, sans-serif"
                    className="select-none pointer-events-none"
                  >
                    {count}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* EDIT MODE: Render Custom Regions */}
          {editMode && regions.filter(r => (r.view || 'front') === view).map(params => (
            <div
              key={params.id}
              className="absolute border-2 border-blue-500 bg-blue-500/20 rounded-full group hover:bg-blue-500/40 z-10 transition-colors"
              style={{
                left: `${params.cx - params.r}%`,
                top: `${params.cy - params.r}%`,
                width: `${params.r * 2}%`,
                height: `${params.r * 2}%`
              }}
              title={params.name}
            >
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900/80 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                {params.name}
              </span>
              
              <button 
                onClick={(e) => deleteRegion(e, params.id)}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 hover:scale-110 transition-all shadow"
                title="Löschen"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          
          {/* Active Drawing in Edit Mode */}
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

          {/* Interactive Info Popover on pressing a region with wounds */}
          {activePopoverRegion && !editMode && (
            <div 
              className="absolute z-50 bg-white rounded-xl shadow-2xl border border-slate-200 p-3 max-w-xs w-64 animate-in fade-in zoom-in-95"
              style={{
                left: `${Math.min(Math.max(activePopoverRegion.cx, 25), 75)}%`,
                top: `${Math.min(Math.max(activePopoverRegion.cy + 6, 12), 75)}%`,
                transform: 'translate(-50%, 0)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-100">
                <div>
                  <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    {activePopoverRegion.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {(woundsByRegion[activePopoverRegion.id] || []).length} {
                      (woundsByRegion[activePopoverRegion.id] || []).length === 1 ? 'Wunde erfasst' : 'Wunden erfasst'
                    }
                  </p>
                </div>
                <button 
                  onClick={() => setActivePopoverRegion(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {/* List of wounds in this region */}
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {(woundsByRegion[activePopoverRegion.id] || []).map((w) => (
                  <div
                    key={w.id}
                    onClick={() => {
                      if (onSelectMarker) onSelectMarker(w);
                      setSelectedRegionId(activePopoverRegion.id);
                    }}
                    className={`p-2 rounded-lg border text-xs cursor-pointer flex justify-between items-center transition-all ${
                      selectedMarkerId === w.id 
                        ? 'bg-red-50 border-red-300 text-red-900 font-semibold' 
                        : 'bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="truncate pr-1">#{markers.indexOf(w) + 1} {w.locationName}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${STATUS_COLORS[w.status] || 'bg-slate-100'}`}>
                      {STATUS_TRANSLATION[w.status] || w.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action: Add new wound to this region */}
              <button
                onClick={() => {
                  setActivePopoverRegion(null);
                  if (onLocationSelect) {
                    onLocationSelect({
                      x: activePopoverRegion.cx,
                      y: activePopoverRegion.cy,
                      view,
                      partName: activePopoverRegion.name,
                      regionId: activePopoverRegion.id
                    });
                  }
                }}
                className="mt-2 w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 shadow-sm transition-colors"
              >
                <Plus size={13} />
                Weitere Wunde erfassen
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom Info Bar / Legend */}
      <div className="px-3 py-2 text-center text-xs text-slate-600 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        {editMode ? (
          <span className="text-blue-700 font-medium">Ziehen zum Erstellen von neuen Regionen</span>
        ) : (
          <>
            <span className="flex items-center gap-1.5 text-slate-500">
              Körperregion antippen zum Erfassen &amp; Auswählen
            </span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                Bereich mit Wunde(n)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                Ausgewählte Region
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BodyMap;
