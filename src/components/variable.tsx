import { useMemo, useState, type ComponentProps } from "react";
import Color from "color";
import {
  X,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Check,
  ChevronsUpDown,
  MousePointerClick,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { FontsByName } from "@/lib/pdf";
import { cn } from "@/lib/utils";
import {
  HexColorPicker as ColorPicker,
  ColorPickerFormat,
  ColorPickerHue,
  ColorPickerOutput,
  ColorPickerSelection,
  ColorPickerEyeDropper,
} from "@/components/ui/shadcn-io/color-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { rgb, type TextVariable } from "@/lib/pdf";

export type VariableObject = Omit<TextVariable, "text">;

function AlignItem({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="tabs-trigger"
      className={cn(
        "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function toRGBString(color: ReturnType<typeof rgb>): string {
  if (color) {
    return `#${[
      (color.red as number) * 255,
      color.green * 255,
      color.blue * 255,
    ]
      .map((n) => Math.round(n).toString(16).padStart(2, "0"))
      .join("")}`;
  }

  return "#000000";
}

export interface VariableProps {
  index: number | string;
  variable: VariableObject;
  onChange: <K extends keyof VariableObject>(ev: {
    key: K;
    value: VariableObject[K];
  }) => void;
  onDelete: () => void;
  className?: string;
  onPosition: () => void;
}

export function Variable({
  index,
  variable,
  onChange,
  onDelete,
  className,
  onPosition,
}: VariableProps) {
  const [open, setOpen] = useState<"font-face" | "font-color" | null>(null);
  const fonts = useMemo(() => {
    const fonts = Object.keys(FontsByName);
    fonts.sort((a, b) => a.localeCompare(b));
    return fonts;
  }, []);

  return (
    <Card className={cn("w-full py-4 gap-2", className)} data-tour="variable">
      <CardHeader className="px-2">
        <CardTitle>Variable {index}</CardTitle>
        <CardAction>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={onDelete}
          >
            <X />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2">
        <div className="flex flex-col gap-6">
          <div className="grid gap-2" data-tour="variable-align">
            <Label>Align</Label>
            <div className="flex justify-center">
              <div className="bg-muted text-muted-foreground inline-flex w-fit items-center justify-center rounded-lg p-[3px]">
                <AlignItem
                  data-state={
                    variable.alignment === "left" ? "active" : undefined
                  }
                  onClick={() => onChange({ key: "alignment", value: "left" })}
                >
                  <AlignLeft />
                </AlignItem>
                <AlignItem
                  data-state={
                    variable.alignment === "center" ? "active" : undefined
                  }
                  onClick={() =>
                    onChange({ key: "alignment", value: "center" })
                  }
                >
                  <AlignCenter />
                </AlignItem>
                <AlignItem
                  data-state={
                    variable.alignment === "right" ? "active" : undefined
                  }
                  onClick={() => onChange({ key: "alignment", value: "right" })}
                >
                  <AlignRight />
                </AlignItem>
              </div>
            </div>
          </div>
          <div className="grid gap-2" data-tour="variable-position">
            <div className="flex space-x-2 justify-between">
              <Label>Position</Label>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    onClick={onPosition}
                    data-tour="variable-position-button"
                  >
                    <MousePointerClick />
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent
                  align="start"
                  className="w-[260px] text-sm"
                  side="left"
                >
                  Use this button to select in the PDF where the variable will
                  be placed.
                </HoverCardContent>
              </HoverCard>
            </div>
            <div className="flex space-x-2 justify-center">
              <Input
                type="number"
                placeholder="x"
                value={variable.x || ""}
                onChange={(ev) => {
                  const value = parseFloat(ev.target.value);
                  onChange({
                    key: "x",
                    value: isNaN(value) ? 0 : value,
                  });
                }}
              />
              <Input
                type="number"
                placeholder="y"
                value={variable.y || ""}
                onChange={(ev) => {
                  const value = parseFloat(ev.target.value);
                  onChange({
                    key: "y",
                    value: isNaN(value) ? 0 : value,
                  });
                }}
              />
            </div>
          </div>
          <div className="grid gap-2" data-tour="variable-fontface">
            <div className="flex space-x-2 justify-between">
              <Label>Font Face</Label>
              <Button size="icon" variant="ghost" className="size-8" asChild>
                <a
                  href="https://fonts.google.com/"
                  target="_blank"
                  rel="noopener"
                >
                  <Search />
                </a>
              </Button>
            </div>
            <Popover
              open={open === "font-face"}
              onOpenChange={(o) => setOpen(o ? "font-face" : null)}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open === "font-face"}
                  className="w-full justify-between"
                >
                  {variable.font ? variable.font : "Select Font..."}
                  <ChevronsUpDown className="opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[250px] p-0">
                <Command loop>
                  <CommandList className="h-[var(--cmdk-list-height)] max-h-[400px]">
                    <CommandInput placeholder="Select Font..." />
                    {fonts.map((font) => {
                      const selected = font === variable.font;
                      return (
                        <CommandItem
                          key={font}
                          onSelect={() => {
                            onChange({ key: "font", value: font });
                            setOpen(null);
                          }}
                          data-selected={selected ? "true" : undefined}
                          className="data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground"
                        >
                          {font}
                          <Check
                            className={cn(
                              "ml-auto",
                              selected ? "opacity-100" : "opacity-0",
                            )}
                          />
                        </CommandItem>
                      );
                    })}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2" data-tour="variable-fontsize">
            <div className="flex space-x-2 justify-between">
              <Label>Font Size</Label>
              <Checkbox
                data-tour="variable-fontsize-auto"
                checked={!variable.contain}
                onCheckedChange={(checked) =>
                  onChange({ key: "contain", value: !checked })
                }
              />
            </div>
            <Input
              disabled={variable.contain}
              onChange={(ev) => {
                const value = parseFloat(ev.target.value);
                onChange({
                  key: "size",
                  value: isNaN(value) ? 0 : value,
                });
              }}
              type={variable.contain ? "text" : "number"}
              placeholder="Font Size"
              value={variable.contain ? "auto" : variable.size || ""}
            />
          </div>
          <div className="grid gap-2" data-tour="variable-fontcolor">
            <Label>Font Color</Label>
            <Popover
              open={open === "font-color"}
              onOpenChange={(o) => setOpen(o ? "font-color" : null)}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  aria-expanded={open === "font-color"}
                  className="w-full justify-start"
                >
                  {variable.color ? (
                    <>
                      <div
                        className="h-[12px] w-[12px]"
                        style={{
                          background: toRGBString(variable.color),
                        }}
                      />
                      <span className="flex-1 text-left">
                        {toRGBString(variable.color)}
                      </span>
                    </>
                  ) : (
                    <span className="flex-1">Select Color...</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="center"
                className="w-[250px] h-[350px] p-0"
              >
                <ColorPicker
                  className="max-w-sm rounded-md border bg-background p-4 shadow-sm"
                  onChange={(hex) => {
                    const color = Color(hex).rgb().object();
                    onChange({
                      key: "color",
                      value: rgb(color.r / 255, color.g / 255, color.b / 255),
                    });
                  }}
                  value={toRGBString(variable.color)}
                >
                  <ColorPickerSelection />
                  <div className="flex items-center gap-4">
                    <ColorPickerEyeDropper />
                    <div className="grid w-full gap-1">
                      <ColorPickerHue />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ColorPickerOutput />
                    <ColorPickerFormat />
                  </div>
                </ColorPicker>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
