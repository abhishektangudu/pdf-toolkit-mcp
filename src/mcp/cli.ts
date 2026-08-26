#!/usr/bin/env node
import { startMcpStdioServer } from './server';

startMcpStdioServer().catch((err) => {
  console.error('Fatal MCP Server Error:', err);
  process.exit(1);
});
