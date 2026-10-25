const fs = require('fs');

const frontZones = {
  head_front: { name: "Kopf", xMin: 0, xMax: 100, yMin: 0, yMax: 12.5, cx: 50, cy: 7 },
  neck_front: { name: "Hals", xMin: 42, xMax: 58, yMin: 12.5, yMax: 17, cx: 50, cy: 15 },
  shoulder_left: { name: "Schulter Links", xMin: 0, xMax: 42, yMin: 12.5, yMax: 22, cx: 28, cy: 19 },
  shoulder_right: { name: "Schulter Rechts", xMin: 58, xMax: 100, yMin: 12.5, yMax: 22, cx: 72, cy: 19 },
  chest_left: { name: "Brustkorb Links", xMin: 33, xMax: 50, yMin: 17, yMax: 29, cx: 40, cy: 24 },
  chest_right: { name: "Brustkorb Rechts", xMin: 50, xMax: 67, yMin: 17, yMax: 29, cx: 60, cy: 24 },
  arm_upper_left: { name: "Oberarm Links", xMin: 0, xMax: 33, yMin: 22, yMax: 35, cx: 20, cy: 28 },
  arm_upper_right: { name: "Oberarm Rechts", xMin: 67, xMax: 100, yMin: 22, yMax: 35, cx: 80, cy: 28 },
  abdomen: { name: "Bauch", xMin: 30, xMax: 70, yMin: 29, yMax: 43, cx: 50, cy: 35 },
  pelvis_front: { name: "Becken/Genital", xMin: 30, xMax: 70, yMin: 43, yMax: 52, cx: 50, cy: 47 },
  arm_lower_left: { name: "Unterarm Links", xMin: 0, xMax: 30, yMin: 35, yMax: 50, cx: 13, cy: 42 },
  arm_lower_right: { name: "Unterarm Rechts", xMin: 70, xMax: 100, yMin: 35, yMax: 50, cx: 87, cy: 42 },
  hand_left: { name: "Hand Links", xMin: 0, xMax: 30, yMin: 50, yMax: 65, cx: 7, cy: 55 },
  hand_right: { name: "Hand Rechts", xMin: 70, xMax: 100, yMin: 50, yMax: 65, cx: 93, cy: 55 },
  thigh_left: { name: "Oberschenkel Links", xMin: 0, xMax: 50, yMin: 52, yMax: 67, cx: 42, cy: 58 },
  thigh_right: { name: "Oberschenkel Rechts", xMin: 50, xMax: 100, yMin: 52, yMax: 67, cx: 58, cy: 58 },
  knee_left: { name: "Knie Links", xMin: 0, xMax: 50, yMin: 67, yMax: 76, cx: 42, cy: 71 },
  knee_right: { name: "Knie Rechts", xMin: 50, xMax: 100, yMin: 67, yMax: 76, cx: 58, cy: 71 },
  shin_left: { name: "Unterschenkel Links", xMin: 0, xMax: 50, yMin: 76, yMax: 90, cx: 42, cy: 82 },
  shin_right: { name: "Unterschenkel Rechts", xMin: 50, xMax: 100, yMin: 76, yMax: 90, cx: 58, cy: 82 },
  foot_left: { name: "Fuß Links", xMin: 0, xMax: 50, yMin: 90, yMax: 100, cx: 42, cy: 95 },
  foot_right: { name: "Fuß Rechts", xMin: 50, xMax: 100, yMin: 90, yMax: 100, cx: 58, cy: 95 }
};

