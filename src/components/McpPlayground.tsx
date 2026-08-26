import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu,
  Terminal,
  Send,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  Zap,
  ArrowRight,
  Code2,
  Eye,
  FileText,
  Upload,
  Download,
  FolderInput,
  FolderOutput,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import type { McpToolDefinition, ToolExecutionResult } from '../types/pdf';
import { TOOL_PRESETS, type ToolPreset } from '../lib/tool-presets';
import { PdfPreviewModal } from './PdfPreviewModal';
import { PdfViewer } from './PdfViewer';

interface McpPlaygroundProps {
  tools: McpToolDefinition[];
  onExecuteTool: (toolName: string, args: any, fileBase64?: string) => Promise<ToolExecutionResult>;
}

type SampleKey = 'invoice' | 'report' | 'contract' | 'form';

interface SampleMeta {
  key: SampleKey;
  label: string;
  icon: string;
  filename: string;
  defaultInputPath: string;
  description: string;
}

const SAMPLES: Record<SampleKey, SampleMeta> = {
  invoice: {
    key: 'invoice',
    label: 'Invoice (PII)',
    icon: '🧾',
    filename: 'sample-invoice-pii.pdf',
    defaultInputPath: './documents/sample-invoice-pii.pdf',
    description: '1-Page Commercial Invoice with customer PII (SSN, credit card, emails)',
  },
  report: {
    key: 'report',
    label: '3-Page Report',
    icon: '📊',
    filename: 'sample-multi-chapter-report.pdf',
    defaultInputPath: './documents/sample-multi-chapter-report.pdf',
    description: '3-Page Multi-Chapter Report with diagrams and headers',
  },
  contract: {
    key: 'contract',
    label: 'NDA Contract',
    icon: '📑',
    filename: 'sample-nda-agreement.pdf',
    defaultInputPath: './documents/sample-nda-agreement.pdf',
    description: '2-Page Legal Agreement with confidentiality terms and signature blocks',
  },
  form: {
    key: 'form',
    label: 'AcroForm',
    icon: '📝',
    filename: 'sample-onboarding-acroform.pdf',
    defaultInputPath: './documents/sample-onboarding-acroform.pdf',
    description: 'Interactive PDF Form with fillable inputs and checkboxes',
  },
};

