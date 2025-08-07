import {
  PDFDocument,
  rgb,
  StandardFonts,
  PDFFont,
  type PDFPageDrawTextOptions,
} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

import AlojaLight from "@/fonts/Aloja-Light.otf?url";

import { arrayBufferCopy } from "./array-buffer";

export interface TextVariable {
  x: number;
  y: number;
  w?: number;
  h?: number;
  font: string;
  size: number;
  contain?: boolean;
  alignment: "left" | "center" | "right";
  color: ReturnType<typeof rgb>;
  text: string;
}

export interface DrawnVariable {
  x: number;
  y: number;
  w: number;
  h: number;
}

const FontCacheDefault = Symbol("default");
export const FontsByName: Record<string, string | ArrayBuffer> = {
  Courier: StandardFonts.Courier,
  CourierBold: StandardFonts.CourierBold,
  CourierBoldOblique: StandardFonts.CourierBoldOblique,
  CourierOblique: StandardFonts.CourierOblique,
  Helvetica: StandardFonts.Helvetica,
  HelveticaBold: StandardFonts.HelveticaBold,
  HelveticaBoldOblique: StandardFonts.HelveticaBoldOblique,
  HelveticaOblique: StandardFonts.HelveticaOblique,
  Symbol: StandardFonts.Symbol,
  TimesRoman: StandardFonts.TimesRoman,
  TimesRomanBold: StandardFonts.TimesRomanBold,
  TimesRomanBoldItalic: StandardFonts.TimesRomanBoldItalic,
  TimesRomanItalic: StandardFonts.TimesRomanItalic,
  ZapfDingbats: StandardFonts.ZapfDingbats,
  AlojaLight,
};

import("@/fonts/fonts.json").then(({ default: fonts }) => {
  for (const [key, value] of Object.entries(fonts)) {
    if (!(key in FontsByName)) FontsByName[key] = value;
  }
});

async function downloadFont(url: string): Promise<ArrayBuffer | string> {
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`Failed to fetch font: '${url}'`);
    return StandardFonts.Helvetica;
  }

  return await res.arrayBuffer();
}

export async function pdfRender(
  bytes: ArrayBuffer,
  texts: TextVariable[],
): Promise<{ document: ArrayBuffer; variables: DrawnVariable[] }> {
  const copy = arrayBufferCopy(bytes);
  const doc = await PDFDocument.load(copy);
  doc.registerFontkit(fontkit);
  doc.setProducer("bulk-pdf ( https://bulk-pdf.vercel.app/ )");
  doc.setCreator("bulk-pdf ( https://bulk-pdf.vercel.app/ )");

  const pages = doc.getPages();
  const page = pages[0];
  const height = page.getHeight();
  const width = page.getWidth();
  const fontCache: Record<string | symbol, PDFFont> = {};
  const variables = [];

  for (const { text, font, alignment, ...rest } of texts) {
    const opts: {
      x: number;
      y: number;
      size: number;
      font?: PDFPageDrawTextOptions["font"];
    } = rest;
    if (opts.x > width || opts.y > height) {
      console.warn("Invalid position", text, { height, width });
      continue;
    }

    if (font) {
      if (!fontCache[font]) {
        if (!(font in StandardFonts) && typeof FontsByName[font] === "string")
          FontsByName[font] = await downloadFont(FontsByName[font]);
        fontCache[font] = await doc.embedFont(FontsByName[font]);
      }
      opts.font = fontCache[font];
    } else {
      if (!fontCache[FontCacheDefault])
        fontCache[FontCacheDefault] = await doc.embedFont(
          StandardFonts.Helvetica,
        );
      opts.font = fontCache[FontCacheDefault];
    }

    if (rest.contain && rest.w && rest.h) {
      let size = opts.font.sizeAtHeight(rest.h);
      while (size > 0 && opts.font.widthOfTextAtSize(text, size) > rest.w) {
        size -= 0.2;
      }

      if (size) opts.size = size;
    }

    const textWidth = opts.font.widthOfTextAtSize(text, opts.size);
    if (alignment && alignment !== "left") {
      switch (alignment) {
        case "center":
          opts.x = opts.x - textWidth / 2;
          break;

        case "right":
          opts.x = opts.x - textWidth;
          break;
      }
    }

    variables.push({
      x: opts.x,
      y: opts.y,
      w: textWidth,
      h: opts.font.heightAtSize(opts.size),
    });

    page.drawText(text, opts);
  }

  return {
    document: await doc.save(),
    variables,
  };
}

export function toPdfCoords(
  canvas: { width: number; height: number },
  rect: { width: number; height: number },
  { x, y, scale = 1 }: { x: number; y: number; scale: number },
): { x: number; y: number } | null {
  const canvasAspect = canvas.width / canvas.height;
  const rectAspect = rect.width / rect.height;
  let drawnWidth, drawnHeight, offsetX, offsetY;

  if (canvasAspect > rectAspect) {
    drawnWidth = rect.width;
    drawnHeight = rect.width / canvasAspect;
    offsetX = 0;
    offsetY = (rect.height - drawnHeight) / 2;
  } else {
    drawnHeight = rect.height;
    drawnWidth = rect.height * canvasAspect;
    offsetX = (rect.width - drawnWidth) / 2;
    offsetY = 0;
  }

  const xInDrawn = x - offsetX;
  const yInDrawn = y - offsetY;

  if (
    xInDrawn < 0 ||
    yInDrawn < 0 ||
    xInDrawn > drawnWidth ||
    yInDrawn > drawnHeight
  )
    return null;

  const scaleX = canvas.width / drawnWidth / scale;
  const scaleY = canvas.height / drawnHeight / scale;

  const pdfX = xInDrawn * scaleX;
  const pdfY = (drawnHeight - yInDrawn) * scaleY;

  return {
    x: pdfX,
    y: pdfY,
  };
}

export function fromPdfCoords(
  canvas: { width: number; height: number },
  rect: { width: number; height: number },
  {
    x: pdfX,
    y: pdfY,
    scale = 1,
    unsafe,
  }: { x: number; y: number; scale: number; unsafe?: boolean },
): { x: number; y: number } | null {
  const canvasAspect = canvas.width / canvas.height;
  const rectAspect = rect.width / rect.height;
  let drawnWidth, drawnHeight, offsetX, offsetY;

  if (canvasAspect > rectAspect) {
    drawnWidth = rect.width;
    drawnHeight = rect.width / canvasAspect;
    offsetX = 0;
    offsetY = (rect.height - drawnHeight) / 2;
  } else {
    drawnHeight = rect.height;
    drawnWidth = rect.height * canvasAspect;
    offsetX = (rect.width - drawnWidth) / 2;
    offsetY = 0;
  }

  const scaleX = canvas.width / drawnWidth / scale;
  const scaleY = canvas.height / drawnHeight / scale;

  const xInDrawn = pdfX / scaleX;
  const yInDrawn = drawnHeight - pdfY / scaleY;

  if (
    !unsafe &&
    (xInDrawn < 0 ||
      yInDrawn < 0 ||
      xInDrawn > drawnWidth ||
      yInDrawn > drawnHeight)
  )
    return null;

  const x = xInDrawn + offsetX;
  const y = yInDrawn + offsetY;

  return {
    x,
    y,
  };
}

export { rgb };
