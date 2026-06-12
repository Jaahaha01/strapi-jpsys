# k6 Stage Load Test Summary

Test target: Strapi API at `http://localhost:1337`

## Load Profile (Ramping VUs)
- **0 ➔ 10 VUs** in 30s
- **10 ➔ 50 VUs** in 1m
- **50 ➔ 100 VUs** in 1m 30s
- **100 ➔ 0 VUs** in 1m
- **Total Test Duration:** 242.65 seconds

## Overall Results

| Metric | Value | Threshold / SLA | Status |
| :--- | :---: | :---: | :---: |
| **Total Requests** | 17055 | - | - |
| **Throughput (Req/s)** | 70.29 req/s | - | - |
| **Average Response Time** | 92.78 ms | - | - |
| **p95 Response Time** | 384.65 ms | < 2000 ms | ✅ PASS |
| **Max Response Time** | 783.80 ms | - | - |
| **HTTP Failure Rate** | 0.00 % | < 5.00 % | ✅ PASS |
| **Custom Error Rate** | 0.00 % | - | - |

## Endpoint Breakdown

| Method | Endpoint | Avg (ms) | p95 (ms) | Max (ms) | Requests | Failures | Status |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: | :---: |
| GET | `/api/company` | 105.55 | 425.27 | 783.80 | 3411 | 0 | ✅ PASS
| GET | `/api/marketing` | 98.59 | 385.17 | 738.96 | 3411 | 0 | ✅ PASS
| GET | `/api/new-release` | 50.62 | 236.18 | 742.64 | 3411 | 0 | ✅ PASS
| POST | `/api/auth/local` | 85.11 | 379.04 | 727.44 | 3411 | 0 | ✅ PASS
| PUT | `/api/company` | 124.01 | 407.06 | 740.76 | 3411 | 0 | ✅ PASS

## Summary Recommendation

🎉 **All SLA thresholds passed!** The system successfully handled the ramping load profile up to 100 VUs while maintaining response times and error rates within acceptable boundaries.
