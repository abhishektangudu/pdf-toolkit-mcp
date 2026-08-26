export interface ToolPreset {
  id: string;
  name: string;
  description: string;
  sampleKey: 'invoice' | 'report' | 'contract' | 'form';
  args: Record<string, any>;
}

export const TOOL_PRESETS: Record<string, ToolPreset[]> = {
  scan_and_redact_pii: [
    {
      id: 'redact_sensitive_subset',
      name: 'Surgical Sensitive Subset (SSN & Credit Card Only)',
      description: 'Blackouts only the Tax ID/SSN and Credit card on file while leaving client identity, email, and phone visible.',
      sampleKey: 'invoice',
      args: {
        redactionReason: 'PII REDACTED (GDPR/HIPAA)',
        customKeywords: ['SecretKey', 'Confidential'],
        blackoutBoxes: [
          { page: 1, x: 38, y: 653, width: 180, height: 16 },
          { page: 1, x: 38, y: 638, width: 235, height: 16 },
        ],
      },
    },
    {
      id: 'redact_all_pii_entities',
      name: 'Complete PII Redaction (All Contact & Financial Entities)',
      description: 'Redacts Tax ID, credit card, contact email, and phone number from the invoice document.',
      sampleKey: 'invoice',
      args: {
        redactionReason: 'RESTRICTED - GDPR COMPLIANCE',
        customKeywords: ['SecretKey', 'Confidential'],
        blackoutBoxes: [
          { page: 1, x: 38, y: 683, width: 200, height: 16 },
          { page: 1, x: 38, y: 668, width: 160, height: 16 },
          { page: 1, x: 38, y: 653, width: 180, height: 16 },
          { page: 1, x: 38, y: 638, width: 235, height: 16 },
        ],
      },
    },
    {
      id: 'redact_custom_keywords',
      name: 'Custom Keyword Audit Blackout',
      description: 'Scans for proprietary keywords and stamps audit reason labels.',
      sampleKey: 'invoice',
      args: {
        redactionReason: 'CONFIDENTIAL / TRADE SECRET',
        customKeywords: ['Acme Global Technologies', 'SecretKey', 'Wire Routing', 'Total Due'],
      },
    },
  ],
  compress_pdf: [
    {
      id: 'compress_ebook',
      name: 'E-Book Balanced Preset (~150 DPI)',
      description: 'Defragments streams and optimizes fonts/images for balanced screen and print reading.',
      sampleKey: 'report',
      args: { preset: 'ebook' },
    },
    {
      id: 'compress_screen',
      name: 'Screen Maximum Reduction (~72 DPI)',
      description: 'Strips tracking metadata and compresses streams for fast email attachments.',
      sampleKey: 'report',
      args: { preset: 'screen' },
    },
    {
      id: 'compress_printer',
      name: 'High Fidelity Print Preset (~300 DPI)',
      description: 'Preserves vector geometry and text clarity while optimizing internal object structure.',
      sampleKey: 'report',
      args: { preset: 'printer' },
    },
  ],
  split_pdf: [
    {
      id: 'split_first_two_pages',
      name: 'First Two Chapters (Pages 1-2)',
      description: 'Extracts the executive summary and chapter 1 analysis.',
      sampleKey: 'report',
      args: { pageRange: '1-2' },
    },
    {
      id: 'split_single_page',
      name: 'Target Single Page (Page 2 Only)',
      description: 'Extracts exactly page 2 for isolated processing.',
      sampleKey: 'report',
      args: { pageRange: '2' },
    },
    {
      id: 'split_last_page',
      name: 'Conclusion & Metrics (Page 3 Only)',
      description: 'Extracts the final summary page from the 3-page report.',
      sampleKey: 'report',
      args: { pageRange: '3' },
    },
  ],
  organize_pdf: [
    {
      id: 'organize_rotate_and_number',
      name: 'Rotate Page 1 + Bottom Numbering',
      description: 'Rotates the cover page by 90° and stamps formatted page numbers at the bottom center.',
      sampleKey: 'report',
      args: {
        rotations: [{ page: 1, degrees: 90 }],
        addPageNumbers: { position: 'bottom-center', format: 'Page {n} of {total}' },
      },
    },
    {
      id: 'organize_reorder_pages',
      name: 'Reorder Page Sequence [3, 1, 2]',
      description: 'Reverses and reorganizes the order of pages into a new customized layout.',
      sampleKey: 'report',
      args: {
        pageOrder: [3, 1, 2],
        addPageNumbers: { position: 'bottom-right', format: 'Sheet {n}/{total}' },
      },
    },
    {
      id: 'organize_remove_page',
      name: 'Remove Intermediate Page 2',
      description: 'Deletes page 2 while preserving page 1 and page 3.',
      sampleKey: 'report',
      args: {
        removePages: [2],
        addPageNumbers: { position: 'bottom-center', format: 'Page {n}' },
      },
    },
  ],
  stamp_watermark: [
    {
      id: 'watermark_confidential_diagonal',
      name: 'Diagonal "CONFIDENTIAL" Banner (45°)',
      description: 'Stamps a 45-degree angled translucent red banner across all pages.',
      sampleKey: 'contract',
      args: {
        text: 'CONFIDENTIAL',
        opacity: 0.3,
        fontSize: 42,
        rotationDegrees: 45,
      },
    },
    {
      id: 'watermark_draft_subtle',
      name: 'Subtle "DRAFT COPY" Watermark',
      description: 'Light 15% opacity watermark for internal review drafts.',
      sampleKey: 'contract',
      args: {
        text: 'DRAFT COPY - NOT FOR EXECUTION',
        opacity: 0.18,
        fontSize: 32,
        rotationDegrees: 35,
      },
    },
    {
      id: 'watermark_classified_badge',
      name: 'High Visibility "TOP SECRET" Stamp',
      description: 'High-contrast 50% opacity security audit watermark.',
      sampleKey: 'contract',
      args: {
        text: 'CLASSIFIED / RESTRICTED',
        opacity: 0.5,
        fontSize: 38,
        rotationDegrees: 45,
      },
    },
  ],
  inspect_and_fill_form: [
    {
      id: 'form_fill_standard_employee',
      name: 'Standard AI Research Access Request',
      description: 'Populates standard employee onboarding name, email, department dropdown, and checkbox.',
      sampleKey: 'form',
      args: {
        values: {
          fullName: 'Jane Doe',
          email: 'jane.doe@enterprise.io',
          department: 'Autonomous AI Research',
          agreeToTerms: true,
          accessNotes: 'Standard production environment MCP server access request.',
        },
        flatten: false,
      },
    },
    {
      id: 'form_fill_and_flatten_security',
      name: 'Security Admin Request & Flatten',
      description: 'Fills administrative credentials and flattens all form fields into un-editable vector graphics.',
      sampleKey: 'form',
      args: {
        values: {
          fullName: 'Marcus Vance, Lead Auditor',
          email: 'm.vance@securityops.corp',
          department: 'Security Operations',
          agreeToTerms: true,
          accessNotes: 'Immediate root authorization for PDF zero-leakage security audit.',
        },
        flatten: true,
      },
    },
    {
      id: 'form_inspect_fields_only',
      name: 'Inspect Form Schema (Get Field Map)',
      description: 'Extracts all interactive AcroForm field definitions and names without altering content.',
      sampleKey: 'form',
      args: {
        values: {},
        flatten: false,
      },
    },
  ],
  extract_pdf_content: [
    {
      id: 'extract_summary_outline',
      name: 'Structured Summary & TOC Outline',
      description: 'Returns table of contents, word counts, metadata, and token budgets (~85% prompt savings).',
      sampleKey: 'report',
      args: {
        extractType: 'summary',
        pageRange: '1-3',
      },
    },
    {
      id: 'extract_full_text',
      name: 'Full Text Stream Extraction',
      description: 'Extracts raw text strings across all pages for comprehensive semantic parsing.',
      sampleKey: 'report',
      args: {
        extractType: 'full',
      },
    },
    {
      id: 'extract_metadata_only',
      name: 'Document Metadata & Header Stats Only',
      description: 'Pulls author, title, creation timestamps, and page count with zero text dump.',
      sampleKey: 'report',
      args: {
        extractType: 'metadata_only',
      },
    },
  ],
  merge_pdfs: [
    {
      id: 'merge_invoice_and_report',
      name: 'Merge Invoice + 3-Page Report',
      description: 'Combines the single-page invoice and 3-page report into a unified 4-page binder.',
      sampleKey: 'invoice',
      args: {
        filePaths: [
          './documents/sample-invoice-pii.pdf',
          './documents/sample-multi-chapter-report.pdf',
        ],
      },
    },
    {
      id: 'merge_report_and_nda',
      name: 'Merge Report + Legal NDA',
      description: 'Combines the multi-chapter report and 2-page legal NDA into a 5-page packet.',
      sampleKey: 'report',
      args: {
        filePaths: [
          './documents/sample-multi-chapter-report.pdf',
          './documents/sample-nda-agreement.pdf',
        ],
      },
    },
  ],
  create_pdf_from_text: [
    {
      id: 'create_tech_spec',
      name: 'Architecture & System Specification',
      description: 'Generates a formatted multi-section technical document from Markdown with styled banner headers.',
      sampleKey: 'report',
      args: {
        title: 'Model Context Protocol (MCP) PDF Engine Spec',
        content:
          '# Executive Summary\nGenerated dynamically by the Model Context Protocol PDF Engine.\n\n# System Guarantees\n- 100% Client-side and in-memory WebAssembly isolation.\n- Token-optimized structured text extraction saves ~85% LLM context.\n- Deterministic PDF-Lib byte manipulation with zero network leaks.',
      },
    },
    {
      id: 'create_compliance_audit',
      name: 'GDPR & HIPAA Compliance Audit Certificate',
      description: 'Creates a formal security verification letter with timestamp and sign-off.',
      sampleKey: 'report',
      args: {
        title: 'Zero-Knowledge Document Processing Certificate',
        content:
          '# Compliance Verification\nThis certifies that all document processing operations were completed inside an isolated client-side execution sandbox.\n\n# Verified Invariants\n- No unredacted PII was transmitted over public networks.\n- Cryptographic hashes match the target input specification.',
      },
    },
  ],
};
