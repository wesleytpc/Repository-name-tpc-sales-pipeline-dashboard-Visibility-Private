const pageWidth = 595;
const pageHeight = 842;
const margin = 48;
const lineHeight = 16;

type PdfLine = {
  text: string;
  size?: number;
  bold?: boolean;
  gapAfter?: number;
};

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapText(text: string, maxChars = 92) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function buildPageContent(lines: PdfLine[]) {
  let y = pageHeight - margin;
  const commands: string[] = ["BT"];

  for (const line of lines) {
    const font = line.bold ? "F2" : "F1";
    const size = line.size ?? 10;
    const wrapped = wrapText(line.text, size >= 16 ? 62 : 92);

    for (const wrappedLine of wrapped) {
      if (y < margin) break;
      commands.push(`/${font} ${size} Tf`);
      commands.push(`${margin} ${y} Td`);
      commands.push(`(${escapePdfText(wrappedLine)}) Tj`);
      commands.push(`${-margin} ${-y} Td`);
      y -= lineHeight + Math.max(0, size - 10);
    }
    y -= line.gapAfter ?? 4;
  }

  commands.push("ET");
  return commands.join("\n");
}

export function createSimplePdf(lines: PdfLine[]) {
  const content = buildPageContent(lines);
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf-8");
}
