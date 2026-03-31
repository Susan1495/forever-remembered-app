/**
 * Screen 0: Landing / Entry Page
 * Route: /
 * Copy from LANDING-PAGE-V3.md by Blaze 📣
 */

import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free AI Memorial Tribute Creator — Forever Remembered',
  description:
    'Create a beautiful tribute page for someone you love in under 2 minutes. Free AI memorial tribute creator — just upload photos and write a few words.',
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-brown-50 text-brown-900">
      {/* ============================================================
          HERO SECTION
          Full-bleed background, centered content
          ============================================================ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-5 py-16">
        {/* Background image — warm amber candlelight */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/images/hero-bg.jpg')`,
            filter: 'brightness(0.75) saturate(1.1)',
          }}
          aria-hidden="true"
        />

        {/* Warm golden gradient overlay — amber/bronze tones, not black */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(120,60,10,0.3) 0%, rgba(80,30,5,0.4) 50%, rgba(30,10,0,0.7) 100%)',
          }}
          aria-hidden="true"
        />

        {/* Content */}
        <div className="relative z-10 text-center max-w-lg w-full mx-auto">
          {/* Wordmark */}
          <p className="text-amber-400 text-sm font-serif tracking-widest uppercase mb-8 opacity-80">
            Forever Remembered
          </p>

          {/* Hero headline */}
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-white leading-tight mb-5">
            They deserved to be remembered beautifully.
          </h1>

          {/* Subheadline */}
          <p className="text-white/80 text-lg md:text-xl leading-relaxed mb-10 font-serif">
            Create a free tribute page in under 2 minutes.
            <br />
            <span className="text-white/70 text-base">
              Just a few photos and a few words — we&apos;ll handle the rest.
            </span>
          </p>

          {/* Primary CTA */}
          <Link
            href="/create"
            className="block w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold font-serif text-lg rounded-full py-4 px-8 text-center transition-all duration-200 shadow-lg hover:shadow-xl active:scale-98 min-h-[56px] flex items-center justify-center"
          >
            Create a Free Tribute
          </Link>

          {/* Micro-copy */}
          <p className="mt-4 text-white/50 text-sm">
            No account needed. No credit card. Just begin.
          </p>
        </div>
      </section>

      {/* ============================================================
          HOW IT WORKS
          3 simple steps
          ============================================================ */}
      <section className="bg-brown-50 px-5 py-16 md:py-20">
        <div className="max-w-lg mx-auto">
          <p className="font-serif text-brown-700 text-center text-base italic mb-10 leading-relaxed">
            It only takes a few minutes. The love behind it will last much longer.
          </p>

          <div className="space-y-10">
            {/* Step 1 */}
            <div className="flex gap-5">
              <div className="text-2xl flex-shrink-0 mt-0.5">🖼️</div>
              <div>
                <h3 className="font-serif text-xl font-semibold text-brown-900 mb-2">
                  Share what you have
                </h3>
                <p className="text-brown-700 leading-relaxed">
                  Upload a photo or two — or as many as you like. Add their name, a little about
                  who they were, and anything else you want the world to know. There&apos;s no right or
                  wrong way to do this.
                </p>
                <p className="text-brown-600 text-sm mt-2 italic">
                  Even a few sentences is enough. The AI will do the rest.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-5">
              <div className="text-2xl flex-shrink-0 mt-0.5">✨</div>
              <div>
                <h3 className="font-serif text-xl font-semibold text-brown-900 mb-2">
                  We create something beautiful
                </h3>
                <p className="text-brown-700 leading-relaxed">
                  In about a minute, we&apos;ll turn your words and photos into a full tribute page —
                  a biography, a photo gallery, a design that fits who they were. Something worthy
                  of them.
                </p>
                <p className="text-brown-600 text-sm mt-2 italic">
                  You can adjust anything you&apos;d like before sharing.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-5">
              <div className="text-2xl flex-shrink-0 mt-0.5">🔗</div>
              <div>
                <h3 className="font-serif text-xl font-semibold text-brown-900 mb-2">
                  Share the link with everyone who loved them
                </h3>
                <p className="text-brown-700 leading-relaxed">
                  One link. Send it by text, share it on WhatsApp, post it anywhere. Family and
                  friends can open it on any phone, anywhere in the world — no app, no sign-up,
                  nothing to install.
                </p>
                <p className="text-brown-600 text-sm mt-2 italic">
                  They can light a candle. Leave a memory. And feel a little less alone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SOCIAL PROOF
          Testimonials from families
          ============================================================ */}
      <section className="bg-amber-50/60 px-5 py-16 md:py-20">
        <div className="max-w-lg mx-auto">
          <h2 className="font-serif text-2xl font-semibold text-brown-900 text-center mb-10">
            From families who&apos;ve been here
          </h2>

          <div className="space-y-8">
            <blockquote className="border-l-2 border-amber-500 pl-5">
              <p className="font-serif text-lg text-brown-800 leading-relaxed italic mb-3">
                &ldquo;I didn&apos;t know where to start. I had my phone, I had photos, I had too many
                feelings and not enough words. This did it for me. My whole family has seen it
                now.&rdquo;
              </p>
              <footer className="text-brown-600 text-sm">— A daughter</footer>
            </blockquote>

            <blockquote className="border-l-2 border-amber-500 pl-5">
              <p className="font-serif text-lg text-brown-800 leading-relaxed italic mb-3">
                &ldquo;My brother died suddenly. I needed something to exist for him immediately. I had
                a page up in less than 10 minutes. People are still leaving memories three months
                later.&rdquo;
              </p>
              <footer className="text-brown-600 text-sm">— A sibling</footer>
            </blockquote>

            <blockquote className="border-l-2 border-amber-500 pl-5">
              <p className="font-serif text-lg text-brown-800 leading-relaxed italic mb-3">
                &ldquo;Mamá only spoke Spanish. The tribute came out in Spanish. My cousins in México
                read it and called me crying. I couldn&apos;t believe it.&rdquo;
              </p>
              <footer className="text-brown-600 text-sm">— A daughter</footer>
            </blockquote>

            <blockquote className="border-l-2 border-amber-500 pl-5">
              <p className="font-serif text-lg text-brown-800 leading-relaxed italic mb-3">
                &ldquo;I made one for my grandfather before I even knew if I&apos;d need it. He passed
                three weeks later. We had something ready. That peace of mind meant everything.&rdquo;
              </p>
              <footer className="text-brown-600 text-sm">— A grandchild</footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* ============================================================
          TRIBUTE PREVIEW
          What they'll create
          ============================================================ */}
      <section className="bg-brown-50 px-5 py-16 md:py-20">
        <div className="max-w-lg mx-auto">
          <h2 className="font-serif text-2xl font-semibold text-brown-900 text-center mb-4">
            Here&apos;s what you&apos;ll create
          </h2>

          <p className="text-brown-700 text-center leading-relaxed mb-8">
            Your tribute page is yours. Designed with care. Personal to them.
          </p>

          {/* Preview card mockup */}
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-brown-100">
            {/* Hero mockup */}
            <div className="bg-gradient-to-b from-amber-900 to-amber-950 h-48 flex items-end p-6">
              <div>
                <div className="font-serif text-white text-2xl font-bold mb-1">
                  Margaret Anne Kowalski
                </div>
                <div className="text-white/70 text-sm tracking-wide">1941 — 2024</div>
                <div className="font-serif text-white/80 text-sm italic mt-2">
                  A woman who made every room feel like home.
                </div>
              </div>
            </div>

            {/* Content mockup */}
            <div className="bg-amber-50 p-6">
              <p className="font-serif text-brown-800 text-sm leading-relaxed mb-3">
                Margaret had a way of making strangers feel like old friends. The kitchen was always
                warm, the coffee was always on, and her door was open to anyone who needed a place
                to land.
              </p>
              <div className="flex gap-2 mt-4">
                <div className="w-16 h-16 bg-brown-200 rounded-lg" />
                <div className="w-16 h-16 bg-brown-200 rounded-lg" />
                <div className="w-16 h-16 bg-brown-200 rounded-lg" />
              </div>
            </div>
          </div>

          <p className="text-brown-500 text-sm text-center mt-4 italic">
            Every tribute is different — because every person was.
          </p>
        </div>
      </section>

      {/* ============================================================
          SHARE SECTION
          Viral loop explanation
          ============================================================ */}
      <section className="bg-amber-50/40 px-5 py-16 md:py-20">
        <div className="max-w-lg mx-auto">
          <h2 className="font-serif text-2xl font-semibold text-brown-900 text-center mb-6">
            One link does more than you might expect
          </h2>

          <div className="font-serif text-brown-700 space-y-4 leading-relaxed text-base">
            <p>
              When you share the link, something happens that no announcement or obituary can quite
              replicate.
            </p>
            <p>
              People open it on their phones. They see the photo. They read the words. And for a
              moment, they&apos;re not alone in what they&apos;re feeling — they&apos;re with you, and with them.
            </p>
            <p>
              Family in other countries. Friends from decades ago. People who never knew how to
              reach out. The link finds them all.
            </p>
            <p>
              They can light a candle. Leave a memory. Share it further. Every person who opens it
              and feels something — and wants to do the same for someone they&apos;ve lost — can start
              from right there.
            </p>
            <p className="text-brown-600">
              That&apos;s how this works. Not ads. Not algorithms. Just grief, and love, and people
              taking care of each other.
            </p>
          </div>

          <p className="text-brown-500 text-sm text-center mt-6 italic">
            No app needed. No sign-up needed. Just the link.
          </p>
        </div>
      </section>

      {/* ============================================================
          FINAL CTA
          ============================================================ */}
      <section className="bg-brown-900 px-5 py-16 md:py-20">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
            Someone is waiting to be remembered.
          </h2>

          <p className="text-white/70 text-base leading-relaxed mb-8 font-serif">
            You don&apos;t need to have the right words. You don&apos;t need perfect photos. You just need a
            few minutes and whatever you have.
            <br />
            <br />
            We&apos;ll help with the rest.
          </p>

          <Link
            href="/create"
            className="block w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold font-serif text-lg rounded-full py-4 px-8 text-center transition-all duration-200 shadow-lg min-h-[56px] flex items-center justify-center"
          >
            Create Their Tribute — It&apos;s Free
          </Link>

          <p className="mt-4 text-white/40 text-sm">
            No credit card. No account. Just begin.
          </p>
        </div>
      </section>

      {/* ============================================================
          FOOTER
          ============================================================ */}
      <footer className="bg-brown-900 border-t border-brown-800 px-5 py-8">
        <div className="max-w-lg mx-auto flex flex-col items-center gap-4 text-center">
          <p className="font-serif text-amber-500/70 text-sm tracking-wide">
            Forever Remembered
          </p>

          <div className="flex gap-5 text-white/40 text-sm">
            <a href="/about" className="hover:text-white/70 transition-colors">
              About
            </a>
            <a href="/privacy" className="hover:text-white/70 transition-colors">
              Privacy
            </a>
            <a href="mailto:support@foreverremembered.ai" className="hover:text-white/70 transition-colors">
              Contact
            </a>
          </div>

          <p className="text-white/30 text-xs">
            Built with care, for the hardest moments.
          </p>

          <p className="text-white/20 text-xs">
            Tributes are stored for 1 year on the free plan. Upgrading preserves them permanently.
          </p>
        </div>
      </footer>

      {/* ============================================================
          SEO LANDING SECTION
          Keyword-targeted content for organic search
          ============================================================ */}
      <section
        id="about-forever-remembered"
        className="bg-amber-50/30 px-5 py-16 md:py-20 border-t border-amber-100"
        aria-label="About Forever Remembered"
      >
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-brown-900 mb-8 leading-snug">
            The easiest way to create a tribute page for someone you love
          </h2>

          <div className="space-y-6 font-serif text-brown-700 leading-relaxed text-base">
            <p>
              Forever Remembered is a free AI memorial tribute creator that turns your photos and
              memories into a beautiful online tribute page in minutes. Our AI tribute generator
              reads what you share — a name, a few sentences, a handful of photos — and crafts a
              full tribute: a biography written in their voice, a gallery that honors their life,
              and a page worthy of who they were. No design skills needed. No writing experience
              required. Just the love you already have.
            </p>

            <p>
              This free tribute page for your loved one is for anyone who has lost someone and
              wants the world to know them — not just the dates on a headstone, but the
              full person. The parent who made every house a home. The friend who always picked up
              the phone. The grandparent whose stories you wish you had recorded. Our online
              memorial page creator gives anyone, anywhere, a way to share that person with
              everyone who mattered to them — across families, time zones, and generations.
            </p>

            <p>
              Forever Remembered is, and will always be, free to create. We believe every family
              deserves a place to remember someone they love — not just those who can afford a
              fancy memorial site. When you share your tribute, others who open it and feel
              something may create one too. That&apos;s how this stays free: not through ads, but
              through people taking care of each other. Every tribute shared is a ripple — and
              it&apos;s how grieving families find us when they need us most.
            </p>
          </div>
        </div>
      </section>

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Forever Remembered',
            description:
              'Free AI memorial tribute creator. Create a beautiful tribute page for someone you love in under 2 minutes — just upload photos and write a few words.',
            url: 'https://foreverremembered.ai',
            applicationCategory: 'LifestyleApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
          }),
        }}
      />
    </main>
  )
}
