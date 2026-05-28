// ============================================================
// k6 Load Test — Config
// โปรเจกต์: strapi-jpsys (Internship Final Project)
// ============================================================

export const BASE_URL = 'http://localhost:1337';

// API Token จาก Strapi Admin → Settings → API Tokens
// สร้าง token ชื่อ "k6-load-test" แบบ Full Access แล้ว paste ที่นี่
export const API_TOKEN = __ENV.API_TOKEN || 'ec7a81bc9282fe3f00de7557122821faac557eba3e1ef4ba75fd6d4c91b8bd234cd3118c9d223ed0c7b274073876dd3aabb25c5346c43c2ee473baf45400bac5bfbbc21da179abd8b793cc623296a8d9cd56ec2679c3e7d6afb673b22f1503dd03f859fe0a9833593b107d7fda883e522f60084dc2c3200ac20b949e60071dc6';

// Test User สำหรับ POST /api/auth/local
export const TEST_USER = {
  identifier: __ENV.TEST_EMAIL || 'jaahaha10@gmail.com',
  password: __ENV.TEST_PASSWORD || 'Jaa02488',
};

// ============================================================
// Thresholds — เกณฑ์ที่ยอมรับได้
// ============================================================
export const THRESHOLDS = {
  // 95% ของ request ต้องเสร็จภายใน 2000ms
  http_req_duration: ['p(95)<2000'],
  // Error rate ต้องต่ำกว่า 5%
  http_req_failed: ['rate<0.05'],
};
export const STAGES = [
  { duration: '10s', target: 20 },  // ramp-up: 20 VUs ใน 10 วินาที
  { duration: '30s', target: 100 },  // sustain: คงที่ 100 VUs นาน 30 วินาที
  { duration: '10s', target: 0 },  // ramp-down: 0 VUs ใน 10 วินาที
];
