// Raw SVG imports for WoundCarePro anatomical body map
import maleFrontBaseRaw from '../assets/male/male_front_benannt.svg?raw';
import maleFrontRotRaw from '../assets/male/male_front_overlay_rot.svg?raw';
import maleFrontBlauRaw from '../assets/male/male_front_overlay_blau.svg?raw';
import maleBackBaseRaw from '../assets/male/male_back_benannt.svg?raw';
import maleBackRotRaw from '../assets/male/male_back_overlay_rot.svg?raw';
import maleBackBlauRaw from '../assets/male/male_back_overlay_blau.svg?raw';

function cleanSvg(raw, extraClass) {
  if (!raw) return '';
  return raw
    .replace(/<metadata>[\s\S]*?<\/metadata>/i, '')
    .replace(/<svg\b([^>]*)>/i, (m, attrs) => {
      const cleanedAttrs = attrs.replace(/\bclass="[^"]*"/g, '');
      return `<svg ${cleanedAttrs} class="${extraClass}">`;
    });
}

export const MALE_FRONT_BASE = cleanSvg(maleFrontBaseRaw, 'base male-front-base');
export const MALE_FRONT_ROT = cleanSvg(maleFrontRotRaw, 'ov ov-rot male-front-rot');
export const MALE_FRONT_BLAU = cleanSvg(maleFrontBlauRaw, 'ov ov-blau male-front-blau');

export const MALE_BACK_BASE = cleanSvg(maleBackBaseRaw, 'base male-back-base');
export const MALE_BACK_ROT = cleanSvg(maleBackRotRaw, 'ov ov-rot male-back-rot');
export const MALE_BACK_BLAU = cleanSvg(maleBackBlauRaw, 'ov ov-blau male-back-blau');
