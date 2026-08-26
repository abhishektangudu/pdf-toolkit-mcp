import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Download,
  Play,
  RotateCw,
  Scissors,
  Layers,
  Minimize2,
  Eye,
  ShieldAlert,
  Stamp,
  FilePlus,
  CheckCircle2,
  Loader2,
  Clock,
  Sparkles,
  RefreshCw,
  Search,
  FileCheck,
  AlertTriangle,
  Columns,
  Maximize2,
  FileCode,
  Check,
  Zap,
} from 'lucide-react';
import type { McpToolDefinition, ToolExecutionResult } from '../types/pdf';
import type { SamplePdfType } from '../lib/sample-pdfs';
import { PdfViewer } from './PdfViewer';
import { PdfPreviewModal } from './PdfPreviewModal';

interface ToolsStudioProps {
  tools: McpToolDefinition[];
  onExecuteTool: (toolName: string, args: any, fileBase64?: string) => Promise<ToolExecutionResult>;
}

export const ToolsStudio: React.FC<ToolsStudioProps> = ({ tools, onExecuteTool }) => {
  const [selectedTool, setSelectedTool] = useState<string>('compress_pdf');
  const [activeSampleType, setActiveSampleType] = useState<SamplePdfType>('invoice');
  const [currentFileBase64, setCurrentFileBase64] = useState<string | null>(null);
  const [currentFilename, setCurrentFilename] = useState<string>('sample-invoice-pii.pdf');
  const [currentFileSize, setCurrentFileSize] = useState<number>(0);
  const [isLoadingSample, setIsLoadingSample] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<ToolExecutionResult | null>(null);

  // Right-side view mode tabs
  const [rightPanelTab, setRightPanelTab] = useState<'preview' | 'compare' | 'payload'>('preview');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Tool specific states
  const [compressPreset, setCompressPreset] = useState<'screen' | 'ebook' | 'printer'>('ebook');
  const [splitRange, setSplitRange] = useState<string>('1-2');
  const [rotateDegrees, setRotateDegrees] = useState<90 | 180 | 270>(90);
  const [targetRotatePage, setTargetRotatePage] = useState<number>(1);
  const [watermarkText, setWatermarkText] = useState<string>('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.25);
  const [createTitle, setCreateTitle] = useState<string>('Autonomous Agent Research Report');
  const [createBody, setCreateBody] = useState<string>(
    `# 1. Executive Summary\nThis document was generated on-the-fly using the zero-dependency PDF Agent Toolkit.\n\n# 2. Key Architecture Metrics\n- Direct WebAssembly & pure TypeScript execution.\n- 88% reduction in token consumption compared to raw base64 context dumps.\n- Local privacy guarantees with zero cloud upload requirements.\n\n# 3. Next Actions\nDeploy as an MCP Server across team workflows.`
  );
  const [customKeywordRedact, setCustomKeywordRedact] = useState<string>('Confidential');
  const [redactTaxId, setRedactTaxId] = useState<boolean>(true);
  const [redactCreditCard, setRedactCreditCard] = useState<boolean>(true);
  const [redactEmail, setRedactEmail] = useState<boolean>(false);
  const [redactPhone, setRedactPhone] = useState<boolean>(false);
  const [formFillData, setFormFillData] = useState<string>('{"fullName": "Sarah Connor", "agreeToTerms": true}');

  // Load sample on mount
  useEffect(() => {
    loadSample('invoice');
  }, []);

  const loadSample = async (type: SamplePdfType) => {
    setIsLoadingSample(true);
    try {
      const res = await fetch('/api/pdf/sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentFileBase64(data.base64);
        setCurrentFilename(data.filename);
        setCurrentFileSize(data.sizeBytes);
        setActiveSampleType(type);
        setExecutionResult(null);
        setRightPanelTab('preview');
      }
    } catch (err) {
      console.error('Failed to load sample:', err);
    } finally {
      setIsLoadingSample(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      setCurrentFileBase64(base64);
      setCurrentFilename(file.name);
      setCurrentFileSize(file.size);
      setExecutionResult(null);
      setRightPanelTab('preview');
    };
    reader.readAsDataURL(file);
  };

  const handleRunTool = async () => {
    setIsExecuting(true);
    setExecutionResult(null);

    let toolArgs: any = {};

    switch (selectedTool) {
      case 'compress_pdf':
        toolArgs = { preset: compressPreset };
        break;
      case 'split_pdf':
        toolArgs = { pageRange: splitRange };
        break;
      case 'organize_pdf':
        toolArgs = {
          rotations: [{ page: targetRotatePage, degrees: rotateDegrees }],
          addPageNumbers: { position: 'bottom-center' },
        };
        break;
      case 'merge_pdfs':
        toolArgs = {};
        break;
      case 'extract_pdf_content':
        toolArgs = { extractType: 'summary' };
        break;
      case 'scan_and_redact_pii': {
        const boxes: { page: number; x: number; y: number; width: number; height: number }[] = [];
        if (redactTaxId) {
          boxes.push({ page: 1, x: 38, y: 653, width: 180, height: 16 }); // Tax ID / SSN
        }
        if (redactCreditCard) {
          boxes.push({ page: 1, x: 38, y: 638, width: 235, height: 16 }); // Credit card on file
        }
        if (redactEmail) {
          boxes.push({ page: 1, x: 38, y: 683, width: 220, height: 16 }); // Contact Email
        }
        if (redactPhone) {
          boxes.push({ page: 1, x: 38, y: 668, width: 170, height: 16 }); // Phone Number
        }
        toolArgs = {
          customKeywords: customKeywordRedact ? [customKeywordRedact] : [],
          redactionReason: 'CONFIDENTIAL',
          blackoutBoxes: boxes.length > 0 ? boxes : undefined,
        };
        break;
      }
      case 'stamp_watermark':
        toolArgs = {
          text: watermarkText,
          opacity: watermarkOpacity,
          rotationDegrees: 45,
        };
        break;
      case 'create_pdf_from_text':
        toolArgs = {
          title: createTitle,
          content: createBody,
        };
        break;
      case 'inspect_and_fill_form':
        try {
          toolArgs = { values: JSON.parse(formFillData), flatten: true };
        } catch {
          toolArgs = { values: {}, flatten: false };
        }
        break;
    }

    try {
      const result = await onExecuteTool(selectedTool, toolArgs, currentFileBase64 || undefined);
      setExecutionResult(result);
      if (result.outputPdfBase64) {
        setRightPanelTab('compare');
      } else {
        setRightPanelTab('payload');
      }
    } catch (err: any) {
      setExecutionResult({
        success: false,
        toolName: selectedTool,
        message: err.message || 'Execution failed',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const downloadOutputPdf = () => {
    if (!executionResult?.outputPdfBase64) return;
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${executionResult.outputPdfBase64}`;
    link.download = executionResult.outputFilename || 'processed.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toolCategories = [
    {
      name: 'Optimization & Security',
      tools: [
        { id: 'compress_pdf', label: 'Compress PDF', icon: Minimize2, tag: 'Up to -70%' },
        { id: 'scan_and_redact_pii', label: 'PII Privacy Scanner', icon: ShieldAlert, tag: 'GDPR/HIPAA' },
        { id: 'stamp_watermark', label: 'Stamp Watermark', icon: Stamp, tag: 'Visual Brand' },
      ],
    },
    {
      name: 'Structure & Pages',
      tools: [
        { id: 'split_pdf', label: 'Split / Extract Pages', icon: Scissors, tag: 'Page Ranges' },
        { id: 'organize_pdf', label: 'Rotate & Organize', icon: RotateCw, tag: 'Compound' },
        { id: 'merge_pdfs', label: 'Merge Documents', icon: Layers, tag: 'Multi-file' },
      ],
    },
    {
      name: 'Agent Intelligence',
      tools: [
        { id: 'extract_pdf_content', label: 'Token-Optimized Extraction', icon: Eye, tag: 'Save 90% Tokens' },
        { id: 'create_pdf_from_text', label: 'Create from Markdown', icon: FilePlus, tag: 'Instant Doc' },
        { id: 'inspect_and_fill_form', label: 'Inspect & Fill Forms', icon: FileCheck, tag: 'AcroForm' },
      ],
    },
  ];

  const sampleButtons = [
    { type: 'invoice' as SamplePdfType, label: '🧾 Invoice with PII', subtext: '1-page invoice, tax IDs, credit card' },
    { type: 'report' as SamplePdfType, label: '📊 3-Page Tech Report', subtext: 'Multi-chapter whitepaper, headers' },
    { type: 'contract' as SamplePdfType, label: '📑 Legal NDA Agreement', subtext: '2-page contract, signatures' },
    { type: 'form' as SamplePdfType, label: '📝 Interactive AcroForm', subtext: 'Fillable text fields & checkboxes' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Explanation */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Live Interactive PDF Workbench
              </span>
              <span className="text-xs text-slate-400">Zero Cloud Uploads • 100% In-Memory Preview</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              PDF Agent Toolkit & Live Document Inspector
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              View input sample PDFs, test deterministic MCP operations in real-time, and inspect the resulting output side-by-side.
            </p>
          </div>

          {/* Quick Action: Open Fullscreen Viewer */}
          {currentFileBase64 && (
            <button
              id="btn-quick-preview-modal"
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 border border-indigo-400/40 shadow-xs transition-all shrink-0"
            >
              <Eye className="w-4 h-4" />
              <span>Full Screen PDF Preview</span>
            </button>
          )}
        </div>

        {/* Sample Switcher Carousel */}
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Select Sample PDF to Process & Inspect:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {sampleButtons.map((sample) => {
              const isActive = activeSampleType === sample.type;
              return (
                <button
                  key={sample.type}
                  onClick={() => loadSample(sample.type)}
                  disabled={isLoadingSample}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    isActive
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                      : 'bg-slate-800/70 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="text-xs font-bold truncate">{sample.label}</div>
                  <div className={`text-[10px] mt-0.5 truncate ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>
                    {sample.subtext}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tool Selector & Configuration */}
        <div className="lg:col-span-5 space-y-6">
          {/* Tool Categories Selection */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                Select PDF Operation
              </h3>
              <label className="cursor-pointer px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center space-x-1.5 transition-colors">
                <Upload className="w-3 h-3 text-slate-500" />
                <span>Upload Custom</span>
                <input type="file" accept="application/pdf" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <div className="space-y-4">
              {toolCategories.map((cat, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="text-xs font-medium text-slate-500">{cat.name}</div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {cat.tools.map((t) => {
                      const Icon = t.icon;
                      const isSelected = selectedTool === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => {
                            setSelectedTool(t.id);
                            setExecutionResult(null);
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-xl text-left border transition-all ${
                            isSelected
                              ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 shadow-xs'
                              : 'bg-slate-50/50 border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <div
                              className={`p-1.5 rounded-lg ${
                                isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="text-xs sm:text-sm font-medium">{t.label}</span>
                          </div>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                              isSelected
                                ? 'bg-indigo-200/70 text-indigo-900'
                                : 'bg-slate-200/70 text-slate-600'
                            }`}
                          >
                            {t.tag}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Tool Parameters Box */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Tool Arguments Configuration</span>
              </div>
              <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                mcp::{selectedTool}
              </span>
            </div>

            {/* Dynamic Controls based on selected tool */}
            {selectedTool === 'compress_pdf' && (
              <div className="space-y-3">
                <label className="text-xs font-medium text-slate-700 block">Optimization Quality Preset</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['screen', 'ebook', 'printer'] as const).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCompressPreset(preset)}
                      className={`p-2.5 rounded-xl border text-center text-xs font-medium transition-all ${
                        compressPreset === preset
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-bold capitalize">{preset}</div>
                      <div className="text-[10px] opacity-80">
                        {preset === 'screen'
                          ? '72 DPI (Max)'
                          : preset === 'ebook'
                          ? '150 DPI (Balanced)'
                          : '300 DPI (Print)'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedTool === 'split_pdf' && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700 block">Page Range to Extract</label>
                <input
                  type="text"
                  value={splitRange}
                  onChange={(e) => setSplitRange(e.target.value)}
                  placeholder="e.g. 1-2 or 1, 3"
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500">Supports ranges (1-3) and comma separation (1, 2, 3).</p>
              </div>
            )}

            {selectedTool === 'organize_pdf' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Target Page to Rotate</label>
                  <input
                    type="number"
                    min="1"
                    value={targetRotatePage}
                    onChange={(e) => setTargetRotatePage(parseInt(e.target.value, 10) || 1)}
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Rotation Angle</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([90, 180, 270] as const).map((deg) => (
                      <button
                        key={deg}
                        type="button"
                        onClick={() => setRotateDegrees(deg)}
                        className={`p-2 rounded-xl border text-xs font-medium transition-all ${
                          rotateDegrees === deg
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        +{deg}°
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedTool === 'stamp_watermark' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Watermark Text</label>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Opacity: {watermarkOpacity}
                  </label>
                  <input
                    type="range"
                    min="0.05"
                    max="0.8"
                    step="0.05"
                    value={watermarkOpacity}
                    onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {selectedTool === 'scan_and_redact_pii' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                    Select Fields to Redact (Surgical Blackout):
                  </label>
                  <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={redactTaxId}
                        onChange={(e) => setRedactTaxId(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-medium text-slate-800">Tax ID / SSN</span>
                      <span className="text-[11px] font-mono text-slate-500">(987-65-4321)</span>
                    </label>

                    <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={redactCreditCard}
                        onChange={(e) => setRedactCreditCard(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-medium text-slate-800">Credit Card on file</span>
                      <span className="text-[11px] font-mono text-slate-500">(4532-8921-...)</span>
                    </label>

                    <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={redactEmail}
                        onChange={(e) => setRedactEmail(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-medium text-slate-800">Contact Email</span>
                      <span className="text-[11px] font-mono text-slate-500">(finance@acmeglobal.com)</span>
                    </label>

                    <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={redactPhone}
                        onChange={(e) => setRedactPhone(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-medium text-slate-800">Phone Number</span>
                      <span className="text-[11px] font-mono text-slate-500">((555) 234-5678)</span>
                    </label>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Unchecked fields and company metadata remain 100% visible and unredacted.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 block">Custom Sensitive Keyword</label>
                  <input
                    type="text"
                    value={customKeywordRedact}
                    onChange={(e) => setCustomKeywordRedact(e.target.value)}
                    placeholder="e.g. Confidential, SecretKey"
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
            )}

            {selectedTool === 'create_pdf_from_text' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Document Title</label>
                  <input
                    type="text"
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Markdown Body</label>
                  <textarea
                    rows={5}
                    value={createBody}
                    onChange={(e) => setCreateBody(e.target.value)}
                    className="w-full text-xs font-mono p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
            )}

            {selectedTool === 'inspect_and_fill_form' && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700 block">Form Field Values (JSON)</label>
                <textarea
                  rows={3}
                  value={formFillData}
                  onChange={(e) => setFormFillData(e.target.value)}
                  className="w-full text-xs font-mono p-2 border border-slate-300 rounded-xl"
                />
                <p className="text-[11px] text-slate-500">
                  Provide field name and value pairs. Select "Interactive AcroForm" sample above to test.
                </p>
              </div>
            )}

            {/* Execute Button */}
            <button
              id="run-tool-btn"
              onClick={handleRunTool}
              disabled={isExecuting}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold flex items-center justify-center space-x-2 shadow-sm transition-all disabled:opacity-50"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Executing MCP Tool...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Execute Tool Action</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Visual PDF Viewer, Before/After Comparison & Output Telemetry */}
        <div className="lg:col-span-7 space-y-5">
          {/* Tab Navigation Header */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-1.5">
              <button
                id="btn-tab-preview"
                onClick={() => setRightPanelTab('preview')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  rightPanelTab === 'preview'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Input Document Preview</span>
              </button>

              {executionResult?.outputPdfBase64 && (
                <button
                  id="btn-tab-compare"
                  onClick={() => setRightPanelTab('compare')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    rightPanelTab === 'compare'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Columns className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Before vs After</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </button>
              )}

              <button
                id="btn-tab-payload"
                onClick={() => setRightPanelTab('payload')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  rightPanelTab === 'payload'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Execution Metrics</span>
                {executionResult && (
                  <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded-full font-bold">
                    New
                  </span>
                )}
              </button>
            </div>

            <button
              id="btn-open-modal-expand"
              onClick={() => setIsModalOpen(true)}
              className="px-2.5 py-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-medium flex items-center space-x-1 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Expand</span>
            </button>
          </div>

          {/* Tab 1: Input Document Viewer */}
          {rightPanelTab === 'preview' && (
            <div className="space-y-4">
              <PdfViewer
                base64={currentFileBase64}
                filename={currentFilename}
                sizeBytes={currentFileSize}
                title={`Active Sample: ${currentFilename}`}
                badge={activeSampleType.toUpperCase()}
                badgeColor="indigo"
                heightClass="h-[460px]"
                onOpenModal={() => setIsModalOpen(true)}
              />
            </div>
          )}

          {/* Tab 2: Before vs After Side-by-Side Comparison */}
          {rightPanelTab === 'compare' && executionResult?.outputPdfBase64 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>Before: Input Document</span>
                  </div>
                  <PdfViewer
                    base64={currentFileBase64}
                    filename={currentFilename}
                    sizeBytes={currentFileSize}
                    badge="Input Original"
                    badgeColor="blue"
                    heightClass="h-[420px]"
                    onOpenModal={() => setIsModalOpen(true)}
                  />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-1.5 flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>After: Processed Output ({executionResult.outputFilename})</span>
                  </div>
                  <PdfViewer
                    base64={executionResult.outputPdfBase64}
                    filename={executionResult.outputFilename}
                    sizeBytes={executionResult.metrics?.newSizeBytes}
                    badge="Processed Output"
                    badgeColor="emerald"
                    heightClass="h-[420px]"
                    onOpenModal={() => setIsModalOpen(true)}
                  />
                </div>
              </div>

              {/* Download Bar */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                <div className="text-xs text-emerald-900 font-medium">
                  Processed output ready: <strong>{executionResult.outputFilename}</strong>
                </div>
                <button
                  onClick={downloadOutputPdf}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Output PDF</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Execution Metrics & Structured Payload */}
          {rightPanelTab === 'payload' && (
            <div className="space-y-4">
              {executionResult ? (
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-sm font-bold text-slate-900">Execution Telemetry</span>
                    </div>
                    {executionResult.metrics?.executionTimeMs !== undefined && (
                      <span className="text-xs text-slate-500 flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{executionResult.metrics.executionTimeMs} ms</span>
                      </span>
                    )}
                  </div>

                  {/* Performance Metrics Cards */}
                  {executionResult.metrics && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {executionResult.metrics.reductionPercentage !== undefined && (
                        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3">
                          <div className="text-[11px] font-medium text-emerald-800">Size Compression</div>
                          <div className="text-lg font-bold text-emerald-900">
                            -{executionResult.metrics.reductionPercentage}%
                          </div>
                        </div>
                      )}
                      {executionResult.metrics.newSizeBytes !== undefined && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                          <div className="text-[11px] font-medium text-slate-600">Output Size</div>
                          <div className="text-lg font-bold text-slate-900">
                            {(executionResult.metrics.newSizeBytes / 1024).toFixed(1)} KB
                          </div>
                        </div>
                      )}
                      {executionResult.metrics.tokensSavedEstimate !== undefined && (
                        <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3">
                          <div className="text-[11px] font-medium text-indigo-800">Tokens Saved</div>
                          <div className="text-lg font-bold text-indigo-900">
                            ~{executionResult.metrics.tokensSavedEstimate.toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Structured Output Data */}
                  {executionResult.data && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-slate-700">Structured Tool Response:</div>
                      <pre className="text-[11px] font-mono bg-slate-900 text-slate-200 p-3.5 rounded-xl overflow-x-auto max-h-60 border border-slate-800">
                        {JSON.stringify(executionResult.data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Action */}
                  {executionResult.outputPdfBase64 && (
                    <button
                      onClick={downloadOutputPdf}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold flex items-center justify-center space-x-2 shadow-xs transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Processed PDF ({executionResult.outputFilename})</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50/70 border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 mx-auto shadow-xs">
                    <Play className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">No Tool Executed Yet</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      Configure arguments on the left and click <strong>Execute Tool Action</strong> to run.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Architecture Insights Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-800 mb-2 flex items-center space-x-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
              <span>Pure Client-Side In-Memory Processing</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Documents are processed directly in the browser runtime using native TypeScript object streams (<code className="text-indigo-600 font-mono">pdf-lib</code>). 
              No third-party cloud upload or file system persistence is required, guaranteeing zero document leakage.
            </p>
          </div>
        </div>
      </div>

      {/* Fullscreen PDF Modal */}
      <PdfPreviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Document Inspection: ${currentFilename}`}
        inputPdfBase64={currentFileBase64}
        inputFilename={currentFilename}
        outputPdfBase64={executionResult?.outputPdfBase64}
        outputFilename={executionResult?.outputFilename}
        badge={activeSampleType.toUpperCase()}
      />
    </div>
  );
};
