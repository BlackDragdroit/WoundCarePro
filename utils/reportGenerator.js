import { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType, BorderStyle } from "docx";
import { formatDate } from "./dateHelpers";

export const generateWordReport = async (entry, patientName = "Patient") => {
  const children = [];

  // Helper to safely handle text inputs
  const safeText = (text, fallback = "-") => {
    if (text === null || text === undefined) return fallback;
    return String(text);
  };

  // --- Header ---
  children.push(
    new Paragraph({
      text: "WUNDDOKUMENTATION / VERLAUFSBERICHT",
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Datum: ", bold: true }),
        new TextRun(safeText(formatDate(entry.createdAt), "N/A")),
        new TextRun({ text: "\t\tPatient: ", bold: true }),
        new TextRun(safeText(patientName)),
      ],
      spacing: { after: 400 },
      border: {
        bottom: { color: "auto", space: 1, value: "single", size: 6 },
      },
    })
  );

  // --- Subjective ---
  children.push(
    new Paragraph({
      text: "SUBJEKTIV",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
    }),
    new Paragraph({
      text: "Patienteninteraktion dokumentiert. Keine akuten Beschwerden über den Basisstatus hinaus geäußert.",
    })
  );

  // --- Objective ---
  children.push(
    new Paragraph({
      text: "OBJEKTIV",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Lokalisation: ", bold: true }),
        new TextRun(safeText(entry.locationName, "Unbekannt")),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Maße: ", bold: true }),
        new TextRun(`L ${safeText(entry.length)}cm x B ${safeText(entry.width)}cm x T ${safeText(entry.depth)}cm`),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Wundphase: ", bold: true }),
        new TextRun(safeText(entry.phase)),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Exsudat: ", bold: true }),
        new TextRun(`${safeText(entry.exudateAmount)} / ${safeText(entry.exudateType)}`),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Wundränder: ", bold: true }),
        new TextRun(safeText(entry.edges)),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Wundumgebung: ", bold: true }),
        new TextRun(safeText(entry.surroundings)),
      ],
    })
  );

  // --- Image Handling ---
  if (entry.imageUrl) {
    try {
      // Fetch the image data
      const response = await fetch(entry.imageUrl);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
      
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      if (arrayBuffer.byteLength > 0) {
        children.push(
          new Paragraph({
            text: "FOTODOKUMENTATION",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 100 },
          }),
          new Paragraph({
            children: [
              new ImageRun({
                data: arrayBuffer,
                transformation: {
                  width: 400,
                  height: 300,
                },
              }),
            ],
            alignment: AlignmentType.CENTER,
          })
        );
      }
    } catch (error) {
      console.error("Error fetching image for report:", error);
      children.push(
        new Paragraph({
          children: [
            new TextRun({ 
              text: "[Bild konnte nicht geladen werden]", 
              color: "FF0000",
              italics: true
            })
          ],
          spacing: { before: 200 }
        })
      );
    }
  }

  // --- Assessment ---
  children.push(
    new Paragraph({
      text: "BEURTEILUNG",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 100 },
    }),
    new Paragraph({
      text: "Wundstatus erfasst. Therapieanpassung basierend auf aktuellem Erscheinungsbild.",
    })
  );

  // --- Plan ---
  children.push(
    new Paragraph({
      text: "THERAPIEPLAN",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Reinigung: ", bold: true }),
        new TextRun(safeText(entry.cleanser, "Standardprotokoll")),
      ],
      bullet: { level: 0 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Wundfüller: ", bold: true }),
        new TextRun(safeText(entry.filler, "Keiner")),
      ],
      bullet: { level: 0 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Verband: ", bold: true }),
        new TextRun(safeText(entry.dressing, "Keiner")),
      ],
      bullet: { level: 0 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Kompression: ", bold: true }),
        new TextRun(entry.compression === 'Ja' ? safeText(entry.compressionType, "Unspezifiziert") : 'Keine'),
      ],
      bullet: { level: 0 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Nächster Verbandswechsel: ", bold: true }),
        new TextRun(safeText(entry.frequency, "48 Stunden")),
      ],
      bullet: { level: 0 },
    })
  );

  // --- Notes ---
  if (entry.notes) {
    children.push(
      new Paragraph({
        text: "NOTIZEN",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 100 },
      }),
      new Paragraph({
        text: safeText(entry.notes),
        style: "IntenseQuote", 
      })
    );
  }

  // --- Create Document ---
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children,
      },
    ],
  });

  return await Packer.toBlob(doc);
};
