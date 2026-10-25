/**
 * Maps relative coordinates (0-100%) to specific body parts.
 * Uses a list of defined circular/elliptical regions.
 * 
 * @param {number} x - Click X %
 * @param {number} y - Click Y %
 * @param {string} view - 'front' | 'back'
 * @param {Array} regions - Array of defined regions [{name, view, cx, cy, r}, ...]
 * @returns {Object|null} - Matched region object or null
 */
export const getRegionFromCoords = (x, y, view, regions = []) => {
  if (!regions || regions.length === 0) return null;

  // Filter regions by current view
  const viewRegions = regions.filter(r => (r.view || 'front') === view);

  // Find exact matches inside radius
  const matches = viewRegions.filter(region => {
    const dist = Math.hypot(x - region.cx, y - region.cy);
    return dist <= region.r;
  });

  if (matches.length > 0) {
    // If multiple matches, return the most specific one (smallest radius)
    matches.sort((a, b) => a.r - b.r);
    return matches[0];
  }

  // If outside exact radius, find closest region within a lenient threshold (1.4x radius)
  const nearby = viewRegions
    .map(region => ({ region, dist: Math.hypot(x - region.cx, y - region.cy) }))
    .filter(item => item.dist <= Math.max(item.region.r * 1.4, 6))
    .sort((a, b) => a.dist - b.dist);

  return nearby.length > 0 ? nearby[0].region : null;
};

/**
 * Gets the body part name from coordinates
 */
export const getBodyPartFromCoords = (x, y, view, regions = []) => {
  const match = getRegionFromCoords(x, y, view, regions);
  return match ? match.name : null;
};

/**
 * Checks whether a wound marker belongs to a specific body region
 */
export const isWoundInRegion = (marker, region) => {
  if (!marker || !region) return false;
  if ((marker.view || 'front') !== (region.view || 'front')) return false;

  // Explicit region ID match
  if (marker.regionId && marker.regionId === region.id) return true;

  // Name match
  if (marker.locationName && region.name &&
      marker.locationName.trim().toLowerCase() === region.name.trim().toLowerCase()) {
    return true;
  }

  // Coordinate distance check
  if (typeof marker.x === 'number' && typeof marker.y === 'number') {
    const dist = Math.hypot(marker.x - region.cx, marker.y - region.cy);
    return dist <= Math.max(region.r * 1.35, 6);
  }

  return false;
};

