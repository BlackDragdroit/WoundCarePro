import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { RotateCw, Plus, X, MapPin } from 'lucide-react';
import { BODY_REGIONS_FRONT, BODY_REGIONS_BACK } from './bodyRegionsData';
import {
  MALE_FRONT_BASE,
  MALE_FRONT_ROT,
  MALE_FRONT_BLAU,
  MALE_BACK_BASE,
  MALE_BACK_ROT,
  MALE_BACK_BLAU
} from './BodyMapSvgSource';
import { getRegionSlugForWound } from '../utils/bodyPartMapper';
import { STATUS_COLORS, STATUS_TRANSLATION } from '../utils/constants';
import './BodyMap.css';

const BodyMap = ({ 
  onLocationSelect, 
  markers = [], 
  selectedMarkerId, 
  onSelectMarker
}) => {
  const [view, setView] = useState('front'); // 'front' | 'back'
  const [selectedRegionId, setSelectedRegionId] = useState(null);
  const [hoveredRegion, setHoveredRegion] = useState(null); // { slug, name }
  const [activePopover, setActivePopover] = useState(null); // { slug, name, wounds, center }

  // Scalability / Size preference (compact: 350px, normal: 420px, large: 490px)
  const [scale, setScale] = useState(() => {
    return localStorage.getItem('woundCare_bodyMapScale') || 'normal';
  });

  const handleScaleChange = (newScale) => {
    setScale(newScale);
    localStorage.setItem('woundCare_bodyMapScale', newScale);
  };

  const currentHeight = useMemo(() => {
    if (scale === 'compact') return 360;
    if (scale === 'large') return 510;
    return 430;
  }, [scale]);

  // Dimension & Aspect Ratios
  // Front: 697 x 1759 -> ~0.396
  // Back:  683 x 1744 -> ~0.392
  const aspectRatio = view === 'front' ? 697 / 1759 : 683 / 1744;
  const currentWidth = Math.round(currentHeight * aspectRatio);

  // Active region definitions for the current view
  const activeRegionsData = useMemo(() => {
    return view === 'front' ? BODY_REGIONS_FRONT : BODY_REGIONS_BACK;
  }, [view]);

  // Map wounds to regions of current view
  const woundsByRegion = useMemo(() => {
    const map = {};
    for (const slug of Object.keys(activeRegionsData)) {
      map[slug] = [];
    }

    const currentViewWounds = markers.filter(m => (m.view || 'front') === view);

    for (const wound of currentViewWounds) {
      const slug = getRegionSlugForWound(wound, view);
      if (slug && map[slug]) {
        map[slug].push(wound);
      }
    }
    return map;
  }, [markers, view, activeRegionsData]);

  // List of slugs that currently have wounds
  const slugsWithWounds = useMemo(() => {
    return Object.keys(woundsByRegion).filter(slug => woundsByRegion[slug].length > 0);
  }, [woundsByRegion]);

  // If selectedMarkerId is given externally, find its region (only on matching view)
  const markerSelectedRegionId = useMemo(() => {
    if (!selectedMarkerId) return null;
    const selectedMarker = markers.find(m => m.id === selectedMarkerId);
    if (!selectedMarker) return null;
    const markerView = selectedMarker.view || 'front';
    if (markerView !== view) return null;
    return getRegionSlugForWound(selectedMarker, markerView);
  }, [selectedMarkerId, markers, view]);

  // Track previous selected marker to only switch view when a new wound is selected,
  // NOT when the user manually toggles the view.
  const prevSelectedMarkerIdRef = useRef(selectedMarkerId);
  useEffect(() => {
    if (selectedMarkerId && selectedMarkerId !== prevSelectedMarkerIdRef.current) {
      const marker = markers.find(m => m.id === selectedMarkerId);
      if (marker?.view) {
        setView(marker.view);
      }
    }
    prevSelectedMarkerIdRef.current = selectedMarkerId;
  }, [selectedMarkerId, markers]);

  // Effective selected region ID
  const activeSelectedRegionId = selectedRegionId || markerSelectedRegionId;

  // DOM Refs for direct SVG manipulation
  const mapContainerRef = useRef(null);
  const baseRef = useRef(null);
  const rotRef = useRef(null);
  const blauRef = useRef(null);

  // SVGs for the current view
  const baseSvgHtml = view === 'front' ? MALE_FRONT_BASE : MALE_BACK_BASE;
  const rotSvgHtml = view === 'front' ? MALE_FRONT_ROT : MALE_BACK_ROT;
  const blauSvgHtml = view === 'front' ? MALE_FRONT_BLAU : MALE_BACK_BLAU;

  // Helper: toggle visibility of region group in an overlay
  const showOverlayRegion = (overlayEl, slug, isActive) => {
    if (!overlayEl || !slug) return;
    overlayEl.querySelectorAll(`.region[data-region="${slug}"]`).forEach(g => {
      g.classList.toggle('is-active', Boolean(isActive));
    });
  };

  // Sync Red Overlay (Info / Wounds present)
  useLayoutEffect(() => {
    if (!rotRef.current) return;
    rotRef.current.querySelectorAll('.region').forEach(g => {
      const slug = g.dataset.region;
      const hasWounds = slugsWithWounds.includes(slug);
      g.classList.toggle('is-active', hasWounds);
    });
  }, [slugsWithWounds, view, rotSvgHtml]);

  // Sync Blue Overlay (Selection & Hover)
  useLayoutEffect(() => {
    if (!blauRef.current) return;
    blauRef.current.querySelectorAll('.region').forEach(g => {
      const slug = g.dataset.region;
      const isSelected = slug === activeSelectedRegionId;
      const isHovered = slug === hoveredRegion?.slug;
      g.classList.toggle('is-active', Boolean(isSelected || isHovered));
    });
  }, [activeSelectedRegionId, hoveredRegion, view, blauSvgHtml]);

  // Toggle View Handler
  const toggleView = (e) => {
    e.stopPropagation();
    setView(v => v === 'front' ? 'back' : 'front');
    setSelectedRegionId(null);
    setHoveredRegion(null);
    setActivePopover(null);
  };

  // Hit-testing Event Handlers
  const handlePointerOver = (e) => {
    const regionEl = e.target.closest('[data-region]');
    if (!regionEl) return;
    const slug = regionEl.dataset.region;
    const name = regionEl.dataset.name;
    if (!slug) return;

    // Prevent re-trigger / flickering when moving across adjacent paths of the same region
    const fromSlug = e.relatedTarget?.closest?.('[data-region]')?.dataset.region;
    if (fromSlug === slug) return;

    setHoveredRegion({ slug, name });

    // Instantly highlight in blue overlay for zero-latency response
    showOverlayRegion(blauRef.current, slug, true);
  };

  const handlePointerOut = (e) => {
    const regionEl = e.target.closest('[data-region]');
    if (!regionEl) return;
    const slug = regionEl.dataset.region;
    if (!slug) return;

    // Prevent re-trigger / flickering when moving across adjacent paths of the same region
    const toSlug = e.relatedTarget?.closest?.('[data-region]')?.dataset.region;
    if (toSlug === slug) return;

    setHoveredRegion(null);

    // Turn off blue overlay unless this region is actively selected
    if (slug !== activeSelectedRegionId) {
      showOverlayRegion(blauRef.current, slug, false);
    }
  };

  const handleRegionSelect = (slug, name, clientCoords) => {
    setSelectedRegionId(slug);
    const regionWounds = woundsByRegion[slug] || [];
    const meta = activeRegionsData[slug];

    if (regionWounds.length > 0) {
      // Area has wounds: toggle interactive popover
      setActivePopover(prev => (prev?.slug === slug ? null : {
        slug,
        name,
        wounds: regionWounds,
        center: meta?.center || { pctX: 50, pctY: 50 }
      }));
    } else {
      // Area has no wounds: close popover and trigger new wound creation modal
      setActivePopover(null);
      if (onLocationSelect) {
        onLocationSelect({
          x: clientCoords?.pctX ?? meta?.center?.pctX ?? 50,
          y: clientCoords?.pctY ?? meta?.center?.pctY ?? 50,
          view,
          partName: name || meta?.name || slug,
          regionId: slug
        });
      }
    }
  };

  const handleMapClick = (e) => {
    // If click was inside the popover card, ignore
    if (e.target.closest('.wound-popover')) return;

    const regionEl = e.target.closest('[data-region]');
    if (!regionEl) {
      // Clicked outside any region -> clear selection & close popover
      setSelectedRegionId(null);
      setActivePopover(null);
      return;
    }

    const slug = regionEl.dataset.region;
    const name = regionEl.dataset.name;
    if (!slug) return;

    // Calculate click coordinates in percent (0-100%)
    let clientCoords = null;
    if (mapContainerRef.current) {
      const rect = mapContainerRef.current.getBoundingClientRect();
      const pctX = Math.round(((e.clientX - rect.left) / rect.width) * 100);
      const pctY = Math.round(((e.clientY - rect.top) / rect.height) * 100);
      clientCoords = { pctX, pctY };
    }

    handleRegionSelect(slug, name, clientCoords);
  };

  // Determine active region name for the top badge
  const activeRegionName = useMemo(() => {
    if (hoveredRegion?.name) {
      const woundCount = (woundsByRegion[hoveredRegion.slug] || []).length;
      return `${hoveredRegion.name}${woundCount > 0 ? ` (${woundCount} Wunde${woundCount > 1 ? 'n' : ''})` : ''}`;
    }
    if (activeSelectedRegionId && activeRegionsData[activeSelectedRegionId]) {
      const woundCount = (woundsByRegion[activeSelectedRegionId] || []).length;
      return `${activeRegionsData[activeSelectedRegionId].name}${woundCount > 0 ? ` (${woundCount} Wunde${woundCount > 1 ? 'n' : ''})` : ''}`;
    }
    return null;
  }, [hoveredRegion, activeSelectedRegionId, activeRegionsData, woundsByRegion]);

  return (
    <div className="relative w-full mx-auto bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden select-none">
      
      {/* Top Left Controls: View Label & Active Region Badge */}
      <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 flex-wrap pointer-events-none">
        <span className="px-2 py-1 bg-white/95 backdrop-blur-md rounded-lg shadow-sm border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          {view === 'front' ? 'Vorderansicht' : 'Rückansicht'}
        </span>

        {/* Dynamic Hover / Selected Region Badge */}
        {activeRegionName && (
          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold shadow-xs border border-blue-200 animate-in fade-in transition-all">
            {activeRegionName}
          </span>
        )}
      </div>

      {/* Top Right Controls Bar */}
      <div className="absolute top-2.5 right-2.5 z-30 flex items-center gap-1.5 flex-wrap justify-end pointer-events-auto">
        {/* View Toggle (Front / Back) */}
        <button 
          type="button"
          onClick={toggleView} 
          className="px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-lg shadow-sm border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer" 
          title="Ansicht drehen (Vorderseite / Rückseite)"
        >
          <RotateCw size={13} className="text-blue-600" />
          <span>{view === 'front' ? 'Rückseite' : 'Vorderseite'}</span>
        </button>

        {/* Scale Toggle (S / M / L) */}
        <div className="flex bg-white/95 backdrop-blur-md rounded-lg shadow-sm border border-slate-200 p-0.5 text-xs font-semibold">
          <button
            onClick={(e) => { e.stopPropagation(); handleScaleChange('compact'); }}
            className={`px-1.5 py-0.5 rounded transition-all text-[10px] ${
              scale === 'compact' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Kompakt (360px Höhe)"
          >
            S
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleScaleChange('normal'); }}
            className={`px-1.5 py-0.5 rounded transition-all text-[10px] ${
              scale === 'normal' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Mittel (430px Höhe)"
          >
            M
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleScaleChange('large'); }}
            className={`px-1.5 py-0.5 rounded transition-all text-[10px] ${
              scale === 'large' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Groß (510px Höhe)"
          >
            L
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas */}
      <div 
        className="bodymap-wrapper bg-slate-50 pt-12 pb-4 px-4 min-h-[400px]"
        onClick={() => {
          setSelectedRegionId(null);
          setActivePopover(null);
        }}
      >
        {/* Figure Container - Dimensions match the SVG aspect ratio perfectly */}
        <div 
          ref={mapContainerRef}
          className="bodymap relative cursor-default drop-shadow-sm select-none"
          style={{ 
            height: `${currentHeight}px`, 
            width: `${currentWidth}px` 
          }}
          onClick={handleMapClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          {/* Layer 1: Base SVG (Silhouette & Contours & Region Hit Areas) */}
          <div 
            ref={baseRef}
            className="base-layer w-full h-full"
            dangerouslySetInnerHTML={{ __html: baseSvgHtml }}
          />

          {/* Layer 2: Red Overlay ("Info vorhanden" - Regions with wounds) */}
          <div 
            ref={rotRef}
            className="ov-layer ov-rot-layer absolute inset-0 pointer-events-none w-full h-full"
            dangerouslySetInnerHTML={{ __html: rotSvgHtml }}
          />

          {/* Layer 3: Blue Overlay (Hover / Selection) */}
          <div 
            ref={blauRef}
            className="ov-layer ov-blau-layer absolute inset-0 pointer-events-none w-full h-full"
            dangerouslySetInnerHTML={{ __html: blauSvgHtml }}
          />

          {/* Layer 4: Wound Count Badges on Regions With Wounds */}
          {slugsWithWounds.map(slug => {
            const meta = activeRegionsData[slug];
            if (!meta?.center) return null;
            const count = (woundsByRegion[slug] || []).length;
            const isSelected = activeSelectedRegionId === slug;

            return (
              <div
                key={`badge-${slug}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRegionSelect(slug, meta.name);
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[10px] font-bold shadow-md cursor-pointer transition-transform hover:scale-125 ${
                  isSelected 
                    ? 'bg-blue-600 text-white ring-2 ring-white ring-offset-1' 
                    : 'bg-red-600 text-white ring-2 ring-white ring-offset-1'
                }`}
                style={{
                  left: `${meta.center.pctX}%`,
                  top: `${meta.center.pctY}%`
                }}
                title={`${meta.name}: ${count} Wunde${count > 1 ? 'n' : ''}`}
              >
                {count}
              </div>
            );
          })}

          {/* Layer 5: Interactive Wound Popover Card */}
          {activePopover && (
            <div 
              className="wound-popover absolute z-50 bg-white rounded-xl shadow-2xl border border-slate-200 p-3 max-w-xs w-64 animate-in fade-in zoom-in-95 pointer-events-auto"
              style={{
                left: `${Math.min(Math.max(activePopover.center.pctX, 26), 74)}%`,
                top: `${Math.min(Math.max(activePopover.center.pctY + 4, 10), 75)}%`,
                transform: 'translate(-50%, 0)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-100">
                <div>
                  <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    {activePopover.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {activePopover.wounds.length} {
                      activePopover.wounds.length === 1 ? 'Wunde erfasst' : 'Wunden erfasst'
                    }
                  </p>
                </div>
                <button 
                  onClick={() => setActivePopover(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  title="Schließen"
                >
                  <X size={14} />
                </button>
              </div>

              {/* List of wounds in this region */}
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {activePopover.wounds.map((w) => (
                  <div
                    key={w.id}
                    onClick={() => {
                      if (onSelectMarker) onSelectMarker(w);
                      setSelectedRegionId(activePopover.slug);
                    }}
                    className={`p-2 rounded-lg border text-xs cursor-pointer flex justify-between items-center transition-all ${
                      selectedMarkerId === w.id 
                        ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold shadow-xs' 
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
                  setActivePopover(null);
                  if (onLocationSelect) {
                    onLocationSelect({
                      x: activePopover.center.pctX,
                      y: activePopover.center.pctY,
                      view,
                      partName: activePopover.name,
                      regionId: activePopover.slug
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
        <span className="flex items-center gap-1.5 text-slate-500">
          Körperregion antippen zum Erfassen &amp; Auswählen
        </span>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            Region mit Wunde(n)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            Auswahl / Hover
          </span>
        </div>
      </div>
    </div>
  );
};

export default BodyMap;
