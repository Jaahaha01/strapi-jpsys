# Strapi JpSys

Strapi v5 project for the JpSys internship. This repo serves localized content pages, auto-translates supported fields, and includes dedicated load and end-to-end test suites.

## Setup & Quick Start (สำหรับเครื่องใหม่)

เมื่อดาวน์โหลดโค้ดมาจาก GitHub เป็นครั้งแรก สามารถติดตั้งระบบทั้งหมด (Strapi, Playwright, และ k6) ได้ง่ายๆ ด้วยคำสั่งเดียว:

### วิธีที่ 1: ติดตั้งทุกอย่างอัตโนมัติ (แนะนำสำหรับ Windows ✅)
เปิด PowerShell ในฐานะ Administrator ที่โฟลเดอร์โปรเจกต์นี้ แล้วรันสคริปต์ setup:
```powershell
.\setup.ps1
```
*สคริปต์นี้จะติดตั้ง **k6**, โหลด **dependencies** ทั้งหมด และดาวน์โหลด **Playwright browsers** ให้เสร็จสรรพในขั้นตอนเดียว! หลังจากรันเสร็จ ให้ปิดและเปิด Terminal หรือ VS Code ใหม่อีกครั้ง*

### วิธีที่ 2: ติดตั้งผ่าน npm (สำหรับผู้ที่มี k6 แล้ว หรือใช้ macOS/Linux)
```bash
# 1. ติดตั้ง dependencies และ Playwright browsers
npm run setup

# 2. ปรับปรุงไฟล์ .env
cp .env.example .env
```

---

## Quick Start (ขั้นตอนเริ่มใช้งานปกติ)

1. แก้ไขรายละเอียดคีย์ในไฟล์ `.env`
2. เริ่มต้นระบบ Strapi:
   ```bash
   npm run dev
   ```
3. เปิดหน้าจัดการระบบที่ `http://localhost:1337/admin`


## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Strapi in development mode. |
| `npm run develop` | Alias for `npm run dev`. |
| `npm run start` | Start Strapi in production mode. |
| `npm run build` | Build the admin panel. |
| `npm run console` | Open the Strapi console. |
| `npm run deploy` | Deploy with Strapi Cloud tooling. |
| `npm run upgrade` | Upgrade to the latest Strapi version. |
| `npm run upgrade:dry` | Preview an upgrade without changing files. |

## Repository Layout

| Path | Purpose |
| --- | --- |
| `src/` | App code, content types, bootstrap logic, and utilities. |
| `config/` | Strapi runtime configuration. |
| `database/` | Database-related configuration and generated data. |
| `e2e-tests/` | Playwright test project. |
| `k6-tests/` | k6 load test project and report generator. |
| `results/` | Generated outputs for k6 and Playwright. Ignored by git. |
| `public/` | Public assets served by Strapi. |
| `dist/` | Build output. |

## What This App Does

- Creates the locales `en`, `th`, and `ja` during bootstrap.
- Grants public `find` and `findOne` permissions for API content types.
- Registers an auto-translation middleware for localized documents.
- Silences a few Strapi admin feature-detection 404s so the browser console stays clean.
- Caps `sharp` memory and concurrency during bootstrap to reduce image-processing spikes.

## Content Model

All content types in `src/api` are `singleType`, localized, and draft-and-publish enabled.

| Content type | Display name | Main idea |
| --- | --- | --- |
| `company` | Company | Company hero, about, and info sections. |
| `contact` | Contact | Contact form copy and office contact details. |
| `e-tax` | ETax | E-tax landing page content, benefits, pricing, and explanatory sections. |
| `homepage` | Homepage | Home hero content and service items. |
| `it-system` | ItSystem | IT products, service items, and features. |
| `marketing` | Marketing | Marketing landing content, cards, and social icons. |
| `my-log-star` | MyLogStar | Hero content, video, feature blocks, and accordion items. |
| `new-release` | New Release | Release/news content with cards and supporting copy. |

Shared repeatable structures live in `src/components/shared/`.

## Runtime Behavior

### Bootstrap

`src/utils/setup.ts` runs during bootstrap and:

