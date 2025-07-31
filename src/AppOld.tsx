import React, { useState, useRef, useEffect } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker?url";

import { arrayBufferCopy } from "@/lib/array-buffer";
import { pdfRender } from "@/lib/pdf";

GlobalWorkerOptions.workerSrc = workerUrl;

const PDFScale = 1.5;

export default function CertificateGenerator() {
  const [names, setNames] = useState("Alice Smith\nBob Johnson\nCarla Ruiz");
  const [templateBytes, setTemplateBytes] = useState(null);
  const [clickCoords, setClickCoords] = useState({ x: 150, y: 300 });
  const canvasRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const bytes = await file.arrayBuffer();
      setTemplateBytes(bytes);
    }
  };

  useEffect(() => {
    if (templateBytes && canvasRef.current) {
      const copy = arrayBufferCopy(templateBytes);
      const renderPDF = async () => {
        const pdf = await getDocument({ data: copy }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: PDFScale });

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: context,
          viewport,
        };

        await page.render(renderContext).promise;
      };

      renderPDF();
    }
  }, [templateBytes]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / PDFScale;
    const y = (canvas.height - (e.clientY - rect.top)) / PDFScale;
    setClickCoords({ x, y });
  };

  const replacePlaceholderText = async (pdfDoc, replacement) => {
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const page = pages[0];

    page.drawText(replacement, {
      x: clickCoords.x,
      y: clickCoords.y,
      size: 24,
      font,
      color: rgb(0, 0, 0),
    });
  };

  const generateCertificates = async () => {
    if (!templateBytes) {
      alert("Please upload a certificate template.");
      return;
    }

    const nameList = names.split("\n").filter(Boolean);
    const zip = new JSZip();

    for (const name of nameList) {
      const bufferCopy = arrayBufferCopy(templateBytes);
      const pdfDoc = await PDFDocument.load(bufferCopy);
      await replacePlaceholderText(pdfDoc, name);
      const pdfBytes = await pdfDoc.save();
      zip.file(`pdf-${name.replace(/\s+/g, "_")}.pdf`, pdfBytes);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, "certificates.zip");
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">Certificate Generator</h1>

      <div>
        <label className="block font-medium mb-1">
          Certificate Template (PDF):
        </label>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
        />
      </div>

      <div>
        <label className="block font-medium mb-1">
          Participant Names (one per line):
        </label>
        <textarea
          className="w-full border p-2 rounded"
          rows={6}
          value={names}
          onChange={(e) => setNames(e.target.value)}
        />
      </div>

      {templateBytes && (
        <div>
          <h2 className="text-lg font-semibold mb-2">
            Click on the template to place the name:
          </h2>
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="border cursor-crosshair"
          />
          <p className="text-sm mt-2">
            Selected position: x={clickCoords.x.toFixed(0)}, y=
            {clickCoords.y.toFixed(0)}
          </p>
        </div>
      )}

      <button
        onClick={generateCertificates}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Generate Certificates
      </button>
      <button
        onClick={async () => {
          if (templateBytes) {
            const bytes = await pdfRender(templateBytes, [
              {
                text: "Hello, pdf-lib!",
                x: clickCoords.x,
                y: clickCoords.y,
                size: 24,
                font: "Helvetica",
                color: rgb(0.98, 0.34, 0.11),
                alignment: "center",
              },
            ]);
            setTemplateBytes(bytes);
          }
        }}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Demo
      </button>
      <button onClick={async () => {}}>Test </button>
    </div>
  );
}
