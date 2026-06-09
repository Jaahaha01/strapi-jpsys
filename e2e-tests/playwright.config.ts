import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Increase global timeout for Strapi which can be slow to respond */
  timeout: 90000,
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only — retry 1 time locally to handle webkit flakiness */
  retries: process.env.CI ? 2 : 1,
  /* Always use 1 worker to prevent race conditions in serial journeys */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html', { outputFolder: '../results/e2e/playwright-report' }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    // baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Give Strapi's React SPA enough time to render */
    navigationTimeout: 60000,

    /* Max time for each click/fill/etc. action */
    actionTimeout: 30000,

    /* Slow down all browsers for a smooth, presentable demo pace */
    launchOptions: {
      slowMo: 500, // ชะลอทุก action 500ms ทุก browser ให้ดูสมูท
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        /* WebKit (Safari engine) needs extra time and slower interactions
           to handle Strapi's React SPA correctly */
        navigationTimeout: 90000,
        actionTimeout: 45000,
        launchOptions: {
          slowMo: 500, // ชะลอทุก action 500ms เฉพาะ WebKit
        },
      },
    },
  ],

  /* Store test artifacts under results/e2e to keep the repo tidy. */
  outputDir: '../results/e2e/test-results',

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
