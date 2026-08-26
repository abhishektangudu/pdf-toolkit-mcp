import { runEntireEvalSuite, EVAL_TEST_CASES } from '../lib/eval-suite';
import type { EvalTestResult, EvalSuiteSummary } from '../types/eval';

async function main() {
  console.log('\n============================================================');
  console.log('  PDF AGENT TOOLKIT & MCP SERVER - BENCHMARK EVAL SUITE');
  console.log('============================================================\n');
  console.log(`Discovered ${EVAL_TEST_CASES.length} test cases across 6 benchmark categories...\n`);

  const startTime = Date.now();

  const { results, summary } = await runEntireEvalSuite(undefined, (result, index, total) => {
    const symbol = result.passed ? '✓ PASS' : '✗ FAIL';
    const color = result.passed ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';
    console.log(
      `[${index}/${total}] ${color}${symbol}${reset} [${result.executionTimeMs}ms] ${result.title}`
    );
  });

  console.log('\n------------------------------------------------------------');
  console.log('                    EVALUATION SUMMARY                      ');
  console.log('------------------------------------------------------------');
  console.log(`Total Benchmark Tests : ${summary.totalTests}`);
  console.log(`Passed                : ${summary.passedTests} (${summary.passRatePercent}%)`);
  console.log(`Failed                : ${summary.failedTests}`);
  console.log(`Total Duration        : ${summary.totalExecutionTimeMs}ms (avg ${summary.avgExecutionTimeMs}ms/test)`);
  console.log(`Avg Prompt Token Reduction : ~${summary.avgTokenSavingsPercent}%`);
  console.log(`PII Ground Truth Recall    : ${summary.avgPiiRecallPercent}%`);
  console.log('------------------------------------------------------------\n');

  console.log('Category Breakdown:');
  Object.entries(summary.categoryBreakdown).forEach(([cat, stats]) => {
    console.log(` • ${cat.padEnd(25)} : ${stats.passed}/${stats.total} passed`);
  });

  console.log('\n');

  if (summary.failedTests > 0) {
    console.error('❌ Eval suite failed with errors.');
    process.exit(1);
  } else {
    console.log('✨ All evaluation assertions passed green!\n');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal eval runner error:', err);
  process.exit(1);
});
