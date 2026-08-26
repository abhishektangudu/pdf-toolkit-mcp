import type { AgentRoutingEvalSample } from '../types/eval';

export interface RoutePrediction {
  predictedTool: string;
  predictedArgs: Record<string, any>;
  confidence: number;
  reasoning: string;
}

/**
 * Benchmark samples for Agent Intent Routing and Tool Argument Resolution
 */
export const AGENT_ROUTING_SAMPLES: AgentRoutingEvalSample[] = [
  {
    id: 'intent_split_range',
    query: 'Extract pages 2 through 4 from financial_report.pdf and save as q3_summary.pdf',
    expectedTool: 'split_pdf',
    expectedArgs: {
      inputPath: 'financial_report.pdf',
      outputPath: 'q3_summary.pdf',
      pageRange: '2-4',
    },
    description: 'Direct page extraction range intent',
  },
  {
    id: 'intent_merge_files',
    query: 'Combine invoice_jan.pdf, invoice_feb.pdf, and invoice_mar.pdf into q1_billing.pdf',
    expectedTool: 'merge_pdfs',
    expectedArgs: {
      filePaths: ['invoice_jan.pdf', 'invoice_feb.pdf', 'invoice_mar.pdf'],
      outputPath: 'q1_billing.pdf',
    },
    description: 'Multi-document merge sequence',
  },
  {
    id: 'intent_organize_compound',
    query: 'Rotate page 2 by 90 degrees, remove page 4, and add page numbers to the bottom-center of draft.pdf',
    expectedTool: 'organize_pdf',
    expectedArgs: {
      inputPath: 'draft.pdf',
      outputPath: 'draft_organized.pdf',
      rotations: [{ page: 2, degrees: 90 }],
      removePages: [4],
      addPageNumbers: { position: 'bottom-center' },
    },
    description: 'Compound page manipulation (rotate + delete + number)',
  },
  {
    id: 'intent_compress_preset',
    query: 'Compress heavy_catalog.pdf using screen preset for web email attachment',
    expectedTool: 'compress_pdf',
    expectedArgs: {
      inputPath: 'heavy_catalog.pdf',
      outputPath: 'heavy_catalog_compressed.pdf',
      preset: 'screen',
    },
    description: 'Size optimization with specific preset',
  },
  {
    id: 'intent_redact_pii',
    query: 'Scan customer_statement.pdf for social security numbers and emails, and blackout them with reason CONFIDENTIAL',
    expectedTool: 'scan_and_redact_pii',
    expectedArgs: {
      inputPath: 'customer_statement.pdf',
      outputPath: 'customer_statement_redacted.pdf',
      redactionReason: 'CONFIDENTIAL',
    },
    description: 'Privacy scanner and redaction intent',
  },
  {
    id: 'intent_stamp_watermark',
    query: 'Stamp a bold red CONFIDENTIAL watermark rotated 45 degrees across review.pdf',
    expectedTool: 'stamp_watermark',
    expectedArgs: {
      inputPath: 'review.pdf',
      outputPath: 'review_watermarked.pdf',
      text: 'CONFIDENTIAL',
      rotationDegrees: 45,
    },
    description: 'Visual watermark stamping intent',
  },
  {
    id: 'intent_extract_summary',
    query: 'Get a token-efficient summary outline and TOC of annual_report.pdf without reading raw bytes',
    expectedTool: 'extract_pdf_content',
    expectedArgs: {
      inputPath: 'annual_report.pdf',
      extractType: 'summary',
    },
    description: 'Structured context-optimized extraction',
  },
  {
    id: 'intent_create_doc',
    query: 'Generate a new PDF document titled "System Architecture 2026" from Markdown notes',
    expectedTool: 'create_pdf_from_text',
    expectedArgs: {
      title: 'System Architecture 2026',
      outputPath: 'system_architecture_2026.pdf',
    },
    description: 'Programmatic document generation intent',
  },
];

/**
 * Deterministic Intent Classifier for Agent Tool Selection Benchmark
 */
