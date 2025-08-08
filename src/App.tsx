import { useState, useEffect, useRef } from "react";
import { FileUp, X, Plus, Package, PartyPopper } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Tour } from "@/components/tour";
import { waitForSelector } from "@/lib/elements";

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

const InitialSteps = [
  {
    content:
      "This app helps you effortlessly create multiple personalized PDFs from a single template. Imagine you have a certificate design, and you need to generate one for each speaker at a conference. Instead of manually editing each certificate, you can use this app to quickly produce all of them!",
  },
  {
    selector: '[data-tour="file"]',
    content: (
      <p className="text-sm">
        To get started, please{" "}
        <span className="font-bold">upload your PDF template</span> here. This
        file will be the base for all the documents you generate.
      </p>
    ),
  },
];

const AddVariableSteps = [
  {
    selector: '[data-tour="variables"]',
    content: (
      <p className="text-sm pb-1">
        Variables are special placeholders in your template that will be
        replaced with real data. For instance, if you're making certificates,
        you might have variables for the "Speaker Name" and "Talk Title."
      </p>
    ),
    position: "w" as const,
  },
  {
    selector: '[data-tour="variable-add"]',
    content: (
      <p className="text-sm">
        Click <span className="font-bold">this button</span> to start adding
        these placeholders.
      </p>
    ),
    position: "sw" as const,
  },
];

const VariableSteps = [
  {
    selector: '[data-tour="variable"]',
    content: (
      <p className="text-sm pb-1">
        This panel is where you'll define everything about your variable,
        including its{" "}
        <span className="font-bold">
          text alignment, position, font face, font size, and color
        </span>
        .
      </p>
    ),
    position: "w" as const,
  },
  {
    selector: '[data-tour="variable-align"]',
    content: (
      <>
        <p className="text-sm pb-1">
          You can control how the text for each variable is aligned within its
          placeholder.
        </p>
        <p className="text-sm">
          Use the <span className="font-bold">alignment options</span> to choose
          if you want your text aligned to the left, centered, or to the right.
        </p>
      </>
    ),
    position: "sw" as const,
  },
  {
    selector: '[data-tour="variable-position"]',
    content: (
      <p className="text-sm">
        You have multiple ways to place and size your variable on the PDF. In
        this section, you can manually enter the{" "}
        <span className="font-bold">X and Y coordinates</span> for precise
        placement. Alternatively, you can click the placement button and then
        click anywhere on the PDF preview to set the initial position of your
        variable. After it's placed, you can also{" "}
        <span className="font-bold">drag and resize the variable box</span>{" "}
        directly on the preview until it looks just right.
      </p>
    ),
    position: "w" as const,
  },
  {
    selector: '[data-tour="variable-position-button"]',
    content: (
      <>
        <p className="text-sm">
          Click this button, then simply{" "}
          <span className="font-bold">click on the PDF preview</span> where
          you'd like your variable to appear. The app will snap it into place!
        </p>
      </>
    ),
    position: "w" as const,
  },
  {
    selector: '[data-tour="variable-fontface"]',
    content: (
      <>
        <p className="text-sm">
          Use this <span className="font-bold">Font Face selector</span> to
          choose from a variety of available fonts.
        </p>
      </>
    ),
    position: "w" as const,
  },
  {
    selector: '[data-tour="variable-fontsize"]',
    content: (
      <>
        <p className="text-sm">You can also adjust the size of your text.</p>
        <p className="text-sm">
          Use this <span className="font-bold">Font Size selector</span> to
          choose how big or small you want your font to be.
        </p>
      </>
    ),
    position: "w" as const,
  },
  {
    selector: '[data-tour="variable-fontsize-auto"]',
    content: (
      <>
        <p className="text-sm">We've got a smart way to handle font sizes!</p>
        <p className="text-sm">
          If you leave this <span className="font-bold">checkbox checked</span>,
          you can manually set the size yourself in the font size section.
        </p>
        <p className="text-sm">
          {" "}
          If you <span className="font-bold">uncheck it</span>, the app will
          automatically calculate and use the largest possible font size that
          fits your placeholder.{" "}
        </p>
      </>
    ),
    position: "w" as const,
  },
  {
    selector: '[data-tour="variable-fontcolor"]',
    content: (
      <p className="text-sm">
        Use this <span className="font-bold">color picker</span> to select a
        color for your variable's text.
      </p>
    ),
    position: "w" as const,
  },
  {
    selector: '[data-tour="button-generate"]',
    content: (
      <>
        <p className="text-sm">
          Once you've set up all your variables and their properties, it's time
          to bring your PDFs to life!
        </p>
        <p className="text-sm">
          When you're happy with everything, click the{" "}
          <span className="font-bold">"Generate"</span> button to create all
          your personalized PDFs in bulk!
        </p>
      </>
    ),
    position: "sw" as const,
  },
];

