import { useRef, useEffect, type CanvasHTMLAttributes } from "react";
import { getDocument } from "pdfjs-dist";

import { arrayBufferCopy } from "@/lib/array-buffer";
import { cn } from "@/lib/utils";

export interface PdfProps {
  bytes: ArrayBuffer;
  scale?: number;
  className?: string;
  onClick?: (position: { x: number; y: number }) => void;
}

export function Pdf({
  bytes,
  scale = 1,
  className,
  onClick,
  ...props
}: PdfProps & Omit<CanvasHTMLAttributes<HTMLCanvasElement>, "onClick">) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!bytes || !ref.current) return;
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

      await page.render({
        canvas,
        canvasContext: context,
        viewport,
      }).promise;
    };

    render();
    return () => {
      cancel = true;
    };
  }, [bytes, scale]);

  return (
    <canvas
      ref={ref}
      className={cn(
        "border-input dark:bg-input/30 flex w-full rounded-md border bg-transparent px-3 py-2 shadow-xs transition-[color,box-shadow]",
        className,
      )}
      onClick={
        onClick
          ? (e) => {
              const canvas = ref.current;
              if (!canvas) return;

              const rect = canvas.getBoundingClientRect();
              const x = Math.round(
                (canvas.width * (e.clientX - rect.left)) / rect.width / scale,
              );
              const y = Math.round(
                (canvas.height -
                  (canvas.height * (e.clientY - rect.top)) / rect.height) /
                  scale,
              );
              onClick({ x, y });
            }
          : undefined
      }
      {...props}
    />
  );
}
