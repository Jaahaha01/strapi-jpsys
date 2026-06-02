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

### ขั้นตอนที่ 1 — เปิด Strapi ก่อน

เปิด **Terminal 1** แล้วรัน:

```powershell
cd C:\JapanSys\strapi-jpsys
npm run dev
```

> รอจนเห็น `Server listening on: http://localhost:1337` แล้วค่อยไปขั้นตอนต่อไป

---

### ขั้นตอนที่ 2 — ติดตั้ง Dependencies (ครั้งแรกครั้งเดียว)

เปิด **Terminal 2** แล้วรัน:

```powershell
cd C:\JapanSys\strapi-jpsys\e2e-tests
npm install
npx playwright install
```

---

## ▶️ รันเทส

> ⚠️ **สำคัญ:** ใช้ `/` (slash) ไม่ใช่ `\` (backslash) ตอนระบุชื่อไฟล์ เพราะ Playwright อ่าน path แบบ regex

### รันทุกเทส (ทุก Browser)

```powershell
npx playwright test
```

---

### รันเฉพาะไฟล์ admin-journeys

```powershell
# ✅ แบบที่ถูก — ใช้ slash
npx playwright test tests/admin-journeys.spec.ts --project=chromium --workers=1

# ✅ หรือระบุแค่ชื่อก็พอ
npx playwright test admin-journeys --project=chromium --workers=1
```

> `--workers=1` จำเป็นสำหรับ `admin-journeys` เพราะ Journey ต้องรันต่อเนื่องกัน (Login → Create → Edit → Delete)

---

### รันแบบ Headed (เห็นหน้าต่าง Browser)

```powershell
npx playwright test admin-journeys --project=chromium --workers=1 --headed
```

---

### รันเฉพาะ Browser ใดบราวเซอร์หนึ่ง

```powershell
# Chromium เท่านั้น (แนะนำ — เร็วที่สุด)
npx playwright test --project=chromium

# Firefox
npx playwright test --project=firefox

# Safari (WebKit)
npx playwright test --project=webkit
```

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
npx playwright test admin-journeys --project=chromium --workers=1
```

```cmd
:: Windows CMD
set ADMIN_EMAIL=your@email.com
set ADMIN_PASSWORD=your_password
npx playwright test admin-journeys --project=chromium --workers=1
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
| เทสแดงทั้งหมด | ตรวจสอบว่า Strapi รันอยู่ที่ `http://localhost:1337` |
| "No tests found" | ใช้ `/` แทน `\` ในชื่อไฟล์ |
| เทส flaky / ไม่แน่นอน | เพิ่ม `--headed` เพื่อดูว่า browser ทำอะไร |
| Port 9323 ถูกใช้ | เพิ่ม `--port 9324` ตอน show-report |
| รัน serial ไม่ได้ | ใส่ `--workers=1` เสมอสำหรับ admin-journeys |
| Browser ไม่ถูกติดตั้ง | รัน `npx playwright install` อีกครั้ง |
