import React, { useState } from 'react';
import { Terminal, Copy, Check, ExternalLink, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export const McpSetupGuide: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const cursorConfig = `{
  "mcpServers": {
    "pdf-agent-toolkit": {
      "command": "npx",
      "args": ["-y", "pdf-agent-toolkit-mcp@latest"]
    }
  }
}`;

  const claudeDesktopConfig = `{
  "mcpServers": {
    "pdf-tools": {
      "command": "npx",
      "args": ["-y", "pdf-agent-toolkit-mcp"]
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
            "args": ["-y", "pdf-agent-toolkit-mcp"],
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

# PDF Manipulation & Optimization Skill

Use this skill whenever processing, modifying, merging, or extracting text from PDFs.
Always use the local MCP tool suite to avoid uploading sensitive files to external servers or wasting context tokens on raw binaries.

## Available Actions:
- \`compress_pdf\`: Optimize object streams and reduce file size by up to 70%.
- \`extract_pdf_content\`: Retrieve structured outline and page snippets in clean Markdown.
- \`scan_and_redact_pii\`: Automatically locate and blackout SSNs, Credit Cards, Emails, and custom keywords.
- \`organize_pdf\`: Compound rotation, page deletions, reordering, and page numbering in a single pass.`;

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
              Universal MCP Integration Guide
            </h3>
            <p className="text-xs text-slate-500">
              Plug your PDF MCP server directly into any AI assistant or autonomous developer agent in seconds.
            </p>
          </div>
        </div>
      </div>

      {/* Integration Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Cursor IDE */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-slate-900">1. Cursor IDE</span>
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

        {/* 2. Claude Desktop */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-slate-900">2. Claude Desktop</span>
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

        {/* 3. LangChain / LangGraph */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-slate-900">3. LangChain & LangGraph (Python)</span>
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
            Connect via stdio transport in autonomous agent workflows.
          </p>
          <pre className="text-xs font-mono bg-slate-900 text-sky-300 p-3.5 rounded-xl overflow-x-auto border border-slate-800">
            {pythonLangchainConfig}
          </pre>
        </div>

        {/* 4. Agent Skill SKILL.md */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-slate-900">4. Claude Code / Coding Agent Skill</span>
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
    </div>
  );
};
