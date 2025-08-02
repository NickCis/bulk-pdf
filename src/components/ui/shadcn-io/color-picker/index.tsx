"use client";

import Color, { type ColorInstance } from "color";
import { PipetteIcon } from "lucide-react";
import { Slider } from "radix-ui";
import {
  type ComponentProps,
  createContext,
  type HTMLAttributes,
  memo,
  useContext,
  useRef,
  useState,
  useEffect,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ColorPickerContextValue {
  color: ColorInstance;
  mode: string;
  setMode: (mode: string) => void;
  onChange: (color: ColorInstance) => void;
}

const ColorPickerContext = createContext<ColorPickerContextValue | undefined>(
  undefined,
);

function useColorPicker() {
  const context = useContext(ColorPickerContext);

  if (!context) {
    throw new Error("useColorPicker must be used within a ColorPickerProvider");
  }

  return context;
}

export type ColorPickerProps<T> = Omit<
  HTMLAttributes<HTMLDivElement>,
  "onChange" | "value" | "defaultValue"
> & {
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
};

export function HexColorPicker({
  value: controlledValue,
  defaultValue = "#000000",
  onChange,
  ...props
}: ColorPickerProps<string>) {
  const [color, setColor] = useState<ColorInstance>(() =>
    Color(controlledValue || defaultValue),
  );

  useEffect(() => {
    if (controlledValue === undefined) return;
    setColor((color) => {
      const c = Color(controlledValue);
      return color.hex() === c.hex() ? color : c;
    });
  }, [controlledValue]);

  return (
    <ColorPicker
      value={color}
      onChange={(c) => {
        setColor(c);
        if (onChange && c.hex() !== color.hex()) onChange(c.hex());
      }}
      {...props}
    />
  );
}

export function ColorPicker({
  value: controlledValue,
  defaultValue = Color("#000000"),
  onChange,
  className,
  ...props
}: ColorPickerProps<ColorInstance>) {
  const isControlled = controlledValue !== undefined && onChange;
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const color = isControlled ? controlledValue : uncontrolledValue;
  const [mode, setMode] = useState("hex");

  return (
    <ColorPickerContext.Provider
      value={{
        color,
        onChange: isControlled
          ? onChange
          : (color: ColorInstance) => setUncontrolledValue(color),
        mode,
        setMode,
      }}
    >
      <div
        className={cn("flex size-full flex-col gap-4", className)}
        {...props}
      />
    </ColorPickerContext.Provider>
  );
}

export type ColorPickerSelectionProps = HTMLAttributes<HTMLDivElement>;

export const ColorPickerSelection = memo(
  ({ className, ...props }: ColorPickerSelectionProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { color, onChange } = useColorPicker();
    const hue = color.hue();
    const saturation = color.saturationl();
    const lightness = color.lightness();
    const positionX = saturation / 100;
    const positionY =
      1 - lightness / (positionX < 0.01 ? 100 : 50 + 50 * (1 - positionX));

    const handlePointerMove = (event: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(
        0,
        Math.min(1, (event.clientX - rect.left) / rect.width),
      );
      const y = Math.max(
        0,
        Math.min(1, (event.clientY - rect.top) / rect.height),
      );
      const topLightness = x < 0.01 ? 100 : 50 + 50 * (1 - x);
      const lightness = topLightness * (1 - y);

      onChange(color.saturationl(x * 100).lightness(lightness));
    };

    return (
      <div
        className={cn("relative size-full cursor-crosshair rounded", className)}
        onPointerDown={(e) => {
          e.preventDefault();
          handlePointerMove(e.nativeEvent);
          window.addEventListener("pointermove", handlePointerMove);
          window.addEventListener(
            "pointerup",
            () => window.removeEventListener("pointermove", handlePointerMove),
            { once: true },
          );
        }}
        ref={containerRef}
        style={{
          background: `linear-gradient(0deg, rgba(0,0,0,1), rgba(0,0,0,0)),
            linear-gradient(90deg, rgba(255,255,255,1), rgba(255,255,255,0)),
            hsl(${hue}, 100%, 50%)`,
        }}
        {...props}
      >
        <div
          className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute h-4 w-4 rounded-full border-2 border-white"
          style={{
            left: `${positionX * 100}%`,
            top: `${positionY * 100}%`,
            boxShadow: "0 0 0 1px rgba(0,0,0,0.5)",
          }}
        />
      </div>
    );
  },
);

ColorPickerSelection.displayName = "ColorPickerSelection";

export type ColorPickerHueProps = ComponentProps<typeof Slider.Root>;

export function ColorPickerHue({ className, ...props }: ColorPickerHueProps) {
  const { color, onChange } = useColorPicker();
  const hue = color.hue();

  return (
    <Slider.Root
      className={cn("relative flex h-4 w-full touch-none", className)}
      max={360}
      onValueChange={([hue]) => onChange(color.hue(hue))}
      step={1}
      value={[hue]}
      {...props}
    >
      <Slider.Track className="relative my-0.5 h-3 w-full grow rounded-full bg-[linear-gradient(90deg,#FF0000,#FFFF00,#00FF00,#00FFFF,#0000FF,#FF00FF,#FF0000)]">
        <Slider.Range className="absolute h-full" />
      </Slider.Track>
      <Slider.Thumb className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
    </Slider.Root>
  );
}

export type ColorPickerEyeDropperProps = ComponentProps<typeof Button>;

export function ColorPickerEyeDropper({
  className,
  ...props
}: ColorPickerEyeDropperProps) {
  const { onChange } = useColorPicker();

  const handleEyeDropper = async () => {
    try {
      // @ts-expect-error - EyeDropper API is experimental
      const eyeDropper = new EyeDropper();
      const result = await eyeDropper.open();
      const color = Color(result.sRGBHex);
      onChange(color);
    } catch (error) {
      console.error("EyeDropper failed:", error);
    }
  };

  return (
    <Button
      className={cn("shrink-0 text-muted-foreground", className)}
      onClick={handleEyeDropper}
      size="icon"
      variant="outline"
      type="button"
      {...props}
    >
      <PipetteIcon size={16} />
    </Button>
  );
}

export type ColorPickerOutputProps = ComponentProps<typeof SelectTrigger>;

const formats = ["hex", "rgb", "hsl"];

export function ColorPickerOutput({ ...props }: ColorPickerOutputProps) {
  const { mode, setMode } = useColorPicker();

  return (
    <Select onValueChange={setMode} value={mode}>
      <SelectTrigger className="h-8 w-20 shrink-0 text-xs" {...props}>
        <SelectValue placeholder="Mode" />
      </SelectTrigger>
      <SelectContent>
        {formats.map((format) => (
          <SelectItem className="text-xs" key={format} value={format}>
            {format.toUpperCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export type ColorPickerFormatProps = HTMLAttributes<HTMLDivElement>;

function HexInput({
  value,
  onChange,
  ...props
}: { value: string; onChange: (c: ColorInstance) => void } & Omit<
  ComponentProps<typeof Input>,
  "value" | "onChange"
>) {
  const [v, setV] = useState(value);

  useEffect(() => {
    setV((v) => (Color(v).hex() !== Color(value).hex() ? value : v));
  }, [value]);

  const handleChange = (v: string) => {
    try {
      onChange(Color(v));
    } catch (e) {} // eslint-disable-line @typescript-eslint/no-unused-vars, no-empty
  };

  return (
    <Input
      value={v}
      onChange={(e) => {
        const value = e.target.value;
        setV(value);
        handleChange(value);
      }}
      onBlur={() => {
        handleChange(v);
      }}
      {...props}
    />
  );
}

export function ColorPickerFormat({
  className,
  ...props
}: ColorPickerFormatProps) {
  const { color, mode, onChange } = useColorPicker();

  if (mode === "hex") {
    const hex = color.hex();

    return (
      <div
        className={cn(
          "-space-x-px relative flex w-full items-center rounded-md shadow-sm",
          className,
        )}
        {...props}
      >
        <HexInput
          className="h-8 px-2 text-xs shadow-none"
          type="text"
          value={hex}
          onChange={onChange}
        />
      </div>
    );
  }

  if (mode === "rgb") {
    const rgb = color
      .rgb()
      .array()
      .map((value) => Math.round(value));

    return (
      <div
        className={cn(
          "-space-x-px flex items-center rounded-md shadow-sm",
          className,
        )}
        {...props}
      >
        {rgb.map((value, index) => (
          <Input
            className={cn(
              "h-8 px-2 text-xs shadow-none",
              index && "rounded-l-none",
              index < rgb.length - 1 && "rounded-r-none",
              className,
            )}
            key={index}
            type="text"
            value={value}
            onChange={(e) => {
              const value = parseInt(e.target.value || "0", 10);
              if (isNaN(value)) return;
              const method = [
                "red" as const,
                "green" as const,
                "blue" as const,
              ][index];
              onChange(color[method](value));
            }}
          />
        ))}
      </div>
    );
  }

  if (mode === "hsl") {
    const hsl = color
      .hsl()
      .array()
      .map((value) => Math.round(value));

    return (
      <div
        className={cn(
          "-space-x-px flex items-center rounded-md shadow-sm",
          className,
        )}
        {...props}
      >
        {hsl.map((value, index) => (
          <Input
            className={cn(
              "h-8 px-2 text-xs shadow-none",
              index && "rounded-l-none",
              index < hsl.length - 1 && "rounded-r-none",
              className,
            )}
            key={index}
            type="text"
            value={value}
            onChange={(e) => {
              const value = parseInt(e.target.value || "0", 10);
              if (isNaN(value)) return;
              const method = [
                "hue" as const,
                "saturationl" as const,
                "lightness" as const,
              ][index];
              onChange(color[method](value));
            }}
          />
        ))}
      </div>
    );
  }

  return null;
}
