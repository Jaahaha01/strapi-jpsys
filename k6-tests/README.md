# 🚀 k6 Load Test — Strapi JpSys API

> ทดสอบ Load บน Strapi API ด้วย k6 ที่ 10, 50, 100 VUs

---

## ⚙️ ติดตั้ง k6

```powershell
# Windows (winget)
winget install k6 --source winget

# ตรวจสอบ
k6 version
```

---

## 🔑 เตรียม API Token

สร้างจาก Strapi Admin → Settings → API Tokens → "Full Access"  
แก้ค่าใน `k6-tests/config.js` หรือส่งเป็น env:

```powershell
k6 run --env API_TOKEN="your_token_here" k6-tests/load-test.js
```

---

## ▶️ รันการทดสอบ

> ⚠️ **ต้องใช้ `npm run start`** (ไม่ใช่ `dev`) เพราะ dev จะ restart ตอน k6 เขียนไฟล์ผลลัพธ์

### ขั้นตอนที่ 1 — เปิด Strapi

```powershell
cd C:\JapanSys\strapi-jpsys
npm run build   # ครั้งแรก
npm run start
```

### ขั้นตอนที่ 2 — รัน k6

```powershell
k6 run --env SCENARIO_VUS=10  k6-tests/load-test.js
k6 run --env SCENARIO_VUS=50  k6-tests/load-test.js
k6 run --env SCENARIO_VUS=100 k6-tests/load-test.js
```

### Smoke test (ลองเร็วๆ 1 VU)

```powershell
k6 run --vus 1 --duration 15s k6-tests/load-test.js
```

### Stage test (ไต่ขั้นอัตโนมัติ 0→10→50→100→0)

```powershell
k6 run --env TEST_MODE=stage k6-tests/load-test.js
```

---

## 📊 สร้าง Report

หลังรัน k6 ครบแล้ว (10, 50, 100 VU) สร้าง summary report:

```powershell
node k6-tests/build-report.mjs
```

ได้ไฟล์:
- `results/k6/LOAD_TEST_SUMMARY.md` — สรุปตาราง Markdown
- `results/k6/report-endpoints.csv` — CSV แยกรายละเอียดแต่ละ endpoint
- `results/k6/report-overall.csv` — CSV สรุปรวมต่อ VU level

---

## 📁 โครงสร้างไฟล์

```
k6-tests/
├── load-test.js       ← script หลัก (k6 run)
├── config.js          ← ค่า config (token, stages, thresholds)
├── build-report.mjs   ← สร้าง summary จาก JSON results
└── README.md

results/k6/
├── results-10vus-summary.json   ← ผล 10 VU (overwrite ทุกรอบ)
├── results-10vus.csv
├── results-50vus-summary.json   ← ผล 50 VU
├── results-50vus.csv
├── results-100vus-summary.json  ← ผล 100 VU
├── results-100vus.csv
├── report-endpoints.csv         ← build-report output
├── report-overall.csv
├── LOAD_TEST_SUMMARY.md         ← Markdown summary
└── LOAD_TEST_STAGE_SUMMARY.md   ← Stage test summary (ถ้ารัน)
```

---

## 🎯 Endpoints ที่ทดสอบ

| Method | Endpoint | หมายเหตุ |
|---|---|---|
| GET | `/api/company?populate=*&locale=th` | Public |
| GET | `/api/marketing?populate=*&locale=th` | Public |
| GET | `/api/new-release?populate=*&locale=th` | Public |
| PUT | `/api/company` | ต้องมี API Token |
| POST | `/api/auth/local` | Login |

---

## 📏 Thresholds

| Metric | เกณฑ์ |
|---|---|
| `http_req_duration` p95 | < 2000ms |
| `http_req_failed` rate | < 5% |
| GET endpoints p95 | < 1500ms |
| PUT endpoint p95 | < 3000ms |
| POST auth p95 | < 2000ms |