const backZones = {
  head_back: { name: "Hinterkopf", xMin: 0, xMax: 100, yMin: 0, yMax: 12.5, cx: 50, cy: 7 },
  neck_back: { name: "Nacken", xMin: 42, xMax: 58, yMin: 12.5, yMax: 17, cx: 50, cy: 15 },
  shoulder_blade_left: { name: "Schulterblatt Links", xMin: 20, xMax: 42, yMin: 12.5, yMax: 25, cx: 30, cy: 22 },
  shoulder_blade_right: { name: "Schulterblatt Rechts", xMin: 58, xMax: 80, yMin: 12.5, yMax: 25, cx: 70, cy: 22 },
  arm_upper_back_left: { name: "Oberarm Links", xMin: 0, xMax: 20, yMin: 12.5, yMax: 35, cx: 20, cy: 28 },
  arm_upper_back_right: { name: "Oberarm Rechts", xMin: 80, xMax: 100, yMin: 12.5, yMax: 35, cx: 80, cy: 28 },
  upper_back: { name: "Oberer Rücken", xMin: 20, xMax: 80, yMin: 25, yMax: 32, cx: 50, cy: 26 },
  lower_back: { name: "Lendenwirbelsäule", xMin: 30, xMax: 70, yMin: 32, yMax: 44, cx: 50, cy: 38 },
  gluteal_sacrum: { name: "Gesäß / Sakrum", xMin: 30, xMax: 70, yMin: 44, yMax: 54, cx: 50, cy: 49 },
  elbow_left: { name: "Ellenbogen/Unterarm Links", xMin: 0, xMax: 30, yMin: 35, yMax: 50, cx: 13, cy: 42 },
  elbow_right: { name: "Ellenbogen/Unterarm Rechts", xMin: 70, xMax: 100, yMin: 35, yMax: 50, cx: 87, cy: 42 },
  hand_back_left: { name: "Handrücken Links", xMin: 0, xMax: 30, yMin: 50, yMax: 65, cx: 7, cy: 55 },
  hand_back_right: { name: "Handrücken Rechts", xMin: 70, xMax: 100, yMin: 50, yMax: 65, cx: 93, cy: 55 },
  thigh_back_left: { name: "Oberschenkel Rückseite Links", xMin: 0, xMax: 50, yMin: 54, yMax: 67, cx: 42, cy: 60 },
  thigh_back_right: { name: "Oberschenkel Rückseite Rechts", xMin: 50, xMax: 100, yMin: 54, yMax: 67, cx: 58, cy: 60 },
  knee_back_left: { name: "Kniekehle Links", xMin: 0, xMax: 50, yMin: 67, yMax: 76, cx: 42, cy: 71 },
  knee_back_right: { name: "Kniekehle Rechts", xMin: 50, xMax: 100, yMin: 67, yMax: 76, cx: 58, cy: 71 },
  calf_left: { name: "Wade Links", xMin: 0, xMax: 50, yMin: 76, yMax: 90, cx: 42, cy: 82 },
  calf_right: { name: "Wade Rechts", xMin: 50, xMax: 100, yMin: 76, yMax: 90, cx: 58, cy: 82 },
  heel_left: { name: "Ferse Links", xMin: 0, xMax: 50, yMin: 90, yMax: 100, cx: 42, cy: 95 },
  heel_right: { name: "Ferse Rechts", xMin: 50, xMax: 100, yMin: 90, yMax: 100, cx: 58, cy: 95 }
};

function processModel(filename) {
  const content = fs.readFileSync('assets/' + filename, 'utf8');
  const vbMatch = content.match(/viewBox="0 0 (\d+) (\d+)"/);
  const w = parseFloat(vbMatch[1]);
  const h = parseFloat(vbMatch[2]);
  const isBack = filename.includes('back');
  const zones = isBack ? backZones : frontZones;

  // Extract contour paths
  const rawPathMatches = content.match(/<path[^>]+>/g) || [];
  const contourPaths = [];
  for (const p of rawPathMatches) {
    if (!p.includes('class="body-fill') && !p.includes('class="muscle-fill') && !p.includes('class="region-') && !p.includes('class="body-silhouette')) {
      const dMatch = p.match(/d="([^"]+)"/);
      if (dMatch) {
        contourPaths.push({ d: dMatch[1], evenOdd: p.includes('evenodd') });
      }
    }
  }

  // Find silhouette path d
  let silhouetteD = '';
  if (filename === 'female_front.svg') {
    let s66 = contourPaths[66].d.split(/[zZ]/)[0].trim();
    let s67 = contourPaths[67].d.split(/[zZ]/)[0].trim();
    if (s66.startsWith('m')) s66 = 'M' + s66.slice(1);
    if (s67.startsWith('m')) s67 = 'M' + s67.slice(1);
    silhouetteD = s66 + ' z ' + s67 + ' z';
  } else if (filename === 'male_front.svg') {
    let s0 = contourPaths[0].d.split(/[zZ]/)[0].trim();
    let s33 = contourPaths[33].d.split(/[zZ]/)[0].trim();
    if (s0.startsWith('m')) s0 = 'M' + s0.slice(1);
    if (s33.startsWith('m')) s33 = 'M' + s33.slice(1);
    silhouetteD = s0 + ' z ' + s33 + ' z';
  } else {
    let s0 = contourPaths[0].d.split(/[zZ]/)[0].trim();
    if (s0.startsWith('m')) s0 = 'M' + s0.slice(1);
    silhouetteD = s0 + ' z';
  }

  // Precalculate pixel rects for each zone
  const zoneRects = {};
  for (const [zoneId, z] of Object.entries(zones)) {
    zoneRects[zoneId] = {
      name: z.name,
      rx: parseFloat(((z.xMin / 100) * w).toFixed(1)),
      ry: parseFloat(((z.yMin / 100) * h).toFixed(1)),
      rw: parseFloat((((z.xMax - z.xMin) / 100) * w).toFixed(1)),
      rh: parseFloat((((z.yMax - z.yMin) / 100) * h).toFixed(1)),
      cx: z.cx,
      cy: z.cy
    };
  }

  return {
    w,
    h,
    viewBox: `0 0 ${w} ${h}`,
    silhouetteD,
    zoneRects,
    contourPaths
  };
}

const models = {
  male_front: processModel('male_front.svg'),
  male_back: processModel('male_back.svg'),
  female_front: processModel('female_front.svg'),
  female_back: processModel('female_back.svg')
};

const output = `// Auto-generated SVG Anatomical Model Data for WoundCarePro
export const BODY_MODELS_DATA = ${JSON.stringify(models, null, 2)};
`;

fs.writeFileSync('components/bodyModelsData.js', output, 'utf8');
console.log('Successfully written components/bodyModelsData.js');
