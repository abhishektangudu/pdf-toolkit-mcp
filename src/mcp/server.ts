import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs/promises';
import { MCP_TOOLS } from './tools';
import {
  mergePdfs,
  splitPdf,
  organizePdf,
  compressPdf,
  extractPdfContent,
  redactPdf,
  stampWatermark,
  createPdfFromText,
  getFormFields,
  fillForm,
} from '../lib/pdf-engine';

/**
 * Creates and initializes the MCP Server instance
 */
export function createPdfMcpServer() {
  const server = new Server(
    {
      name: 'pdf-agent-toolkit-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  // Expose MCP Tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: MCP_TOOLS.map((t) => ({
        name: t.name,
        description: `${t.description} [Optimization: ${t.tokenSavingHighlight}]`,
        inputSchema: t.inputSchema,
      })),
    };
  });

  // Handle Tool Calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;
    const startTime = Date.now();

    try {
      switch (name) {
        case 'merge_pdfs': {
          const { filePaths, outputPath } = args as { filePaths: string[]; outputPath: string };
          if (!filePaths || filePaths.length < 2) {
            throw new Error('merge_pdfs requires at least 2 file paths');
          }
          const buffers = await Promise.all(filePaths.map((p) => fs.readFile(p)));
          const mergedBytes = await mergePdfs(buffers);
          await fs.writeFile(outputPath, mergedBytes);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'success',
                  tool: name,
                  message: `Successfully merged ${filePaths.length} PDFs into ${outputPath}`,
                  mergedFileSizeBytes: mergedBytes.byteLength,
                  executionTimeMs: Date.now() - startTime,
                }),
              },
            ],
          };
        }

        case 'split_pdf': {
          const { inputPath, outputPath, pageRange } = args as {
            inputPath: string;
            outputPath: string;
            pageRange: string;
          };
          const fileBytes = await fs.readFile(inputPath);
          const splitBytes = await splitPdf(fileBytes, pageRange);
          await fs.writeFile(outputPath, splitBytes);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'success',
                  tool: name,
                  message: `Extracted page range "${pageRange}" from ${inputPath} to ${outputPath}`,
                  outputFileSizeBytes: splitBytes.byteLength,
                  executionTimeMs: Date.now() - startTime,
                }),
              },
            ],
          };
        }

        case 'organize_pdf': {
          const { inputPath, outputPath, pageOrder, removePages, rotations, addPageNumbers } =
            args as any;
          const fileBytes = await fs.readFile(inputPath);
          const organizedBytes = await organizePdf(fileBytes, {
            pageOrder,
            removePages,
            rotations,
            addPageNumbers,
          });
          await fs.writeFile(outputPath, organizedBytes);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'success',
                  tool: name,
                  message: `Organized and saved PDF to ${outputPath}`,
                  outputFileSizeBytes: organizedBytes.byteLength,
                  executionTimeMs: Date.now() - startTime,
                }),
              },
            ],
          };
        }

        case 'compress_pdf': {
          const { inputPath, outputPath, preset } = args as {
            inputPath: string;
            outputPath: string;
            preset?: 'screen' | 'ebook' | 'printer';
          };
          const fileBytes = await fs.readFile(inputPath);
          const result = await compressPdf(fileBytes, preset);
          await fs.writeFile(outputPath, result.buffer);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'success',
                  tool: name,
                  message: `Compressed PDF by ${result.ratio}% (${result.originalSize} -> ${result.compressedSize} bytes)`,
                  originalSizeBytes: result.originalSize,
                  compressedSizeBytes: result.compressedSize,
                  reductionRatioPercent: result.ratio,
                  executionTimeMs: Date.now() - startTime,
                }),
              },
            ],
          };
        }

        case 'extract_pdf_content': {
          const { inputPath, pageRange, extractType } = args as any;
          const fileBytes = await fs.readFile(inputPath);
          const extracted = await extractPdfContent(fileBytes, { pageRange, extractType });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'success',
                  tool: name,
                  totalPages: extracted.totalPages,
                  metadata: extracted.metadata,
                  wordCount: extracted.wordCount,
                  characterCount: extracted.characterCount,
                  textSnippet: extracted.text.slice(0, 3000),
                  pagesPreview: extracted.pagesPreview,
                  executionTimeMs: Date.now() - startTime,
                }),
              },
            ],
          };
        }

        case 'scan_and_redact_pii': {
          const { inputPath, outputPath, blackoutBoxes, redactionReason } = args as any;
          const fileBytes = await fs.readFile(inputPath);
          const redactedBytes = await redactPdf(fileBytes, { blackoutBoxes, redactionReason });
          await fs.writeFile(outputPath, redactedBytes);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'success',
                  tool: name,
                  message: `Redacted sensitive areas in ${inputPath} and saved to ${outputPath}`,
                  executionTimeMs: Date.now() - startTime,
                }),
              },
            ],
          };
        }

        case 'stamp_watermark': {
          const { inputPath, outputPath, text, opacity, fontSize, rotationDegrees } = args as any;
          const fileBytes = await fs.readFile(inputPath);
          const stampedBytes = await stampWatermark(fileBytes, {
            text,
            opacity,
            fontSize,
            rotationDegrees,
          });
          await fs.writeFile(outputPath, stampedBytes);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'success',
                  tool: name,
                  message: `Stamped watermark "${text}" on ${outputPath}`,
                  executionTimeMs: Date.now() - startTime,
                }),
              },
            ],
          };
        }

        case 'create_pdf_from_text': {
          const { title, content, outputPath } = args as any;
          const createdBytes = await createPdfFromText(title, content);
          await fs.writeFile(outputPath, createdBytes);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'success',
                  tool: name,
                  message: `Created PDF document "${title}" at ${outputPath}`,
                  fileSizeBytes: createdBytes.byteLength,
                  executionTimeMs: Date.now() - startTime,
                }),
              },
            ],
          };
        }

        case 'inspect_and_fill_form': {
          const { inputPath, outputPath, values, flatten } = args as any;
          const fileBytes = await fs.readFile(inputPath);

          if (!values || Object.keys(values).length === 0) {
            // Inspection mode
            const fields = await getFormFields(fileBytes);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    status: 'success',
                    tool: name,
                    detectedFields: fields,
                    totalFields: fields.length,
                    executionTimeMs: Date.now() - startTime,
                  }),
                },
              ],
            };
          } else {
            // Fill mode
            if (!outputPath) throw new Error('outputPath is required when filling form fields');
            const filledBytes = await fillForm(fileBytes, values, flatten);
            await fs.writeFile(outputPath, filledBytes);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    status: 'success',
                    tool: name,
                    message: `Filled ${Object.keys(values).length} form fields into ${outputPath}`,
                    flattened: !!flatten,
                    executionTimeMs: Date.now() - startTime,
                  }),
                },
              ],
            };
          }
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (err: any) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'error',
              tool: name,
              error: err?.message || String(err),
            }),
          },
        ],
      };
    }
  });

  return server;
}

/**
 * Run stdio MCP server for CLI agent execution
 */
export async function startMcpStdioServer() {
  const server = createPdfMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('PDF Agent Toolkit MCP Server running on stdio');
}
