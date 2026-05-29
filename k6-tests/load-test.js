// ============================================================
// k6 Load Test Script — Strapi JpSys API
// Internship Final Project
//
// Endpoints ที่ทดสอบ:
//   [1] GET  /api/company?populate=*&locale=th
//   [2] GET  /api/marketing?populate=*&locale=th
//   [3] GET  /api/new-release?populate=*&locale=th
//   [4] PUT  /api/company   (ต้องมี API Token)
//   [5] POST /api/auth/local
//
// วิธีรัน:
//   k6 run --env TEST_MODE=stage k6-tests/load-test.js
//   k6 run --env SCENARIO_VUS=10 k6-tests/load-test.js
//   k6 run --env SCENARIO_VUS=50 k6-tests/load-test.js
//   k6 run --env SCENARIO_VUS=100 k6-tests/load-test.js
// ============================================================

import http    from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { BASE_URL, API_TOKEN, TEST_USER, THRESHOLDS, STAGES, SCENARIO_NAME, SCENARIO_VUS, TEST_MODE } from './config.js';

// ============================================================
// Custom Metrics — แยกวัดแต่ละ endpoint
// ============================================================
const getCompanyDuration   = new Trend('get_company_duration',   true);
const getMarketingDuration = new Trend('get_marketing_duration', true);
const getNewReleaseDuration= new Trend('get_new_release_duration', true);
const putCompanyDuration   = new Trend('put_company_duration',   true);
const postAuthDuration     = new Trend('post_auth_duration',     true);

const errorRate            = new Rate('errors');
const putSuccessCounter    = new Counter('put_success_total');
const authSuccessCounter   = new Counter('auth_success_total');

// ============================================================
// Options
// ============================================================
export const options = {
  stages: STAGES,
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)'],
  thresholds: {
    ...THRESHOLDS,
    // แยก threshold ต่อ endpoint
    get_company_duration:    ['p(95)<1500'],
    get_marketing_duration:  ['p(95)<1500'],
    get_new_release_duration:['p(95)<1500'],
    put_company_duration:    ['p(95)<3000'],
    post_auth_duration:      ['p(95)<2000'],
  },
};

// ============================================================
// Headers
// ============================================================
const PUBLIC_HEADERS = {
  'Content-Type': 'application/json',
};

