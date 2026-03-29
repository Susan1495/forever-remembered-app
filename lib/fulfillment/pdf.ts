/**
 * PDF Generation using Puppeteer
 *
 * Generates beautiful memorial PDFs by rendering HTML/CSS in a headless
 * browser and exporting to PDF. This approach enables rich typography,
 * gradients, and custom Google Fonts.
 *
 * Two exports:
 *   generateMemorialCard()    — 1-page portrait card (Keep tier)
 *   generateMemorialBook()    — 8-page A4 memorial book (Cherish tier)
 */

import type { Tribute, TributePhoto } from '@/lib/types'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatDateRange(tribute: Tribute): string {
  const birth = formatDate(tribute.birth_date)
  const death = formatDate(tribute.death_date)
  if (birth && death) return `${birth} – ${death}`
  if (birth) return `Born ${birth}`
  if (death) return `${death}`
  return ''
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength).trimEnd() + '…'
}

async function photoToDataUrl(cdnUrl: string): Promise<string> {
  try {
    const res = await fetch(cdnUrl)
    if (!res.ok) return ''
    const buffer = await res.arrayBuffer()
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const base64 = Buffer.from(buffer).toString('base64')
    return `data:${contentType};base64,${base64}`
  } catch {
    return ''
  }
}

// ── Memorial Card HTML (Keep tier — 1 page portrait) ──────────────────────────

