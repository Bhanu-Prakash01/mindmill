const fs = require('fs');
const path = require('path');

// Ensure output directory exists
const outputDir = path.join(__dirname, '../frontend/public/cacs-images/options');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function getPolygonPoints(sides, radius = 40, cx = 50, cy = 50) {
  const points = [];
  const startAngle = -Math.PI / 2; // point up
  for (let i = 0; i < sides; i++) {
    const angle = startAngle + (i * 2 * Math.PI) / sides;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return points.join(' ');
}

function getStarPoints(cx, cy, spikes = 5, outerRadius = 12, innerRadius = 5) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;
  const points = [];

  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    rot += step;
  }
  return points.join(' ');
}

const svgs = {};

// ==========================================
// Q6 Options (Geometric Shapes)
// ==========================================
svgs['q6_a.svg'] = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <polygon points="${getPolygonPoints(7, 38)}" stroke="#4f46e5" stroke-width="4" fill="#e0e7ff" stroke-linejoin="round" />
</svg>`;

svgs['q6_b.svg'] = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <polygon points="${getPolygonPoints(5, 38)}" stroke="#4f46e5" stroke-width="4" fill="#e0e7ff" stroke-linejoin="round" />
</svg>`;

svgs['q6_c.svg'] = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <polygon points="${getPolygonPoints(8, 38)}" stroke="#4f46e5" stroke-width="4" fill="#e0e7ff" stroke-linejoin="round" />
</svg>`;

svgs['q6_d.svg'] = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="38" stroke="#4f46e5" stroke-width="4" fill="#e0e7ff" />
</svg>`;

svgs['q6_e.svg'] = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <polygon points="${getPolygonPoints(3, 38)}" stroke="#4f46e5" stroke-width="4" fill="#e0e7ff" stroke-linejoin="round" />
</svg>`;

// ==========================================
// Q7 Options (Sequence of Shapes - 5 in a row)
// ==========================================
svgs['q7_a.svg'] = `
<svg width="200" height="60" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
  ${[20, 60, 100, 140, 180].map(cx => `<polygon points="${cx},15 ${cx-12},45 ${cx+12},45" fill="#4f46e5" stroke-linejoin="round" />`).join('\n  ')}
</svg>`;

svgs['q7_b.svg'] = `
<svg width="200" height="60" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
  ${[20, 60, 100, 140, 180].map(cx => `<polygon points="${cx},45 ${cx-12},15 ${cx+12},15" fill="#4f46e5" stroke-linejoin="round" />`).join('\n  ')}
</svg>`;

svgs['q7_c.svg'] = `
<svg width="200" height="60" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
  ${[10, 50, 90, 130, 170].map(x => `<rect x="${x}" y="17" width="26" height="26" rx="4" fill="#4f46e5" />`).join('\n  ')}
</svg>`;

svgs['q7_d.svg'] = `
<svg width="200" height="60" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
  ${[20, 60, 100, 140, 180].map(cx => `<circle cx="${cx}" cy="30" r="14" fill="#4f46e5" />`).join('\n  ')}
</svg>`;

svgs['q7_e.svg'] = `
<svg width="200" height="60" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
  ${[20, 60, 100, 140, 180].map(cx => `<polygon points="${getStarPoints(cx, 30, 5, 15, 6)}" fill="#4f46e5" />`).join('\n  ')}
</svg>`;

// ==========================================
// Q8 Options (Hollow / Filled Shapes)
// ==========================================
svgs['q8_a.svg'] = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <polygon points="50,15 15,75 85,75" stroke="#4f46e5" stroke-width="5" stroke-linejoin="round" fill="none" />
</svg>`;

svgs['q8_b.svg'] = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="35" fill="#4f46e5" />
</svg>`;

svgs['q8_c.svg'] = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="35" stroke="#4f46e5" stroke-width="5" fill="none" />
</svg>`;

svgs['q8_d.svg'] = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect x="15" y="15" width="70" height="70" rx="6" fill="#4f46e5" />
</svg>`;

svgs['q8_e.svg'] = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <polygon points="${getPolygonPoints(5, 38)}" stroke="#4f46e5" stroke-width="5" stroke-linejoin="round" fill="none" />
</svg>`;

// ==========================================
// Q9 Options (Rotation Arrows)
// ==========================================
svgs['q9_a.svg'] = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="M80 50 H20 M35 35 L20 50 L35 65" stroke="#4f46e5" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
</svg>`;

svgs['q9_b.svg'] = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="M50 80 V20 M35 35 L50 20 L65 35" stroke="#4f46e5" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
</svg>`;

svgs['q9_c.svg'] = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="M25 75 L75 25 M45 25 H75 V55" stroke="#4f46e5" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
</svg>`;

svgs['q9_d.svg'] = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="M25 25 L75 75 M75 45 V75 H45" stroke="#4f46e5" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
</svg>`;

svgs['q9_e.svg'] = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 50 H80 M35 35 L20 50 L35 65 M65 35 L80 50 L65 65" stroke="#4f46e5" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
</svg>`;

// ==========================================
// Q10 Options (Nested Shapes)
// ==========================================
svgs['q10_a.svg'] = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect x="15" y="15" width="70" height="70" rx="4" stroke="#4f46e5" stroke-width="4" fill="none" />
  <polygon points="50,28 28,66 72,66" stroke="#059669" stroke-width="4" stroke-linejoin="round" fill="none" />
</svg>`;

svgs['q10_b.svg'] = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="35" stroke="#4f46e5" stroke-width="4" fill="none" />
  <circle cx="50" cy="50" r="18" stroke="#059669" stroke-width="4" fill="none" />
