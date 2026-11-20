/**
 * iOS apple-touch-startup-image 생성기.
 * src/components/boot/pwaSplash.mjs 의 생성용 마크업(하트+타이틀, 화면 전체 기준 가운데)을
 * 기기 해상도별로 캡처한다.
 *
 * 실행: node scripts/generate-pwa-splash.mjs   (Playwright chromium 필요: npx playwright install chromium)
 * 출력: public/splash/{w}x{h}@{dpr}x.png
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import {
  PWA_SPLASH_CSS,
  PWA_SPLASH_DEVICES,
  PWA_SPLASH_HTML,
  pwaSplashImagePath,
} from '../src/components/boot/pwaSplash.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
await mkdir(path.join(root, 'public/splash'), { recursive: true })

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${PWA_SPLASH_CSS}</style></head><body>${PWA_SPLASH_HTML}</body></html>`

const browser = await chromium.launch()
// 단일 색 스플래시라 색 모드와 무관하게 기기당 한 장.
for (const d of PWA_SPLASH_DEVICES) {
  const page = await browser.newPage({
    viewport: { width: d.w, height: d.h },
    deviceScaleFactor: d.dpr,
    reducedMotion: 'reduce',
  })
  await page.setContent(html)
  const out = path.join(root, 'public', pwaSplashImagePath(d))
  await page.screenshot({ path: out, animations: 'disabled' })
  await page.close()
  console.log(path.relative(root, out))
}
await browser.close()
