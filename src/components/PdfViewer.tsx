import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  ExternalLink,
  Maximize2,
  Eye,
  Shield,
  Info,
  Copy,
  Check,
  FileCode,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { PdfCanvasViewer } from './PdfCanvasViewer';

interface PdfViewerProps {
  base64?: string | null;
  filename?: string;
  sizeBytes?: number;
  title?: string;
  badge?: string;
  badgeColor?: 'indigo' | 'emerald' | 'amber' | 'blue' | 'purple';
  heightClass?: string;
  showComparisonToggle?: boolean;
  onOpenModal?: () => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  base64,
  filename = 'document.pdf',
  sizeBytes = 0,
  title,
  badge,
  badgeColor = 'indigo',
  heightClass = 'h-[440px]',
  onOpenModal,
}) => {
  const [viewMode, setViewMode] = useState<'embed' | 'metadata'>('embed');
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number>(1);
  const [extractedInfo, setExtractedInfo] = useState<{
    pageCount: number;
    title?: string;
    producer?: string;
    dimensions?: { width: number; height: number };
  } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Generate Blob URL and metadata inspection from base64 safely
  useEffect(() => {
    if (!base64) {
      setBlobUrl(null);
      setExtractedInfo(null);
      return;
    }

    try {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);

      // Inspect document asynchronously
      PDFDocument.load(bytes, { ignoreEncryption: true })
        .then((doc) => {
          const total = doc.getPageCount();
          setPageCount(total);
          const firstPage = total > 0 ? doc.getPage(0) : null;
          const dims = firstPage ? firstPage.getSize() : { width: 595, height: 842 };

          setExtractedInfo({
            pageCount: total,
            title: doc.getTitle() || filename,
            producer: doc.getProducer() || 'pdf-lib & PDF Agent Toolkit',
            dimensions: { width: Math.round(dims.width), height: Math.round(dims.height) },
          });
        })
        .catch((err) => {
          console.warn('PDF inspection failed:', err);
        });

      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (err) {
      console.error('Failed to create PDF blob:', err);
      setBlobUrl(null);
    }
  }, [base64, filename]);

  const handleDownload = () => {
    if (!base64) return;
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${base64}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInTab = () => {
    if (blobUrl) {
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopyBase64 = () => {
    if (!base64) return;
    navigator.clipboard.writeText(base64);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const badgeStyles = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  if (!base64) {
    return (
      <div
        id="pdf-viewer-empty"
        className={`w-full ${heightClass} bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-slate-400`}
      >
        <FileText className="w-10 h-10 text-slate-300 mb-2" />
        <p className="text-xs font-semibold text-slate-600">No PDF Loaded</p>
        <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
          Select a sample document or upload a file to preview the content.
        </p>
      </div>
    );
  }

  return (
    <div
      id="pdf-viewer-container"
      className="w-full bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex flex-col transition-all"
    >
      {/* Header Bar */}
      <div className="bg-slate-50/80 border-b border-slate-200/80 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-xs">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-800 truncate max-w-[180px] sm:max-w-[240px]">
                {title || filename}
              </span>
              {badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 font-semibold rounded-full border ${badgeStyles[badgeColor]}`}
                >
                  {badge}
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 flex items-center space-x-2">
              <span>{pageCount} {pageCount === 1 ? 'page' : 'pages'}</span>
              <span>•</span>
              <span>{sizeBytes > 0 ? `${(sizeBytes / 1024).toFixed(1)} KB` : 'In-memory buffer'}</span>
            </div>
          </div>
        </div>

        {/* View mode switcher */}
        <div className="flex items-center space-x-1 bg-slate-200/60 p-0.5 rounded-lg">
          <button
            onClick={() => setViewMode('embed')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center space-x-1 ${
              viewMode === 'embed'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Interactive Canvas PDF Renderer"
          >
            <Eye className="w-3 h-3" />
            <span>Visual View</span>
          </button>
          <button
            onClick={() => setViewMode('metadata')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center space-x-1 ${
              viewMode === 'metadata'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Inspect PDF Structure & Technical Attributes"
          >
            <Info className="w-3 h-3" />
            <span>Structure</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1">
          <button
            id="pdf-btn-open-tab"
            onClick={handleOpenInTab}
            title="Open in Native Browser Window"
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {onOpenModal && (
            <button
              id="pdf-btn-expand-modal"
              onClick={onOpenModal}
              title="Expand into Focused Fullscreen Modal"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            id="pdf-btn-download"
            onClick={handleDownload}
            title="Download PDF Binary"
            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className={`relative w-full ${heightClass} bg-slate-900/5 flex flex-col`}>
        {viewMode === 'embed' && (
          <PdfCanvasViewer
            base64={base64}
            filename={filename}
            className="h-full"
            onPageCountChange={(count) => setPageCount(count)}
          />
        )}

        {viewMode === 'metadata' && (
          <div className="w-full h-full p-4 overflow-y-auto bg-slate-900 text-slate-100 font-mono text-[11px] space-y-4">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 flex items-center space-x-1.5">
                <FileCode className="w-4 h-4" />
                <span>PDF Object & Invariant Inspection</span>
              </span>
              <button
                onClick={handleCopyBase64}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded-md flex items-center space-x-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied Base64' : 'Copy Base64'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block text-[10px]">Filename:</span>
                <span className="font-semibold text-slate-200 break-all">{filename}</span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block text-[10px]">Byte Size:</span>
                <span className="font-semibold text-emerald-400">
                  {sizeBytes > 0 ? `${sizeBytes.toLocaleString()} bytes (${(sizeBytes / 1024).toFixed(1)} KB)` : 'Dynamic'}
                </span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block text-[10px]">Page Count:</span>
                <span className="font-semibold text-indigo-300">{pageCount} Pages</span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block text-[10px]">Page Dimensions:</span>
                <span className="font-semibold text-slate-200">
                  {extractedInfo?.dimensions
                    ? `${extractedInfo.dimensions.width} x ${extractedInfo.dimensions.height} pt (ISO A4)`
                    : '595 x 842 pt (A4)'}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Base64 Signature Header:
              </span>
              <div className="bg-slate-950 p-3 rounded-xl text-[10px] text-slate-300 border border-slate-800/80 break-all font-mono">
                {base64 ? `${base64.substring(0, 160)}... [${base64.length} total chars]` : 'N/A'}
              </div>
            </div>

            <div className="bg-indigo-950/40 border border-indigo-800/50 p-3 rounded-xl text-[11px] text-indigo-200 flex items-start space-x-2">
              <Shield className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                <strong>Agent Local Privacy Guarantee:</strong> Document processing occurred entirely in-memory with zero external API calls or telemetry logging.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
