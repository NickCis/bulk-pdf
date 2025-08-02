import { writeFile } from 'node:fs/promises';

async function getFontList() {
  const url = 'https://gwfh.mranftl.com/api/fonts';
  const res = await fetch(url);
  return res.json();
}

async function getFontURL(family) {
  const url = `https://fonts.googleapis.com/css?family=${encodeURIComponent(family)}`;
  const res = await fetch(url, { 'User-Agent': 'curl/8.13.0'});
  const text = await res.text();
  const match = text.match(/url\((.*?\.ttf)\)/);
  if (match)
    return match[1];
}

async function main() {
  const fonts = {}
  const fontList = await getFontList();
  console.log('Fonts:', fontList.length);
  for (let i =0; i < fontList.length ; i++) {
    const font = fontList[i];
    if (font.defSubset !== 'latin') continue;
    const url = await getFontURL(font.family);
    if (url) {
      fonts[font.family] = url;
      console.log(`  ${i}) ${font.family}:`, url);
    }
  }

  await writeFile('src/fonts/fonts.json', JSON.stringify(fonts, null, 2));
}

main();