export const McpPlayground: React.FC<McpPlaygroundProps> = ({ tools, onExecuteTool }) => {
  const [selectedToolName, setSelectedToolName] = useState<string>('scan_and_redact_pii');
  
  // Abstracted Path States
  const [inputPath, setInputPath] = useState<string>('./documents/sample-invoice-pii.pdf');
  const [outputPath, setOutputPath] = useState<string>('./documents/out-invoice-pii-redacted.pdf');
  const [activeSampleKey, setActiveSampleKey] = useState<SampleKey | 'custom'>('invoice');
  const [activeFileBase64, setActiveFileBase64] = useState<string | null>(null);
  const [activeFilename, setActiveFilename] = useState<string>('sample-invoice-pii.pdf');

  // Tool-specific JSON Arguments (excluding abstracted file paths)
  const [activePresetId, setActivePresetId] = useState<string>('redact_sensitive_subset');
  const [jsonArgs, setJsonArgs] = useState<string>(
    JSON.stringify(
      {
        redactionReason: 'PII REDACTED (GDPR/HIPAA)',
        customKeywords: ['SecretKey', 'Confidential'],
        blackoutBoxes: [
          { page: 1, x: 38, y: 653, width: 180, height: 16 }, // Surgically redacts "Tax ID / SSN: 987-65-4321"
          { page: 1, x: 38, y: 638, width: 235, height: 16 }, // Surgically redacts "Card on file: 4532-8921-3829-1928"
        ],
      },
      null,
      2
    )
  );

  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [responseLog, setResponseLog] = useState<any | null>(null);
  const [lastOutputBase64, setLastOutputBase64] = useState<string | null>(null);
  const [lastOutputFilename, setLastOutputFilename] = useState<string>('output.pdf');
  const [lastOutputSize, setLastOutputSize] = useState<number>(0);
  const [rightPanelTab, setRightPanelTab] = useState<'preview' | 'json' | 'compare'>('preview');
  const [copied, setCopied] = useState<boolean>(false);
  const [showFullRpcPreview, setShowFullRpcPreview] = useState<boolean>(false);

  // Sample PDF Preview Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewBase64, setPreviewBase64] = useState<string | null>(null);
  const [previewFilename, setPreviewFilename] = useState<string>('sample.pdf');
  const [previewTitle, setPreviewTitle] = useState<string>('Sample Document');
  const [previewBadge, setPreviewBadge] = useState<string>('SAMPLE');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-load default sample buffer on mount
  useEffect(() => {
    loadSampleBuffer('invoice', false);
  }, []);

  const loadSampleBuffer = async (type: SampleKey, openModal = false) => {
    try {
      const res = await fetch('/api/pdf/sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveFileBase64(data.base64);
        setActiveFilename(data.filename);
        setActiveSampleKey(type);
        setInputPath(SAMPLES[type].defaultInputPath);

        // Update default output path based on tool and sample
        updateDefaultOutputPath(selectedToolName, type);

        if (openModal) {
          setPreviewBase64(data.base64);
          setPreviewFilename(data.filename);
          setPreviewTitle(
            type === 'invoice'
              ? 'Sample: Invoice with PII'
              : type === 'contract'
              ? 'Sample: NDA Agreement'
              : type === 'form'
              ? 'Sample: Interactive AcroForm'
              : 'Sample: 3-Page Multi-Chapter Report'
          );
          setPreviewBadge(type.toUpperCase());
          setIsPreviewOpen(true);
        }
      }
    } catch (err) {
      console.error('Failed to load sample buffer:', err);
    }
  };

  const updateDefaultOutputPath = (toolName: string, sample: SampleKey | 'custom', customName?: string) => {
    const baseSlug = customName
      ? customName.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9-_]/g, '_')
      : sample === 'invoice'
      ? 'invoice-pii'
      : sample === 'report'
      ? 'multi-chapter-report'
      : sample === 'contract'
      ? 'nda-agreement'
      : sample === 'form'
      ? 'onboarding-form'
      : 'document';

    switch (toolName) {
      case 'scan_and_redact_pii':
        setOutputPath(`./documents/out-${baseSlug}-redacted.pdf`);
        break;
      case 'compress_pdf':
        setOutputPath(`./documents/out-${baseSlug}-compressed.pdf`);
        break;
      case 'split_pdf':
        setOutputPath(`./documents/out-${baseSlug}-pages-1-2.pdf`);
        break;
      case 'organize_pdf':
        setOutputPath(`./documents/out-${baseSlug}-organized.pdf`);
        break;
      case 'stamp_watermark':
        setOutputPath(`./documents/out-${baseSlug}-watermarked.pdf`);
        break;
      case 'inspect_and_fill_form':
        setOutputPath(`./documents/out-${baseSlug}-filled.pdf`);
        break;
      case 'merge_pdfs':
        setOutputPath(`./documents/out-merged-package.pdf`);
        break;
      case 'create_pdf_from_text':
        setOutputPath(`./documents/out-generated-report.pdf`);
        break;
      case 'extract_pdf_content':
        setOutputPath(`(Not applicable - returns structured text/tokens)`);
        break;
      default:
        setOutputPath(`./documents/out-${baseSlug}-result.pdf`);
    }
  };

  const activeTool = tools.find((t) => t.name === selectedToolName) || tools[0];

  const handleToolSelect = (toolName: string) => {
    setSelectedToolName(toolName);
    setResponseLog(null);
    setLastOutputBase64(null);

    const presetsForTool = TOOL_PRESETS[toolName] || [];
    if (presetsForTool.length > 0) {
      const defaultPreset = presetsForTool[0];
      applyPreset(defaultPreset, toolName);
    } else {
      setActivePresetId('custom');
      // Pick recommended default sample for this tool
      let recommendedSample: SampleKey = 'invoice';
      if (['split_pdf', 'organize_pdf', 'compress_pdf', 'extract_pdf_content'].includes(toolName)) {
        recommendedSample = 'report';
      } else if (toolName === 'stamp_watermark') {
        recommendedSample = 'contract';
      } else if (toolName === 'inspect_and_fill_form') {
        recommendedSample = 'form';
      }

      if (toolName !== 'create_pdf_from_text') {
        loadSampleBuffer(recommendedSample, false);
      } else {
        setInputPath('(Not required - creates new PDF from markdown)');
        setOutputPath('./documents/out-generated-report.pdf');
      }
      setJsonArgs(JSON.stringify({ mode: 'standard' }, null, 2));
    }
  };

  const applyPreset = (preset: ToolPreset, toolName: string = selectedToolName) => {
    setActivePresetId(preset.id);
    setJsonArgs(JSON.stringify(preset.args, null, 2));
    
    if (toolName !== 'create_pdf_from_text') {
      loadSampleBuffer(preset.sampleKey, false);
    } else {
      setInputPath('(Not required - creates new PDF from markdown)');
      setOutputPath('./documents/out-generated-report.pdf');
    }
  };

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const base64 = result.split(',')[1];
      setActiveFileBase64(base64);
      setActiveFilename(file.name);
      setActiveSampleKey('custom');
      setInputPath(`./documents/${file.name}`);
      updateDefaultOutputPath(selectedToolName, 'custom', file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleRunRpc = async () => {
    setIsExecuting(true);
    try {
      let parsedArgs: Record<string, any> = {};
      try {
        parsedArgs = JSON.parse(jsonArgs || '{}');
      } catch (jsonErr: any) {
        throw new Error(`JSON syntax error in tool arguments: ${jsonErr.message}`);
      }

      // Merge the abstracted input and output paths into the final arguments payload
      const fullArguments: Record<string, any> = {
        ...parsedArgs,
      };

      if (selectedToolName !== 'create_pdf_from_text') {
        fullArguments.inputPath = inputPath;
      }
      if (selectedToolName !== 'extract_pdf_content') {
        fullArguments.outputPath = outputPath;
      }

      const res = await onExecuteTool(selectedToolName, fullArguments, activeFileBase64 || undefined);

      if (res.outputPdfBase64) {
        setLastOutputBase64(res.outputPdfBase64);
        setLastOutputFilename(outputPath.replace(/^.*[\\/]/, '') || 'output.pdf');
        setLastOutputSize(res.outputSizeBytes || Math.round(res.outputPdfBase64.length * 0.75));
        setRightPanelTab('preview');
      } else {
        setLastOutputBase64(null);
        setRightPanelTab('json');
      }

      setResponseLog({
        jsonrpc: '2.0',
        id: Math.floor(Math.random() * 10000),
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(res, null, 2),
            },
          ],
        },
      });
    } catch (err: any) {
      setResponseLog({
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32602,
          message: err.message || 'Invalid JSON syntax or parameter error',
        },
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const copyRpcResponse = () => {
    if (!responseLog) return;
    navigator.clipboard.writeText(JSON.stringify(responseLog, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadOutput = () => {
    if (!lastOutputBase64) return;
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${lastOutputBase64}`;
    link.download = lastOutputFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreviewCurrentOutput = () => {
    if (!lastOutputBase64) return;
    setPreviewBase64(lastOutputBase64);
    setPreviewFilename(lastOutputFilename);
    setPreviewTitle(`Output: ${lastOutputFilename}`);
    setPreviewBadge('OUTPUT');
    setIsPreviewOpen(true);
  };

  const isCreateTool = selectedToolName === 'create_pdf_from_text';
  const isExtractOnly = selectedToolName === 'extract_pdf_content';

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Cpu className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Interactive Model Context Protocol (MCP) Simulator
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Simulate how LLMs (Claude 3.7, Gemini 2.5, GPT-4o) call the PDF MCP Server with abstracted paths and JSON-RPC payloads.
          </p>
        </div>

        {/* Quick Sample Inspector Buttons */}
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center">
            <Eye className="w-3 h-3 mr-1 text-indigo-600" />
            <span>Sample PDFs:</span>
          </span>
          {(['invoice', 'report', 'contract', 'form'] as SampleKey[]).map((key) => {
            const s = SAMPLES[key];
            const isActive = activeSampleKey === key;
            return (
              <button
                key={key}
                id={`btn-sample-pill-${key}`}
                onClick={() => loadSampleBuffer(key, false)}
                title={s.description}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-all flex items-center space-x-1 ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs font-semibold'
                    : 'bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border-slate-200'
                }`}
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Tool Selector & Abstracted Parameter Builder */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            
            {/* Active Tool Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase text-slate-600 tracking-wider">
                  Active MCP Tool
                </label>
                <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 font-semibold">
                  tools/call
                </span>
              </div>
              <select
                id="select-mcp-tool"
                value={selectedToolName}
                onChange={(e) => handleToolSelect(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-800"
              >
                {tools.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.displayName} ({t.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Tool description & token highlight */}
            {activeTool && (
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 space-y-1">
                <div className="text-xs font-semibold text-indigo-950 flex items-center space-x-1.5">
                  <Zap className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{activeTool.displayName}</span>
                </div>
                <p className="text-[11px] text-indigo-900 leading-relaxed">
                  {activeTool.tokenSavingHighlight}
                </p>
              </div>
            )}

            {/* ABSTRACTED FILE PATH CONFIGURATION BOX */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <FolderInput className="w-3.5 h-3.5 text-indigo-600" />
                  <span>File Paths & Sample Resolution</span>
                </span>
                <span className="text-[10px] text-slate-500">Abstracted inputs</span>
              </div>

              {/* Input PDF Path Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <label className="font-semibold text-slate-700 flex items-center space-x-1">
                    <span>Input File Path (`inputPath`)</span>
                    {isCreateTool && (
                      <span className="text-[10px] text-slate-400 font-normal">(Optional for markdown creation)</span>
                    )}
                  </label>
                  {activeFileBase64 && !isCreateTool && (
                    <button
                      onClick={() => {
                        setPreviewBase64(activeFileBase64);
                        setPreviewFilename(activeFilename);
                        setPreviewTitle(`Input: ${activeFilename}`);
                        setPreviewBadge('INPUT');
                        setIsPreviewOpen(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center space-x-0.5 font-medium"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Preview Input PDF</span>
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="input-mcp-input-path"
                    type="text"
                    value={inputPath}
                    disabled={isCreateTool}
                    onChange={(e) => {
                      setInputPath(e.target.value);
                      setActiveSampleKey('custom');
                    }}
                    placeholder="./documents/sample-multi-chapter-report.pdf"
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>

                {/* Quick Sample Selector Pills & Upload */}
                {!isCreateTool && (
                  <div className="flex items-center flex-wrap gap-1 pt-1">
                    <span className="text-[10px] text-slate-400 font-medium mr-1">Quick Select:</span>
                    {(['invoice', 'report', 'contract', 'form'] as SampleKey[]).map((k) => (
                      <button
                        key={k}
                        id={`pill-input-select-${k}`}
                        onClick={() => loadSampleBuffer(k, false)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border font-medium transition-colors ${
                          activeSampleKey === k
                            ? 'bg-indigo-100 text-indigo-800 border-indigo-300 font-semibold'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {SAMPLES[k].icon} {SAMPLES[k].label}
                      </button>
                    ))}
                    
                    {/* Upload custom button */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`text-[10px] px-2 py-0.5 rounded-md border font-medium transition-colors flex items-center space-x-1 ${
                        activeSampleKey === 'custom'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Upload className="w-2.5 h-2.5" />
                      <span>Upload Custom</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      onChange={handleCustomFileUpload}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {/* Output PDF Path Field */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <label className="font-semibold text-slate-700 flex items-center space-x-1">
                    <FolderOutput className="w-3 h-3 text-slate-500" />
                    <span>Target Output Path (`outputPath`)</span>
                  </label>
                  {isExtractOnly && (
                    <span className="text-[10px] text-slate-400 font-normal">(Tokens/Text only)</span>
                  )}
                </div>
                <input
                  id="input-mcp-output-path"
                  type="text"
                  value={outputPath}
                  disabled={isExtractOnly}
                  onChange={(e) => setOutputPath(e.target.value)}
                  placeholder="./documents/out-processed.pdf"
                  className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>
            </div>

            {/* Additional Tool-Specific Arguments Editor */}
            <div className="space-y-2">
              {/* Presets Bar */}
              {TOOL_PRESETS[selectedToolName] && TOOL_PRESETS[selectedToolName].length > 0 && (
                <div className="space-y-1.5 pb-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-700 flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Ready-to-Run Parameter Presets:</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {TOOL_PRESETS[selectedToolName].length} presets available
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {TOOL_PRESETS[selectedToolName].map((preset) => {
                      const isSelected = activePresetId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          id={`btn-preset-${preset.id}`}
                          onClick={() => applyPreset(preset)}
                          className={`text-left p-2 rounded-xl border text-xs transition-all ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-400 text-indigo-950 ring-1 ring-indigo-400 shadow-2xs font-semibold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{preset.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase font-mono">
                              {preset.sampleKey}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 font-normal">
                            {preset.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                  <Code2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Tool Arguments JSON (params)</span>
                </label>
                <button
                  onClick={() => setShowFullRpcPreview(!showFullRpcPreview)}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  {showFullRpcPreview ? 'Hide Full RPC Packet' : 'Show Full RPC Packet'}
                </button>
              </div>
              
              {!showFullRpcPreview ? (
                <textarea
                  id="textarea-mcp-json-args"
                  rows={6}
                  value={jsonArgs}
                  onChange={(e) => setJsonArgs(e.target.value)}
                  className="w-full text-xs font-mono p-3 bg-slate-900 text-emerald-400 rounded-xl border border-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              ) : (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 max-h-48 overflow-auto">
                  <div className="text-[10px] text-slate-400 mb-1 border-b border-slate-800 pb-1">
                    Complete Outgoing JSON-RPC 2.0 Request:
                  </div>
                  <pre className="text-emerald-400 leading-tight">
                    {JSON.stringify(
                      {
                        jsonrpc: '2.0',
                        id: 1,
                        method: 'tools/call',
                        params: {
                          name: selectedToolName,
                          arguments: {
                            ...((() => {
                              try {
                                return JSON.parse(jsonArgs || '{}');
                              } catch {
                                return { invalidJson: true };
                              }
                            })()),
                            ...(isCreateTool ? {} : { inputPath }),
                            ...(isExtractOnly ? {} : { outputPath }),
                          },
                        },
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}
            </div>

            {/* Submit RPC Button */}
            <button
              id="btn-send-mcp-rpc"
              onClick={handleRunRpc}
              disabled={isExecuting}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold flex items-center justify-center space-x-2 shadow-xs transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isExecuting ? 'Invoking MCP Engine...' : 'Send JSON-RPC Request'}</span>
            </button>
          </div>
        </div>

        {/* Right Col: JSON-RPC Response Inspector with Inline PDF Output Preview */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            
            {/* Header with View Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div className="flex items-center space-x-2">
                <Code2 className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-bold text-slate-900">Execution Result & Inspector</span>
              </div>
              
              {/* Tab Switcher (Visible when output or log exists) */}
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
                {lastOutputBase64 && (
                  <button
                    id="tab-mcp-preview-output"
                    onClick={() => setRightPanelTab('preview')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1 ${
                      rightPanelTab === 'preview'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Processed PDF</span>
                  </button>
                )}
                {lastOutputBase64 && activeFileBase64 && !isCreateTool && (
                  <button
                    id="tab-mcp-compare"
                    onClick={() => setRightPanelTab('compare')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1 ${
                      rightPanelTab === 'compare'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Side-by-Side</span>
                  </button>
                )}
                <button
                  id="tab-mcp-json-rpc"
                  onClick={() => setRightPanelTab('json')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1 ${
                    rightPanelTab === 'json'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5 text-slate-500" />
                  <span>JSON-RPC</span>
                </button>
              </div>
            </div>

            {responseLog ? (
              <div className="space-y-4">
                
                {/* 1. Processed PDF Canvas Preview */}
                {rightPanelTab === 'preview' && lastOutputBase64 && (
                  <div className="space-y-3">
                    <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 text-emerald-900 font-medium">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>Output Generated: <strong className="font-mono text-emerald-950">{lastOutputFilename}</strong></span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <button
                          id="btn-mcp-expand-output-modal"
                          onClick={handlePreviewCurrentOutput}
                          className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-semibold flex items-center space-x-1 text-[11px]"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Fullscreen</span>
                        </button>
                        <button
                          id="btn-mcp-download-output-doc"
                          onClick={handleDownloadOutput}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center space-x-1 text-[11px]"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>

                    {/* Inline HTML5 Canvas Viewer */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shadow-2xs">
                      <PdfViewer
                        base64={lastOutputBase64}
                        filename={lastOutputFilename}
                        sizeBytes={lastOutputSize}
                        title={`Output: ${lastOutputFilename}`}
                        badge="MCP PROCESSED"
                        badgeColor="emerald"
                        heightClass="h-[420px]"
                        onOpenModal={handlePreviewCurrentOutput}
                      />
                    </div>
                  </div>
                )}

                {/* 2. Side-by-Side Comparison Tab */}
                {rightPanelTab === 'compare' && lastOutputBase64 && activeFileBase64 && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Left: Input */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 px-1">
                          <span className="flex items-center space-x-1">
                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                            <span>Input Original</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                            {activeFilename}
                          </span>
                        </div>
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                          <PdfViewer
                            base64={activeFileBase64}
                            filename={activeFilename}
                            title="Input Original"
                            badge="ORIGINAL"
                            badgeColor="indigo"
                            heightClass="h-[360px]"
                          />
                        </div>
                      </div>

                      {/* Right: Output */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 px-1">
                          <span className="flex items-center space-x-1">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            <span>MCP Output Result</span>
                          </span>
                          <span className="text-[10px] font-mono text-emerald-700 truncate max-w-[120px]">
                            {lastOutputFilename}
                          </span>
                        </div>
                        <div className="border border-emerald-200 rounded-xl overflow-hidden bg-emerald-50/20">
                          <PdfViewer
                            base64={lastOutputBase64}
                            filename={lastOutputFilename}
                            title="MCP Output"
                            badge="PROCESSED"
                            badgeColor="emerald"
                            heightClass="h-[360px]"
                            onOpenModal={handlePreviewCurrentOutput}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Raw JSON-RPC 2.0 Packet Tab */}
                {rightPanelTab === 'json' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Standard JSON-RPC 2.0 Response:</span>
                      <button
                        id="btn-copy-rpc-response"
                        onClick={copyRpcResponse}
                        className="text-xs text-slate-600 hover:text-slate-900 flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                      </button>
                    </div>
                    <pre className="text-xs font-mono bg-slate-950 text-slate-200 p-4 rounded-xl overflow-x-auto max-h-[440px] border border-slate-800 leading-relaxed">
                      {JSON.stringify(responseLog, null, 2)}
                    </pre>
                  </div>
                )}

              </div>
            ) : (
              <div className="bg-slate-50/70 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center space-y-2">
                <Terminal className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">Awaiting JSON-RPC Execution</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click <strong>Send JSON-RPC Request</strong> to test the active MCP tool. You will instantly get the live interactive PDF preview and structured response right here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PDF Preview Modal for inspecting input sample or output result */}
      <PdfPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={previewTitle}
        inputPdfBase64={previewBase64}
        inputFilename={previewFilename}
        badge={previewBadge}
      />
    </div>
  );
};