export function predictAgentToolAndArgs(query: string): RoutePrediction {
  const q = query.toLowerCase();

  // 1. Merge
  if (q.includes('combine') || q.includes('merge') || q.includes('join') || (q.includes('into') && q.includes('.pdf') && (query.match(/\.pdf/g) || []).length > 2)) {
    const fileMatches = query.match(/[a-zA-Z0-9_-]+\.pdf/g) || [];
    const targetFile = fileMatches.length > 0 ? fileMatches[fileMatches.length - 1] : 'merged.pdf';
    const sourceFiles = fileMatches.slice(0, Math.max(1, fileMatches.length - 1));

    return {
      predictedTool: 'merge_pdfs',
      predictedArgs: {
        filePaths: sourceFiles.length > 0 ? sourceFiles : ['file1.pdf', 'file2.pdf'],
        outputPath: targetFile,
      },
      confidence: 0.95,
      reasoning: 'Detected multi-file combination keywords and source target paths.',
    };
  }

  // 2. Split / Extract Pages
  if ((q.includes('extract page') || q.includes('split') || q.includes('pages ') || q.includes('page range')) && !q.includes('summary outline')) {
    const rangeMatch = query.match(/(\d+\s*(?:through|to|-)\s*\d+|\d+(?:\s*,\s*\d+)*)/i);
    let pageRange = '1-2';
    if (rangeMatch) {
      pageRange = rangeMatch[1].replace(/through|to/i, '-').replace(/\s+/g, '');
    }

    const pdfs = query.match(/[a-zA-Z0-9_-]+\.pdf/g) || [];
    return {
      predictedTool: 'split_pdf',
      predictedArgs: {
        inputPath: pdfs[0] || 'input.pdf',
        outputPath: pdfs[1] || 'extracted_pages.pdf',
        pageRange,
      },
      confidence: 0.94,
      reasoning: `Matched page extraction pattern with range "${pageRange}".`,
    };
  }

  // 3. Watermark (checked before general rotation to avoid conflict with "rotated watermark")
  if (q.includes('watermark') || (q.includes('stamp') && !q.includes('timestamp'))) {
    const textMatch = query.match(/["']([^"']+)["']/) || query.match(/(?:watermark\s+)?(CONFIDENTIAL|DRAFT|APPROVED|SAMPLE|COPY)/i);
    const rotMatch = query.match(/(\d+)\s*deg/i);
    const pdfs = query.match(/[a-zA-Z0-9_-]+\.pdf/g) || [];

    return {
      predictedTool: 'stamp_watermark',
      predictedArgs: {
        inputPath: pdfs[0] || 'input.pdf',
        outputPath: pdfs[1] || 'watermarked.pdf',
        text: textMatch ? textMatch[1] : 'CONFIDENTIAL',
        rotationDegrees: rotMatch ? parseInt(rotMatch[1], 10) : 45,
      },
      confidence: 0.94,
      reasoning: 'Detected watermark stamping parameters and text.',
    };
  }

  // 4. Organize (Rotate Pages, Delete Pages, Add Page Numbers)
  if (q.includes('rotate page') || q.includes('reorder') || q.includes('page number') || q.includes('remove page') || (q.includes('rotate') && !q.includes('watermark'))) {
    const rotMatch = query.match(/rotate\s+page\s+(\d+)\s+(?:by\s+)?(\d+)/i);
    const removeMatch = query.match(/(?:remove|delete)\s+page\s+(\d+)/i);
    const pdfs = query.match(/[a-zA-Z0-9_-]+\.pdf/g) || [];

    const rotations = rotMatch ? [{ page: parseInt(rotMatch[1], 10), degrees: parseInt(rotMatch[2], 10) as any }] : undefined;
    const removePages = removeMatch ? [parseInt(removeMatch[1], 10)] : undefined;
    const addPageNumbers = q.includes('page number')
      ? { position: (q.includes('bottom-right') ? 'bottom-right' : q.includes('top-right') ? 'top-right' : 'bottom-center') as any }
      : undefined;

    return {
      predictedTool: 'organize_pdf',
      predictedArgs: {
        inputPath: pdfs[0] || 'input.pdf',
        outputPath: pdfs[1] || 'organized.pdf',
        ...(rotations && { rotations }),
        ...(removePages && { removePages }),
        ...(addPageNumbers && { addPageNumbers }),
      },
      confidence: 0.96,
      reasoning: 'Matched compound page manipulation instructions (rotation/deletion/numbering).',
    };
  }

  // 4. Compress
  if (q.includes('compress') || q.includes('reduce size') || q.includes('shrink') || q.includes('optimize size')) {
    let preset: 'screen' | 'ebook' | 'printer' = 'ebook';
    if (q.includes('screen')) preset = 'screen';
    else if (q.includes('printer')) preset = 'printer';

    const pdfs = query.match(/[a-zA-Z0-9_-]+\.pdf/g) || [];
    return {
      predictedTool: 'compress_pdf',
      predictedArgs: {
        inputPath: pdfs[0] || 'input.pdf',
        outputPath: pdfs[1] || 'compressed.pdf',
        preset,
      },
      confidence: 0.95,
      reasoning: `Detected document compression request with preset "${preset}".`,
    };
  }

  // 5. PII Redaction
  if (q.includes('redact') || q.includes('blackout') || q.includes('pii') || q.includes('social security') || q.includes('credit card')) {
    const reasonMatch = query.match(/reason\s+([A-Z_]+)/i);
    const pdfs = query.match(/[a-zA-Z0-9_-]+\.pdf/g) || [];

    return {
      predictedTool: 'scan_and_redact_pii',
      predictedArgs: {
        inputPath: pdfs[0] || 'input.pdf',
        outputPath: pdfs[1] || 'redacted.pdf',
        redactionReason: reasonMatch ? reasonMatch[1] : 'CONFIDENTIAL',
      },
      confidence: 0.97,
      reasoning: 'Identified privacy redaction & PII scanning intent.',
    };
  }

  // 6. Creation from Text/Markdown
  if (q.includes('generate a new pdf') || q.includes('create pdf from') || (q.includes('create') && q.includes('titled'))) {
    const titleMatch = query.match(/titled\s+["']?([^"'\n]+?)["']?(?:\s+from|\s+with|$)/i);
    return {
      predictedTool: 'create_pdf_from_text',
      predictedArgs: {
        title: titleMatch ? titleMatch[1] : 'Document',
        outputPath: 'output.pdf',
      },
      confidence: 0.92,
      reasoning: 'Matched synthetic document creation request.',
    };
  }

  // 8. Extraction
  const pdfs = query.match(/[a-zA-Z0-9_-]+\.pdf/g) || [];
  return {
    predictedTool: 'extract_pdf_content',
    predictedArgs: {
      inputPath: pdfs[0] || 'input.pdf',
      extractType: 'summary',
    },
    confidence: 0.88,
    reasoning: 'Defaulted to token-efficient structured outline extraction.',
  };
}
