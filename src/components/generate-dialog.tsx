import type { PropsWithChildren } from "react";
import { useFormik } from "formik";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { pdfRender, type TextVariable } from "@/lib/pdf";
import { type VariableObject } from "./variable";

interface ContentProps {
  template: ArrayBuffer;
  variables: VariableObject[];
  name?: string;
}

function normalizeForPath(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9\-_]/g, "");
}

function Content({ variables, template, name }: ContentProps) {
  const formik = useFormik({
    initialValues: {
      filename: "{variable-1}.pdf",
      data: "",
    },
    onSubmit: async (values) => {
      await new Promise((rs) => setTimeout(rs, 5000));
      if (!template) return;
      const rows = values.data
        .split("\n")
        .map((l) =>
          l
            ?.trim?.()
            ?.split?.("\t")
            ?.map?.((v) => v?.trim?.()),
        )
        .filter((r) => r?.length);

      const zip = new JSZip();

      for (let i = 0; i < rows.length; i++) {
        try {
          const row = rows[i];
          const { document: bytes } = await pdfRender(
            template,
            (variables || []).reduce<TextVariable[]>((vs, v, i) => {
              if (row[i] && v.x && v.y && v.size) {
                vs.push({
                  ...v,
                  text: row[i],
                });
              }
              return vs;
            }, []),
          );
          let filename = (values.filename || "1.pdf").replace(
            "{index}",
            `${i + 1}`,
          );
          for (let ii = 0; ii < row.length; ii++) {
            const value = normalizeForPath(row[ii] || "");
            filename = filename.replace(`{variable-${ii + 1}}`, value || "");
          }
          zip.file(filename, bytes);
        } catch (e) {
          console.error(e);
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipName = `${normalizeForPath(name?.split?.(".")?.[0] || "files")}.zip`;
      saveAs(zipBlob, zipName);
    },
  });

  return (
    <DialogContent
      className="sm:max-w-[80%] h-[90%]"
      aria-describedby={undefined}
    >
      <form
        onSubmit={formik.handleSubmit}
        className="h-full w-full flex flex-col min-h-0"
      >
        <DialogHeader>
          <DialogTitle>Generate PDFs</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-4 overflow-auto -mx-4 px-4 py-2 flex-1">
          <div className="grid gap-3" data-tour="generate-filename">
            <Label>File Name</Label>
            <Input
              disabled={formik.isSubmitting}
              name="filename"
              onChange={formik.handleChange}
              value={formik.values.filename}
            />
          </div>
          <div
            className="flex flex-col space-y-3 flex-1"
            data-tour="generate-data"
          >
            <Label>Data</Label>
            <Textarea
              disabled={formik.isSubmitting}
              className="flex-1"
              name="data"
              onChange={formik.handleChange}
              value={formik.values.data}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            disabled={formik.isSubmitting}
            data-tour="generate-button"
          >
            {formik.isSubmitting ? (
              <>
                <Loader2Icon className="animate-spin" />
                Loading...
              </>
            ) : (
              "Generate"
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

export function GenerateDialog({
  children,
  variables,
  template,
  name,
}: PropsWithChildren<ContentProps>) {
  return (
    <Dialog modal={false}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <Content variables={variables} template={template} name={name} />
    </Dialog>
  );
}
