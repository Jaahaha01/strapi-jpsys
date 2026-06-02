# k6 Strapi Load Test Summary

Test target: Strapi API at `http://localhost:1337`

Load levels: 10, 50, 100 VUs

Endpoints tested:
- GET `/api/company?populate=*&locale=th`
- GET `/api/marketing?populate=*&locale=th`
- GET `/api/new-release?populate=*&locale=th`
- POST `/api/auth/local`
- PUT `/api/company`

## Overall Results

| VUs | Total Requests | Req/s | Avg (ms) | p95 (ms) | Max (ms) | Error % | Result |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | :--- |
| 10 | 1185 | 14.42 | 8.08 | 22.87 | 32.60 | 0.00 | PASS |
| 50 | 5870 | 71.12 | 10.03 | 28.96 | 107.84 | 0.00 | PASS |
| 100 | 8490 | 103.01 | 246.83 | 540.98 | 981.74 | 0.00 | PASS |

## Endpoint Results

| VUs | Method | Endpoint | Avg (ms) | p95 (ms) | Max (ms) | Requests | Failures |
| ---: | :--- | :--- | ---: | ---: | ---: | ---: | ---: |
| 10 | GET | `/api/company` | 4.87 | 6.12 | 7.35 | 237 | 0 |
| 10 | GET | `/api/marketing` | 5.47 | 6.74 | 8.54 | 237 | 0 |
| 10 | GET | `/api/new-release` | 5.38 | 7.86 | 10.54 | 237 | 0 |
| 10 | POST | `/api/auth/local` | 2.67 | 3.48 | 4.12 | 237 | 0 |
| 10 | PUT | `/api/company` | 22.03 | 25.26 | 32.60 | 237 | 0 |
| 50 | GET | `/api/company` | 5.95 | 15.68 | 56.42 | 1174 | 0 |
| 50 | GET | `/api/marketing` | 11.98 | 28.36 | 106.44 | 1174 | 0 |
| 50 | GET | `/api/new-release` | 6.18 | 15.65 | 69.36 | 1174 | 0 |
| 50 | POST | `/api/auth/local` | 3.54 | 8.98 | 54.88 | 1174 | 0 |
| 50 | PUT | `/api/company` | 22.53 | 34.35 | 107.84 | 1174 | 0 |
| 100 | GET | `/api/company` | 288.04 | 578.71 | 963.49 | 1698 | 0 |
| 100 | GET | `/api/marketing` | 210.27 | 492.41 | 885.75 | 1698 | 0 |
| 100 | GET | `/api/new-release` | 268.73 | 544.99 | 981.74 | 1698 | 0 |
| 100 | POST | `/api/auth/local` | 208.83 | 497.72 | 958.63 | 1698 | 0 |
| 100 | PUT | `/api/company` | 258.30 | 547.49 | 981.28 | 1698 | 0 |

## Chart Data

Use `results/k6/report-endpoints.csv` for a grouped bar chart:
- X-axis: `vus`
- Series: `p95_ms` or `avg_ms`
- Breakdown: `method` + `endpoint`

Use `results/k6/report-overall.csv` for the main comparison chart:
- X-axis: `vus`
- Series: `avg_ms`, `p95_ms`, `requests_per_second`

## Recommendation

All three load levels passed the selected thresholds: p95 below 2000 ms and error rate below 5%.

Slowest endpoint by p95 was GET `/api/company` at 100 VUs with p95 578.71 ms.
