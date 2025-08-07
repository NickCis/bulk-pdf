import {
  useRef,
  useEffect,
  type RefObject,
  type CanvasHTMLAttributes,
} from "react";
import { getDocument } from "pdfjs-dist";

import { arrayBufferCopy } from "@/lib/array-buffer";
import { cn } from "@/lib/utils";
import { toPdfCoords } from "@/lib/pdf";

export interface PdfProps {
  bytes: ArrayBuffer;
  scale?: number;
  className?: string;
  onClick?: (position: { x: number; y: number }) => void;
  ref?: RefObject<HTMLCanvasElement | null>;
}

export function Pdf({
  bytes,
  scale = 1,
  className,
  onClick,
  ref: externalRef,
  ...props
}: PdfProps & Omit<CanvasHTMLAttributes<HTMLCanvasElement>, "onClick">) {
  const internalRef = useRef<HTMLCanvasElement>(null);
  const last = useRef(Promise.resolve());
  const ref = externalRef === undefined ? internalRef : externalRef;

  useEffect(() => {
    if (!bytes || !ref?.current) return;
    let cancel = false;
    const copy = arrayBufferCopy(bytes);
    const render = async () => {
      const canvas = ref.current;
      if (!canvas) return;

      const context = canvas.getContext("2d");
      if (!context) return;

      const pdf = await getDocument({ data: copy }).promise;
      if (cancel) return;

      const page = await pdf.getPage(1);
      if (cancel) return;

      const viewport = page.getViewport({ scale });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      last.current = last.current.then(async () => {
        if (cancel) return;
        try {
          await page.render({
            canvas,
            canvasContext: context,
            viewport,
          }).promise;
        } catch (e) {
          console.error(e);
        }
      });
    };

    render();
    return () => {
      cancel = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bytes, scale]);

  return (
    <canvas
      ref={ref}
      className={cn("w-full h-full object-contain", className)}
      onClick={
        onClick
          ? (event) => {
              const canvas = ref.current;
              if (!canvas) return;
              const rect = canvas.getBoundingClientRect();
              const x = event.clientX - rect.left;
              const y = event.clientY - rect.top;
              const coords = toPdfCoords(canvas, rect, {
                x,
                y,
                scale,
              });

              if (!coords) return;

              onClick(coords);
            }
          : undefined
      }
      {...props}
    />
  );
}
