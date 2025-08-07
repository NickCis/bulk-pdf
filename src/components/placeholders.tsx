import {
  useRef,
  useEffect,
  useState,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from "react";
import { Circle } from "lucide-react";

import { fromPdfCoords, toPdfCoords } from "@/lib/pdf";
import { cn } from "@/lib/utils";
import { type VariableObject } from "@/components/variable";
import { type DrawnVariable } from "@/lib/pdf";

export type EventType =
  | "move"
  | "drag-n"
  | "drag-ne"
  | "drag-e"
  | "drag-se"
  | "drag-s"
  | "drag-sw"
  | "drag-w"
  | "drag-nw";

export interface ChangeEvent {
  key: string;
  event: EventType;
  x: number;
  y: number;
  w: number;
  h: number;
}

export type VariableObjectWithKey = VariableObject & { key: string };

interface Position {
  left: number;
  top: number;
  width: number;
  height: number;
}
interface PlaceholderProps {
  left: number;
  top: number;
  width: number;
  height: number;
  onChange: (ev: Position & { event: EventType }) => void;
}
function Placeholder({ left, top, width, height, onChange }: PlaceholderProps) {
  const [position, setPosition] = useState<Position & { grabbing?: boolean }>({
    grabbing: false,
    left,
    top,
    width,
    height,
  });
  const startRef = useRef<{
    event: EventType;
    current: Position;
    position: Position;
    mouse: { x: number; y: number };
  }>(null);

  useEffect(() => {
    setPosition({
      left,
      top,
      width,
      height,
    });
  }, [left, top, width, height]);

  const classNames =
    "absolute w-3 h-3 text-muted-foreground opacity-40 hover:opacity-100 transition-opacity";

  function makeMouseDown(event: EventType) {
    return (ev: ReactMouseEvent) => {
      ev.stopPropagation();
      if (startRef.current) return;
      if (event === "move") setPosition((p) => ({ ...p, grabbing: true }));

      startRef.current = {
        event,
        current: position,
        position,
        mouse: {
          x: ev.clientX,
          y: ev.clientY,
        },
      };

      let handleMouseUp = () => {};
      const handleMouseMove = (ev: MouseEvent) => {
        if (!startRef.current) {
          handleMouseUp();
          return;
        }

        const dx = ev.clientX - startRef.current.mouse.x;
        const dy = ev.clientY - startRef.current.mouse.y;
        const update: Partial<typeof position> = {};

        switch (event) {
          case "move":
            update.left = startRef.current.position.left + dx;
            update.top = startRef.current.position.top + dy;
            break;
          case "drag-n":
            update.top = startRef.current.position.top + dy;
            update.height = startRef.current.position.height - dy;
            break;
          case "drag-ne":
            update.top = startRef.current.position.top + dy;
            update.width = startRef.current.position.width + dx;
            update.height = startRef.current.position.height - dy;
            break;
          case "drag-e":
            update.width = startRef.current.position.width + dx;
            break;
          case "drag-se":
            update.width = startRef.current.position.width + dx;
            update.height = startRef.current.position.height + dy;
            break;
          case "drag-s":
            update.height = startRef.current.position.height + dy;
            break;
          case "drag-sw":
            update.left = startRef.current.position.left + dx;
            update.width = startRef.current.position.width - dx;
            update.height = startRef.current.position.height + dy;
            break;
          case "drag-w":
            update.left = startRef.current.position.left + dx;
            update.width = startRef.current.position.width - dx;
            break;
          case "drag-nw":
            update.left = startRef.current.position.left + dx;
            update.top = startRef.current.position.top + dy;
            update.width = startRef.current.position.width - dx;
            update.height = startRef.current.position.height - dy;
            break;
        }

        setPosition((p) => ({
          ...p,
          ...update,
        }));
        startRef.current.current = {
          ...startRef.current.current,
          ...update,
        };
      };

      handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        if (!startRef.current) return;

        const current = startRef.current.current;
        startRef.current = null;
        if (event === "move") setPosition((p) => ({ ...p, grabbing: false }));
        onChange({
          event,
          ...current,
        });
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp, { once: true });
    };
  }

  return (
    <div
      onMouseDown={makeMouseDown("move")}
      className={cn(
        "absolute bg-blue-500/50 cursor-grab rounded-xs shadow-md select-none group",
        position.grabbing ? "cursor-grabbing" : "",
      )}
      style={{
        left: `${position.left}px`,
        width: `${position.width}px`,
        top: `${position.top}px`,
        height: `${position.height}px`,
      }}
    >
      <div
        onMouseDown={makeMouseDown("drag-n")}
        className={cn(
          classNames,
          "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize",
        )}
      >
        <Circle className="w-3 h-3" />
      </div>
      <div
        onMouseDown={makeMouseDown("drag-e")}
        className={cn(
          classNames,
          "right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-ew-resize",
        )}
      >
        <Circle className="w-3 h-3" />
      </div>
      <div
        onMouseDown={makeMouseDown("drag-s")}
        className={cn(
          classNames,
          "left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-ns-resize",
        )}
      >
        <Circle className="w-3 h-3" />
      </div>
      <div
        onMouseDown={makeMouseDown("drag-w")}
        className={cn(
          classNames,
          "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize",
        )}
      >
        <Circle className="w-3 h-3" />
      </div>

      <div
        onMouseDown={makeMouseDown("drag-nw")}
        className={cn(
          classNames,
          "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize",
        )}
      >
        <Circle className="w-3 h-3" />
      </div>
      <div
        onMouseDown={makeMouseDown("drag-ne")}
        className={cn(
          classNames,
          "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize",
        )}
      >
        <Circle className="w-3 h-3" />
      </div>
      <div
        onMouseDown={makeMouseDown("drag-sw")}
        className={cn(
          classNames,
          "left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize",
        )}
      >
        <Circle className="w-3 h-3" />
      </div>
      <div
        onMouseDown={makeMouseDown("drag-se")}
        className={cn(
          classNames,
          "right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize",
        )}
      >
        <Circle className="w-3 h-3" />
      </div>
    </div>
  );
}

