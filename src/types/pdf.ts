export type ToolCategory = 'organization' | 'optimization' | 'extraction' | 'security' | 'creation' | 'forms';

export interface McpToolDefinition {
  name: string;
  category: ToolCategory;
  displayName: string;
  description: string;
  tokenSavingHighlight: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface PdfOutlineItem {
  title: string;
  page: number;
  level?: number;
}

export interface ExtractedPdfContent {
  totalPages: number;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: string;
    modificationDate?: string;
  };
  text: string;
  wordCount: number;
  characterCount: number;
  outline?: PdfOutlineItem[];
  pagesPreview?: { page: number; textSnippet: string; wordCount: number }[];
}

export interface PiiScanFinding {
  type: 'email' | 'phone' | 'ssn' | 'credit_card' | 'aadhaar' | 'custom';
  value: string;
  page: number;
  count: number;
}

export interface FormFieldInfo {
  name: string;
  type: 'text' | 'checkbox' | 'dropdown' | 'radio' | 'button' | 'unknown';
  value?: string | boolean;
  options?: string[];
}

export interface ToolExecutionResult {
  success: boolean;
  toolName: string;
  message: string;
  data?: any;
  outputPdfBase64?: string;
  outputFilename?: string;
  outputImageBase64?: string;
  mimeType?: string;
  metrics?: {
    originalSizeBytes?: number;
    newSizeBytes?: number;
    reductionPercentage?: number;
    executionTimeMs?: number;
    tokensSavedEstimate?: number;
  };
}