const AUTH_HEADERS = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${API_TOKEN}`,
};

// ============================================================
// Main VU Function
// ============================================================
export default function () {
  // ---- [1] GET Company ----
  group('GET /api/company', () => {
    const res = http.get(
      `${BASE_URL}/api/company?populate=*&locale=th`,
      { headers: PUBLIC_HEADERS, tags: { endpoint: 'get_company' } }
    );

    getCompanyDuration.add(res.timings.duration);

    const ok = check(res, {
      'GET company: status 200': (r) => r.status === 200,
      'GET company: has data':   (r) => {
        try { return JSON.parse(r.body).data !== null; }
        catch { return false; }
      },
    });
    errorRate.add(!ok);
  });

  sleep(0.5);

  // ---- [2] GET Marketing ----
  group('GET /api/marketing', () => {
    const res = http.get(
      `${BASE_URL}/api/marketing?populate=*&locale=th`,
      { headers: PUBLIC_HEADERS, tags: { endpoint: 'get_marketing' } }
    );

    getMarketingDuration.add(res.timings.duration);

    const ok = check(res, {
      'GET marketing: status 200': (r) => r.status === 200,
      'GET marketing: has data':   (r) => {
        try { return JSON.parse(r.body).data !== null; }
        catch { return false; }
      },
    });
    errorRate.add(!ok);
  });

  sleep(0.5);

  // ---- [3] GET New Releases ----
  group('GET /api/new-release', () => {
    const res = http.get(
      `${BASE_URL}/api/new-release?populate=*&locale=th`,
      { headers: PUBLIC_HEADERS, tags: { endpoint: 'get_new_releases' } }
    );

    getNewReleaseDuration.add(res.timings.duration);

    const ok = check(res, {
      'GET new-release: status 200': (r) => r.status === 200,
      'GET new-release: has data':   (r) => {
        try { return JSON.parse(r.body).data !== null; }
        catch { return false; }
      },
    });
    errorRate.add(!ok);
  });

  sleep(0.5);

  // ---- [4] PUT Company (อัพเดตฟิลด์เล็กน้อย) ----
  group('PUT /api/company', () => {
    // ใช้ timestamp เพื่อให้ข้อมูลเปลี่ยนทุก request
    const payload = JSON.stringify({
      data: {
        infoPhone: `02-000-000${Math.floor(Math.random() * 9)}`,
      },
    });

    const res = http.put(
      `${BASE_URL}/api/company`,
      payload,
      { headers: AUTH_HEADERS, tags: { endpoint: 'put_company' } }
    );

    putCompanyDuration.add(res.timings.duration);

    const ok = check(res, {
      'PUT company: status 200':     (r) => r.status === 200,
      'PUT company: not 401/403':    (r) => r.status !== 401 && r.status !== 403,
    });

    if (res.status === 200) putSuccessCounter.add(1);
    errorRate.add(!ok);
  });

  sleep(0.5);

  // ---- [5] POST Auth/Local (Login) ----
  group('POST /api/auth/local', () => {
    const payload = JSON.stringify(TEST_USER);

    // บอก k6 ว่า status 200, 400 และ 429 ถือว่าเป็น "expected"
    // 429 = Rate Limited (Strapi จำกัด login request ที่มาถี่เกินไป)
    // เพื่อไม่ให้นับเข้า http_req_failed
    const res = http.post(
      `${BASE_URL}/api/auth/local`,
      payload,
      {
        headers: PUBLIC_HEADERS,
        tags: { endpoint: 'post_auth' },
        responseCallback: http.expectedStatuses(200, 400, 429),
      }
    );

    postAuthDuration.add(res.timings.duration);

    const ok = check(res, {
      // ยอมรับ 200 (สำเร็จ), 400 (credentials ผิด), 429 (rate limited)
      'POST auth: status 200, 400 or 429': (r) => r.status === 200 || r.status === 400 || r.status === 429,
      'POST auth: has response body':       (r) => r.body && r.body.length > 0,
    });

    if (res.status === 200) authSuccessCounter.add(1);
    errorRate.add(!ok);
  });

  sleep(1);
}

// ============================================================
// Summary Handler — แสดงผลสรุปหลังรันเสร็จ
// ============================================================
export function handleSummary(data) {
  // สร้าง CSV สำหรับ import Google Sheets
  const metrics = data.metrics;

  const rows = [
    ['VUs', 'Endpoint', 'Avg (ms)', 'Min (ms)', 'Med (ms)', 'p90 (ms)', 'p95 (ms)', 'Max (ms)', 'Requests', 'Failures'],
  ];

  const endpointMap = {
    'GET /api/company':       { metric: 'get_company_duration', groupName: 'GET /api/company' },
    'GET /api/marketing':     { metric: 'get_marketing_duration', groupName: 'GET /api/marketing' },
    'GET /api/new-release':   { metric: 'get_new_release_duration', groupName: 'GET /api/new-release' },
    'PUT /api/company':       { metric: 'put_company_duration', groupName: 'PUT /api/company' },
    'POST /api/auth/local':   { metric: 'post_auth_duration', groupName: 'POST /api/auth/local' },
  };

  for (const [label, info] of Object.entries(endpointMap)) {
    const m = metrics[info.metric];
    if (!m) continue;
    const v = m.values;

    let requests = '-';
    let failures = '-';

    const group = data.root_group.groups.find(g => g.name === info.groupName);
    if (group && group.checks && group.checks.length > 0) {
      requests = group.checks[0].passes + group.checks[0].fails;
      const statusCheck = group.checks.find(c => c.name.includes('status 200') || c.name.includes('not 401/403'));
      if (statusCheck) {
        failures = statusCheck.fails;
      } else {
        failures = group.checks[0].fails;
      }
    }

    rows.push([
      SCENARIO_VUS,
      label,
      v.avg  ? v.avg.toFixed(2)  : '-',
      v.min  ? v.min.toFixed(2)  : '-',
      v.med  ? v.med.toFixed(2)  : '-',
      v['p(90)'] ? v['p(90)'].toFixed(2) : '-',
      v['p(95)'] ? v['p(95)'].toFixed(2) : '-',
      v.max  ? v.max.toFixed(2)  : '-',
      requests,
      failures,
    ]);
  }

  // แปลงเป็น CSV string
  const csv = rows.map(r => r.join(',')).join('\n');

  console.log('\n============================================================');
  console.log(`LOAD TEST SUMMARY (${SCENARIO_NAME}) - Copy to Google Sheets`);
  console.log('============================================================');
  console.log(csv);
  console.log('============================================================\n');

  const totalReqs   = metrics.http_reqs?.values?.count    || 0;
  const errorRateVal= metrics.errors?.values?.rate         || 0;
  const avgDuration = metrics.http_req_duration?.values?.avg || 0;
  const p95Duration = metrics.http_req_duration?.values?.['p(95)'] || 0;

  console.log(`Total Requests : ${totalReqs}`);
  console.log(`Avg Duration   : ${avgDuration.toFixed(2)} ms`);
  console.log(`p95 Duration   : ${p95Duration.toFixed(2)} ms`);
  console.log(`Error Rate     : ${(errorRateVal * 100).toFixed(2)} %`);

  const summaryText = [
    `k6 Load Test Summary - ${SCENARIO_NAME}`,
    '',
    `Test mode: ${TEST_MODE}`,
    `Total requests: ${totalReqs}`,
    `Average duration: ${avgDuration.toFixed(2)} ms`,
    `p95 duration: ${p95Duration.toFixed(2)} ms`,
    `Custom error rate: ${(errorRateVal * 100).toFixed(2)} %`,
    '',
    csv,
    '',
  ].join('\n');

  return {
    [`results/k6/results-${SCENARIO_NAME}-summary.json`]: JSON.stringify(data, null, 2),
    [`results/k6/results-${SCENARIO_NAME}.csv`]: csv,
    stdout: summaryText,
  };
}
