# 🎭 E2E Tests — Playwright

> ชุดทดสอบแบบ End-to-End สำหรับ Strapi Admin  
> รัน Journeys จริง: **Login → Create → Edit → Delete → Logout**

---

## 📋 สารบัญ

- [เตรียมเครื่อง](#-เตรียมเครื่อง)
- [รันเทส](#-รันเทส)
- [ดูผลรายงาน](#-ดูผลรายงาน)
- [Credentials / Env](#-credentials--env)
- [โครงสร้างโฟลเดอร์](#-โครงสร้างโฟลเดอร์)
- [เคล็ดลับ](#-เคล็ดลับ)

---

## ⚙️ เตรียมเครื่อง

### ขั้นตอนที่ 1 — Build และ Start Strapi

> ⚠️ **ต้องใช้ `npm run start` เท่านั้น** (ไม่ใช่ `dev`) เพราะ `dev` มี hot-reload ที่จะ restart Strapi ระหว่าง test ทำให้ test พัง

เปิด **Terminal 1** แล้วรัน:

```powershell
cd C:\JapanSys\strapi-jpsys

# Build admin panel (ครั้งแรก หรือหลังแก้โค้ด)
npm run build

# Start Strapi แบบ production (ไม่มี hot-reload)
npm run start
```

> รอจนเห็น `Strapi started successfully` แล้วค่อยไปขั้นตอนต่อไป

---

### ขั้นตอนที่ 2 — ติดตั้ง Dependencies (ครั้งแรกครั้งเดียว)

เปิด **Terminal 2** แล้วรัน:

```powershell
cd C:\JapanSys\strapi-jpsys\e2e-tests
npm install
npx playwright install
```

---

### รันทุกเทส (คำสั่งพื้นฐาน)

```powershell
# รันทุกไฟล์ทุก browser → 18 tests (admin-journeys 12 + example 6)
npx playwright test
```
### รันเฉพาะไฟล์ admin-journeys (แนะนำ ✅)

```powershell
# 12 tests (4 journeys × 3 browsers)
npx playwright test tests/admin-journeys.spec.ts

# ระบุแค่ชื่อก็ได้
npx playwright test admin-journeys
```

### รันแบบ Headed (เห็นหน้าต่าง Browser)

```powershell
npx playwright test admin-journeys --headed
```

### รันแบบ Headed เฉพาะ Browser เดียว (เร็ว + ดู debug ง่าย)

```powershell
# เปิดหน้าต่าง Chromium ให้ดูเห็นจริงๆ ว่า test กดอะไร ไปหน้าไหน — 4 tests
npx playwright test admin-journeys --project=chromium --headed
```

> 💡 เหมาะสำหรับ debug: เห็น browser เปิดขึ้นมาจริง กรอก login กดปุ่ม สร้างข้อมูล ลบข้อมูล ต่อหน้าต่อตา
### รันเฉพาะ Browser ใดบราวเซอร์หนึ่ง

```powershell
# Chromium — 4 tests
npx playwright test admin-journeys --project=chromium

# Firefox — 4 tests
npx playwright test admin-journeys --project=firefox

# WebKit (Safari) — 4 tests
npx playwright test admin-journeys --project=webkit
```

> **สรุปจำนวน test:**
> | คำสั่ง | จำนวน |
> |---|---|
> | `npx playwright test` | 18 (ทุกไฟล์ × 3 browsers) |
> | `npx playwright test admin-journeys` | 12 (4 journeys × 3 browsers) |
> | `npx playwright test admin-journeys --project=chromium` | 4 |

---

## 📊 ดูผลรายงาน

หลังรันเทสเสร็จ ไฟล์ report จะอยู่ที่:

```
results/e2e/playwright-report/index.html
```

เปิดด้วยคำสั่ง:

```powershell
npx playwright show-report ..\results\e2e\playwright-report
```

> ถ้าขึ้น `EADDRINUSE` ให้ระบุ port อื่น:
> ```powershell
> npx playwright show-report ..\results\e2e\playwright-report --port 9324
> ```

---

## 🔐 Credentials / Env

ค่าเริ่มต้น Email/Password ตั้งไว้ใน `tests/admin-journeys.spec.ts` บรรทัดบนสุด  
แก้ให้ตรงกับ account ของตัวเองก่อนรัน:

```ts
const ADMIN_EMAIL    = 'your@email.com';
const ADMIN_PASSWORD = 'your_password';
```

หรือจะใช้ Environment Variable แทนการ hardcode (แนะนำ):

```powershell
# Windows PowerShell
$env:ADMIN_EMAIL    = "your@email.com"
$env:ADMIN_PASSWORD = "your_password"
npx playwright test admin-journeys
```

```cmd
:: Windows CMD
set ADMIN_EMAIL=your@email.com
set ADMIN_PASSWORD=your_password
npx playwright test admin-journeys
```

---

## 📁 โครงสร้างโฟลเดอร์

```
e2e-tests/
├── tests/
│   ├── admin-journeys.spec.ts   ← เทสหลัก (Login, Create, Edit, Delete)
│   └── example.spec.ts          ← ตัวอย่าง Playwright เบื้องต้น
├── playwright.config.ts         ← config (browser, reporter, outputDir)
├── tsconfig.json                ← TypeScript config สำหรับโฟลเดอร์นี้
└── package.json
```

**Output ที่ generate ออกมา:**

```
results/e2e/
├── playwright-report/   ← HTML report (เปิดใน browser ได้)
└── test-results/        ← Screenshots, Traces, Videos
```

---

## 💡 เคล็ดลับ

| สถานการณ์ | วิธีแก้ |
|---|---|
| `ERR_CONNECTION_REFUSED` | ยังไม่ได้ `npm run start` |
| Admin 404 / Page ว่าง | ยังไม่ได้ `npm run build` ก่อน start |
| Strapi restart ระหว่าง test | ใช้ `npm run start` ไม่ใช่ `dev` |
| "No tests found" | ใช้ `/` แทน `\` ในชื่อไฟล์ |
| เทส flaky / ไม่แน่นอน | เพิ่ม `--headed` เพื่อดูว่า browser ทำอะไร |
| Port 9323 ถูกใช้ | เพิ่ม `--port 9324` ตอน show-report |
| Browser ไม่ถูกติดตั้ง | รัน `npx playwright install` อีกครั้ง |
