import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export type SamplePdfType = 'invoice' | 'report' | 'contract' | 'form';

/**
 * Generate sample PDFs for instant previewing and testing
 */
export async function createSampleInvoicePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  // Header Banner
  page.drawRectangle({
    x: 40,
    y: height - 90,
    width: width - 80,
    height: 50,
    color: rgb(0.08, 0.18, 0.36),
  });

  page.drawText('INVOICE #INV-2026-8891', {
    x: 55,
    y: height - 60,
    size: 16,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('Status: PAID', {
    x: width - 150,
    y: height - 60,
    size: 12,
    font: fontBold,
    color: rgb(0.4, 0.9, 0.5),
  });

  // Client Details with simulated PII for privacy scanner testing
  let y = height - 120;
  page.drawText('Billed To:', { x: 40, y, size: 12, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  y -= 18;
  page.drawText('Acme Global Technologies Inc.', { x: 40, y, size: 10, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
  y -= 15;
  page.drawText('Contact: finance@acmeglobal.com', { x: 40, y, size: 10, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
  y -= 15;
  page.drawText('Phone: (555) 234-5678', { x: 40, y, size: 10, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
  y -= 15;
  page.drawText('Tax ID / SSN: 987-65-4321', { x: 40, y, size: 10, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
  y -= 15;
  page.drawText('Card on file: 4532-8921-3829-1928', { x: 40, y, size: 10, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

  // Line items table
  y -= 35;
  page.drawRectangle({
    x: 40,
    y: y - 5,
    width: width - 80,
    height: 22,
    color: rgb(0.92, 0.94, 0.98),
  });

  page.drawText('Description', { x: 50, y, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  page.drawText('Qty', { x: 300, y, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  page.drawText('Rate', { x: 380, y, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  page.drawText('Amount', { x: 470, y, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2) });

  const items = [
    { desc: 'MCP Tooling Development & Agent Integration', qty: '40 hrs', rate: '$150.00', total: '$6,000.00' },
    { desc: 'WebAssembly Ghostscript & OCR Optimization', qty: '20 hrs', rate: '$150.00', total: '$3,000.00' },
    { desc: 'Security Audit & PII Redaction Pipeline', qty: '12 hrs', rate: '$150.00', total: '$1,800.00' },
  ];

  items.forEach((item) => {
    y -= 24;
    page.drawText(item.desc, { x: 50, y, size: 9, font: fontRegular, color: rgb(0.25, 0.25, 0.25) });
    page.drawText(item.qty, { x: 300, y, size: 9, font: fontRegular, color: rgb(0.25, 0.25, 0.25) });
    page.drawText(item.rate, { x: 380, y, size: 9, font: fontRegular, color: rgb(0.25, 0.25, 0.25) });
    page.drawText(item.total, { x: 470, y, size: 9, font: fontBold, color: rgb(0.15, 0.15, 0.15) });
  });

  // Total
  y -= 40;
  page.drawText('Total Amount Due: $10,800.00', {
    x: width - 240,
    y,
    size: 13,
    font: fontBold,
    color: rgb(0.08, 0.18, 0.36),
  });

  // Footer Note
  page.drawText('Notice: Contains confidential corporate PII for MCP security evaluation purposes.', {
    x: 40,
    y: 30,
    size: 8,
    font: fontRegular,
    color: rgb(0.6, 0.6, 0.6),
  });

  return await doc.save();
}

/**
 * Generate a 3-page multi-chapter report for splitting, merging, rotating, and numbering tests
 */
export async function createSampleReportPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const chapters = [
    {
      title: 'Chapter 1: Architecture Overview',
      subtitle: 'Pure TypeScript & WebAssembly Engine',
      content:
        'This document provides an overview of zero-dependency PDF processing for autonomous AI agents.\nBy operating directly in-memory, the engine avoids external cloud roundtrips, reducing latency to under 20ms and guaranteeing data privacy.\n\nKey advantages:\n• Zero third-party cloud upload requirements\n• High performance stream compression with Deflate algorithm\n• Full compliance with GDPR and HIPAA redaction protocols',
    },
    {
      title: 'Chapter 2: Token Economy & Prompt Optimization',
      subtitle: 'Extracting Structural Outlines vs Full Base64 Dumps',
      content:
        'AI agents often waste 80-95% of their LLM context window when receiving raw Base64 document representations.\nBy utilizing the extract_pdf_content tool with structured outline parsing, agent workflows consume under 400 tokens per document inspection.\n\nBenchmarks show:\n• 84.7% average prompt token reduction\n• 5x faster LLM inference response times\n• Strict page range targeting for granular RAG retrieval',
    },
    {
      title: 'Chapter 3: Security, Watermarking & Invariants',
      subtitle: 'Blackout Redaction & Layer Protection',
      content:
        'Visual redaction stamps opaque filled rectangles over sensitive coordinates to permanently eliminate text rendering.\nWatermarking overlays high-contrast diagonal labels with configurable opacity for document classification.\n\nAll structural invariants (page counts, object streams, fonts) are preserved during batch transformations.',
    },
  ];

  chapters.forEach((ch, idx) => {
    const page = doc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    // Top Header Banner
    page.drawRectangle({
      x: 35,
      y: height - 80,
      width: width - 70,
      height: 48,
      color: rgb(0.12, 0.2, 0.32),
    });

    page.drawText(ch.title, {
      x: 50,
      y: height - 54,
      size: 15,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    // Subtitle
    page.drawText(ch.subtitle, {
      x: 35,
      y: height - 110,
      size: 11,
      font: fontBold,
      color: rgb(0.2, 0.4, 0.7),
    });

    // Body lines
    const lines = ch.content.split('\n');
    let lineY = height - 140;
    lines.forEach((l) => {
      if (l.trim() === '') {
        lineY -= 10;
        return;
      }
      const isBullet = l.startsWith('•');
      page.drawText(l, {
        x: isBullet ? 45 : 35,
        y: lineY,
        size: 10,
        font: isBullet ? fontRegular : fontRegular,
        color: rgb(0.25, 0.25, 0.25),
      });
      lineY -= 18;
    });

    // Callout Box
    page.drawRectangle({
      x: 35,
      y: 100,
      width: width - 70,
      height: 60,
      color: rgb(0.95, 0.97, 1.0),
      borderColor: rgb(0.75, 0.82, 0.95),
      borderWidth: 1,
    });

    page.drawText('Agent Architecture Best Practice:', {
      x: 50,
      y: 140,
      size: 9.5,
      font: fontBold,
      color: rgb(0.15, 0.3, 0.6),
    });

    page.drawText('Always use extract_pdf_content first to inspect document outline before splitting or mutating.', {
      x: 50,
      y: 120,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.3, 0.35, 0.45),
    });

    // Footer
    page.drawText(`PDF Agent Toolkit • Technical Whitepaper • Page ${idx + 1} of ${chapters.length}`, {
      x: 35,
      y: 40,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.55, 0.55, 0.55),
    });
  });

  return await doc.save();
}

/**
 * Generate a 2-page Non-Disclosure Legal Agreement for watermarking & redaction testing
 */
export async function createSampleContractPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Page 1
  const page1 = doc.addPage([595.28, 841.89]);
  const { width, height } = page1.getSize();

  page1.drawText('MUTUAL NON-DISCLOSURE AGREEMENT', {
    x: 40,
    y: height - 70,
    size: 16,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.25),
  });

  page1.drawText('CONFIDENTIAL & PROPRIETARY', {
    x: 40,
    y: height - 90,
    size: 10,
    font: fontBold,
    color: rgb(0.7, 0.2, 0.2),
  });

  let y = height - 130;
  const p1Text = [
    'This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of January 15, 2026, by and between:',
    'Party A: Cyberdyne Autonomous AI Systems, LLC (Tax ID: 12-3456789, contact: legal@cyberdyne.ai)',
    'Party B: Acme Corporation Global Operations (Tax ID: 98-7654321, contact: security@acmeglobal.com)',
    '',
    '1. Purpose and Scope of Confidential Information',
    'The parties wish to explore a business opportunity concerning AI model integration and Model Context Protocol (MCP) server deployments. In connection with this opportunity, each party may disclose to the other certain proprietary and confidential technical specifications, source code, token usage telemetry, and financial terms.',
    '',
    '2. Standard of Care and Non-Disclosure Obligations',
    'Each party agrees to protect the confidential information of the disclosing party using the same degree of care that it uses to protect its own confidential information of like nature, but in no event less than reasonable care. Neither party shall disclose any confidential information to third parties without prior written consent.',
    '',
    '3. Term and Termination',
    'This Agreement and the confidentiality obligations herein shall remain in effect for a period of three (3) years from the effective date set forth above.',
  ];

  p1Text.forEach((l) => {
    if (l === '') {
      y -= 12;
      return;
    }
    const isHeading = l.startsWith('1.') || l.startsWith('2.') || l.startsWith('3.');
    page1.drawText(l, {
      x: 40,
      y,
      size: isHeading ? 10.5 : 9,
      font: isHeading ? fontBold : fontRegular,
      color: isHeading ? rgb(0.15, 0.2, 0.3) : rgb(0.25, 0.25, 0.25),
    });
    y -= isHeading ? 18 : 14;
  });

  page1.drawText('Page 1 of 2 - Mutual NDA', {
    x: 40,
    y: 35,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.6, 0.6, 0.6),
  });

  // Page 2: Signatures
  const page2 = doc.addPage([595.28, 841.89]);
  let y2 = height - 70;

  page2.drawText('4. Governing Law and Jurisdiction', {
    x: 40,
    y: y2,
    size: 11,
    font: fontBold,
    color: rgb(0.15, 0.2, 0.3),
  });
  y2 -= 20;

  page2.drawText(
    'This Agreement shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law principles.',
    { x: 40, y: y2, size: 9, font: fontRegular, color: rgb(0.25, 0.25, 0.25) }
  );
  y2 -= 40;

  page2.drawText('IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first above written.', {
    x: 40,
    y: y2,
    size: 9.5,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });
  y2 -= 50;

  // Signature Block 1
  page2.drawText('PARTY A: Cyberdyne AI Systems, LLC', { x: 40, y: y2, size: 9.5, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  page2.drawText('PARTY B: Acme Corporation', { x: 300, y: y2, size: 9.5, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  y2 -= 35;

  page2.drawLine({ start: { x: 40, y: y2 }, end: { x: 240, y: y2 }, thickness: 1, color: rgb(0.4, 0.4, 0.4) });
  page2.drawLine({ start: { x: 300, y: y2 }, end: { x: 500, y: y2 }, thickness: 1, color: rgb(0.4, 0.4, 0.4) });
  y2 -= 15;

  page2.drawText('Authorized Signature: Dr. Miles Dyson', { x: 40, y: y2, size: 8.5, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
  page2.drawText('Authorized Signature: Sarah Connor, VP', { x: 300, y: y2, size: 8.5, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

  page2.drawText('Page 2 of 2 - Mutual NDA', {
    x: 40,
    y: 35,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.6, 0.6, 0.6),
  });

  return await doc.save();
}

/**
 * Generate an interactive AcroForm PDF with fillable fields
 */
export async function createSampleFormPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  // Title
  page.drawRectangle({
    x: 40,
    y: height - 80,
    width: width - 80,
    height: 45,
    color: rgb(0.18, 0.24, 0.38),
  });

  page.drawText('AGENT ONBOARDING & ACCESS REQUEST FORM', {
    x: 55,
    y: height - 55,
    size: 14,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  const form = doc.getForm();

  let y = height - 120;

  // Field 1: Full Name
  page.drawText('Full Name:', { x: 40, y, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  const nameField = form.createTextField('fullName');
  nameField.setText('Alex Rivera');
  nameField.addToPage(page, { x: 140, y: y - 5, width: 220, height: 20 });

  // Field 2: Email
  y -= 35;
  page.drawText('Work Email:', { x: 40, y, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  const emailField = form.createTextField('email');
  emailField.setText('alex.rivera@enterprise.ai');
  emailField.addToPage(page, { x: 140, y: y - 5, width: 220, height: 20 });

  // Field 3: Department
  y -= 35;
  page.drawText('Department:', { x: 40, y, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  const deptField = form.createDropdown('department');
  deptField.addOptions(['Autonomous AI Research', 'Cloud Infrastructure', 'Security Operations', 'Product Engineering']);
  deptField.select('Autonomous AI Research');
  deptField.addToPage(page, { x: 140, y: y - 5, width: 220, height: 20 });

  // Field 4: Checkbox: Agree
  y -= 40;
  page.drawText('Security Policy Agreement:', { x: 40, y, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  const agreeCheck = form.createCheckBox('agreeToTerms');
  agreeCheck.check();
  agreeCheck.addToPage(page, { x: 220, y: y - 4, width: 16, height: 16 });
  page.drawText('I accept the zero-leakage security guidelines', { x: 245, y, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

  // Field 5: Notes
  y -= 40;
  page.drawText('Access Notes:', { x: 40, y, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  const notesField = form.createTextField('accessNotes');
  notesField.setText('Provision Model Context Protocol MCP permissions for local documents.');
  notesField.addToPage(page, { x: 140, y: y - 15, width: 380, height: 30 });

  // Form info note
  page.drawText('This interactive AcroForm can be inspected, read, and automatically filled via MCP tools.', {
    x: 40,
    y: 40,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5),
  });

  return await doc.save();
}

