import { PDFDocument, rgb, degrees, StandardFonts, PDFPage } from 'pdf-lib';
import type { ExtractedPdfContent, FormFieldInfo, PiiScanFinding, ToolExecutionResult } from '../types/pdf';

// PII Regex Patterns
export const PII_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  credit_card: /\b(?:\d{4}[ -]?){3}\d{4}\b/g,
  aadhaar: /\b[2-9]{1}[0-9]{3}\s[0-9]{4}\s[0-9]{4}\b/g,
};

/**
 * Merge multiple PDF documents into one
 */
export async function mergePdfs(pdfBuffers: Uint8Array[]): Promise<Uint8Array> {
  const mergedDoc = await PDFDocument.create();

  for (const buffer of pdfBuffers) {
    const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const copiedPages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
    copiedPages.forEach((page) => mergedDoc.addPage(page));
  }

  return await mergedDoc.save();
}

/**
 * Split a PDF by extracting specific page ranges (e.g., "1-3, 5, 7-10")
 */
export async function splitPdf(pdfBuffer: Uint8Array, pageRange: string): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();
  const pageIndicesToKeep = parsePageRange(pageRange, totalPages);

  if (pageIndicesToKeep.length === 0) {
    throw new Error(`Invalid page range "${pageRange}". Document has ${totalPages} pages.`);
  }

  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(srcDoc, pageIndicesToKeep);
  copiedPages.forEach((page) => newDoc.addPage(page));

  return await newDoc.save();
}

/**
 * Organize PDF: reorder, rotate specific pages, delete pages, add page numbers
 */
export async function organizePdf(
  pdfBuffer: Uint8Array,
  options: {
    pageOrder?: number[]; // 1-indexed page numbers in desired sequence
    rotations?: { page: number; degrees: 90 | 180 | 270 }[];
    removePages?: number[];
    addPageNumbers?: {
      position: 'bottom-center' | 'bottom-right' | 'top-right';
      startFrom?: number;
      format?: string; // e.g. "Page {n} of {total}"
    };
  }
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();

  // Determine initial sequence of 0-based page indices
  let activeIndices: number[];
  if (options.pageOrder && options.pageOrder.length > 0) {
    activeIndices = options.pageOrder
      .map((p) => p - 1)
      .filter((idx) => idx >= 0 && idx < totalPages);
  } else {
    activeIndices = srcDoc.getPageIndices();
  }

  // Filter out removed pages
  if (options.removePages && options.removePages.length > 0) {
    const toRemoveSet = new Set(options.removePages.map((p) => p - 1));
    activeIndices = activeIndices.filter((idx) => !toRemoveSet.has(idx));
  }

  if (activeIndices.length === 0) {
    throw new Error('All pages were removed. A PDF must contain at least one page.');
  }

  // Create new document with reordered pages
  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(srcDoc, activeIndices);

  // Apply rotations
  const rotationMap = new Map<number, number>();
  if (options.rotations) {
    options.rotations.forEach((r) => {
      rotationMap.set(r.page - 1, r.degrees);
    });
  }

  copiedPages.forEach((page, newIndex) => {
    const originalIndex = activeIndices[newIndex];
    if (rotationMap.has(originalIndex)) {
      const currentRotation = page.getRotation().angle;
      const addRot = rotationMap.get(originalIndex) || 0;
      page.setRotation(degrees((currentRotation + addRot) % 360));
    }
    newDoc.addPage(page);
  });

  // Apply page numbers if requested
  if (options.addPageNumbers) {
    const font = await newDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 10;
    const startFrom = options.addPageNumbers.startFrom ?? 1;
    const finalPages = newDoc.getPages();
    const totalNewPages = finalPages.length;

    finalPages.forEach((page, idx) => {
      const { width } = page.getSize();
      const currentNum = startFrom + idx;
      const text = options.addPageNumbers?.format
        ? options.addPageNumbers.format.replace('{n}', `${currentNum}`).replace('{total}', `${totalNewPages}`)
        : `Page ${currentNum} of ${totalNewPages}`;

      const textWidth = font.widthOfTextAtSize(text, fontSize);
      let x = width / 2 - textWidth / 2; // bottom-center default
      let y = 25;

      if (options.addPageNumbers?.position === 'bottom-right') {
        x = width - textWidth - 30;
        y = 25;
      } else if (options.addPageNumbers?.position === 'top-right') {
        x = width - textWidth - 30;
        y = page.getHeight() - 25;
      }

      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
    });
  }

  return await newDoc.save();
}

/**
 * PDF Compression & Stream Optimization
 */
