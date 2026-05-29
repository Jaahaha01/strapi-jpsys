import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'results', 'k6');
const scenarios = [10, 50, 100];

fs.mkdirSync(OUT_DIR, { recursive: true });

const endpoints = [
  { method: 'GET', endpoint: '/api/company', metric: 'get_company_duration', group: 'GET /api/company' },
  { method: 'GET', endpoint: '/api/marketing', metric: 'get_marketing_duration', group: 'GET /api/marketing' },
  { method: 'GET', endpoint: '/api/new-release', metric: 'get_new_release_duration', group: 'GET /api/new-release' },
  { method: 'POST', endpoint: '/api/auth/local', metric: 'post_auth_duration', group: 'POST /api/auth/local' },
  { method: 'PUT', endpoint: '/api/company', metric: 'put_company_duration', group: 'PUT /api/company' },
];

function readSummary(vus) {
  const file = path.join(OUT_DIR, `results-${vus}vus-summary.json`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function readStageSummary() {
  const file = path.join(OUT_DIR, 'results-stage-summary.json');
  if (!fs.existsSync(file)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function value(metric, key) {
  const raw = metric?.values?.[key];
  return Number.isFinite(raw) ? raw : 0;
}

function fixed(input, decimals = 2) {
  return Number(input).toFixed(decimals);
}

function groupCheck(summary, groupName) {
  const group = summary.root_group.groups.find((item) => item.name === groupName);
  const statusCheck = group?.checks?.find((check) => check.name.includes('status') || check.name.includes('not 401/403'));
  return {
    requests: (statusCheck?.passes || 0) + (statusCheck?.fails || 0),
    failures: statusCheck?.fails || 0,
  };
}

function passFail(summary) {
  const failed = summary.metrics.http_req_failed?.values?.rate || 0;
  const p95 = summary.metrics.http_req_duration?.values?.['p(95)'] || 0;
  return failed < 0.05 && p95 < 2000 ? 'PASS' : 'REVIEW';
}

const endpointRows = [];
const overallRows = [];

for (const vus of scenarios) {
  const summary = readSummary(vus);
  const metrics = summary.metrics;
  const durationSec = (summary.state.testRunDurationMs || 0) / 1000;

  overallRows.push({
    vus,
    totalRequests: value(metrics.http_reqs, 'count'),
    requestsPerSecond: value(metrics.http_reqs, 'rate'),
    avgMs: value(metrics.http_req_duration, 'avg'),
    p95Ms: value(metrics.http_req_duration, 'p(95)'),
    maxMs: value(metrics.http_req_duration, 'max'),
    httpFailedPercent: value(metrics.http_req_failed, 'rate') * 100,
    customErrorPercent: value(metrics.errors, 'rate') * 100,
    durationSec,
    result: passFail(summary),
  });

  for (const item of endpoints) {
    const metric = metrics[item.metric];
    const check = groupCheck(summary, item.group);
    endpointRows.push({
      vus,
      method: item.method,
      endpoint: item.endpoint,
      avgMs: value(metric, 'avg'),
      minMs: value(metric, 'min'),
      medMs: value(metric, 'med'),
      p90Ms: value(metric, 'p(90)'),
      p95Ms: value(metric, 'p(95)'),
      maxMs: value(metric, 'max'),
      requests: check.requests,
      failures: check.failures,
      failurePercent: check.requests ? (check.failures / check.requests) * 100 : 0,
    });
  }
}

const endpointCsv = [
  'vus,method,endpoint,avg_ms,min_ms,med_ms,p90_ms,p95_ms,max_ms,requests,failures,failure_percent',
  ...endpointRows.map((row) => [
    row.vus,
    row.method,
    row.endpoint,
    fixed(row.avgMs),
    fixed(row.minMs),
    fixed(row.medMs),
    fixed(row.p90Ms),
    fixed(row.p95Ms),
    fixed(row.maxMs),
    row.requests,
    row.failures,
    fixed(row.failurePercent),
  ].join(',')),
].join('\n');

const overallCsv = [
  'vus,total_requests,requests_per_second,avg_ms,p95_ms,max_ms,http_failed_percent,custom_error_percent,duration_sec,result',
  ...overallRows.map((row) => [
    row.vus,
    row.totalRequests,
    fixed(row.requestsPerSecond),
    fixed(row.avgMs),
    fixed(row.p95Ms),
    fixed(row.maxMs),
    fixed(row.httpFailedPercent),
    fixed(row.customErrorPercent),
    fixed(row.durationSec),
    row.result,
  ].join(',')),
].join('\n');

const worstEndpoint = endpointRows.reduce((worst, row) => row.p95Ms > worst.p95Ms ? row : worst, endpointRows[0]);
const allPassed = overallRows.every((row) => row.result === 'PASS');

const markdown = `# k6 Strapi Load Test Summary

Test target: Strapi API at \`http://localhost:1337\`

Load levels: 10, 50, 100 VUs

Endpoints tested:
- GET \`/api/company?populate=*&locale=th\`
- GET \`/api/marketing?populate=*&locale=th\`
- GET \`/api/new-release?populate=*&locale=th\`
- POST \`/api/auth/local\`
- PUT \`/api/company\`

## Overall Results

| VUs | Total Requests | Req/s | Avg (ms) | p95 (ms) | Max (ms) | Error % | Result |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | :--- |
${overallRows.map((row) => `| ${row.vus} | ${row.totalRequests} | ${fixed(row.requestsPerSecond)} | ${fixed(row.avgMs)} | ${fixed(row.p95Ms)} | ${fixed(row.maxMs)} | ${fixed(row.customErrorPercent)} | ${row.result} |`).join('\n')}

## Endpoint Results

| VUs | Method | Endpoint | Avg (ms) | p95 (ms) | Max (ms) | Requests | Failures |
| ---: | :--- | :--- | ---: | ---: | ---: | ---: | ---: |
${endpointRows.map((row) => `| ${row.vus} | ${row.method} | \`${row.endpoint}\` | ${fixed(row.avgMs)} | ${fixed(row.p95Ms)} | ${fixed(row.maxMs)} | ${row.requests} | ${row.failures} |`).join('\n')}

## Chart Data

Use \`results/k6/report-endpoints.csv\` for a grouped bar chart:
- X-axis: \`vus\`
- Series: \`p95_ms\` or \`avg_ms\`
- Breakdown: \`method\` + \`endpoint\`

Use \`results/k6/report-overall.csv\` for the main comparison chart:
- X-axis: \`vus\`
- Series: \`avg_ms\`, \`p95_ms\`, \`requests_per_second\`

## Recommendation

${allPassed ? 'All three load levels passed the selected thresholds: p95 below 2000 ms and error rate below 5%.' : 'At least one load level needs review because p95 exceeded 2000 ms or error rate exceeded 5%.'}

Slowest endpoint by p95 was ${worstEndpoint.method} \`${worstEndpoint.endpoint}\` at ${worstEndpoint.vus} VUs with p95 ${fixed(worstEndpoint.p95Ms)} ms.
`;

fs.writeFileSync(path.join(OUT_DIR, 'report-endpoints.csv'), endpointCsv);
fs.writeFileSync(path.join(OUT_DIR, 'report-overall.csv'), overallCsv);
fs.writeFileSync(path.join(OUT_DIR, 'LOAD_TEST_SUMMARY.md'), markdown);

const stageSummary = readStageSummary();
if (stageSummary) {
  const stageMetrics = stageSummary.metrics;
  const stageMarkdown = `# k6 Stage Load Test Summary

Test target: Strapi API at \`http://localhost:1337\`

Load profile:
- 1m ramp from 0 to 10 VUs
- 2m ramp from 10 to 50 VUs
- 3m ramp from 50 to 100 VUs
- 1m ramp down from 100 to 0 VUs

Total requests: ${stageMetrics.http_reqs?.values?.count || 0}
Average duration: ${(stageMetrics.http_req_duration?.values?.avg || 0).toFixed(2)} ms
p95 duration: ${(stageMetrics.http_req_duration?.values?.['p(95)'] || 0).toFixed(2)} ms
Error rate: ${(((stageMetrics.errors?.values?.rate || 0) * 100).toFixed(2))} %
`;
  fs.writeFileSync(path.join(OUT_DIR, 'LOAD_TEST_STAGE_SUMMARY.md'), stageMarkdown);
}

console.log('Generated:');
console.log('results/k6/report-endpoints.csv');
console.log('results/k6/report-overall.csv');
console.log('results/k6/LOAD_TEST_SUMMARY.md');
if (stageSummary) {
  console.log('results/k6/LOAD_TEST_STAGE_SUMMARY.md');
}
