import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCw,
  Loader2,
  AlertCircle,
  FileText,
} from 'lucide-react';

// Setup worker source reliably across build & dev environments
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
} catch {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

interface PdfCanvasViewerProps {
  base64?: string | null;
  filename?: string;
  className?: string;
  onPageCountChange?: (count: number) => void;
}

export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({
  base64,
  filename = 'document.pdf',
  className = 'h-[440px]',
  onPageCountChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.1);
  const [userRotation, setUserRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewLayout, setViewLayout] = useState<'single' | 'all'>('single');
  const [allPagesRendered, setAllPagesRendered] = useState<boolean>(false);

  // Load PDF document from base64
  useEffect(() => {
    if (!base64) {
      setPdfDoc(null);
      setNumPages(1);
      setCurrentPage(1);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    try {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const loadingTask = pdfjsLib.getDocument({
        data: bytes,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/',
        cMapPacked: true,
      });

      loadingTask.promise
        .then((doc) => {
          if (!isMounted) return;
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setCurrentPage(1);
          setLoading(false);
          if (onPageCountChange) {
            onPageCountChange(doc.numPages);
          }
        })
        .catch((err) => {
          if (!isMounted) return;
          console.error('PDF.js parse error:', err);
          setError('Failed to render PDF document. The binary may be corrupted.');
          setLoading(false);
        });
    } catch (err: any) {
      console.error('Base64 decode error:', err);
      setError('Invalid base64 document format.');
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [base64, onPageCountChange]);

  // Render single page onto canvas
  const renderSinglePage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current || viewLayout !== 'single') return;

    try {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const page = await pdfDoc.getPage(currentPage);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) return;

      const viewport = page.getViewport({
        scale,
        rotation: (page.rotate + userRotation) % 360,
      });

      // Handle HiDPI / Retina displays for crisp font rendering
      const outputScale = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

      const renderContext = {
        canvasContext: context,
        transform,
        viewport,
      };

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;
      await renderTask.promise;
    } catch (err: any) {
      if (err.name !== 'RenderingCancelledException') {
        console.error('Page render error:', err);
      }
    }
  }, [pdfDoc, currentPage, scale, userRotation, viewLayout]);

  useEffect(() => {
    if (viewLayout === 'single') {
      renderSinglePage();
    }
  }, [renderSinglePage, viewLayout]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 2.5));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleRotate = () => {
    setUserRotation((prev) => (prev + 90) % 360);
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, numPages));
  };

  const handleDownload = () => {
    if (!base64) return;
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${base64}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!base64) {
    return (
      <div
        className={`w-full ${className} bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-slate-400`}
      >
        <FileText className="w-10 h-10 text-slate-300 mb-2" />
        <p className="text-xs font-semibold text-slate-600">No PDF Document</p>
        <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
          Select a sample document or upload a file to preview.
        </p>
      </div>
    );
  }

  return (
    <div className={`w-full ${className} flex flex-col bg-slate-900/90 rounded-b-2xl overflow-hidden relative select-none`}>
      {/* Visual Canvas Toolbar */}
      <div className="bg-slate-900/95 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between text-slate-200 text-xs shrink-0 z-10 backdrop-blur-xs">
        {/* Page navigation controls */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1 || loading}
            title="Previous Page"
            className="p-1 rounded-lg hover:bg-slate-800 disabled:opacity-30 text-slate-300 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-800/80 rounded-md border border-slate-700/60">
            Page {currentPage} of {numPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage >= numPages || loading}
            title="Next Page"
            className="p-1 rounded-lg hover:bg-slate-800 disabled:opacity-30 text-slate-300 hover:text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom & View Settings */}
        <div className="flex items-center space-x-1">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.5 || loading}
            title="Zoom Out"
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono w-10 text-center text-slate-400">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={scale >= 2.5 || loading}
            title="Zoom In"
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-3.5 bg-slate-800 mx-1" />

          <button
            onClick={handleRotate}
            title="Rotate 90° Clockwise"
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleDownload}
            title="Download PDF"
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Presentation Viewport */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-slate-950/80 flex items-center justify-center p-4 min-h-[300px]"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center text-slate-400 space-y-2.5">
            <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
            <span className="text-xs font-medium">Rendering PDF Pages on HTML5 Canvas...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center text-center p-6 space-y-3 bg-red-950/30 border border-red-900/50 rounded-2xl max-w-sm">
            <AlertCircle className="w-8 h-8 text-rose-400" />
            <div>
              <p className="text-xs font-bold text-rose-200">Canvas Render Fallback</p>
              <p className="text-[11px] text-rose-300/80 mt-1">{error}</p>
            </div>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF Directly</span>
            </button>
          </div>
        ) : (
          <div className="transition-all duration-150 shadow-2xl rounded-md overflow-hidden bg-white ring-1 ring-slate-800">
            <canvas ref={canvasRef} className="block mx-auto max-w-full" />
          </div>
        )}
      </div>
    </div>
  );
};
