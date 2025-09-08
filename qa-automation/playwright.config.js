import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  timeout: 120000,
  reporter: 'html',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Global setup for authentication
  globalSetup: './global-setup.js',
  
  webServer: [
    {
      command: 'cd ../client && REACT_APP_API_URL=http://localhost:5001/api npm start',
      port: 3000,
      reuseExistingServer: true,
    },
    {
      command: 'cd ../server && PORT=5001 DISABLE_CORS=true npm run dev',
      port: 5001,
      reuseExistingServer: true,
      env: {
        PORT: '5001',
        DISABLE_CORS: 'true',
      },
    },
  ],
});