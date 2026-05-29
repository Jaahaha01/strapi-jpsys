# k6 Load Test — Strapi JpSys API

> **Internship Final Project**  
> ทดสอบ Load บน Strapi API ด้วย k6 ที่ 10, 50, 100 VUs

---

## 📦 ติดตั้ง k6

### วิธีที่ 1: winget (แนะนำ)
```powershell
winget install k6 --source winget
```

### วิธีที่ 2: Chocolatey
```powershell
choco install k6
```

### วิธีที่ 3: Download โดยตรง
ดาวน์โหลดจาก https://k6.io/docs/get-started/installation/

ตรวจสอบว่าติดตั้งสำเร็จ:
```powershell
k6 version
```

---

## 🔑 เตรียม API Token (สำหรับ PUT endpoint)

1. เปิด Strapi Admin: http://localhost:1337/admin
2. ไปที่ **Settings → API Tokens → + Create new API Token**
3. ตั้งค่า:
   - Name: `k6-load-test`
   - Token duration: `Unlimited`
   - Token type: `Full access`
4. Copy token
5. แก้ไข `config.js` บรรทัด `API_TOKEN = '...'` ใส่ token ที่ได้

---

## 🚀 วิธีรัน

### ขั้นตอนที่ 1 — เริ่ม Strapi ก่อน
```powershell
cd c:\JapanSys\strapi-jpsys
npm run dev
```

### ขั้นตอนที่ 2 — Smoke Test (ทดสอบว่า script ทำงานได้)
```powershell
cd c:\JapanSys\strapi-jpsys
k6 run --vus 1 --duration 15s k6-tests/load-test.js
```

### ขั้นตอนที่ 3 — Full Load Test (10 → 50 → 100 VUs)
```powershell
# รันแยก 3 รอบ เพื่อเอาไปเปรียบเทียบ/ทำกราฟ
k6 run --env TEST_MODE=single --env SCENARIO_VUS=10 k6-tests/load-test.js
k6 run --env TEST_MODE=single --env SCENARIO_VUS=50 k6-tests/load-test.js
k6 run --env TEST_MODE=single --env SCENARIO_VUS=100 k6-tests/load-test.js

# หรือส่ง API Token ผ่าน env variable
k6 run --env TEST_MODE=single --env SCENARIO_VUS=100 --env API_TOKEN=your_token_here k6-tests/load-test.js
```

### ขั้นตอนที่ 4 — Stage Test แบบไต่โหลด
```powershell
k6 run --env TEST_MODE=stage k6-tests/load-test.js
```

> หมายเหตุ: ถ้าใช้ `npm run dev` ของ Strapi ไม่ควรใช้ `--out json=k6-tests/results.json`
> เพราะ k6 จะเขียนไฟล์ตลอดเวลาระหว่างทดสอบ ทำให้ Strapi dev watcher reload server กลางคันได้
> ให้ใช้ไฟล์ summary ที่ script สร้างหลังจบรอบแทน

### ขั้นตอนที่ 5 — สร้างรายงานรวมสำหรับ Google Sheets
```powershell
node k6-tests/build-report.mjs
```

---

## 📊 Endpoints ที่ทดสอบ

| # | Method | Endpoint | หมายเหตุ |
|---|--------|----------|----------|
| 1 | GET | `/api/company?populate=*&locale=th` | ข้อมูลบริษัท |
| 2 | GET | `/api/marketing?populate=*&locale=th` | หน้า Marketing |
| 3 | GET | `/api/new-release?populate=*&locale=th` | New Release |
| 4 | PUT | `/api/company` | อัพเดตข้อมูล (ต้องมี API Token) |
| 5 | POST | `/api/auth/local` | Login |

---

## 📈 Load Profile

### Single Mode
| ช่วง | VUs | Duration |
|------|-----|----------|
| Ramp up | 0 → VUs ที่เลือก | 10s |
| Steady | VUs ที่เลือก | 60s |
| Cool down | VUs ที่เลือก → 0 | 10s |
| **รวมต่อรอบ** | | **~1 min 20 sec** |

### Stage Mode
| ช่วง | จาก → ถึง | Duration |
|------|-----------|----------|
| Ramp 1 | 0 → 10 | 1m |
| Ramp 2 | 10 → 50 | 2m |
| Ramp 3 | 50 → 100 | 3m |
| Cool down | 100 → 0 | 1m |
| **รวม** | | **~7 min** |

---

## ✅ Thresholds (เกณฑ์ผ่าน/ไม่ผ่าน)

| Metric | เกณฑ์ |
|--------|--------|
| `http_req_duration` p95 | < 2000ms |
| `http_req_failed` rate | < 5% |
| GET endpoints p95 | < 1500ms |
| PUT p95 | < 3000ms |
| POST auth p95 | < 2000ms |

---

## 📋 Google Sheets — วิธี Import ผล

1. เปิด Google Sheets ใหม่
2. Import `results/k6/report-overall.csv` สำหรับกราฟภาพรวม 10, 50, 100 VUs
3. Import `results/k6/report-endpoints.csv` สำหรับกราฟแยก endpoint
4. สร้าง Chart:
   - X-axis: `vus`
   - Series: `avg_ms`, `p95_ms`, `requests_per_second`
   - Breakdown สำหรับ endpoint: `method` + `endpoint`
5. ถ้าจะดู stage test ให้ใช้ `results/k6/results-stage-summary.json` และ `results/k6/results-stage.csv`

---

## 📁 ไฟล์ที่เกี่ยวข้อง

```
results/k6/
├── config.js              ← ค่า config, token, stages
├── load-test.js           ← script หลัก
├── README.md              ← ไฟล์นี้
├── build-report.mjs       ← รวมผล 10/50/100 เป็น CSV + Markdown
├── results-10vus.csv      ← endpoint summary ของ 10 VUs
├── results-50vus.csv      ← endpoint summary ของ 50 VUs
├── results-100vus.csv     ← endpoint summary ของ 100 VUs
├── results-stage-summary.json ← raw summary ของ stage test
├── results-stage.csv      ← endpoint summary ของ stage test
├── report-overall.csv     ← ตารางรวมสำหรับกราฟภาพรวม
├── report-endpoints.csv   ← ตารางรวมสำหรับกราฟราย endpoint
└── LOAD_TEST_SUMMARY.md   ← สรุปผลและข้อเสนอแนะ
```