interface WrapperProps {
  x: number;
  y: number;
  w: number;
  h: number;
  scale: number;
  alignment: VariableObject["alignment"];
  canvasRef: RefObject<HTMLCanvasElement | null>;
  onChange: (ev: Omit<ChangeEvent, "key">) => void;
}

function Wrapper({
  x,
  y,
  w,
  h,
  canvasRef,
  scale,
  onChange,
  alignment,
}: WrapperProps) {
  if (!canvasRef.current) return null;
  // XXX: should be a useMemo?
  const rect = canvasRef.current.getBoundingClientRect();
  const a = fromPdfCoords(canvasRef.current, rect, {
    x,
    y,
    scale,
    unsafe: true,
  });
  const b = fromPdfCoords(canvasRef.current, rect, {
    x: x + w,
    y: y + h,
    scale,
    unsafe: true,
  });
  if (!a || !b) return null;
  let left = a.x;
  const top = b.y;
  const width = b.x - a.x;
  const height = a.y - b.y;

  if (alignment && alignment !== "left") {
    switch (alignment) {
      case "center":
        left = left - width / 2;
        break;

      case "right":
        left = left - width;
        break;
    }
  }

  return (
    <Placeholder
      left={left}
      width={width}
      top={top}
      height={height}
      onChange={({ event, left, top, width, height }) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const a = toPdfCoords(canvasRef.current, rect, {
          x: left,
          y: height + top,
          scale,
        });
        const b = toPdfCoords(canvasRef.current, rect, {
          x: width + left,
          y: top,
          scale,
        });
        if (!a || !b) return;
        const ev = {
          event,
          x: a.x,
          y: a.y,
          w: b.x - a.x,
          h: b.y - a.y,
        };
        if (alignment && alignment !== "left") {
          switch (alignment) {
            case "center":
              ev.x = ev.x + ev.w / 2;
              break;

            case "right":
              ev.x = ev.x + ev.w;
              break;
          }
        }
        onChange(ev);
      }}
    />
  );
}

export interface PlaceholdersProps {
  variables: VariableObjectWithKey[];
  onChange: (ev: ChangeEvent) => void;
  drawn: Record<string, DrawnVariable>;
  scale: number;
  canvasRef: RefObject<HTMLCanvasElement | null>;
}

export function Placeholders({
  variables,
  drawn,
  canvasRef,
  scale,
  onChange,
}: PlaceholdersProps) {
  return variables.map((variable) => {
    const d = drawn[variable.key];
    if (!d) return null;
    return (
      <Wrapper
        key={variable.key}
        x={variable.x}
        y={variable.y}
        w={variable.w || d.w}
        h={variable.h || d.h}
        alignment={variable.alignment}
        canvasRef={canvasRef}
        scale={scale}
        onChange={(ev) => onChange({ ...ev, key: variable.key })}
      />
    );
  });
}
