export type EvalCategory =
  | 'structural_invariants'
  | 'pii_security'
  | 'compression_bench'
  | 'token_economy'
  | 'agent_intent_routing'
  | 'edge_cases';

export type EvalStatus = 'idle' | 'running' | 'passed' | 'failed' | 'warning';

export interface EvalAssertion {
  name: string;
  expected: any;
  actual: any;
  passed: boolean;
  details?: string;
}

export interface EvalMetricBreakdown {
  tokensSaved?: number;
  tokensSavedPercent?: number;
  reductionRatioPercent?: number;
  piiRecallPercent?: number;
  piiPrecisionPercent?: number;
  piiF1Score?: number;
  pageCount?: number;
  sizeBytes?: number;
  executionTimeMs?: number;
}

export interface EvalTestCase {
  id: string;
  title: string;
  category: EvalCategory;
  description: string;
  targetTool: string;
  complexity: 'low' | 'medium' | 'high';
  prompt?: string;
  expectedTool?: string;
  expectedArgsPattern?: Record<string, any>;
}

export interface EvalTestResult {
  testId: string;
  title: string;
  category: EvalCategory;
  status: EvalStatus;
  passed: boolean;
  executionTimeMs: number;
  assertions: EvalAssertion[];
  metrics: EvalMetricBreakdown;
  outputArtifactSnippet?: string;
  error?: string;
}

export interface EvalSuiteSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  passRatePercent: number;
  totalExecutionTimeMs: number;
  avgExecutionTimeMs: number;
  avgTokenSavingsPercent: number;
  avgPiiRecallPercent: number;
  avgCompressionPercent: number;
  categoryBreakdown: Record<EvalCategory, { total: number; passed: number; failed: number }>;
}

export interface AgentRoutingEvalSample {
  id: string;
  query: string;
  expectedTool: string;
  expectedArgs: Record<string, any>;
  description: string;
}
