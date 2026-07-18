import { chromium } from 'playwright-core'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
const apiUrl = process.env.API_URL || 'http://localhost:8080/api'
const outputDirectory = path.resolve('artifacts/visual')
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

await mkdir(outputDirectory, { recursive: true })

const browser = await chromium.launch({ executablePath: chromePath, headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
page.on('response', (response) => {
  if (response.status() >= 500 && response.url().startsWith(baseUrl)) {
    errors.push(`${response.status()} ${response.url()}`)
  }
})

const loginResponse = await page.request.post(`${apiUrl}/auth/login`, {
  data: {
    email: process.env.ADMIN_EMAIL || 'admin@imaninvestment.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@123456',
  },
})
if (!loginResponse.ok()) throw new Error(`Admin login failed with ${loginResponse.status()}`)
const { token } = await loginResponse.json()
const authorization = { Authorization: `Bearer ${token}` }

const plans = await page.request.get(`${apiUrl}/admin/business-plans`, { headers: authorization }).then((response) => response.json())
const applicants = await page.request.get(`${apiUrl}/admin/applicants`, { headers: authorization }).then((response) => response.json())
const jobs = await page.request.get(`${apiUrl}/public/jobs`).then((response) => response.json())

const routes = [
  ['home', '/'],
  ['business-plan-submit', '/submit-business-plan'],
  ['careers', '/careers'],
  ...(jobs.content?.[0] ? [
    ['job-detail', `/careers/${jobs.content[0].slug}`],
    ['job-apply', `/careers/${jobs.content[0].slug}/apply`],
  ] : []),
  ['admin-dashboard', '/admin'],
  ['admin-business-plans', '/admin/business-plans'],
  ...(plans.content?.[0] ? [['admin-business-plan-detail', `/admin/business-plans/${plans.content[0].id}`]] : []),
  ['admin-applicants', '/admin/applicants'],
  ...(applicants.content?.[0] ? [['admin-applicant-detail', `/admin/applicants/${applicants.content[0].id}`]] : []),
  ['admin-jobs', '/admin/jobs'],
  ['admin-portfolio', '/admin/portfolio'],
]

await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })
await page.evaluate((value) => localStorage.setItem('iman_access_token', value), token)

for (const [name, route] of routes) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(800)
  if (!(await page.locator('#root').innerText()).trim()) errors.push(`Empty application root at ${route}`)
  await page.screenshot({ path: path.join(outputDirectory, `${name}.png`), fullPage: true })
}

await browser.close()

if (errors.length) {
  throw new Error(`Browser errors:\n${[...new Set(errors)].join('\n')}`)
}

console.log(`Captured ${routes.length} visual verification screenshots in ${outputDirectory}`)
