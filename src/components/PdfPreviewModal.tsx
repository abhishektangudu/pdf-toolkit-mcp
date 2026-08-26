import React, { useState } from 'react';
import {
  X,
  Download,
  ExternalLink,
  FileText,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Layers,
  Sparkles,
  Shield,
  Columns,
  Eye,
} from 'lucide-react';
import { PdfViewer } from './PdfViewer';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  inputPdfBase64?: string | null;
  inputFilename?: string;
  outputPdfBase64?: string | null;
  outputFilename?: string;
  badge?: string;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  inputPdfBase64,
  inputFilename = 'input-sample.pdf',
  outputPdfBase64,
  outputFilename = 'processed-output.pdf',
  badge,
}) => {
  const [activeTab, setActiveTab] = useState<'input' | 'output' | 'compare'>(
    outputPdfBase64 ? 'compare' : 'input'
  );

  if (!isOpen) return null;

  const hasBoth = Boolean(inputPdfBase64 && outputPdfBase64);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">{title}</h3>
                {badge && (
                  <span className="text-[11px] px-2.5 py-0.5 font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Inspect raw sample buffer or compare Before vs After transformation artifacts.
              </p>
            </div>
          </div>

          {/* Tab Selector if both input and output are present */}
          <div className="flex items-center space-x-3">
            {hasBoth && (
              <div className="flex items-center bg-slate-200/70 p-1 rounded-xl text-xs font-medium">
                <button
                  onClick={() => setActiveTab('compare')}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center space-x-1.5 ${
                    activeTab === 'compare'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>Side-by-Side</span>
                </button>
                <button
                  onClick={() => setActiveTab('input')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeTab === 'input'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Input (Original)</span>
                </button>
                <button
                  onClick={() => setActiveTab('output')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeTab === 'output'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Output (Processed)</span>
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-100/50">
          {activeTab === 'compare' && hasBoth ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
              <div>
                <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>ORIGINAL INPUT PDF ({inputFilename})</span>
                  </span>
                </div>
                <PdfViewer
                  base64={inputPdfBase64}
                  filename={inputFilename}
                  badge="Original Input"
                  badgeColor="blue"
                  heightClass="h-[520px]"
                />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-800 mb-2 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>PROCESSED OUTPUT PDF ({outputFilename})</span>
                  </span>
                </div>
                <PdfViewer
                  base64={outputPdfBase64}
                  filename={outputFilename}
                  badge="Processed Output"
                  badgeColor="emerald"
                  heightClass="h-[520px]"
                />
              </div>
            </div>
          ) : activeTab === 'output' && outputPdfBase64 ? (
            <div className="max-w-4xl mx-auto">
              <PdfViewer
                base64={outputPdfBase64}
                filename={outputFilename}
                badge="Processed Output"
                badgeColor="emerald"
                heightClass="h-[580px]"
              />
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <PdfViewer
                base64={inputPdfBase64}
                filename={inputFilename}
                badge="Original Document"
                badgeColor="indigo"
                heightClass="h-[580px]"
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>100% In-Memory Browser Execution • Zero Server Egress</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
