# k6 Stage Load Test Summary

Test target: Strapi API at `http://localhost:1337`

## Load Profile (Ramping VUs)
- **0 ➔ 10 VUs** in 30s
- **10 ➔ 50 VUs** in 1m
- **50 ➔ 100 VUs** in 1m 30s
- **100 ➔ 0 VUs** in 1m
- **Total Test Duration:** 242.03 seconds

## Overall Results

| Metric | Value | Threshold / SLA | Status |
| :--- | :---: | :---: | :---: |
| **Total Requests** | 18340 | - | - |
| **Throughput (Req/s)** | 75.78 req/s | - | - |
| **Average Response Time** | 43.87 ms | - | - |
| **p95 Response Time** | 185.59 ms | < 2000 ms | ✅ PASS |
| **Max Response Time** | 446.06 ms | - | - |
| **HTTP Failure Rate** | 0.00 % | < 5.00 % | ✅ PASS |
| **Custom Error Rate** | 0.00 % | - | - |

## Endpoint Breakdown

| Method | Endpoint | Avg (ms) | p95 (ms) | Max (ms) | Requests | Failures | Status |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: | :---: |
| GET | `/api/company` | 46.07 | 190.06 | 437.54 | 3668 | 0 | ✅ PASS
| GET | `/api/marketing` | 47.46 | 200.89 | 398.12 | 3668 | 0 | ✅ PASS
| GET | `/api/new-release` | 27.83 | 138.04 | 446.06 | 3668 | 0 | ✅ PASS
| POST | `/api/auth/local` | 35.99 | 184.65 | 431.94 | 3668 | 0 | ✅ PASS
| PUT | `/api/company` | 62.00 | 200.10 | 445.85 | 3668 | 0 | ✅ PASS

## Summary Recommendation

🎉 **All SLA thresholds passed!** The system successfully handled the ramping load profile up to 100 VUs while maintaining response times and error rates within acceptable boundaries.
