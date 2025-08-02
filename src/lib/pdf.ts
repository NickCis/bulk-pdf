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
  font: string;
  size: number;
  alignment: "left" | "center" | "right";
  color: ReturnType<typeof rgb>;
  text: string;
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
): Promise<ArrayBuffer> {
  const copy = arrayBufferCopy(bytes);
  const doc = await PDFDocument.load(copy);
  doc.registerFontkit(fontkit);

  const pages = doc.getPages();
  const page = pages[0];
  const height = page.getHeight();
  const width = page.getWidth();
  const fontCache: Record<string | symbol, PDFFont> = {};

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

    if (alignment && alignment !== "left") {
      const textWidth = opts.font.widthOfTextAtSize(text, opts.size);
      switch (alignment) {
        case "center":
          opts.x = opts.x - textWidth / 2;
          break;

        case "right":
          opts.x = opts.x - textWidth;
          break;
      }
    }

    page.drawText(text, opts);
  }

  return await doc.save();
}

export { rgb };
