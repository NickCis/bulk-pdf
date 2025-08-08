import { useRef, useState, useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

type CardinalPoint = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";
export interface Step {
  selector?: string;
  content: string | ReactNode;
  position?: CardinalPoint;
  className?: string;
}

export interface TourProps {
  open: boolean;
  steps: Step[];
  onClose: (reason: "skip" | "end" | "esc") => void;
}

function positionFromCardinal(
  rect: DOMRect,
  cardinal: CardinalPoint = "s",
  { margin = 12 } = {},
) {
  switch (cardinal) {
    case "n":
      return {
        top: rect.bottom - rect.height - margin,
        left: rect.left + rect.width / 2,
        transform: "translate(-50%, -100%)",
      };
    case "ne":
      return {
        top: rect.bottom - rect.height - margin,
        left: rect.right + margin,
        transform: "translateY(-100%)",
      };
    case "e":
      return {
        top: rect.top + rect.height / 2,
        left: rect.right + margin,
        transform: "translateY(-50%)",
      };
    case "se":
      return {
        top: rect.bottom + margin,
        left: rect.right + margin,
      };
    case "s":
      return {
        top: rect.bottom + margin,
        left: rect.left + rect.width / 2,
        transform: "translateX(-50%)",
      };
    case "sw":
      return {
        top: rect.bottom + margin,
        left: rect.left - margin,
        transform: "translateX(-100%)",
      };
    case "w":
      return {
        top: rect.top + rect.height / 2,
        left: rect.left - margin,
        transform: "translate(-100%, -50%)",
      };
    case "nw":
      return {
        top: rect.bottom - rect.height - margin,
        left: rect.left - margin,
        transform: "translate(-100%, -100%)",
      };
  }
}

export function Tour({ open, onClose, steps }: TourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const refs = useRef({
    steps,
    onClose,
  });
  refs.current.steps = steps;
  refs.current.onClose = onClose;

  useEffect(() => {
    if (!open) return;

    const selector = refs.current.steps[currentStep].selector;
    if (selector) {
      const el = document.querySelector(selector);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect(r);
        return;
      }
    }
    setRect(null);
  }, [open, currentStep]);

  useEffect(() => {
    if (!open) return;
    setCurrentStep(0);
    const handler = (ev: KeyboardEvent) => {
      if (ev.key !== "Escape") return;
      refs.current.onClose("esc");
    };

    document.addEventListener("keydown", handler);

    return () => {
      document.removeEventListener("keydown", handler);
    };
  }, [open]);

  if (!open) return null;

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((i) => i + 1);
    } else {
      onClose("end");
    }
  };
  const step = steps[currentStep];

  return (
    <>
      <svg
        className="fixed inset-0 z-100"
        width="100%"
        height="100%"
        onPointerDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        {rect ? (
          <defs>
            <mask id="mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={rect.left - 8}
                y={rect.top - 8}
                width={rect.width + 16}
                height={rect.height + 16}
                rx={8}
                ry={8}
                fill="black"
              />
            </mask>
          </defs>
        ) : null}
        <rect
          width="100%"
          height="100%"
          fill="black"
          mask="url(#mask)"
          fillOpacity={0.6}
        />
      </svg>
      <Popover open>
        <PopoverContent
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          className={cn(
            "z-101 w-[260px] transition-all duration-300 ease-out absolute",
            !rect
              ? "top-[50vh] left-[50vw] -translate-y-1/2 -translate-x-1/2"
              : undefined,
            step.className,
          )}
          style={rect ? positionFromCardinal(rect, step.position) : undefined}
        >
          {"string" === typeof step.content ? (
            <p className="text-sm">{steps[currentStep].content}</p>
          ) : (
            step.content
          )}
          <div className="mt-4 flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => onClose("skip")}>
              Skip
            </Button>
            <Button size="sm" onClick={next}>
              {currentStep === steps.length - 1 ? "Finish" : "Next"}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
