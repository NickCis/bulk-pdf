import { useRef, useEffect } from "react";
import { getDocument } from "pdfjs-dist";

import { arrayBufferCopy } from "@/lib/array-buffer";
import { cn } from "@/lib/utils";

export function Pdf({ bytes, scale = 1, className, onClick, ...props }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!bytes || !ref.current) return;
    let cancel = false;
    const copy = arrayBufferCopy(bytes);
    const render = async () => {
      const pdf = await getDocument({ data: copy }).promise;
      if (cancel) return;
      const page = await pdf.getPage(1);
      if (cancel) return;
      const viewport = page.getViewport({ scale });

      const canvas = ref.current;
      const context = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = {
        canvasContext: context,
        viewport,
      };

      await page.render(renderContext).promise;
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
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      onClick={
        onClick
          ? (e) => {
              const canvas = ref.current;
              const rect = canvas.getBoundingClientRect();
              const x = Math.round(
                (canvas.width * (e.clientX - rect.left)) / rect.width,
              );
              const y = Math.round(
                canvas.height -
                  (canvas.height * (e.clientY - rect.top)) / rect.height,
              );
              onClick({ x, y }, e, canvas);
            }
          : undefined
      }
      {...props}
    />
  );
}
