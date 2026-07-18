import { chromium } from 'playwright-core'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
const apiUrl = process.env.API_URL || 'http://localhost:8080/api'
const outputDirectory = path.resolve('artifacts/visual/responsive')
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const viewports = [
  ['tablet', { width: 768, height: 1024 }],
  ['mobile', { width: 390, height: 844 }],
]

await mkdir(outputDirectory, { recursive: true })

const browser = await chromium.launch({ executablePath: chromePath, headless: true })
const errors = []
const bootstrap = await browser.newPage()
const loginResponse = await bootstrap.request.post(`${apiUrl}/auth/login`, {
  data: {
    email: process.env.ADMIN_EMAIL || 'admin@imaninvestment.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@123456',
  },
})
if (!loginResponse.ok()) throw new Error(`Admin login failed with ${loginResponse.status()}`)
const { token } = await loginResponse.json()
const authorization = { Authorization: `Bearer ${token}` }

const plans = await bootstrap.request.get(`${apiUrl}/admin/business-plans`, { headers: authorization }).then((response) => response.json())
const applicants = await bootstrap.request.get(`${apiUrl}/admin/applicants`, { headers: authorization }).then((response) => response.json())
const jobs = await bootstrap.request.get(`${apiUrl}/public/jobs`).then((response) => response.json())
await bootstrap.close()

const routes = [
  ['home', '/'],
  ['business-plan-submit', '/submit-business-plan'],
  ['careers', '/careers'],
  ...(jobs.content?.[0] ? [['job-apply', `/careers/${jobs.content[0].slug}/apply`]] : []),
  ['admin-dashboard', '/admin'],
  ...(plans.content?.[0] ? [['admin-business-plan-detail', `/admin/business-plans/${plans.content[0].id}`]] : []),
  ...(applicants.content?.[0] ? [['admin-applicant-detail', `/admin/applicants/${applicants.content[0].id}`]] : []),
]

let captured = 0
for (const [label, viewport] of viewports) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 2 })
  page.on('pageerror', (error) => errors.push(`${label}: ${error.message}`))
  page.on('response', (response) => {
    if (response.status() >= 500 && response.url().startsWith(baseUrl)) {
      errors.push(`${label}: ${response.status()} ${response.url()}`)
    }
  })
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })
  await page.evaluate((value) => localStorage.setItem('iman_access_token', value), token)

  for (const [name, route] of routes) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(700)
    const text = (await page.locator('#root').innerText()).trim()
    if (!text) errors.push(`${label}: empty root at ${route}`)
    await page.screenshot({ path: path.join(outputDirectory, `${name}-${label}.png`), fullPage: true })
    captured += 1
  }
  await page.close()
}

await browser.close()

if (errors.length) {
  throw new Error(`Responsive verification failed:\n${[...new Set(errors)].join('\n')}`)
}

console.log(`Captured ${captured} responsive screenshots in ${outputDirectory}`)
