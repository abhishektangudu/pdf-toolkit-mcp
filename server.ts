import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { MCP_TOOLS } from './src/mcp/tools';
import {
  mergePdfs,
  splitPdf,
  organizePdf,
  compressPdf,
  extractPdfContent,
  scanForPii,
  redactPdf,
  stampWatermark,
  createPdfFromText,
  getFormFields,
  fillForm,
} from './src/lib/pdf-engine';
import {
  createSampleInvoicePdf,
  createSampleReportPdf,
  createSampleContractPdf,
  createSampleFormPdf,
} from './src/lib/sample-pdfs';
import { EVAL_TEST_CASES, runTestCase, runEntireEvalSuite } from './src/lib/eval-suite';
import { predictAgentToolAndArgs, AGENT_ROUTING_SAMPLES } from './src/lib/agent-eval-router';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body parser with high limit for PDF buffers/base64
  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'pdf-agent-toolkit-mcp' });
  });

  // Get all MCP Tools specifications
  app.get('/api/mcp/tools', (req, res) => {
    res.json({
      tools: MCP_TOOLS,
      totalTools: MCP_TOOLS.length,
      protocolVersion: '2024-11-05',
    });
  });

  // Generate Sample PDF
  app.post('/api/pdf/sample', async (req, res) => {
    try {
      const type = req.body.type || 'invoice';
      let buffer: Uint8Array;
      let filename = 'sample.pdf';

      if (type === 'invoice') {
        buffer = await createSampleInvoicePdf();
        filename = 'sample-invoice-pii.pdf';
      } else if (type === 'contract') {
        buffer = await createSampleContractPdf();
        filename = 'sample-nda-agreement.pdf';
      } else if (type === 'form') {
        buffer = await createSampleFormPdf();
        filename = 'sample-onboarding-acroform.pdf';
      } else {
        buffer = await createSampleReportPdf();
        filename = 'sample-multi-chapter-report.pdf';
      }

      const base64 = Buffer.from(buffer).toString('base64');
      res.json({
        success: true,
        filename,
        sizeBytes: buffer.byteLength,
        base64,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Execute an MCP tool directly via HTTP (Simulation & Testing)
  app.post('/api/mcp/execute', async (req, res) => {
    const startTime = Date.now();
    const { toolName, args, fileBase64, filesBase64 } = req.body;

    try {
      let outputBuffer: Uint8Array | null = null;
      let outputFilename = 'output.pdf';
      let dataPayload: any = null;
      let metrics: any = {};

      const inputBuffer = fileBase64 ? new Uint8Array(Buffer.from(fileBase64, 'base64')) : null;

      switch (toolName) {
        case 'merge_pdfs': {
          let buffersToMerge: Uint8Array[] = [];
          if (filesBase64 && Array.isArray(filesBase64) && filesBase64.length > 0) {
            buffersToMerge = filesBase64.map((b: string) => new Uint8Array(Buffer.from(b, 'base64')));
          } else if (inputBuffer) {
            // Self-duplicate test merge if only 1 buffer provided
            buffersToMerge = [inputBuffer, inputBuffer];
          } else {
            const s1 = await createSampleInvoicePdf();
            const s2 = await createSampleReportPdf();
            buffersToMerge = [s1, s2];
          }
          outputBuffer = await mergePdfs(buffersToMerge);
          outputFilename = 'merged-document.pdf';
          dataPayload = { mergedFileCount: buffersToMerge.length };
          break;
        }

        case 'split_pdf': {
          const buf = inputBuffer || (await createSampleReportPdf());
          const pageRange = args?.pageRange || '1-2';
          outputBuffer = await splitPdf(buf, pageRange);
          outputFilename = `split-pages-${pageRange.replace(/[^0-9-]/g, '_')}.pdf`;
          dataPayload = { extractedRange: pageRange };
          break;
        }

        case 'organize_pdf': {
          const buf = inputBuffer || (await createSampleReportPdf());
          outputBuffer = await organizePdf(buf, {
            pageOrder: args?.pageOrder,
            rotations: args?.rotations,
            removePages: args?.removePages,
            addPageNumbers: args?.addPageNumbers || { position: 'bottom-center' },
          });
          outputFilename = 'organized-document.pdf';
          dataPayload = { operations: args };
          break;
        }

        case 'compress_pdf': {
          const buf = inputBuffer || (await createSampleInvoicePdf());
          const preset = args?.preset || 'ebook';
          const compResult = await compressPdf(buf, preset);
          outputBuffer = compResult.buffer;
          outputFilename = `compressed-${preset}.pdf`;
          metrics = {
            originalSizeBytes: compResult.originalSize,
            newSizeBytes: compResult.compressedSize,
            reductionPercentage: compResult.ratio,
          };
          dataPayload = { preset, ...metrics };
          break;
        }

        case 'extract_pdf_content': {
          const buf = inputBuffer || (await createSampleInvoicePdf());
          const extracted = await extractPdfContent(buf, {
            pageRange: args?.pageRange,
            extractType: args?.extractType || 'summary',
          });
          dataPayload = extracted;
          metrics = {
            tokensSavedEstimate: Math.max(0, Math.round(buf.byteLength / 4 - extracted.wordCount * 1.3)),
          };
          break;
        }

        case 'scan_and_redact_pii': {
          const buf = inputBuffer || (await createSampleInvoicePdf());
          // First scan
          const extracted = await extractPdfContent(buf);
          const piiFindings = await scanForPii(extracted.text, args?.customKeywords || []);

          // Apply redaction boxes (Default to surgical subset: Tax ID / SSN and Card on file)
          const boxes = args?.blackoutBoxes || [
            { page: 1, x: 38, y: 653, width: 180, height: 16 }, // Surgically redacts "Tax ID / SSN: 987-65-4321"
            { page: 1, x: 38, y: 638, width: 235, height: 16 }, // Surgically redacts "Card on file: 4532-8921-3829-1928"
          ];
          outputBuffer = await redactPdf(buf, {
            blackoutBoxes: boxes,
            redactionReason: args?.redactionReason || 'PII REDACTED',
          });
          outputFilename = 'redacted-document.pdf';
          dataPayload = {
            piiFindingsDetected: piiFindings,
            boxesAppliedCount: boxes.length,
            redactedFieldsSubset: ['Tax ID / SSN', 'Card on file'],
          };
          break;
        }

        case 'stamp_watermark': {
          const buf = inputBuffer || (await createSampleInvoicePdf());
          const text = args?.text || 'CONFIDENTIAL';
          outputBuffer = await stampWatermark(buf, {
            text,
            opacity: args?.opacity ?? 0.25,
            fontSize: args?.fontSize ?? 42,
            rotationDegrees: args?.rotationDegrees ?? 45,
          });
          outputFilename = 'watermarked.pdf';
          dataPayload = { watermarkText: text };
          break;
        }

        case 'create_pdf_from_text': {
          const title = args?.title || 'System Architecture Report';
          const content =
            args?.content ||
            '# Executive Summary\nThis document was generated automatically by the PDF Agent Toolkit MCP Server.\n\n# Key Findings\n- Client-side WebAssembly guarantees strict zero-data leakage.\n- Structured extraction reduces agent token consumption by ~85%.\n- Direct MCP tool integration accelerates autonomous workflow pipelines.';
          outputBuffer = await createPdfFromText(title, content);
          outputFilename = 'generated-report.pdf';
          dataPayload = { title, characterLength: content.length };
          break;
        }

        case 'inspect_and_fill_form': {
          const buf = inputBuffer || (await createSampleInvoicePdf());
          const fields = await getFormFields(buf);
          if (args?.values && Object.keys(args.values).length > 0) {
            outputBuffer = await fillForm(buf, args.values, args.flatten);
            outputFilename = 'filled-form.pdf';
            dataPayload = { filledFields: args.values, detectedFields: fields };
          } else {
            dataPayload = { detectedFields: fields, totalFields: fields.length };
          }
          break;
        }

        default:
          throw new Error(`Unrecognized tool: ${toolName}`);
      }

      const executionTimeMs = Date.now() - startTime;
      const responsePayload: any = {
        success: true,
        toolName,
        message: `Successfully executed ${toolName}`,
        data: dataPayload,
        metrics: {
          executionTimeMs,
          ...metrics,
        },
      };

      if (outputBuffer) {
        responsePayload.outputPdfBase64 = Buffer.from(outputBuffer).toString('base64');
        responsePayload.outputFilename = outputFilename;
        responsePayload.newSizeBytes = outputBuffer.byteLength;
      }

      res.json(responsePayload);
    } catch (err: any) {
      res.status(400).json({
        success: false,
        toolName,
        error: err?.message || String(err),
        executionTimeMs: Date.now() - startTime,
      });
    }
  });

  // Get list of evaluation benchmark cases
  app.get('/api/eval/cases', (req, res) => {
    res.json({
      testCases: EVAL_TEST_CASES,
      routingSamples: AGENT_ROUTING_SAMPLES,
      totalCases: EVAL_TEST_CASES.length,
    });
  });

  // Execute benchmark evaluation suite
  app.post('/api/eval/run', async (req, res) => {
    const { testId, category } = req.body;
    try {
      if (testId) {
        const result = await runTestCase(testId);
        return res.json({ success: true, result });
      }

      const suite = await runEntireEvalSuite(category);
      res.json({
        success: true,
        results: suite.results,
        summary: suite.summary,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || String(err),
      });
    }
  });

  // Test natural language intent routing live
  app.post('/api/eval/intent', (req, res) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Query string is required' });
      }
      const prediction = predictAgentToolAndArgs(query);
      res.json({
        success: true,
        query,
        prediction,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  // Vite Middleware Setup for dev / prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PDF Agent Toolkit & MCP Server running on http://localhost:${PORT}`);
  });
}

startServer();
