import React, { useState } from 'react';
import { BookOpen, Copy, Check, Sparkles, Code2, Layers, Search } from 'lucide-react';
import type { McpToolDefinition } from '../types/pdf';

interface SchemaViewerProps {
  tools: McpToolDefinition[];
}

export const SchemaViewer: React.FC<SchemaViewerProps> = ({ tools }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedName, setCopiedName] = useState<string | null>(null);

  const filteredTools = tools.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copySchema = (name: string, schema: any) => {
    navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
    setCopiedName(name);
    setTimeout(() => setCopiedName(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Registered MCP Tool Schemas ({tools.length} Tools)
          </h3>
          <p className="text-xs text-slate-500">
            Compliant with Model Context Protocol (2024-11-05) Tool Definition specifications.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter tools by keyword..."
            className="w-full text-xs sm:text-sm pl-9 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Grid of Schemas */}
      <div className="grid grid-cols-1 gap-6">
        {filteredTools.map((tool) => (
          <div key={tool.name} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center space-x-2.5">
                  <h4 className="font-bold text-slate-900 text-sm">{tool.displayName}</h4>
                  <code className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono font-medium">
                    {tool.name}
                  </code>
                </div>
                <p className="text-xs text-slate-600 mt-1">{tool.description}</p>
              </div>

              <button
                onClick={() => copySchema(tool.name, tool.inputSchema)}
                className="text-xs text-slate-600 hover:text-slate-900 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 self-start sm:self-auto"
              >
                {copiedName === tool.name ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedName === tool.name ? 'Copied Schema' : 'Copy JSON Schema'}</span>
              </button>
            </div>

            <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-xl p-3 text-xs text-indigo-900 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span><strong>Agent Optimization:</strong> {tool.tokenSavingHighlight}</span>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center space-x-1">
                <Code2 className="w-3.5 h-3.5 text-slate-500" />
                <span>inputSchema (JSON Schema Definition)</span>
              </div>
              <pre className="text-xs font-mono bg-slate-900 text-slate-200 p-4 rounded-xl overflow-x-auto max-h-56 border border-slate-800">
                {JSON.stringify(tool.inputSchema, null, 2)}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
