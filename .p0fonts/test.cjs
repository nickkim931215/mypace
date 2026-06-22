const sharp = require('sharp');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="200">
  <rect width="600" height="200" fill="#0a0a0b"/>
  <text x="30" y="120" font-family="NanumGothic" font-size="60" font-weight="bold" fill="#d4ff3f">나만의 페이스 MyPace</text>
</svg>`;
sharp(Buffer.from(svg)).png().toFile('/tmp/fonttest.png').then(async()=>{
  const png = require('fs').readFileSync('/tmp/fonttest.png');
  // count non-background (lime) pixels as a proxy for "text rendered"
  const raw = await sharp('/tmp/fonttest.png').raw().toBuffer();
  let lime=0; for(let i=0;i<raw.length;i+=3){ if(raw[i]>150&&raw[i+1]>200&&raw[i+2]<120) lime++; }
  console.log('lime pixels (text):', lime, lime>500?'-> TEXT RENDERED OK':'-> NO TEXT (font fail)');
}).catch(e=>console.error('ERR',e.message));
