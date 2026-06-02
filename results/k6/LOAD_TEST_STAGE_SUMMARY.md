# k6 Stage Load Test Summary

Test target: Strapi API at `http://localhost:1337`

Load profile:
- 1m ramp from 0 to 10 VUs
- 2m ramp from 10 to 50 VUs
- 3m ramp from 50 to 100 VUs
- 1m ramp down from 100 to 0 VUs

Total requests: 17000
Average duration: 95.72 ms
p95 duration: 357.37 ms
Error rate: 0.00 %