const PlaceholderSteps = [
  {
    selector: '[data-tour="placeholder"]',
    content: (
      <div className="flex flex-col items-center space-y-2">
        <PartyPopper className="w-12 h-12" />
        <p className="text-sm">
          You've successfully placed your variable! Remember, you can{" "}
          <span className="font-bold">drag the variable box</span> to reposition
          it anywhere on your document. You can also use the handles on the
          corners of the box to <span className="font-bold">resize it</span> and
          fit your content perfectly.
        </p>
      </div>
    ),
  },
];

const GenerateSteps = [
  {
    content:
      "Let's get your PDFs generated. The final step is to tell the app what to name your files and what data to use.",
  },
  {
    selector: '[data-tour="generate-filename"]',
    content: (
      <p className="text-sm">
        In the <span className="font-bold">File Name</span> field, you can set a
        name for your generated PDFs. You can use placeholders like{" "}
        <Badge>&#123;index&#125;</Badge> to number each file, or even use your
        variables! For example, if you set the name to{" "}
        <Badge>&#123;variable-1&#125;-certificate.pdf</Badge>, your files might
        be named "John Doe-certificate.pdf" and "Jane Smith-certificate.pdf".
      </p>
    ),
    position: "s" as const,
  },
  {
    selector: '[data-tour="generate-data"]',
    content: (
      <div className="space-y-1">
        <p className="text-sm">
          This is where you'll put the information that will fill your
          variables.
        </p>
        <p className="text-sm">
          The easiest way to do this is to copy and paste data directly from a
          spreadsheet program like Google Sheets or Microsoft Excel.
        </p>
        <ul className="text-sm list-disc ml-6">
          <li>Each row of your spreadsheet will become a new PDF.</li>
          <li>
            The first column will be used for the first variable, the second for
            the second one, and so on.
          </li>
        </ul>
        <p className="text-sm">
          Just copy the cells from your spreadsheet and paste them into the Data
          text box.
        </p>
      </div>
    ),
    position: "s" as const,
    className: "w-[800px] -translate-y-3/4",
  },
  {
    selector: '[data-tour="generate-button"]',
    content: (
      <p className="text-sm">
        Once your data is in place, you're all set! Click the{" "}
        <span className="font-bold">"Generate"</span> button to create all of
        your personalized PDFs.
      </p>
    ),
    position: "nw" as const,
  },
];

function App() {
  const [tour, setTour] = useState<
    | null
    | "initial"
    | "file"
    | "add-variable"
    | "variable"
    | "placeholder"
    | "generate"
  >("initial");
  const [file, setFile] = useState(DefaultFile);
  const [variables, setVariables] = useState<VariableObjectWithKey[]>([]);
  const [isClicking, setIsClicking] = useState<
    VariableObjectWithKey["key"] | null
  >(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasAlreadyOpenedGenerateDialogRef = useRef(false);

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
    <>
      <Tour
        open={tour === "initial"}
        steps={InitialSteps}
        onClose={() => setTour(null)}
      />
      <Tour
        open={tour === "add-variable"}
        steps={AddVariableSteps}
        onClose={() => setTour(null)}
      />
      <Tour
        open={tour === "variable"}
        steps={VariableSteps}
        onClose={() => setTour(null)}
      />
      <Tour
        open={tour === "placeholder"}
        steps={PlaceholderSteps}
        onClose={() => setTour(null)}
      />
      <Tour
        open={tour === "generate"}
        steps={GenerateSteps}
        onClose={() => setTour(null)}
      />
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      data-tour="button-generate"
                      onClick={() => {
                        if (!hasAlreadyOpenedGenerateDialogRef.current) {
                          // hasAlreadyOpenedGenerateDialogRef.current = true;
                          setTour("generate");
                        }
                      }}
                    >
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
                            const placedVariables = variables.filter(
                              (v) => v.x || v.y,
                            );

                            if (placedVariables.length === 0) {
                              waitForSelector(PlaceholderSteps[0].selector)
                                .then(() => setTour("placeholder"))
                                .catch(console.warn);
                            }
                          }
                        : undefined
                    }
                  />
                </>
              ) : (
                <label
                  className="flex flex-col items-center space-y-2"
                  data-tour="file"
                >
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
                      setTour("add-variable");
                    }}
                  />
                </label>
              )}
            </div>
          </div>
          <div
            className="w-[250px] overflow-y-auto space-y-2 pr-4 pb-4"
            data-tour="variables"
          >
            <div className="flex justify-between">
              <Label className="text-lg">Variables</Label>
              <Button
                data-tour="variable-add"
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

                  if (variables.length === 0) setTour("variable");
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
    </>
  );
}

export default App;
