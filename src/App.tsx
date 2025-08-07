import { useState, useEffect, useRef } from "react";
import { FileUp, X, Plus, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Pdf } from "@/components/ui/pdf";
import {
  pdfRender,
  rgb,
  type TextVariable,
  type DrawnVariable,
} from "@/lib/pdf";

import { Variable } from "@/components/variable";
import { GenerateDialog } from "@/components/generate-dialog";
import {
  Placeholders,
  type VariableObjectWithKey,
} from "@/components/placeholders";

// const PDFScale = 1.5;
const PDFScale = 1.5;
interface FileState {
  name?: string;
  current: ArrayBuffer | null;
  drawn?: Record<string, DrawnVariable>;
  template: ArrayBuffer | null;
}
const DefaultFile: FileState = { template: null, current: null };

const DefaultVariable: VariableObjectWithKey = {
  key: "default",
  x: 0,
  y: 0,
  font: "Helvetica",
  size: 24,
  alignment: "left",
  color: rgb(0, 0, 0),
};
function App() {
  const [file, setFile] = useState(DefaultFile);
  const [variables, setVariables] = useState<VariableObjectWithKey[]>([]);
  const [isClicking, setIsClicking] = useState<
    VariableObjectWithKey["key"] | null
  >(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!file.template) return;
    let cancel = false;
    const timeout = setTimeout(async () => {
      if (!file.template) return;
      const texts = (variables || []).reduce<
        (TextVariable & { key: string })[]
      >((vs, v, i) => {
        if (v.x && v.y && v.size) {
          vs.push({
            ...v,
            text: `Variable ${i + 1}`,
            key: v.key,
          });
        }
        return vs;
      }, []);
      const current = await pdfRender(file.template, texts);
      if (cancel) return;
      setFile((f) => ({
        ...f,
        current: current.document,
        drawn: texts.reduce<Record<string, DrawnVariable>>((texts, text, i) => {
          const drawn = current.variables[i];
          if (drawn) {
            const v = variables.find((v) => v.key === text.key);
            if (v) {
              texts[v.key] = drawn;
            }
          }
          return texts;
        }, {}),
      }));
    }, 250);
    return () => {
      cancel = true;
      clearTimeout(timeout);
    };
  }, [file?.template, variables]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className="flex flex-row items-start justify-between space-y-2 py-4 h-16 px-4 border-b">
        <h1 className="text-lg font-semibold text-nowrap">Bulk PDF</h1>
        <div className="ml-auto flex w-full space-x-2 sm:justify-end">
          {file?.name ? (
            <div className="flex gap-2">
              <Input readOnly value={file.name} />
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setFile(DefaultFile)}
                className="size-8"
              >
                <X />
              </Button>
              {file.template ? (
                <GenerateDialog
                  variables={variables}
                  template={file.template}
                  name={file.name}
                >
                  <Button variant="outline" size="sm" className="h-8">
                    <Package />
                    Generate
                  </Button>
                </GenerateDialog>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden m-4 mr-0 space-x-4">
        <div className="flex-1">
          <div className="w-full h-full border-input rounded-md border bg-transparent shadow-xs flex items-center justify-center relative">
            {file?.current ? (
              <>
                {file.drawn ? (
                  <Placeholders
                    variables={variables}
                    drawn={file.drawn}
                    canvasRef={canvasRef}
                    scale={PDFScale}
                    onChange={(ev) => {
                      setVariables((variables) =>
                        variables.map((v) => {
                          if (v.key !== ev.key) return v;
                          if (ev.event === "move")
                            return { ...v, x: ev.x, y: ev.y };
                          return {
                            ...v,
                            x: ev.x,
                            y: ev.y,
                            w: ev.w,
                            h: ev.h,
                          };
                        }),
                      );
                    }}
                  />
                ) : null}
                <Pdf
                  ref={canvasRef}
                  bytes={file?.current}
                  scale={PDFScale}
                  onClick={
                    isClicking
                      ? ({ x, y }) => {
                          x = parseFloat(x.toFixed(2));
                          y = parseFloat(y.toFixed(2));
                          const key = isClicking;
                          setVariables((variables) => {
                            const vs = [...variables];
                            for (let i = 0; i < vs.length; i++) {
                              const v = vs[i];
                              if (v.key === key) {
                                vs[i] = {
                                  ...vs[i],
                                  x,
                                  y,
                                };
                                delete vs[i].w;
                                delete vs[i].h;
                              }
                            }

                            return vs;
                          });
                          setIsClicking(null);
                        }
                      : undefined
                  }
                />
              </>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <FileUp />
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={async (e) => {
                    const file = e.target?.files?.[0];
                    if (!file) return;
                    const bytes = await file.arrayBuffer();
                    if (!bytes) return;

                    setFile({
                      name: file.name,
                      template: bytes,
                      current: bytes,
                    });
                  }}
                />
              </div>
            )}
          </div>
        </div>
        <div className="w-[250px] overflow-y-auto space-y-2 pr-4 pb-4">
          <div className="flex justify-between">
            <Label className="text-lg">Variables</Label>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => {
                setVariables((v) => {
                  const variables = [...v];
                  variables.push({
                    ...DefaultVariable,
                    key: `${Math.round(Math.random() * 1000)}`,
                  });

                  return variables;
                });
              }}
            >
              <Plus />
            </Button>
          </div>
          {variables.map((variable, i) => (
            <Variable
              className={
                variable.key === isClicking ? "animate-pulse" : undefined
              }
              key={variable.key}
              index={i + 1}
              variable={variable}
              onChange={(ev) => {
                setVariables((variables) => {
                  const vs = [...variables];
                  for (let i = 0; i < vs.length; i++) {
                    const v = vs[i];
                    if (v.key === variable.key) {
                      vs[i] = {
                        ...vs[i],
                        [ev.key]: ev.value,
                      };
                    }
                  }

                  return vs;
                });
              }}
              onDelete={() => {
                setVariables((variables) =>
                  variables.filter((v) => v.key !== variable.key),
                );
                if (isClicking === variable.key) setIsClicking(null);
              }}
              onPosition={() => {
                setIsClicking(variable.key);
              }}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
