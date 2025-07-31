import { useState, useEffect } from "react";
import { RotateCcw, FileUp, X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Pdf } from "@/components/ui/pdf";
import { pdfRender, rgb } from "@/lib/pdf";

import { Variable } from "@/components/variable";

const PDFScale = 1;
const DefaultFile = { template: null, current: null };
const DefaultVariable = {
  x: 0,
  y: 0,
  font: "Helvetica",
  size: 24,
  alignment: "left",
  color: rgb(0, 0, 0),
};
function App() {
  const [file, setFile] = useState(DefaultFile);
  const [variables, setVariables] = useState([]);
  const [isClicking, setIsClicking] = useState();
  useEffect(() => {
    if (!file.template) return;
    let cancel = false;
    (async () => {
      const current = await pdfRender(
        file.template,
        (variables || [])
          .filter(({ x, y, size }) => x && y && size)
          .map((v, i) => ({
            ...v,
            text: `Variable ${i + 1}`,
          })),
      );
      if (cancel) return;
      setFile((f) => ({ ...f, current }));
    })();
    return () => {
      cancel = true;
    };
  }, [file?.template, variables]);

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex flex-row items-start justify-between space-y-2 py-4 h-16 px-4">
        <h1 className="text-lg font-semibold text-nowrap">Bulk PDF</h1>
        <div className="ml-auto flex w-full space-x-2 sm:justify-end">
          {file?.name ? (
            <div className="flex gap-2">
              <Input readOnly value={file.name} />
              <Button
                variant="destructive"
                size="icon"
                onClick={() => setFile(DefaultFile)}
                className="size-8"
              >
                <X />
              </Button>
            </div>
          ) : null}
        </div>
      </div>
      <Separator />
      <div className="h-full py-6 px-4 grid items-stretch gap-6 grid-cols-[1fr_200px]">
        <div className="mt-0 border-0 p-0">
          <div className="flex h-full flex-col space-y-4">
            {file?.current ? (
              <Pdf
                bytes={file.current}
                className="flex-1 p-0"
                scale={PDFScale}
                onClick={
                  isClicking
                    ? ({ x, y }) => {
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
                            }
                          }

                          return vs;
                        });
                        setIsClicking(null);
                      }
                    : undefined
                }
              />
            ) : (
              <div className="flex-1 p-4 border-input w-full rounded-md border bg-transparent shadow-xs flex items-center justify-center">
                <div className="flex flex-col items-center space-y-2">
                  <FileUp />
                  <Input
                    type="file"
                    accept="application/pdf"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const bytes = await file.arrayBuffer();
                        setFile({
                          name: file.name,
                          template: bytes,
                          current: bytes,
                        });
                      }
                    }}
                  />
                </div>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Button>Submit</Button>
              <Button variant="secondary">
                <span className="sr-only">Show history</span>
                <RotateCcw />
              </Button>
            </div>
          </div>
        </div>
        <div className="flex-col space-y-4 flex">
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
                    key: Math.round(Math.random() * 1000),
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
      </div>
    </div>
  );
}

export default App;
