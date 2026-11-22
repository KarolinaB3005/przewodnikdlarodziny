// Konfiguracja testów Playwright dla aplikacji w jednym pliku index.html.
const { defineConfig, devices } = require('@playwright/test');

const chromePath = process.env.CHROME_PATH; // opcjonalnie: własna przeglądarka

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30_000,
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    acceptDownloads: true,
    launchOptions: chromePath ? { executablePath: chromePath } : {},
  },
  projects: [
    { name: 'laptop', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 860 } } },
    { name: 'telefon', use: { ...devices['Pixel 7'] }, testMatch: /ui\.spec\.js/ },
  ],
});