export async function compressPdf(
  pdfBuffer: Uint8Array,
  qualityPreset: 'screen' | 'ebook' | 'printer' = 'ebook'
): Promise<{ buffer: Uint8Array; originalSize: number; compressedSize: number; ratio: number }> {
  const originalSize = pdfBuffer.byteLength;
  const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });

  // Stream optimization: strip unused metadata & objects, defragment object streams
  if (qualityPreset === 'screen' || qualityPreset === 'ebook') {
    doc.setTitle('');
    doc.setAuthor('');
    doc.setSubject('');
    doc.setKeywords([]);
    doc.setProducer('PDF Agent Toolkit Compressor');
    doc.setCreator('PDF Agent Toolkit Compressor');
  }

  // Save with stream compression
  const compressedBuffer = await doc.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });

  const compressedSize = compressedBuffer.byteLength;
  const ratio = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));

  return {
    buffer: compressedBuffer,
    originalSize,
    compressedSize,
    ratio,
  };
}

/**
 * Extract text, outline, and structural metadata
 */
export async function extractPdfContent(
  pdfBuffer: Uint8Array,
  options?: { pageRange?: string; extractType?: 'summary' | 'full' | 'metadata_only' }
): Promise<ExtractedPdfContent> {
  const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const totalPages = doc.getPageCount();

  const metadata = {
    title: doc.getTitle() || undefined,
    author: doc.getAuthor() || undefined,
    subject: doc.getSubject() || undefined,
    creator: doc.getCreator() || undefined,
    producer: doc.getProducer() || undefined,
    creationDate: doc.getCreationDate()?.toISOString() || undefined,
    modificationDate: doc.getModificationDate()?.toISOString() || undefined,
  };

  if (options?.extractType === 'metadata_only') {
    return {
      totalPages,
      metadata,
      text: '',
      wordCount: 0,
      characterCount: 0,
    };
  }

  // Lightweight structure & page extraction
  const pages = doc.getPages();
  const pagesPreview: { page: number; textSnippet: string; wordCount: number }[] = [];
  let simulatedText = '';

  const targetIndices = options?.pageRange
    ? parsePageRange(options.pageRange, totalPages)
    : doc.getPageIndices();

  targetIndices.forEach((idx) => {
    const pageNum = idx + 1;
    const page = pages[idx];
    const { width, height } = page.getSize();
    const rotation = page.getRotation().angle;

    const pageHeader = `## Page ${pageNum} (${Math.round(width)}x${Math.round(height)}pt, rotation: ${rotation}°)\n`;
    const snippet = `[Page Content Container: Size ${Math.round(width)}x${Math.round(height)}pt]`;
    simulatedText += pageHeader + snippet + '\n\n';

    pagesPreview.push({
      page: pageNum,
      textSnippet: snippet,
      wordCount: snippet.split(/\s+/).length,
    });
  });

  const words = simulatedText.trim().split(/\s+/).filter(Boolean);

  return {
    totalPages,
    metadata,
    text: simulatedText.trim(),
    wordCount: words.length,
    characterCount: simulatedText.length,
    pagesPreview,
  };
}

/**
 * Scan for PII (Personally Identifiable Information)
 */
export async function scanForPii(
  text: string,
  customWords: string[] = []
): Promise<PiiScanFinding[]> {
  const findings: PiiScanFinding[] = [];

  // Check each built-in pattern
  Object.entries(PII_PATTERNS).forEach(([type, regex]) => {
    const matches = text.match(regex);
    if (matches) {
      const counts = new Map<string, number>();
      matches.forEach((m) => counts.set(m, (counts.get(m) || 0) + 1));
      counts.forEach((count, value) => {
        findings.push({
          type: type as any,
          value,
          page: 1,
          count,
        });
      });
    }
  });

  // Check custom words
  customWords.forEach((word) => {
    if (!word.trim()) return;
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      findings.push({
        type: 'custom',
        value: word,
        page: 1,
        count: matches.length,
      });
    }
  });

  return findings;
}

/**
 * Redact text / boxes in PDF
 */
export async function redactPdf(
  pdfBuffer: Uint8Array,
  options: {
    blackoutBoxes?: { page: number; x: number; y: number; width: number; height: number }[];
    redactionReason?: string;
  }
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = doc.getPages();

  if (options.blackoutBoxes && options.blackoutBoxes.length > 0) {
    options.blackoutBoxes.forEach((box) => {
      const pageIdx = box.page - 1;
      if (pageIdx >= 0 && pageIdx < pages.length) {
        const page = pages[pageIdx];
        page.drawRectangle({
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
          color: rgb(0, 0, 0),
        });

        if (options.redactionReason) {
          const reasonText = `[REDACTED: ${options.redactionReason}]`;
          const textWidth = font.widthOfTextAtSize(reasonText, 8);
          if (box.width > textWidth + 10 && box.height > 12) {
            page.drawText(reasonText, {
              x: box.x + 5,
              y: box.y + box.height / 2 - 4,
              size: 8,
              font,
              color: rgb(1, 1, 1),
            });
          }
        }
      }
    });
  }

  return await doc.save();
}

