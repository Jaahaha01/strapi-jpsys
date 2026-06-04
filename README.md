# Strapi JpSys

Strapi v5 project for the JpSys internship.  
ระบบจัดการเนื้อหาแบบ Localized (EN / TH / JA) พร้อมแปลอัตโนมัติ, Load Test (k6) และ End-to-End Test (Playwright)

---

## 📋 สารบัญ

- [Setup & Quick Start](#-setup--quick-start)
- [Scripts](#-scripts)
- [Repository Layout](#-repository-layout)
- [Content Model](#-content-model)
- [ฟีเจอร์: Auto Translate](#-ฟีเจอร์-auto-translate)
- [ฟีเจอร์: Bootstrap Setup](#-ฟีเจอร์-bootstrap-setup)
- [ฟีเจอร์: Admin 404 Silencer](#-ฟีเจอร์-admin-404-silencer)
- [Testing: k6 Load Test](#-testing-k6-load-test)
- [Testing: Playwright E2E](#-testing-playwright-e2e)
- [Environment Variables](#-environment-variables)
- [Troubleshooting](#-troubleshooting)

---

## 🚀 Setup & Quick Start

### วิธีที่ 1: ติดตั้งทุกอย่างอัตโนมัติ (แนะนำสำหรับ Windows ✅)

เปิด PowerShell ในฐานะ Administrator ที่โฟลเดอร์โปรเจกต์นี้ แล้วรัน:

```powershell
.\setup.ps1
```

> สคริปต์นี้จะ:
> 1. ติดตั้ง **k6** ผ่าน winget (ถ้ายังไม่มี)
> 2. ติดตั้ง **dependencies** ทั้งหมดของ Strapi
> 3. ติดตั้ง **Playwright browsers** สำหรับ E2E test
>
> ⚠️ หลังรันเสร็จ ให้ **ปิดและเปิด Terminal / VS Code ใหม่** เพื่อให้คำสั่ง `k6` ทำงานได้

### วิธีที่ 2: ติดตั้งผ่าน npm (สำหรับผู้ที่มี k6 แล้ว หรือใช้ macOS/Linux)

```bash
# 1. ติดตั้ง dependencies + Playwright browsers
npm run setup

# 2. สร้างไฟล์ .env
cp .env.example .env
```

### เริ่มใช้งาน Strapi

```bash
# แก้ไข .env ให้ตรงกับค่าของคุณก่อน แล้วรัน:
npm run dev
```

เปิดหน้าจัดการที่ `http://localhost:1337/admin`

---

## 📜 Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Strapi in development mode (hot-reload) |
| `npm run develop` | Alias for `npm run dev` |
| `npm run start` | Start Strapi in production mode **(ใช้ตอนรันเทส)** |
| `npm run build` | Build the admin panel |
| `npm run setup` | ติดตั้ง dependencies ทั้ง root + e2e + Playwright browsers |
| `npm run console` | Open the Strapi console |
| `npm run deploy` | Deploy with Strapi Cloud tooling |
| `npm run upgrade` | Upgrade to the latest Strapi version |
| `npm run upgrade:dry` | Preview an upgrade without changing files |

---

## 📁 Repository Layout

```
strapi-jpsys/
├── src/
│   ├── index.ts                 ← Register + Bootstrap entry point
│   ├── utils/
│   │   ├── auto-translate.ts    ← ระบบแปลอัตโนมัติ (5 providers)
│   │   └── setup.ts             ← สร้าง Locales, Permissions, Webhooks
│   ├── api/                     ← Content Types (8 single-type APIs)
│   ├── components/shared/       ← Shared repeatable components
│   ├── admin/                   ← Admin panel customization
│   └── extensions/              ← Strapi plugin extensions
├── config/                      ← Strapi runtime configuration
├── database/                    ← Database config & generated data
├── e2e-tests/                   ← Playwright E2E test project
│   ├── tests/
│   │   ├── admin-journeys.spec.ts   ← เทสหลัก (Login, Create, Edit, Delete)
│   │   └── example.spec.ts          ← ตัวอย่าง Playwright เบื้องต้น
│   └── playwright.config.ts
├── k6-tests/                    ← k6 Load test project
│   ├── load-test.js             ← Script หลัก
│   ├── config.js                ← ค่า config (token, stages, thresholds)
│   └── build-report.mjs         ← สร้าง summary จาก JSON results
├── results/                     ← Generated output (git-ignored)
│   ├── e2e/                     ← Playwright HTML report + traces
│   └── k6/                      ← CSV exports + Markdown summaries
├── setup.ps1                    ← Windows auto-setup script
├── .env.example                 ← ตัวอย่าง environment variables
└── package.json
```

---

## 📦 Content Model

Content types ทั้งหมดอยู่ใน `src/api/` เป็น **Single Type**, localized, draft-and-publish enabled

| Content Type | Display Name | Main Idea |
| --- | --- | --- |
| `company` | Company | Company hero, about, and info sections |
| `contact` | Contact | Contact form copy and office contact details |
| `e-tax` | ETax | E-tax landing page, benefits, pricing, explanatory sections |
| `homepage` | Homepage | Home hero content and service items |
| `it-system` | ItSystem | IT products, service items, and features |
| `marketing` | Marketing | Marketing landing content, cards, social icons |
| `my-log-star` | MyLogStar | Hero content, video, feature blocks, accordion items |
| `new-release` | New Release | Release/news content with cards and supporting copy |

> Shared repeatable structures อยู่ใน `src/components/shared/`

---

## 🌐 ฟีเจอร์: Auto Translate

**ไฟล์:** `src/utils/auto-translate.ts`

ระบบแปลเนื้อหาอัตโนมัติเมื่อ **สร้าง / แก้ไข / Publish** เอกสาร Localized จาก locale หลัก (`en`) ไปยัง locale อื่น (`th`, `ja`)

### วิธีทำงาน

1. เมื่อผู้ใช้แก้ไขเนื้อหาใน locale `en` → ระบบจะ **อ่านฟิลด์ที่แปลได้** (`string`, `text`, `richtext`, `blocks`)
2. **ข้ามฟิลด์ทางเทคนิค** เช่น URL, email, phone, videoId, slug — ไม่แปล
3. **ข้ามฟิลด์ที่ไม่ใช่ข้อความ** เช่น media, relation, password
4. ส่งข้อความทั้งหมดไปแปลผ่าน provider ที่เลือก
5. เขียนผลแปลกลับเข้า Strapi ใน locale เป้าหมาย (เช่น `th`, `ja`)
6. หากใช้ `publish` action → ระบบจะ auto-publish locale เป้าหมายด้วย

### ตั้งค่าเปิดใช้

เพิ่มใน `.env`:

```env
AUTO_TRANSLATE_ENABLED=true
AUTO_TRANSLATE_PROVIDER=deepl          # deepl | microsoft | google | libretranslate | mymemory
AUTO_TRANSLATE_TARGET_LOCALES=th,ja    # (optional) จำกัด locale เป้าหมาย
AUTO_TRANSLATE_BACKGROUND=true         # (optional) แปลแบบ async ไม่ block UI
DEEPL_API_KEY=your-key-here            # ตั้ง key ตาม provider ที่เลือก
```

## ⚙️ ฟีเจอร์: Bootstrap Setup

**ไฟล์:** `src/utils/setup.ts`

รันอัตโนมัติตอน Strapi เริ่มทำงาน (bootstrap phase):

1. **สร้าง Locales** — เพิ่ม `en`, `th`, `ja` ถ้ายังไม่มี
2. **เปิด Public Permissions** — ให้สิทธิ์ `find` + `findOne` สำหรับทุก API content type
3. **สร้าง Webhook** (optional) — ถ้าตั้ง `FRONTEND_WEBHOOK_URL` ไว้ จะสร้าง webhook สำหรับแจ้ง Next.js ให้ clear cache เมื่อเนื้อหาเปลี่ยน

### Webhook Env Vars

```env
FRONTEND_WEBHOOK_URL=https://your-frontend.com/api/revalidate
FRONTEND_WEBHOOK_SECRET=your-secret
FRONTEND_WEBHOOK_NAME=Nextjs Clear Cache   # (optional, default)
```

---

## 🔇 ฟีเจอร์: Admin 404 Silencer

**ไฟล์:** `src/index.ts` (register phase)

Strapi admin panel จะเรียก endpoint เหล่านี้เพื่อเช็คว่ามี Enterprise Edition features หรือไม่:
- `/content-manager/preview/url/…`
- `/i18n/ai-localization-jobs/…`
- `/admin/ai-feature-config`

ปกติจะ return 404 และแสดง error ใน browser console → middleware นี้จะ return `{ data: null }` พร้อม status 200 แทน เพื่อให้ console สะอาด โดยไม่กระทบการทำงาน

---

## 🚀 Testing: k6 Load Test

### ติดตั้ง k6

```powershell
# Windows (winget)
winget install k6 --source winget

# ตรวจสอบ
k6 version
```

> หรือใช้ `.\setup.ps1` ซึ่งจะติดตั้งให้อัตโนมัติ

### เตรียม API Token

สร้างจาก Strapi Admin → Settings → API Tokens → "Full Access"  
แก้ค่าใน `k6-tests/config.js` หรือส่งเป็น env:

```powershell
k6 run --env API_TOKEN="your_token_here" k6-tests/load-test.js
```

### รัน Load Test

> ⚠️ **ต้องใช้ `npm run start`** (ไม่ใช่ `dev`) เพราะ dev จะ restart ตอน k6 เขียนไฟล์ผลลัพธ์

**ขั้นตอนที่ 1 — เปิด Strapi (Terminal 1)**

```powershell
npm run build   # ครั้งแรก หรือหลังแก้โค้ด
npm run start
```

**ขั้นตอนที่ 2 — รัน k6 (Terminal 2)**

```powershell
# Standard VU comparison tests
k6 run --env SCENARIO_VUS=10  k6-tests/load-test.js
k6 run --env SCENARIO_VUS=50  k6-tests/load-test.js
k6 run --env SCENARIO_VUS=100 k6-tests/load-test.js
```

```powershell
# Smoke test (ลองเร็วๆ 1 VU)
k6 run --vus 1 --duration 15s k6-tests/load-test.js
```

```powershell
# Stage test (ไต่ขั้นอัตโนมัติ 0→10→50→100→0)
k6 run --env TEST_MODE=stage k6-tests/load-test.js
```

### สร้าง Report

```powershell
node k6-tests/build-report.mjs
```

> **เงื่อนไขสำคัญ:**
> 1. ต้องรัน Full Test (10, 50, 100 VUs) ให้ครบก่อนอย่างน้อยรอบละ 1 ครั้ง
> 2. หากต้องการ `LOAD_TEST_STAGE_SUMMARY.md` ต้องรัน Stage test ก่อน

**ไฟล์ที่ได้หลังสร้าง report:**

| ไฟล์ | คำอธิบาย |
| --- | --- |
| `results/k6/report-endpoints.csv` | CSV แยกรายละเอียดความเร็วราย Endpoint |
| `results/k6/report-overall.csv` | CSV สรุปรวมเปรียบเทียบแต่ละ VU Level |
| `results/k6/LOAD_TEST_SUMMARY.md` | รายงานสรุปผลภาพรวม Markdown |
| `results/k6/LOAD_TEST_STAGE_SUMMARY.md` | สรุปผล Stage test *(ถ้ารันก่อนสร้าง report)* |

### Endpoints ที่ทดสอบ

| Method | Endpoint | หมายเหตุ |
| --- | --- | --- |
| GET | `/api/company?populate=*&locale=th` | Public |
| GET | `/api/marketing?populate=*&locale=th` | Public |
| GET | `/api/new-release?populate=*&locale=th` | Public |
| PUT | `/api/company` | ต้องมี API Token |
| POST | `/api/auth/local` | Login |

### Thresholds

| Metric | เกณฑ์ |
| --- | --- |
| `http_req_duration` p95 | < 2000ms |
| `http_req_failed` rate | < 5% |
| GET endpoints p95 | < 1500ms |
| PUT endpoint p95 | < 3000ms |
| POST auth p95 | < 2000ms |

---

## 🎭 Testing: Playwright E2E

### เตรียมเครื่อง

> ⚠️ **ต้องใช้ `npm run start`** (ไม่ใช่ `dev`) เพราะ dev มี hot-reload ที่จะ restart Strapi ระหว่าง test

**Terminal 1 — Build & Start Strapi**

```powershell
npm run build
npm run start
```

> รอจนเห็น `Strapi started successfully` แล้วค่อยไปขั้นตอนต่อไป

**Terminal 2 — ติดตั้ง Dependencies (ครั้งแรกครั้งเดียว)**

```powershell
cd e2e-tests
npm install
npx playwright install
```

### รัน E2E Tests

```powershell
cd e2e-tests

# แนะนำ ✅ — รันแบบ Headed เฉพาะ Chromium (เร็ว + ดู debug ง่าย)
npx playwright test admin-journeys --project=chromium --headed

# รันทุกไฟล์ทุก browser → 18 tests
npx playwright test

# รันเฉพาะ admin-journeys ทุก browser → 12 tests
npx playwright test admin-journeys

# รันแบบ Headed (เห็นหน้าต่าง Browser)
npx playwright test admin-journeys --headed

# เปิด Playwright UI mode
npx playwright test --ui
```

> 💡 **`--headed`** เปิดหน้าต่าง browser จริงให้เห็น login, กดปุ่ม, สร้างข้อมูล ต่อหน้าต่อตา

### รันเฉพาะ Browser

```powershell
npx playwright test admin-journeys --project=chromium   # 4 tests
npx playwright test admin-journeys --project=firefox    # 4 tests
npx playwright test admin-journeys --project=webkit     # 4 tests (Safari)
```

### สรุปจำนวน Tests

| คำสั่ง | จำนวน |
| --- | --- |
| `npx playwright test` | 18 (ทุกไฟล์ × 3 browsers) |
| `npx playwright test admin-journeys` | 12 (4 journeys × 3 browsers) |
| `npx playwright test admin-journeys --project=chromium` | 4 |

### ดูผลรายงาน

```powershell
npx playwright show-report ..\results\e2e\playwright-report
```

> ถ้าขึ้น `EADDRINUSE` ให้ระบุ port อื่น:
> ```powershell
> npx playwright show-report ..\results\e2e\playwright-report --port 9324
> ```

### Credentials

ค่าเริ่มต้น Email/Password อยู่ใน `e2e-tests/tests/admin-journeys.spec.ts` บรรทัดบนสุด  
แก้ให้ตรงกับ account ของตัวเองก่อนรัน:

```ts
const ADMIN_EMAIL    = 'your@email.com';
const ADMIN_PASSWORD = 'your_password';
```

หรือใช้ Environment Variable (แนะนำ):

```powershell
# PowerShell
$env:ADMIN_EMAIL    = "your@email.com"
$env:ADMIN_PASSWORD = "your_password"
npx playwright test admin-journeys
```

---

## 🔑 Environment Variables

### Strapi Core

| Variable | Purpose |
| --- | --- |
| `HOST` | Strapi host (default: `0.0.0.0`) |
| `PORT` | Strapi port (default: `1337`) |
| `APP_KEYS` | Application keys |
| `API_TOKEN_SALT` | API token salt |
| `ADMIN_JWT_SECRET` | Admin JWT secret |
| `TRANSFER_TOKEN_SALT` | Transfer token salt |
| `JWT_SECRET` | JWT secret |
| `ENCRYPTION_KEY` | Encryption key |

### Auto Translate

| Variable | Purpose |
| --- | --- |
| `AUTO_TRANSLATE_ENABLED` | เปิด/ปิดระบบแปล (`true`/`false`) |
| `AUTO_TRANSLATE_PROVIDER` | เลือก provider: `deepl`|
| `AUTO_TRANSLATE_TARGET_LOCALES` | จำกัด locale เป้าหมาย เช่น `th,ja` |
| `AUTO_TRANSLATE_BACKGROUND` | แปลแบบ async (`true`/`false`) |
| `DEEPL_API_KEY` | DeepL API key |

### Webhook

| Variable | Purpose |
| --- | --- |
| `FRONTEND_WEBHOOK_URL` | URL ที่ Strapi จะ POST ไปเมื่อเนื้อหาเปลี่ยน |
| `FRONTEND_WEBHOOK_SECRET` | Bearer token สำหรับ webhook |
| `FRONTEND_WEBHOOK_NAME` | ชื่อ webhook (default: `Nextjs Clear Cache`) |

### k6 Load Test

| Variable | Purpose |
| --- | --- |
| `BASE_URL` | Strapi URL สำหรับ k6 |
| `API_TOKEN` | API token สำหรับ authenticated requests |
| `TEST_EMAIL` | Email สำหรับ login test |
| `TEST_PASSWORD` | Password สำหรับ login test |
| `TEST_MODE` | `single` (default) หรือ `stage` |
| `SCENARIO_VUS` | จำนวน VU: `10`, `50`, หรือ `100` |

---

## ❓ Troubleshooting

| สถานการณ์ | วิธีแก้ |
| --- | --- |
| `ERR_CONNECTION_REFUSED` | ยังไม่ได้ `npm run start` |
| Admin 404 / หน้าว่าง | ยังไม่ได้ `npm run build` ก่อน start |
| Strapi restart ระหว่าง test | ใช้ `npm run start` ไม่ใช่ `dev` |
| "No tests found" (Playwright) | ใช้ `/` แทน `\` ในชื่อไฟล์ |
| เทส flaky / ไม่แน่นอน | เพิ่ม `--headed` เพื่อดูว่า browser ทำอะไร |
| Port 9323 ถูกใช้ | เพิ่ม `--port 9324` ตอน show-report |
| Browser ไม่ถูกติดตั้ง | รัน `npx playwright install` อีกครั้ง |
| `k6` command not found | ปิด Terminal แล้วเปิดใหม่ หรือ `winget install k6` |
| k6 report error "file not found" | รัน Full Test (10, 50, 100 VUs) ให้ครบก่อน build report |
| Auto Translate ไม่ทำงาน | เช็ค `AUTO_TRANSLATE_ENABLED=true` และตั้ง API key ของ provider |

---

## 📝 Notes

- Content model และ Playwright journeys ผูกกับโค้ดใน `src/api/` → ถ้าเปลี่ยน content types ต้องอัปเดตเทสด้วย
- `results/` เป็น generated output ที่ถูก git-ignore
- Node.js version: `>=20` and `<=24.x.x`
