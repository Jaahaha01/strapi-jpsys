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
| 10 | 1180 | 14.32 | 9.75 | 26.73 | 54.56 | 0.00 | PASS |
| 50 | 5880 | 71.17 | 9.06 | 22.36 | 54.72 | 0.00 | PASS |
| 100 | 9285 | 112.34 | 173.06 | 412.52 | 670.51 | 0.00 | PASS |

## Endpoint Results

| VUs | Method | Endpoint | Avg (ms) | p95 (ms) | Max (ms) | Requests | Failures |
| ---: | :--- | :--- | ---: | ---: | ---: | ---: | ---: |
| 10 | GET | `/api/company` | 6.19 | 7.99 | 13.46 | 236 | 0 |
| 10 | GET | `/api/marketing` | 7.01 | 9.89 | 22.08 | 236 | 0 |
| 10 | GET | `/api/new-release` | 6.79 | 10.42 | 33.65 | 236 | 0 |
| 10 | POST | `/api/auth/local` | 3.27 | 4.55 | 11.63 | 236 | 0 |
| 10 | PUT | `/api/company` | 25.49 | 30.34 | 54.56 | 236 | 0 |
| 50 | GET | `/api/company` | 5.41 | 10.31 | 22.36 | 1176 | 0 |
| 50 | GET | `/api/marketing` | 10.38 | 22.91 | 42.83 | 1176 | 0 |
| 50 | GET | `/api/new-release` | 5.75 | 10.55 | 38.27 | 1176 | 0 |
| 50 | POST | `/api/auth/local` | 3.19 | 6.45 | 17.87 | 1176 | 0 |
| 50 | PUT | `/api/company` | 20.58 | 31.97 | 54.72 | 1176 | 0 |
| 100 | GET | `/api/company` | 196.34 | 414.32 | 523.50 | 1857 | 0 |
| 100 | GET | `/api/marketing` | 160.65 | 411.03 | 615.47 | 1857 | 0 |
| 100 | GET | `/api/new-release` | 171.94 | 399.56 | 521.66 | 1857 | 0 |
| 100 | POST | `/api/auth/local` | 133.65 | 344.07 | 519.02 | 1857 | 0 |
| 100 | PUT | `/api/company` | 202.74 | 456.01 | 670.51 | 1857 | 0 |

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

Slowest endpoint by p95 was PUT `/api/company` at 100 VUs with p95 456.01 ms.
