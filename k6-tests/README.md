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
# รันพร้อม export ผลเป็น JSON
k6 run --out json=k6-tests/results.json k6-tests/load-test.js

# หรือส่ง API Token ผ่าน env variable
k6 run --env API_TOKEN=your_token_here --out json=k6-tests/results.json k6-tests/load-test.js
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

| ช่วง | VUs | Duration |
|------|-----|----------|
| Ramp up | 0 → 10 | 30s |
| Steady | 10 | 60s |
| Cool down | 10 → 0 | 15s |
| Ramp up | 0 → 50 | 30s |
| Steady | 50 | 60s |
| Cool down | 50 → 0 | 15s |
| Ramp up | 0 → 100 | 30s |
| Steady | 100 | 60s |
| Cool down | 100 → 0 | 30s |
| **รวม** | | **~5 min 30 sec** |

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
2. สร้าง 3 แท็บ: **Raw Data**, **Graphs**, **ข้อเสนอแนะ**
3. Copy ตาราง CSV ที่ console แสดงหลังรันเสร็จ → Paste ใน Raw Data
4. สร้าง Chart: Insert → Chart → Bar chart
   - X-axis: Endpoint
   - Series: p95, Avg

---

## 📁 ไฟล์ที่เกี่ยวข้อง

```
k6-tests/
├── config.js              ← ค่า config, token, stages
├── load-test.js           ← script หลัก
├── README.md              ← ไฟล์นี้
└── results.json           ← ผลลัพธ์ (สร้างหลังรัน)
└── results-summary.json   ← สรุป JSON (สร้างหลังรัน)
```