- Adds the locales `en`, `th`, and `ja` if they do not already exist.
- Grants public read access for every `api::` content type.
- Optionally creates a webhook when these env vars are set:
  - `FRONTEND_WEBHOOK_URL`
  - `FRONTEND_WEBHOOK_SECRET`
  - `FRONTEND_WEBHOOK_NAME`

### Auto Translation

`src/utils/auto-translate.ts` runs after localized documents are created, updated, or published.

Supported providers in the current code:

- Microsoft Translator
- Google Translate
- LibreTranslate
- MyMemory
- DeepL

Useful env vars:

- `AUTO_TRANSLATE_ENABLED`
- `AUTO_TRANSLATE_PROVIDER`
- `AUTO_TRANSLATE_TARGET_LOCALES`
- `AUTO_TRANSLATE_BACKGROUND`
- `MICROSOFT_TRANSLATOR_API_KEY`
- `MICROSOFT_TRANSLATOR_REGION`
- `GOOGLE_TRANSLATE_API_KEY`
- `LIBRETRANSLATE_URL`
- `LIBRETRANSLATE_API_KEY`
- `MYMEMORY_EMAIL`
- `DEEPL_API_KEY`

The middleware translates localized `string`, `text`, and `richtext` fields, skips technical fields such as URLs and emails, and leaves media, relations, and passwords alone.

Note: the current runtime code does not use `OPENAI_API_KEY`.

## Testing

### k6 Load Testing

The k6 suite lives in `k6-tests/` and supports two modes:
- **Single Mode (Default):** Runs separate runs for `10`, `50`, and `100` VU comparisons.
- **Stage Mode:** Runs a ramp profile from `0 -> 10 -> 50 -> 100 -> 0` VUs.

Common commands (Run from the root directory):

```powershell
# 1. Run standard VU comparison tests
k6 run --env SCENARIO_VUS=10  k6-tests/load-test.js
k6 run --env SCENARIO_VUS=50  k6-tests/load-test.js
k6 run --env SCENARIO_VUS=100 k6-tests/load-test.js

# 2. (Optional) Run stage test
k6 run --env TEST_MODE=stage k6-tests/load-test.js

# 3. Generate summary reports
node k6-tests/build-report.mjs
```

Relevant env vars:
- `BASE_URL`, `API_TOKEN`, `TEST_EMAIL`, `TEST_PASSWORD`, `TEST_MODE`, `SCENARIO_VUS`

Outputs are written to `results/k6/`, including:
- `report-overall.csv` & `report-endpoints.csv`
- `LOAD_TEST_SUMMARY.md` & `LOAD_TEST_STAGE_SUMMARY.md`
- `results-*.csv` & `results-*-summary.json`

### Playwright E2E

The Playwright project lives in `e2e-tests/`.

Configured browser projects: Chromium, Firefox, WebKit.

Common commands (Run from the `e2e-tests` directory):

```powershell
cd e2e-tests

# Run only the core admin journey tests in Chromium, in headed mode (Recommended ✅)
npx playwright test admin-journeys --project=chromium --headed

# Run all tests on all browsers (headless)
npx playwright test

# Run Playwright UI mode
npx playwright test --ui
```

> 💡 **Command Explanation:**
> * `admin-journeys` targets the core flow test (`admin-journeys.spec.ts`) which validates standard operations like login, creation, editing, and deletion.
> * `--project=chromium` limits execution to Chromium to save time and resources.
> * `--headed` launches the visual browser window so you can watch the test interact with the Strapi admin panel in real-time.

Playwright writes its HTML report and trace artifacts to `results/e2e/`.

## Results Folder

`results/` is treated as generated output and is ignored by git. It contains the generated CSV exports, Markdown summaries, and Playwright HTML reports/traces.

## Environment

The project expects Node.js `>=20` and `<=24.x.x`.

The key Strapi env values come from `.env.example`, including:
- `HOST`, `PORT`, `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET`, `ENCRYPTION_KEY`

## Notes

- The content model and the Playwright journeys are intentionally tied to the current code in `src/api` and `e2e-tests/`.
- If you change content types, update the tests together so the repository stays consistent.
