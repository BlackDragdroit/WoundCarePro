/**
 * Maps relative coordinates (0-100%) to specific body parts.
 * Uses a list of defined CIRCULAR regions.
 * 
 * @param {number} x - Click X %
 * @param {number} y - Click Y %
 * @param {string} view - 'front' | 'back'
 * @param {Array} regions - Array of defined regions [{name, view, cx, cy, r}, ...]
 * @returns {string|null} - Name of the matched body part or null
 */
export const getBodyPartFromCoords = (x, y, view, regions = []) => {
  if (!regions || regions.length === 0) return null;

  // Filter regions by current view
  const viewRegions = regions.filter(r => r.view === view);

  // Find all matches
  const matches = viewRegions.filter(region => {
    // Calculate distance between click (x,y) and center (cx,cy)
    // Note: Since x and y are percentages, this is a rough Euclidean distance in % space.
    // Ideally aspect ratio should be considered, but for simple UI tools % is usually fine 
    // if the image is roughly square or circles are "good enough".
    const dist = Math.hypot(x - region.cx, y - region.cy);
    return dist <= region.r;
  });

  if (matches.length === 0) return null;

  // If multiple matches, return the SPECIFIC one (smallest radius)
  // This allows putting a small "Sternum" circle inside a large "Chest" circle.
  matches.sort((a, b) => a.r - b.r);

  return matches[0].name;
};
