const sharp = require('sharp');
const fs = require('fs');

const BG = '#0a0a0b', LIME = '#d4ff3f', MUTED = '#9ca3af', WHITE = '#fafafa';

// reusable "M" logo mark drawn in a 512 coordinate space
function mark(transform, glow=false) {
  return `
  <g transform="${transform}">
    ${glow ? `<circle cx="256" cy="240" r="220" fill="url(#glow)"/>` : ``}
    <path d="M150 340 L150 178 L256 292 L362 178 L362 340"
      fill="none" stroke="${LIME}" stroke-width="46"
      stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="256" cy="372" r="15" fill="${LIME}"/>
  </g>`;
}

const defs = `
  <defs>
    <radialGradient id="glow" cx="50%" cy="42%" r="55%">
      <stop offset="0%" stop-color="${LIME}" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="${LIME}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="fgglow" cx="22%" cy="45%" r="60%">
      <stop offset="0%" stop-color="${LIME}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="${LIME}" stop-opacity="0"/>
    </radialGradient>
  </defs>`;

// ---------- APP ICON 512x512 ----------
const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  ${defs}
  <rect width="512" height="512" fill="${BG}"/>
  <rect width="512" height="512" fill="url(#glow)"/>
  ${mark('translate(0,0)')}
</svg>`;

// ---------- FEATURE GRAPHIC 1024x500 ----------
const fg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  ${defs}
  <rect width="1024" height="500" fill="${BG}"/>
  <rect width="1024" height="500" fill="url(#fgglow)"/>
  ${mark('translate(60,82) scale(0.62)')}
  <text x="360" y="232" font-family="NanumGothic" font-weight="bold" font-size="104" fill="${WHITE}" letter-spacing="-2">MyPace</text>
  <text x="364" y="296" font-family="NanumGothic" font-weight="bold" font-size="40" fill="${MUTED}">나만의 페이스 운동 타이머</text>
  <text x="364" y="350" font-family="NanumGothic" font-size="30" fill="${LIME}">인터벌 타이머 · 운동 기록 · 커뮤니티</text>
</svg>`;

(async () => {
  await sharp(Buffer.from(icon)).png().toFile('playstore-assets/icon-512.png');
  await sharp(Buffer.from(fg)).png().toFile('playstore-assets/feature-1024x500.png');
  for (const f of ['icon-512.png','feature-1024x500.png']) {
    const meta = await sharp('playstore-assets/'+f).metadata();
    console.log(f, meta.width+'x'+meta.height, meta.channels+'ch');
  }
})();
