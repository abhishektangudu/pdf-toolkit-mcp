# PDF Agent Toolkit & MCP Server (inspired by ihatepdf.cv)

A comprehensive, privacy-first PDF manipulation suite and Model Context Protocol (MCP) server for AI Agents (Claude Desktop, Cursor, Windsurf, LangChain, Claude Code).

## Core Philosophy
1. **Zero Cloud Uploads**: All PDF processing (compression, page reordering, rotation, redaction, and text extraction) executes 100% locally in pure TypeScript & WebAssembly.
2. **Agent Token Optimization**: Eliminates context bloat by avoiding raw PDF base64 dumps in prompts; returns structured outlines and page snippets on demand.
3. **Universal Compatibility**: Works out of the box with `stdio` JSON-RPC 2.0.

---

## 🛠️ Available MCP Tools

| Tool Name | Category | Description | Agent Optimization |
|---|---|---|---|
| `compress_pdf` | Optimization | Reduces file size via stream defragmentation and DPI presets (`screen`, `ebook`, `printer`). | Reduces downstream OCR/vision token weight by up to 70%. |
| `extract_pdf_content` | Intelligence | Extracts document TOC, outline, word count, and clean Markdown text. | Saves ~90% context tokens compared to raw stream dumping. |
| `scan_and_redact_pii` | Security | Detects SSNs, Emails, Credit Cards, Aadhaar numbers, and custom keywords, stamping black redaction boxes. | Ensures GDPR/HIPAA compliance prior to sending docs to external LLMs. |
| `organize_pdf` | Structure | Compound tool: reorders, deletes, rotates (90/180/270°), and adds page numbers in one atomic pass. | Prevents multi-turn roundtrips. |
| `split_pdf` | Structure | Extracts specific page ranges (e.g. `"1-3, 5, 8-12"`). | Allows agents to inspect specific chapters. |
| `merge_pdfs` | Structure | Combines multiple input PDFs into a single document. | Fast multi-file document compilation. |
| `stamp_watermark` | Security | Stamps visual text watermarks (e.g. `"DRAFT"`, `"CONFIDENTIAL"`) with custom rotation and opacity. | Visual status stamping. |
| `create_pdf_from_text` | Creation | Formats clean Markdown/text into an A4 PDF with stylized header banners. | Lightweight document generation without headless browser bloat. |
| `inspect_and_fill_form` | Forms | Inspects AcroForm fields and fills form data. | Automates invoice, tax, and contract processing. |

---

## 🚀 Quickstart Configs for Agents

### 1. Cursor IDE (`.cursor/mcp.json`)
```json
{
  "mcpServers": {
    "pdf-agent-toolkit": {
      "command": "npx",
      "args": ["-y", "pdf-agent-toolkit-mcp@latest"]
    }
  }
}
```

### 2. Claude Desktop (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "pdf-tools": {
      "command": "npx",
      "args": ["-y", "pdf-agent-toolkit-mcp"]
    }
  }
}
```

### 3. LangChain & LangGraph (Python)
```python
from langchain_mcp_adapters.client import MultiServerMCPClient
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
            "messages": [("user", "Compress ./financials.pdf and blackout sensitive SSNs")]
        })
        print(response)
```

---

## 💻 Running the Server Locally
```bash
# Run MCP server on stdio
npm run mcp

# Start the interactive visual testing studio and playground
npm run dev
```
