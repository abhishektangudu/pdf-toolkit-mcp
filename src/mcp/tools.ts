import type { McpToolDefinition } from '../types/pdf';

export const MCP_TOOLS: McpToolDefinition[] = [
  {
    name: 'merge_pdfs',
    category: 'organization',
    displayName: 'Merge PDFs',
    description: 'Combines multiple PDF files into a single ordered PDF document without quality degradation.',
    tokenSavingHighlight: 'Zero token bloat: handles pure binary stream merging without loading raw base64 or bytes into LLM context.',
    inputSchema: {
      type: 'object',
      properties: {
        filePaths: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of PDF file paths in the exact order they should be merged.',
        },
        outputPath: {
          type: 'string',
          description: 'Destination file path for the output merged PDF.',
        },
      },
      required: ['filePaths', 'outputPath'],
    },
  },
  {
    name: 'split_pdf',
    category: 'organization',
    displayName: 'Split / Extract Pages',
    description: 'Extracts specific page numbers or ranges (e.g. "1-3, 5, 8-12") from a source PDF into a new document.',
    tokenSavingHighlight: 'Allows agents to pull only relevant chapters or pages for reasoning instead of processing full 100+ page books.',
    inputSchema: {
      type: 'object',
      properties: {
        inputPath: {
          type: 'string',
          description: 'Source PDF file path.',
        },
        outputPath: {
          type: 'string',
          description: 'Destination file path for the extracted pages PDF.',
        },
        pageRange: {
          type: 'string',
          description: 'Page numbers and ranges to extract, comma-separated (e.g. "1-5, 8, 11-14").',
        },
      },
      required: ['inputPath', 'outputPath', 'pageRange'],
    },
  },
  {
    name: 'organize_pdf',
    category: 'organization',
    displayName: 'Organize & Number Pages',
    description: 'Performs compound page-level transformations in one atomic pass: reordering, rotations (90°/180°/270°), page deletions, and header/footer page numbering.',
    tokenSavingHighlight: 'Compound atomic execution prevents repeated disk read/write cycles and multi-turn tool ping-pong.',
    inputSchema: {
      type: 'object',
      properties: {
        inputPath: { type: 'string', description: 'Source PDF path' },
        outputPath: { type: 'string', description: 'Destination PDF path' },
        pageOrder: {
          type: 'array',
          items: { type: 'number' },
          description: 'Optional array of 1-based page indices defining the new sequence.',
        },
        removePages: {
          type: 'array',
          items: { type: 'number' },
          description: 'List of 1-based page numbers to permanently remove.',
        },
        rotations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: { type: 'number' },
              degrees: { type: 'number', enum: [90, 180, 270] },
            },
            required: ['page', 'degrees'],
          },
          description: 'Specific rotations to apply to pages.',
        },
        addPageNumbers: {
          type: 'object',
          properties: {
            position: { type: 'string', enum: ['bottom-center', 'bottom-right', 'top-right'] },
            startFrom: { type: 'number', default: 1 },
            format: { type: 'string', description: 'Template string with {n} and {total}' },
          },
        },
      },
      required: ['inputPath', 'outputPath'],
    },
  },
  {
    name: 'compress_pdf',
    category: 'optimization',
    displayName: 'Compress PDF',
    description: 'Reduces PDF file size via object-stream defragmentation, unused metadata stripping, and resolution optimization presets.',
    tokenSavingHighlight: 'Keeps downstream document uploads lightweight and fast for vision/OCR pipelines.',
    inputSchema: {
      type: 'object',
      properties: {
        inputPath: { type: 'string', description: 'Source PDF path' },
        outputPath: { type: 'string', description: 'Target path for the compressed PDF' },
        preset: {
          type: 'string',
          enum: ['screen', 'ebook', 'printer'],
          default: 'ebook',
          description: 'Quality preset (screen: lowest size / 72 DPI, ebook: balanced / 150 DPI, printer: high / 300 DPI).',
        },
      },
      required: ['inputPath', 'outputPath'],
    },
  },
  {
    name: 'extract_pdf_content',
    category: 'extraction',
    displayName: 'Extract Outline & Text (Token-Optimized)',
    description: 'Extracts structural outline, TOC, page dimensions, and formatted Markdown text without dumping bloated raw streams into prompt context.',
    tokenSavingHighlight: 'Saves up to 90% prompt tokens by returning structural summaries and filtered page snippets on demand.',
    inputSchema: {
      type: 'object',
      properties: {
        inputPath: { type: 'string', description: 'Path to PDF document' },
        pageRange: { type: 'string', description: 'Optional page range filter (e.g. "1-3, 7")' },
        extractType: {
          type: 'string',
          enum: ['summary', 'full', 'metadata_only'],
          default: 'summary',
          description: 'Type of content to retrieve: summary outline, full text, or metadata only.',
        },
      },
      required: ['inputPath'],
    },
  },
  {
    name: 'scan_and_redact_pii',
    category: 'security',
    displayName: 'PII Privacy Scanner & Redaction',
    description: 'Scans for sensitive personal information (Emails, SSNs, Credit Cards, Aadhaar numbers, Phone numbers, custom keywords) and stamps irreversible black redaction boxes.',
    tokenSavingHighlight: 'Guarantees compliance and data sovereignty before passing documents to external cloud APIs or public models.',
    inputSchema: {
      type: 'object',
      properties: {
        inputPath: { type: 'string', description: 'Source PDF path' },
        outputPath: { type: 'string', description: 'Destination redacted PDF path' },
        customKeywords: {
          type: 'array',
          items: { type: 'string' },
          description: 'Custom sensitive words or phrases to find and redact.',
        },
        redactionReason: {
          type: 'string',
          description: 'Reason label stamped inside redaction box (e.g. "PII", "CONFIDENTIAL").',
        },
        blackoutBoxes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: { type: 'number' },
              x: { type: 'number' },
              y: { type: 'number' },
              width: { type: 'number' },
              height: { type: 'number' },
            },
            required: ['page', 'x', 'y', 'width', 'height'],
          },
          description: 'Explicit coordinate boxes to blackout.',
        },
      },
      required: ['inputPath', 'outputPath'],
    },
  },
  {
    name: 'stamp_watermark',
    category: 'security',
    displayName: 'Stamp Watermark / Signature',
    description: 'Applies visual watermarks (e.g. "DRAFT", "CONFIDENTIAL", "APPROVED") or text signatures across PDF pages with customizable rotation and opacity.',
    tokenSavingHighlight: 'Instant visual branding and status stamping directly through agent command.',
    inputSchema: {
      type: 'object',
      properties: {
        inputPath: { type: 'string', description: 'Source PDF path' },
        outputPath: { type: 'string', description: 'Destination PDF path' },
        text: { type: 'string', description: 'Watermark or signature text to stamp' },
        opacity: { type: 'number', default: 0.25, description: 'Opacity from 0.0 to 1.0' },
        fontSize: { type: 'number', default: 44, description: 'Font size in points' },
        rotationDegrees: { type: 'number', default: 45, description: 'Angle of rotation' },
      },
      required: ['inputPath', 'outputPath', 'text'],
    },
  },
  {
    name: 'create_pdf_from_text',
    category: 'creation',
    displayName: 'Create PDF from Markdown/Text',
    description: 'Generates a clean, professionally formatted PDF document from Markdown headers and structured text without complex CSS/headless browser overhead.',
    tokenSavingHighlight: 'Ultra-fast document creation using native font metrics with zero memory leaks.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Document Title for header banner' },
        content: { type: 'string', description: 'Body text or Markdown content to format' },
        outputPath: { type: 'string', description: 'Destination PDF file path' },
      },
      required: ['title', 'content', 'outputPath'],
    },
  },
  {
    name: 'inspect_and_fill_form',
    category: 'forms',
    displayName: 'Inspect & Fill Form Fields',
    description: 'Detects all AcroForm interactive fields (text inputs, checkboxes, dropdowns) and auto-populates them with structured data.',
    tokenSavingHighlight: 'Automates tax forms, invoices, and contracts with programmatic field mapping.',
    inputSchema: {
      type: 'object',
      properties: {
        inputPath: { type: 'string', description: 'Source PDF path containing interactive form' },
        outputPath: { type: 'string', description: 'Destination path for filled PDF' },
        values: {
          type: 'object',
          description: 'Key-value map of field name to text or boolean value.',
        },
        flatten: {
          type: 'boolean',
          default: false,
          description: 'Whether to lock and flatten form fields after filling.',
        },
      },
      required: ['inputPath'],
    },
  },
];
