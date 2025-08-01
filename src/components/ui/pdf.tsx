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
        "border-input dark:bg-input/30 flex w-full rounded-md border bg-transparent px-3 py-2 shadow-xs transition-[color,box-shadow]",
        className,
      )}
      onClick={
        onClick
          ? (e) => {
              const canvas = ref.current;
              const rect = canvas.getBoundingClientRect();
              const x = Math.round(
                (canvas.width * (e.clientX - rect.left)) / rect.width / scale,
              );
              const y = Math.round(
                (canvas.height -
                  (canvas.height * (e.clientY - rect.top)) / rect.height) /
                  scale,
              );
              onClick({ x, y }, e, canvas);
            }
          : undefined
      }
      {...props}
    />
  );
}