</svg>`;

svgs['q10_c.svg'] = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect x="15" y="15" width="70" height="70" rx="4" stroke="#4f46e5" stroke-width="4" fill="none" />
  <rect x="32" y="32" width="36" height="36" rx="2" stroke="#059669" stroke-width="4" fill="none" />
</svg>`;

svgs['q10_d.svg'] = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="50" cy="50" rx="40" ry="30" stroke="#4f46e5" stroke-width="4" fill="none" />
  <rect x="25" y="35" width="50" height="30" rx="2" stroke="#059669" stroke-width="4" fill="none" />
</svg>`;

svgs['q10_e.svg'] = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <polygon points="${getPolygonPoints(6, 38)}" stroke="#4f46e5" stroke-width="4" stroke-linejoin="round" fill="none" />
  <polygon points="${getStarPoints(50, 50, 5, 18, 8)}" fill="#059669" />
</svg>`;

// ==========================================
// Q11 Options (Parallel Lines)
// ==========================================
svgs['q11_a.svg'] = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <line x1="20" y1="15" x2="20" y2="85" stroke="#4f46e5" stroke-width="6" stroke-linecap="round" />
  <line x1="40" y1="15" x2="40" y2="85" stroke="#4f46e5" stroke-width="6" stroke-linecap="round" />
  <line x1="60" y1="15" x2="60" y2="85" stroke="#4f46e5" stroke-width="6" stroke-linecap="round" />
  <line x1="80" y1="15" x2="80" y2="85" stroke="#4f46e5" stroke-width="6" stroke-linecap="round" />
</svg>`;

svgs['q11_b.svg'] = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <line x1="15" y1="15" x2="85" y2="85" stroke="#4f46e5" stroke-width="6" stroke-linecap="round" />
  <line x1="85" y1="15" x2="15" y2="85" stroke="#4f46e5" stroke-width="6" stroke-linecap="round" />
  <line x1="50" y1="10" x2="50" y2="90" stroke="#4f46e5" stroke-width="6" stroke-linecap="round" />
  <line x1="10" y1="50" x2="90" y2="50" stroke="#4f46e5" stroke-width="6" stroke-linecap="round" />
  <line x1="15" y1="85" x2="85" y2="15" stroke="#4f46e5" stroke-width="6" stroke-linecap="round" />
</svg>`;

svgs['q11_c.svg'] = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <line x1="15" y1="50" x2="85" y2="50" stroke="#4f46e5" stroke-width="6" stroke-linecap="round" />
</svg>`;

svgs['q11_d.svg'] = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <line x1="20" y1="10" x2="20" y2="90" stroke="#4f46e5" stroke-width="4" />
  <line x1="40" y1="10" x2="40" y2="90" stroke="#4f46e5" stroke-width="4" />
  <line x1="60" y1="10" x2="60" y2="90" stroke="#4f46e5" stroke-width="4" />
  <line x1="80" y1="10" x2="80" y2="90" stroke="#4f46e5" stroke-width="4" />
  <line x1="10" y1="20" x2="90" y2="20" stroke="#4f46e5" stroke-width="4" />
  <line x1="10" y1="40" x2="90" y2="40" stroke="#4f46e5" stroke-width="4" />
  <line x1="10" y1="60" x2="90" y2="60" stroke="#4f46e5" stroke-width="4" />
  <line x1="10" y1="80" x2="90" y2="80" stroke="#4f46e5" stroke-width="4" />
</svg>`;

svgs['q11_e.svg'] = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="80" height="80" rx="6" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="4,4" fill="none" />
  <line x1="30" y1="30" x2="70" y2="70" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" />
  <line x1="70" y1="30" x2="30" y2="70" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" />
</svg>`;

// ==========================================
// Q12 Options (Horizontal Flip Shading)
// ==========================================
svgs['q12_a.svg'] = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect x="15" y="15" width="70" height="70" rx="4" stroke="#4f46e5" stroke-width="4" fill="none" />
  <path d="M15,19 C15,17 17,15 19,15 H50 V85 H19 C17,85 15,83 15,81 Z" fill="#4f46e5" />
</svg>`;

svgs['q12_b.svg'] = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect x="15" y="15" width="70" height="70" rx="4" stroke="#4f46e5" stroke-width="4" fill="none" />
  <path d="M50,15 H81 C83,15 85,17 85,19 V81 C85,83 83,85 81,85 H50 Z" fill="#4f46e5" />
</svg>`;

svgs['q12_c.svg'] = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect x="15" y="15" width="70" height="70" rx="4" stroke="#4f46e5" stroke-width="4" fill="none" />
  <path d="M19,15 H81 C83,15 85,17 85,19 V50 H15 V19 C15,17 17,15 19,15 Z" fill="#4f46e5" />
</svg>`;

svgs['q12_d.svg'] = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect x="15" y="15" width="70" height="70" rx="4" stroke="#4f46e5" stroke-width="4" fill="none" />
  <path d="M15,50 H85 V81 C85,83 83,85 81,85 H19 C17,85 15,83 15,81 Z" fill="#4f46e5" />
</svg>`;

svgs['q12_e.svg'] = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect x="15" y="15" width="70" height="70" rx="4" stroke="#4f46e5" stroke-width="4" fill="none" />
</svg>`;

// Write all SVGs
Object.keys(svgs).forEach(filename => {
  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, svgs[filename].trim());
  console.log(`Generated SVG: ${filename}`);
});

console.log('All option SVGs generated successfully.');
