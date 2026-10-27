import { BODY_REGIONS_FRONT, BODY_REGIONS_BACK, LEGACY_REGION_MAP } from '../components/bodyRegionsData';

/**
 * Determines the anatomical region slug for a given wound marker.
 * Supports:
 * 1. Direct slug match (e.g. 'vorderer_rechter_oberarm')
 * 2. Legacy regionId mapping (e.g. 'chest_left' -> 'rechte_brust')
 * 3. LocationName text matching (e.g. 'Rechter Oberarm' -> 'vorderer_rechter_oberarm')
 * 4. Coordinate proximity check (cx, cy distance)
 *
 * @param {Object} marker - Wound object { regionId, locationName, x, y, view }
 * @param {string} view - 'front' | 'back'
 * @returns {string|null} - Matching region slug or null
 */
export function getRegionSlugForWound(marker, view = 'front') {
  if (!marker) return null;
  const markerView = marker.view || view || 'front';
  const regions = markerView === 'front' ? BODY_REGIONS_FRONT : BODY_REGIONS_BACK;

  // 1. Direct match on new slug
  if (marker.regionId && regions[marker.regionId]) {
    return marker.regionId;
  }

  // 2. Legacy region ID mapping
  if (marker.regionId && LEGACY_REGION_MAP[marker.regionId]) {
    const mappedSlug = LEGACY_REGION_MAP[marker.regionId];
    if (regions[mappedSlug]) {
      return mappedSlug;
    }
  }

  // 3. Location name matching
  if (marker.locationName) {
    const cleanLocation = marker.locationName.trim().toLowerCase();
    
    // Exact name match
    for (const [slug, reg] of Object.entries(regions)) {
      if (cleanLocation === reg.name.toLowerCase()) {
        return slug;
      }
    }
    
    // Substring / partial match
    for (const [slug, reg] of Object.entries(regions)) {
      const regName = reg.name.toLowerCase();
      if (cleanLocation.includes(regName) || regName.includes(cleanLocation)) {
        return slug;
      }
    }
  }

  // 4. Coordinate distance matching (pctX, pctY)
  if (typeof marker.x === 'number' && typeof marker.y === 'number') {
    let closestSlug = null;
    let minDist = Infinity;

    for (const [slug, reg] of Object.entries(regions)) {
      const dist = Math.hypot(marker.x - reg.center.pctX, marker.y - reg.center.pctY);
      if (dist < minDist) {
        minDist = dist;
        closestSlug = slug;
      }
    }

    // Accept within reasonable anatomical proximity (e.g. 18% of body height)
    if (minDist <= 18) {
      return closestSlug;
    }
  }

  return null;
}

/**
 * Checks whether a wound marker belongs to a specific body region slug
 */
export function isWoundInRegion(marker, regionSlug, view = 'front') {
  if (!marker || !regionSlug) return false;
  const markerView = marker.view || 'front';
  if (markerView !== view) return false;
  
  const resolvedSlug = getRegionSlugForWound(marker, view);
  return resolvedSlug === regionSlug;
}

/**
 * Gets the German display name for a given region slug and view
 */
export function getRegionName(slug, view = 'front') {
  const regions = view === 'front' ? BODY_REGIONS_FRONT : BODY_REGIONS_BACK;
  return regions[slug]?.name || slug;
}

/**
 * Gets region metadata (center, name, bbox)
 */
export function getRegionMeta(slug, view = 'front') {
  const regions = view === 'front' ? BODY_REGIONS_FRONT : BODY_REGIONS_BACK;
  return regions[slug] || null;
}
