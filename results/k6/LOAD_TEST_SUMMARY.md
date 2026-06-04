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
| 10 | 1185 | 14.43 | 7.89 | 21.57 | 31.42 | 0.00 | PASS |
| 50 | 5885 | 71.24 | 8.96 | 24.94 | 78.38 | 0.00 | PASS |
| 100 | 11035 | 134.70 | 49.27 | 118.52 | 266.82 | 0.00 | PASS |

## Endpoint Results

| VUs | Method | Endpoint | Avg (ms) | p95 (ms) | Max (ms) | Requests | Failures |
| ---: | :--- | :--- | ---: | ---: | ---: | ---: | ---: |
| 10 | GET | `/api/company` | 4.84 | 5.70 | 15.86 | 237 | 0 |
| 10 | GET | `/api/marketing` | 5.63 | 6.96 | 16.82 | 237 | 0 |
| 10 | GET | `/api/new-release` | 5.51 | 8.23 | 17.79 | 237 | 0 |
| 10 | POST | `/api/auth/local` | 2.56 | 3.41 | 4.06 | 237 | 0 |
| 10 | PUT | `/api/company` | 20.89 | 23.15 | 31.42 | 237 | 0 |
| 50 | GET | `/api/company` | 5.31 | 9.73 | 54.08 | 1177 | 0 |
| 50 | GET | `/api/marketing` | 9.90 | 25.39 | 65.58 | 1177 | 0 |
| 50 | GET | `/api/new-release` | 5.54 | 10.30 | 63.37 | 1177 | 0 |
| 50 | POST | `/api/auth/local` | 3.30 | 6.65 | 35.30 | 1177 | 0 |
| 50 | PUT | `/api/company` | 20.76 | 33.42 | 78.38 | 1177 | 0 |
| 100 | GET | `/api/company` | 53.88 | 116.44 | 224.13 | 2207 | 0 |
| 100 | GET | `/api/marketing` | 44.67 | 109.73 | 251.66 | 2207 | 0 |
| 100 | GET | `/api/new-release` | 49.07 | 120.07 | 221.34 | 2207 | 0 |
| 100 | POST | `/api/auth/local` | 36.79 | 100.89 | 217.46 | 2207 | 0 |
| 100 | PUT | `/api/company` | 61.94 | 137.88 | 266.82 | 2207 | 0 |

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

Slowest endpoint by p95 was PUT `/api/company` at 100 VUs with p95 137.88 ms.