function buildMemorialCardHtml(
  tribute: Tribute,
  heroPhotoDataUrl: string,
  tributeText: string
): string {
  const name = escapeHtml(tribute.subject_name)
  const dates = escapeHtml(formatDateRange(tribute))
  const pullQuote = tribute.ai_pull_quote ? escapeHtml(tribute.ai_pull_quote) : ''
  const bodyText = escapeHtml(truncate(tributeText, 300))
  const hasPhoto = heroPhotoDataUrl.length > 0

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Lato:wght@300;400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html, body {
    width: 595px;
    height: 842px;
    overflow: hidden;
  }

  .card {
    width: 595px;
    height: 842px;
    background: linear-gradient(160deg, #FFF8F0 0%, #FEF3E8 40%, #FCE8D4 100%);
    font-family: 'Cormorant Garamond', Georgia, serif;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 48px 52px 40px;
  }

  /* Decorative border */
  .card::before {
    content: '';
    position: absolute;
    inset: 16px;
    border: 1px solid rgba(139, 90, 43, 0.18);
    border-radius: 2px;
    pointer-events: none;
  }

  /* Top ornament */
  .ornament {
    font-size: 18px;
    color: #C2874A;
    letter-spacing: 6px;
    margin-bottom: 20px;
    opacity: 0.7;
  }

  /* In Loving Memory label */
  .in-memory {
    font-family: 'Lato', Arial, sans-serif;
    font-weight: 300;
    font-size: 10px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: #A07850;
    margin-bottom: 12px;
  }

  /* Name */
  .name {
    font-size: 36px;
    font-weight: 600;
    color: #2C1A0E;
    text-align: center;
    line-height: 1.2;
    margin-bottom: 10px;
  }

  /* Dates */
  .dates {
    font-size: 14px;
    font-style: italic;
    color: #8B6545;
    margin-bottom: 24px;
    text-align: center;
  }

  /* Divider */
  .divider {
    width: 80px;
    height: 1px;
    background: linear-gradient(90deg, transparent, #C2874A, transparent);
    margin-bottom: 22px;
  }

  /* Hero photo */
  .photo-frame {
    width: 200px;
    height: 220px;
    overflow: hidden;
    border-radius: 2px;
    margin-bottom: 24px;
    box-shadow: 0 4px 20px rgba(100, 60, 20, 0.15);
    flex-shrink: 0;
  }

  .photo-frame img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* Photo placeholder */
  .photo-placeholder {
    width: 200px;
    height: 180px;
    background: linear-gradient(135deg, #F0DFC0, #E8CFA8);
    border-radius: 2px;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #C2A070;
    font-size: 36px;
    flex-shrink: 0;
  }

  /* Pull quote */
  .pull-quote {
    font-size: 14px;
    font-style: italic;
    color: #6B4A28;
    text-align: center;
    line-height: 1.7;
    margin-bottom: 18px;
    padding: 0 8px;
    max-width: 420px;
  }

  /* Body text */
  .body-text {
    font-size: 12px;
    color: #4A3018;
    line-height: 1.75;
    text-align: center;
    padding: 0 4px;
    max-width: 440px;
    flex: 1;
  }

  /* Footer */
  .footer {
    position: absolute;
    bottom: 32px;
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .footer-divider {
    width: 40px;
    height: 1px;
    background: rgba(139, 90, 43, 0.3);
    margin-bottom: 6px;
  }

  .brand {
    font-family: 'Lato', Arial, sans-serif;
    font-weight: 300;
    font-size: 9px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #B08050;
  }

  .brand-url {
    font-family: 'Lato', Arial, sans-serif;
    font-size: 8px;
    color: #C2A070;
    letter-spacing: 1px;
  }
</style>
</head>
<body>
<div class="card">
  <div class="ornament">✦ &nbsp; ✦ &nbsp; ✦</div>
  <div class="in-memory">In Loving Memory</div>
  <div class="name">${name}</div>
  ${dates ? `<div class="dates">${dates}</div>` : ''}
  <div class="divider"></div>

  ${hasPhoto
    ? `<div class="photo-frame"><img src="${heroPhotoDataUrl}" alt="${name}" /></div>`
    : `<div class="photo-placeholder">✿</div>`
  }

  ${pullQuote ? `<div class="pull-quote">&ldquo;${pullQuote}&rdquo;</div>` : ''}
  ${bodyText ? `<div class="body-text">${bodyText}</div>` : ''}

  <div class="footer">
    <div class="footer-divider"></div>
    <div class="brand">Forever Remembered</div>
    <div class="brand-url">foreverremembered.ai</div>
  </div>
</div>
</body>
</html>`
}

// ── Memorial Book HTML (Cherish tier — 8-page A4) ────────────────────────────

function buildMemorialBookPage(
  pageNum: number,
  content: string,
  subjectName: string
): string {
  return `<div class="page" id="page-${pageNum}">
  ${content}
  <div class="page-footer">
    <span class="footer-name">${escapeHtml(subjectName)}</span>
    <span class="footer-page">${pageNum}</span>
    <span class="footer-brand">Forever Remembered</span>
  </div>
</div>`
}

function buildMemorialBookHtml(
  tribute: Tribute,
  photos: TributePhoto[],
  photoDataUrls: string[]
): string {
  const name = escapeHtml(tribute.subject_name)
  const dates = escapeHtml(formatDateRange(tribute))
  const pullQuote = tribute.ai_pull_quote ? escapeHtml(tribute.ai_pull_quote) : ''
  const body = tribute.ai_body
  const heroDataUrl = photoDataUrls[0] || ''

  const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Lato:wght@300;400;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --cream: #FFF8F0;
    --warm-brown: #2C1A0E;
    --amber: #C2874A;
    --tan: #8B6545;
    --light-tan: #F5E8D8;
    --divider: #E8D8C4;
    --med-brown: #6B4A28;
    --pale: #FEF3E8;
  }

  html { font-size: 16px; }

  .page {
    width: 794px;
    min-height: 1123px;
    background: var(--cream);
    font-family: 'Cormorant Garamond', Georgia, serif;
    padding: 72px 80px 90px;
    position: relative;
    page-break-after: always;
    overflow: hidden;
  }

  /* Cover page */
  .page-cover {
    background: linear-gradient(160deg, #3D2008 0%, #7A4010 50%, #5A2C0A 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 80px 90px;
    text-align: center;
  }

  .cover-ornament {
    font-size: 22px;
    color: rgba(255,255,255,0.4);
    letter-spacing: 10px;
    margin-bottom: 32px;
  }

  .cover-in-memory {
    font-family: 'Lato', sans-serif;
    font-weight: 300;
    font-size: 11px;
    letter-spacing: 5px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.65);
    margin-bottom: 20px;
  }

  .cover-name {
    font-size: 52px;
    font-weight: 600;
    color: #FFFFFF;
    line-height: 1.15;
    margin-bottom: 16px;
  }

  .cover-dates {
    font-size: 18px;
    font-style: italic;
    color: rgba(255,255,255,0.75);
    margin-bottom: 40px;
  }

  .cover-divider {
    width: 80px;
    height: 1px;
    background: rgba(255,255,255,0.3);
    margin: 0 auto 40px;
  }

  .cover-photo {
    width: 260px;
    height: 300px;
    object-fit: cover;
    border-radius: 2px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.4);
    margin-bottom: 40px;
  }

  .cover-brand {
    font-family: 'Lato', sans-serif;
    font-weight: 300;
    font-size: 10px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.45);
    position: absolute;
    bottom: 40px;
    left: 0; right: 0;
    text-align: center;
  }

  /* Section heading */
  .section-label {
    font-family: 'Lato', sans-serif;
    font-weight: 400;
    font-size: 10px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--tan);
    margin-bottom: 12px;
  }

  .page-title {
    font-size: 34px;
    font-weight: 600;
    color: var(--warm-brown);
    line-height: 1.3;
    margin-bottom: 8px;
  }

  .page-dates {
    font-size: 15px;
    font-style: italic;
    color: var(--tan);
    margin-bottom: 28px;
  }

  .divider {
    width: 60px;
    height: 1px;
    background: var(--amber);
    margin: 24px 0;
  }

  .pull-quote {
    font-size: 20px;
    font-style: italic;
    font-weight: 400;
    color: var(--med-brown);
    line-height: 1.6;
    margin: 24px 0;
    padding: 0 24px;
    border-left: 3px solid var(--amber);
  }

  .body-text {
    font-size: 15px;
    color: var(--warm-brown);
    line-height: 1.85;
    margin-bottom: 20px;
  }

  /* Photo layout */
  .full-photo {
    width: 100%;
    height: 420px;
    object-fit: cover;
    border-radius: 2px;
    margin: 20px 0;
    display: block;
  }

  .photo-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 24px 0;
  }

  .photo-grid img {
    width: 100%;
    height: 240px;
    object-fit: cover;
    border-radius: 2px;
    display: block;
  }

  .photo-caption {
    font-family: 'Lato', sans-serif;
    font-size: 10px;
    color: var(--tan);
    font-style: italic;
    text-align: center;
    margin-top: 6px;
  }

  /* Closing page */
  .page-closing {
    background: var(--light-tan);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 80px 80px 90px;
  }

  .closing-headline {
    font-size: 28px;
    font-style: italic;
    color: var(--warm-brown);
    line-height: 1.5;
    margin-bottom: 24px;
    max-width: 500px;
  }

  .closing-dates {
    font-size: 16px;
    color: var(--tan);
    margin-bottom: 32px;
  }

  .closing-brand {
    font-family: 'Lato', sans-serif;
    font-weight: 300;
    font-size: 11px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--tan);
    margin-top: 8px;
  }

  /* Page footer */
  .page-footer {
    position: absolute;
    bottom: 32px;
    left: 80px;
    right: 80px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid var(--divider);
    padding-top: 10px;
  }

  .footer-name, .footer-brand {
    font-family: 'Lato', sans-serif;
    font-size: 9px;
    color: var(--tan);
    letter-spacing: 1px;
  }

  .footer-page {
    font-family: 'Lato', sans-serif;
    font-size: 11px;
    color: var(--amber);
  }

  /* Toc / intro section */
  .page-content {
    flex: 1;
  }
`

  // PAGE 1: Cover
  const page1 = `<div class="page page-cover" id="page-1">
  <div class="cover-ornament">✦ &nbsp; ✦ &nbsp; ✦</div>
  <div class="cover-in-memory">In Loving Memory</div>
  <div class="cover-name">${name}</div>
  ${dates ? `<div class="cover-dates">${dates}</div>` : ''}
  <div class="cover-divider"></div>
  ${heroDataUrl ? `<img src="${heroDataUrl}" class="cover-photo" alt="${name}" />` : ''}
  <div class="cover-brand">Forever Remembered · foreverremembered.ai</div>
</div>`

  // PAGE 2: Tribute headline + pull quote
  const headline = tribute.ai_headline ? escapeHtml(tribute.ai_headline) : name
  const page2 = buildMemorialBookPage(2, `
  <div class="section-label">A Life to Remember</div>
  <h1 class="page-title">${headline}</h1>
  ${dates ? `<div class="page-dates">${dates}</div>` : ''}
  <div class="divider"></div>
  ${pullQuote ? `<div class="pull-quote">&ldquo;${pullQuote}&rdquo;</div>` : ''}
  ${body?.opening ? `<p class="body-text">${escapeHtml(body.opening)}</p>` : ''}
  `, name)

  // PAGE 3: Life & Memories
  const page3 = buildMemorialBookPage(3, `
  <div class="section-label">Life &amp; Memories</div>
  <div class="divider"></div>
  ${body?.life ? `<p class="body-text">${escapeHtml(body.life)}</p>` : `<p class="body-text">${escapeHtml(tribute.subject_bio || '')}</p>`}
  `, name)

  // PAGE 4: Photo page (if available)
  const photo2DataUrl = photoDataUrls[1] || ''
  const photo3DataUrl = photoDataUrls[2] || ''
  const page4Content = photo2DataUrl
    ? `<div class="section-label">Photo Memories</div>
       <div class="divider"></div>
       <img src="${photo2DataUrl}" class="full-photo" alt="Photo of ${name}" />
       ${photo3DataUrl ? `<img src="${photo3DataUrl}" style="width:100%;height:200px;object-fit:cover;border-radius:2px;margin-top:12px;display:block;" alt="Photo of ${name}" />` : ''}`
    : `<div class="section-label">Photo Memories</div>
       <div class="divider"></div>
       ${heroDataUrl ? `<img src="${heroDataUrl}" class="full-photo" alt="Photo of ${name}" />` : ''}
       <p class="body-text" style="text-align:center;font-style:italic;color:var(--tan);margin-top:24px;">Cherished moments captured in time.</p>`
  const page4 = buildMemorialBookPage(4, page4Content, name)

  // PAGE 5: Legacy
  const page5 = buildMemorialBookPage(5, `
  <div class="section-label">Legacy</div>
  <div class="divider"></div>
  ${body?.legacy ? `<p class="body-text">${escapeHtml(body.legacy)}</p>` : ''}
  `, name)

  // PAGE 6: Additional photos grid
  const photo4DataUrl = photoDataUrls[3] || ''
  const photo5DataUrl = photoDataUrls[4] || ''
  const page6Content = (photo4DataUrl || photo5DataUrl)
    ? `<div class="section-label">More Memories</div>
       <div class="divider"></div>
       <div class="photo-grid">
         ${photo4DataUrl ? `<div><img src="${photo4DataUrl}" alt="" /><div class="photo-caption">A cherished moment</div></div>` : '<div></div>'}
         ${photo5DataUrl ? `<div><img src="${photo5DataUrl}" alt="" /><div class="photo-caption">In remembrance</div></div>` : '<div></div>'}
       </div>`
    : `<div class="section-label">In Remembrance</div>
       <div class="divider"></div>
       ${body?.closing ? `<p class="body-text">${escapeHtml(body.closing)}</p>` : ''}`
  const page6 = buildMemorialBookPage(6, page6Content, name)

  // PAGE 7: Closing words
  const page7 = buildMemorialBookPage(7, `
  <div class="section-label">In Remembrance</div>
  <div class="divider"></div>
  ${body?.closing ? `<p class="body-text">${escapeHtml(body.closing)}</p>` : ''}
  ${pullQuote ? `<div class="pull-quote" style="margin-top:32px;">&ldquo;${pullQuote}&rdquo;</div>` : ''}
  `, name)

  // PAGE 8: Closing / back page
  const page8 = `<div class="page page-closing" id="page-8">
  <div class="cover-ornament" style="color:var(--amber);">✦ &nbsp; ✦ &nbsp; ✦</div>
  <p class="closing-headline">${pullQuote ? `&ldquo;${pullQuote}&rdquo;` : `In loving memory of ${name}.`}</p>
  ${dates ? `<div class="closing-dates">${dates}</div>` : ''}
  <div class="divider" style="margin:0 auto;"></div>
  <div class="closing-brand">Forever Remembered</div>
  <div style="font-family:'Lato',sans-serif;font-size:10px;color:var(--tan);letter-spacing:2px;margin-top:4px;">foreverremembered.ai</div>
  <p style="font-family:'Lato',sans-serif;font-size:10px;color:var(--tan);margin-top:16px;font-style:italic;">This memorial was lovingly created and preserved for your family.</p>
</div>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>${css}</style>
</head>
<body>
${page1}
${page2}
${page3}
${page4}
${page5}
${page6}
${page7}
${page8}
</body>
</html>`
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate a 1-page portrait memorial card PDF (Keep tier, $39)
 * Returns a Buffer containing the PDF bytes.
 */
export async function generateMemorialCard(
  tribute: Tribute,
  photos: TributePhoto[]
): Promise<Buffer> {
  const puppeteer = await import('puppeteer')
  const browser = await puppeteer.default.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
    ],
  })

  try {
    const page = await browser.newPage()

    // Fetch hero photo as data URL (avoids CORS issues in headless chrome)
    const heroDataUrl = photos[0]?.cdn_url ? await photoToDataUrl(photos[0].cdn_url) : ''

    // Derive tribute text: ai_body.opening or subject_bio
    const tributeText =
      tribute.ai_body?.opening ||
      tribute.subject_bio ||
      `${tribute.subject_name} will forever be remembered by all who knew and loved them.`

    const html = buildMemorialCardHtml(tribute, heroDataUrl, tributeText)

    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 })

    // A5 portrait ≈ 595 × 842 pt (same as A4 height, portrait card feel)
    const pdf = await page.pdf({
      width: '595px',
      height: '842px',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    })

    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}

/**
 * Generate an 8-page A4 memorial book PDF (Cherish tier, $127)
 * Returns a Buffer containing the PDF bytes.
 */
export async function generateMemorialBook(
  tribute: Tribute,
  photos: TributePhoto[]
): Promise<Buffer> {
  const puppeteer = await import('puppeteer')
  const browser = await puppeteer.default.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
    ],
  })

  try {
    const page = await browser.newPage()

    // Fetch up to 6 photos as data URLs
    const photoDataUrls = await Promise.all(
      photos.slice(0, 6).map((p) => photoToDataUrl(p.cdn_url))
    )

    const html = buildMemorialBookHtml(tribute, photos, photoDataUrls)

    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 45000 })

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    })

    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
