# k6 Load Test — Strapi JpSys API

> **Internship Final Project**  
> ทดสอบ Load บน Strapi API ด้วย k6 ที่ 10, 50, 100 VUs

---

## 📦 ติดตั้ง k6
# k6 Load Test — Strapi JpSys API

## ติดตั้ง k6 (สั้น ๆ)
- Windows (winget): `winget install k6 --source winget`
- หรือใช้ Chocolatey: `choco install k6`
- ตรวจสอบ: `k6 version`

## เตรียม API Token (ถ้าจำเป็น)
- สร้าง API Token จาก Strapi Admin (Settings → API Tokens) แล้วเก็บค่าไว้ใน `k6-tests/config.js` หรือส่งเป็น env `API_TOKEN` เวลารัน

## รันการทดสอบ (ตัวอย่าง)
1) เริ่ม Strapi: `cd c:\JapanSys\strapi-jpsys && npm run dev`
2) Smoke test: `k6 run --vus 1 --duration 15s k6-tests/load-test.js`
3) Full tests (รันแยกตาม VUs เพื่อเปรียบเทียบ):
   - `k6 run --env TEST_MODE=single --env SCENARIO_VUS=10 k6-tests/load-test.js`
   - `k6 run --env TEST_MODE=single --env SCENARIO_VUS=50 k6-tests/load-test.js`
   - `k6 run --env TEST_MODE=single --env SCENARIO_VUS=100 k6-tests/load-test.js`
4) Stage test: `k6 run --env TEST_MODE=stage k6-tests/load-test.js`

หมายเหตุ: อย่าใช้ `--out json=...` ขณะรันกับ Strapi ในโหมด dev เพราะไฟล์ผลที่เขียนบ่อยอาจกระตุ้นการ reload ของ dev server

## Endpoints ที่ทดสอบ (ย่อ)
- GET `/api/company?populate=*&locale=th`
- GET `/api/marketing?populate=*&locale=th`
- GET `/api/new-release?populate=*&locale=th`
- PUT `/api/company` (ต้องมี API Token)
- POST `/api/auth/local` (login)

## Load profiles (ย่อ)
- Single mode: ramp up 10s, steady 60s, cool down 10s (รวม ≈ 1m20s)
- Stage mode: ตัวอย่างไต่จาก 0→10→50→100 แล้ว cool down (รวม ≈ 7m)

## Thresholds (ตัวอย่าง)
- `http_req_duration` p95 < 2000ms
- `http_req_failed` rate < 5%
- GET endpoints p95 < 1500ms
- PUT p95 < 3000ms

## ไฟล์สำคัญ
- `k6-tests/load-test.js` — script หลัก
- `k6-tests/config.js` — ค่า config (token, stages)