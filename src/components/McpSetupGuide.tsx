import React, { useState } from 'react';
import { Terminal, Copy, Check, ExternalLink, ShieldCheck, Sparkles, CheckCircle2, Bot, Cpu, Layers } from 'lucide-react';

export const McpSetupGuide: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const antigravityConfig = `{
  "mcpServers": {
    "pdf-toolkit": {
      "command": "npx",
      "args": ["-y", "pdf-toolkit-mcp@latest"],
      "env": {
        "PDF_ENGINE_MODE": "deterministic-wasm"
      }
    }
  }
}`;

  const geminiAgentTsCode = `import { GoogleGenAI, Type } from '@google/genai';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// 1. Initialize MCP Client for PDF Toolkit
const transport = new StdioClientTransport({
  command: 'npx',
  args: ['-y', 'pdf-toolkit-mcp'],
});
const mcpClient = new Client({ name: 'gemini-pdf-agent', version: '1.0.0' }, { capabilities: {} });
await mcpClient.connect(transport);

// 2. Query Available MCP Tools
const { tools } = await mcpClient.listTools();

// 3. Connect to Google Antigravity / Gemini 2.5 Flash
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Scan ./documents/invoice.pdf, surgically blackout any SSN or Credit Card, and summarize totals.',
  config: {
    // Map MCP Tools to Gemini function declarations
    tools: [{ functionDeclarations: tools.map(t => ({
      name: t.name,
      description: t.description,
      parameters: t.inputSchema,
    })) }]
  }
});

console.log(response.functionCalls);`;

  const cursorConfig = `{
  "mcpServers": {
    "pdf-toolkit": {
      "command": "npx",
      "args": ["-y", "pdf-toolkit-mcp@latest"]
    }
  }
}`;

  const claudeDesktopConfig = `{
  "mcpServers": {
    "pdf-toolkit": {
      "command": "npx",
      "args": ["-y", "pdf-toolkit-mcp"]
    }
  }
}`;

  const pythonLangchainConfig = `from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.prebuilt import create_react_agent
from langchain_google_genai import ChatGoogleGenerativeAI

async def main():
    async with MultiServerMCPClient({
        "pdf_tools": {
            "command": "npx",
            "args": ["-y", "pdf-toolkit-mcp"],
            "transport": "stdio",
        }
    }) as client:
        tools = client.get_tools()
        model = ChatGoogleGenerativeAI(model="gemini-2.5-flash")
        agent = create_react_agent(model, tools)
        
        response = await agent.ainvoke({
            "messages": [("user", "Compress ./report.pdf and scan for any leaked PII emails")]
        })
        print(response)`;

  const agentSkillMarkdown = `---
name: pdf-tools
description: Deterministic local PDF manipulation, compression, PII redaction, and token-optimized extraction.
---

# PDF Manipulation & Optimization Skill for Google Antigravity & AI Studio Agents

Use this skill whenever processing, modifying, merging, or extracting text from PDFs.
Always use the local MCP tool suite to avoid uploading sensitive files to external servers or wasting context tokens on raw binaries.

## Available Actions:
- \`compress_pdf\`: Optimize object streams and reduce file size by up to 70%.
- \`extract_pdf_content\`: Retrieve structured outline and page snippets in clean Markdown (~85% prompt token reduction).
- \`scan_and_redact_pii\`: Automatically locate and blackout SSNs, Credit Cards, Emails, and custom keywords.
- \`organize_pdf\`: Compound rotation, page deletions, reordering, and page numbering in a single pass.
- \`inspect_and_fill_form\`: Inspect AcroForms, fill fields, and flatten to static vectors.`;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 rounded-xl bg-violet-50 text-violet-600 border border-violet-200">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Universal MCP & Agent Quick Configs
            </h3>
            <p className="text-xs text-slate-500">
              Plug your PDF MCP server directly into Google Antigravity, Gemini TypeScript SDK, Claude Desktop, Cursor, or LangChain agents in seconds.
            </p>
          </div>
        </div>
      </div>

      {/* Integration Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Google Antigravity Agent & AI Studio */}
        <div className="bg-white rounded-2xl p-5 border border-indigo-200 ring-1 ring-indigo-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1 rounded bg-indigo-50 text-indigo-600">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-slate-900">Google Antigravity & AI Studio</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 font-semibold px-2 py-0.5 rounded font-mono">
                antigravity.json
              </span>
            </div>
            <button
              onClick={() => copyToClipboard('antigravity', antigravityConfig)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50/50"
            >
              {copiedId === 'antigravity' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'antigravity' ? 'Copied' : 'Copy Config'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Config definition for Google Antigravity Agent and AI Studio agent tool bridges.
          </p>
          <pre className="text-xs font-mono bg-slate-900 text-indigo-300 p-3.5 rounded-xl overflow-x-auto border border-slate-800">
            {antigravityConfig}
          </pre>
        </div>

        {/* 2. Google GenAI TypeScript SDK */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1 rounded bg-amber-50 text-amber-600">
                <Cpu className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-slate-900">Gemini SDK (TypeScript)</span>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                @google/genai
              </span>
            </div>
            <button
              onClick={() => copyToClipboard('gemini_ts', geminiAgentTsCode)}
              className="text-xs text-slate-500 hover:text-slate-900 flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50"
            >
              {copiedId === 'gemini_ts' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'gemini_ts' ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Directly bind MCP Tool definitions to Gemini 2.5 Flash Function Declarations.
          </p>
          <pre className="text-xs font-mono bg-slate-900 text-amber-300 p-3.5 rounded-xl overflow-x-auto border border-slate-800">
            {geminiAgentTsCode}
          </pre>
        </div>

        {/* 3. Cursor IDE */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-slate-900">Cursor IDE</span>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                .cursor/mcp.json
              </span>
            </div>
            <button
              onClick={() => copyToClipboard('cursor', cursorConfig)}
              className="text-xs text-slate-500 hover:text-slate-900 flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50"
            >
              {copiedId === 'cursor' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'cursor' ? 'Copied' : 'Copy Config'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Add to your project root under <code className="text-indigo-600 font-mono">.cursor/mcp.json</code> or Settings &gt; MCP.
          </p>
          <pre className="text-xs font-mono bg-slate-900 text-emerald-400 p-3.5 rounded-xl overflow-x-auto border border-slate-800">
            {cursorConfig}
          </pre>
        </div>

        {/* 4. Claude Desktop */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-slate-900">Claude Desktop</span>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                claude_desktop_config.json
              </span>
            </div>
            <button
              onClick={() => copyToClipboard('claude', claudeDesktopConfig)}
              className="text-xs text-slate-500 hover:text-slate-900 flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50"
            >
              {copiedId === 'claude' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'claude' ? 'Copied' : 'Copy Config'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Paste into Claude Desktop Settings &gt; Developer &gt; Edit Config.
          </p>
          <pre className="text-xs font-mono bg-slate-900 text-emerald-400 p-3.5 rounded-xl overflow-x-auto border border-slate-800">
            {claudeDesktopConfig}
          </pre>
        </div>

        {/* 5. LangChain / LangGraph */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-slate-900">LangChain & LangGraph (Python)</span>
            </div>
            <button
              onClick={() => copyToClipboard('langchain', pythonLangchainConfig)}
              className="text-xs text-slate-500 hover:text-slate-900 flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50"
            >
              {copiedId === 'langchain' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'langchain' ? 'Copied' : 'Copy Python'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Connect via stdio transport in autonomous Python agent workflows.
          </p>
          <pre className="text-xs font-mono bg-slate-900 text-sky-300 p-3.5 rounded-xl overflow-x-auto border border-slate-800">
            {pythonLangchainConfig}
          </pre>
        </div>

        {/* 6. Agent Skill SKILL.md */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-slate-900">Antigravity / Coding Agent Skill</span>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                SKILL.md
              </span>
            </div>
            <button
              onClick={() => copyToClipboard('skill', agentSkillMarkdown)}
              className="text-xs text-slate-500 hover:text-slate-900 flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50"
            >
              {copiedId === 'skill' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'skill' ? 'Copied' : 'Copy Markdown'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Drop into <code className="text-indigo-600 font-mono">skills/pdf-tools/SKILL.md</code> for natural language routing.
          </p>
          <pre className="text-xs font-mono bg-slate-900 text-amber-300 p-3.5 rounded-xl overflow-x-auto border border-slate-800">
            {agentSkillMarkdown}
          </pre>
        </div>
      </div>

      {/* Security & Publishing Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                Publishing <span className="text-indigo-300 font-mono">pdf-toolkit-mcp</span> to npm
              </h4>
              <p className="text-xs text-slate-400">
                Security-hardened package configuration with strict provenance & sandboxed filesystem execution.
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              copyToClipboard(
                'publish_cmd',
                'npm publish --provenance --access public'
              )
            }
            className="text-xs text-indigo-300 hover:text-white bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 px-3 py-1.5 rounded-xl font-medium flex items-center space-x-1.5 transition-colors"
          >
            {copiedId === 'publish_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedId === 'publish_cmd' ? 'Copied Publish Cmd' : 'Copy Publish Command'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
            <div className="font-semibold text-slate-200 mb-1 flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>1. Path Sandboxing</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Enforces <code className="text-indigo-300 font-mono">ALLOWED_ROOT</code> check to prevent path traversal attacks (e.g., ../../../).
            </p>
          </div>
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
            <div className="font-semibold text-slate-200 mb-1 flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>2. Zero Network Egress</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              All processing executes strictly over stdio with in-memory WASM and zero telemetry or outbound APIs.
            </p>
          </div>
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
            <div className="font-semibold text-slate-200 mb-1 flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>3. npm Provenance</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Cryptographically links your published npm package to its source repo via GitHub Actions OIDC.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

