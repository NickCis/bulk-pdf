import type { PropsWithChildren } from "react";
import { useFormik } from "formik";
import JSZip from "jszip";
import { saveAs } from "file-saver";

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
import { pdfRender } from "@/lib/pdf";
import { type VariableObject } from "./variable";

interface ContentProps {
  template: ArrayBuffer;
  variables: VariableObject[];
}

function Content({ variables, template }: ContentProps) {
  const formik = useFormik({
    initialValues: {
      filename: "{0}.pdf",
      data: "",
    },
    onSubmit: async (values) => {
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
        const row = rows[i];
        const bytes = await pdfRender(
          template,
          (variables || [])
            .filter(({ x, y, size }, i) => row[i] && x && y && size)
            .map((v, i) => ({
              ...v,
              text: row[i],
            })),
        );
        let filename = (values.filename || "1.pdf").replace("{index}", `${i}`);
        for (let ii = 0; ii < row.length; ii++) {
          const value = (row[ii] || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "-")
            .replace(/[^a-zA-Z0-9\-_]/g, "");
          filename = filename.replace(`{${ii}}`, value || "");
        }
        zip.file(filename, bytes);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, "files.zip");
    },
  });

  return (
    <DialogContent className="sm:max-w-[80%] h-[90%]">
      <form
        onSubmit={formik.handleSubmit}
        className="h-full w-full flex flex-col min-h-0"
      >
        <DialogHeader>
          <DialogTitle>Generate PDFs</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-4 overflow-auto -mx-4 px-4 py-2 flex-1">
          <div className="grid gap-3">
            <Label>File Name</Label>
            <Input
              name="filename"
              onChange={formik.handleChange}
              value={formik.values.filename}
            />
          </div>
          <div className="flex flex-col space-y-3 flex-1">
            <Label>Data</Label>
            <Textarea
              className="flex-1"
              name="data"
              onChange={formik.handleChange}
              value={formik.values.data}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Generate</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
export function GenerateDialog({
  children,
  variables,
  template,
}: PropsWithChildren<ContentProps>) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <Content variables={variables} template={template} />
    </Dialog>
  );
}
