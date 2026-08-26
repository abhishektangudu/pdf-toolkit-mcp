import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ToolsStudio } from './components/ToolsStudio';
import { McpPlayground } from './components/McpPlayground';
import { McpSetupGuide } from './components/McpSetupGuide';
import { SchemaViewer } from './components/SchemaViewer';
import { EvalSuiteView } from './components/EvalSuiteView';
import { MCP_TOOLS } from './mcp/tools';
import type { McpToolDefinition, ToolExecutionResult } from './types/pdf';
import { ShieldCheck, Sparkles, Terminal, Layers } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'playground' | 'evals' | 'setup' | 'schemas'>('studio');
  const [tools, setTools] = useState<McpToolDefinition[]>(MCP_TOOLS);

  useEffect(() => {
    fetch('/api/mcp/tools')
      .then((res) => res.json())
      .then((data) => {
        if (data.tools && Array.isArray(data.tools)) {
          setTools(data.tools);
        }
      })
      .catch((err) => {
        console.warn('Using client-side tool definitions fallback:', err);
      });
  }, []);

  const handleExecuteTool = async (
    toolName: string,
    args: any,
    fileBase64?: string
  ): Promise<ToolExecutionResult> => {
    const res = await fetch('/api/mcp/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toolName,
        args,
        fileBase64,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to execute tool');
    }
    return data;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation */}
      <Header activeTab={activeTab} onTabChange={setActiveTab} toolCount={tools.length} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'studio' && (
          <ToolsStudio tools={tools} onExecuteTool={handleExecuteTool} />
        )}

        {activeTab === 'playground' && (
          <McpPlayground tools={tools} onExecuteTool={handleExecuteTool} />
        )}

        {activeTab === 'evals' && <EvalSuiteView />}

        {activeTab === 'setup' && <McpSetupGuide />}

        {activeTab === 'schemas' && <SchemaViewer tools={tools} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Open Source Model Context Protocol (MCP) Server for PDF Operations</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Client-side WebAssembly & Pure TypeScript Engine</span>
            <span>•</span>
            <span>Zero Cloud File Uploads</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
