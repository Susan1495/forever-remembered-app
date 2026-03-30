process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://pwncmufflmxehjdrhfyn.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_TMQit2z0vpoPZGdzCKIrCA_il9u9-zN'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_fyhwPfe50bOCTkO_RxfSgA_6UyGTGLw'

import puppeteer from 'puppeteer'

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu'],
  })
  const page = await browser.newPage()
  const html = `<!DOCTYPE html><html><head><style>body{background:#FFF8F0;font-family:Georgia,serif;}</style></head>
<body><h1>Test Memorial Card</h1><p>Margaret Johnson</p></body></html>`
  
  await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 10000 })
  const pdf = await page.pdf({ width: '595px', height: '842px', printBackground: true })
  await browser.close()
  console.log(`✓ Basic PDF: ${(pdf.length/1024).toFixed(1)} KB`)
  console.log('✅ Puppeteer is working')
}
main().catch(e => { console.error('❌', e.message); process.exit(1) })
