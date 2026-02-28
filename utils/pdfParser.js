import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

export const extractTextFromPDF = async (fileBuffer) => {
  try {
    const uint8Array = new Uint8Array(fileBuffer);

    const loadingTask = pdfjsLib.getDocument({
      data: uint8Array,
      useSystemFonts: true
    });

    const pdf = await loadingTask.promise;

    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      const strings = content.items.map(item => item.str);
      fullText += strings.join(" ") + "\n";
    }

    return fullText;

  } catch (error) {
    console.error("PDF Parse Error:", error);
    throw new Error("Failed to parse PDF");
  }
};