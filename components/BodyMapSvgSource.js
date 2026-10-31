// Raw SVG imports for WoundCarePro anatomical body map (Male & Female)
import maleFrontBaseRaw from '../assets/male/male_front_benannt.svg?raw';
import maleFrontRotRaw from '../assets/male/male_front_overlay_rot.svg?raw';
import maleFrontBlauRaw from '../assets/male/male_front_overlay_blau.svg?raw';
import maleBackBaseRaw from '../assets/male/male_back_benannt.svg?raw';
import maleBackRotRaw from '../assets/male/male_back_overlay_rot.svg?raw';
import maleBackBlauRaw from '../assets/male/male_back_overlay_blau.svg?raw';

import femaleFrontBaseRaw from '../assets/female/female_front_benannt.svg?raw';
import femaleFrontRotRaw from '../assets/female/female_front_overlay_rot.svg?raw';
import femaleFrontBlauRaw from '../assets/female/female_front_overlay_blau.svg?raw';
import femaleBackBaseRaw from '../assets/female/female_back_benannt.svg?raw';
import femaleBackRotRaw from '../assets/female/female_back_overlay_rot.svg?raw';
import femaleBackBlauRaw from '../assets/female/female_back_overlay_blau.svg?raw';

function cleanSvg(raw, extraClass) {
  if (!raw) return '';
  return raw
    .replace(/<metadata>[\s\S]*?<\/metadata>/i, '')
    .replace(/<svg\b([^>]*)>/i, (m, attrs) => {
      const cleanedAttrs = attrs.replace(/\bclass="[^"]*"/g, '');
      return `<svg ${cleanedAttrs} class="${extraClass}">`;
    });
}

// Male SVGs
export const MALE_FRONT_BASE = cleanSvg(maleFrontBaseRaw, 'base male-front-base');
export const MALE_FRONT_ROT = cleanSvg(maleFrontRotRaw, 'ov ov-rot male-front-rot');
export const MALE_FRONT_BLAU = cleanSvg(maleFrontBlauRaw, 'ov ov-blau male-front-blau');

export const MALE_BACK_BASE = cleanSvg(maleBackBaseRaw, 'base male-back-base');
export const MALE_BACK_ROT = cleanSvg(maleBackRotRaw, 'ov ov-rot male-back-rot');
export const MALE_BACK_BLAU = cleanSvg(maleBackBlauRaw, 'ov ov-blau male-back-blau');

// Female SVGs
export const FEMALE_FRONT_BASE = cleanSvg(femaleFrontBaseRaw, 'base female-front-base');
export const FEMALE_FRONT_ROT = cleanSvg(femaleFrontRotRaw, 'ov ov-rot female-front-rot');
export const FEMALE_FRONT_BLAU = cleanSvg(femaleFrontBlauRaw, 'ov ov-blau female-front-blau');

export const FEMALE_BACK_BASE = cleanSvg(femaleBackBaseRaw, 'base female-back-base');
export const FEMALE_BACK_ROT = cleanSvg(femaleBackRotRaw, 'ov ov-rot female-back-rot');
export const FEMALE_BACK_BLAU = cleanSvg(femaleBackBlauRaw, 'ov ov-blau female-back-blau');

export const BODY_MAP_SVGS = {
  male: {
    front: {
      base: MALE_FRONT_BASE,
      rot: MALE_FRONT_ROT,
      blau: MALE_FRONT_BLAU
    },
    back: {
      base: MALE_BACK_BASE,
      rot: MALE_BACK_ROT,
      blau: MALE_BACK_BLAU
    }
  },
  female: {
    front: {
      base: FEMALE_FRONT_BASE,
      rot: FEMALE_FRONT_ROT,
      blau: FEMALE_FRONT_BLAU
    },
    back: {
      base: FEMALE_BACK_BASE,
      rot: FEMALE_BACK_ROT,
      blau: FEMALE_BACK_BLAU
    }
  }
};