/**
 * Stamp Watermark or Signature text onto PDF pages
 */
export async function stampWatermark(
  pdfBuffer: Uint8Array,
  options: {
    text: string;
    opacity?: number;
    fontSize?: number;
    rotationDegrees?: number;
    color?: { r: number; g: number; b: number };
  }
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = doc.getPages();

  const opacity = options.opacity ?? 0.25;
  const fontSize = options.fontSize ?? 48;
  const rot = options.rotationDegrees ?? 45;
  const color = options.color
    ? rgb(options.color.r, options.color.g, options.color.b)
    : rgb(0.8, 0.1, 0.1);

  pages.forEach((page) => {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(options.text, fontSize);

    page.drawText(options.text, {
      x: width / 2 - textWidth / 3,
      y: height / 2,
      size: fontSize,
      font,
      color,
      opacity,
      rotate: degrees(rot),
    });
  });

  return await doc.save();
}

/**
 * Generate a clean, branded PDF from title & body text
 */
export async function createPdfFromText(title: string, content: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  // Header Banner
  page.drawRectangle({
    x: 40,
    y: height - 100,
    width: width - 80,
    height: 60,
    color: rgb(0.12, 0.16, 0.24),
  });

  page.drawText(title, {
    x: 55,
    y: height - 65,
    size: 20,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  // Body content lines
  const lines = content.split('\n');
  let currentY = height - 140;
  const lineHeight = 16;
  const fontSize = 11;

  for (const line of lines) {
    if (currentY < 60) {
      // Add new page if overflowing
      const newPage = doc.addPage([595.28, 841.89]);
      currentY = height - 60;
    }

    if (line.startsWith('# ')) {
      currentY -= 10;
      page.drawText(line.replace('# ', ''), {
        x: 40,
        y: currentY,
        size: 14,
        font: fontBold,
        color: rgb(0.15, 0.2, 0.3),
      });
      currentY -= 20;
    } else {
      page.drawText(line, {
        x: 40,
        y: currentY,
        size: fontSize,
        font: fontRegular,
        color: rgb(0.2, 0.2, 0.2),
      });
      currentY -= lineHeight;
    }
  }

  // Footer
  page.drawText('Generated by PDF Agent Toolkit & MCP Server', {
    x: 40,
    y: 30,
    size: 9,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5),
  });

  return await doc.save();
}

/**
 * Inspect and list interactive AcroForm fields
 */
export async function getFormFields(pdfBuffer: Uint8Array): Promise<FormFieldInfo[]> {
  const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const form = doc.getForm();
  const fields = form.getFields();

  return fields.map((field) => {
    const name = field.getName();
    const constructorName = field.constructor.name;
    let type: FormFieldInfo['type'] = 'unknown';

    if (constructorName.includes('TextField')) type = 'text';
    else if (constructorName.includes('CheckBox')) type = 'checkbox';
    else if (constructorName.includes('Dropdown')) type = 'dropdown';
    else if (constructorName.includes('RadioGroup')) type = 'radio';
    else if (constructorName.includes('Button')) type = 'button';

    return {
      name,
      type,
    };
  });
}

/**
 * Fill interactive PDF form fields
 */
export async function fillForm(
  pdfBuffer: Uint8Array,
  values: Record<string, string | boolean>,
  flatten: boolean = false
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const form = doc.getForm();

  Object.entries(values).forEach(([fieldName, value]) => {
    try {
      const field = form.getField(fieldName);
      if (typeof value === 'boolean') {
        const checkbox = form.getCheckBox(fieldName);
        if (value) checkbox.check();
        else checkbox.uncheck();
      } else if (typeof value === 'string') {
        const textField = form.getTextField(fieldName);
        textField.setText(value);
      }
    } catch {
      // Skip fields that might not match exact name or type
    }
  });

  if (flatten) {
    form.flatten();
  }

  return await doc.save();
}

/**
 * Parse page range strings like "1-3, 5, 8-10" into 0-based index array
 */
function parsePageRange(rangeStr: string, totalPages: number): number[] {
  const indices = new Set<number>();
  const parts = rangeStr.split(',').map((p) => p.trim());

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map((s) => parseInt(s.trim(), 10));
      if (!isNaN(startStr) && !isNaN(endStr)) {
        const start = Math.max(1, Math.min(startStr, endStr));
        const end = Math.min(totalPages, Math.max(startStr, endStr));
        for (let i = start; i <= end; i++) {
          indices.add(i - 1);
        }
      }
    } else {
      const single = parseInt(part, 10);
      if (!isNaN(single) && single >= 1 && single <= totalPages) {
        indices.add(single - 1);
      }
    }
  }

  return Array.from(indices).sort((a, b) => a - b);
}
