'use client';

import { useEffect, useState } from 'react';

/* ── Scroll-reveal hook ──────────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    const els = document.querySelectorAll('.fade-in-up');
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ── Data ────────────────────────────────────────────────────── */
const meetings = [
  { time: '9:00 AM',  name: 'Marcus Thompson', company: 'Thompson HVAC' },
  { time: '10:30 AM', name: 'Sarah Mitchell',  company: 'Mitchell Law Group' },
  { time: '1:00 PM',  name: 'James Rivera',    company: 'Rivera Roofing Co.' },
  { time: '3:30 PM',  name: 'Amanda Chen',     company: 'Chen Dental Partners' },
];

const stats = [
  { value: '24/7',  label: 'Always running' },
  { value: '$0',    label: 'Ad spend required' },
  { value: '<5s',   label: 'Response time' },
  { value: '100%',  label: 'Personalized' },
];

const problems = [
  {
    icon: '💸',
    title: 'Ads drain your budget',
    desc: 'Spending thousands on Facebook and Google, competing with dozens of competitors bidding on the exact same keywords — with no guarantee of results.',
  },
  {
    icon: '📋',
    title: 'Shared leads go nowhere',
    desc: "The same lead gets sold to five different businesses. By the time you call, they've already been bombarded by your competitors.",
  },
  {
    icon: '⏰',
    title: 'Too busy to prospect',
    desc: "You're running your business all day. There's simply no time left to cold call, follow up, and consistently fill your pipeline.",
  },
];

const steps = [
  {
    num: '01',
    title: 'We learn your business',
    desc: 'One focused onboarding call. We learn your ideal client, your offer, and what makes you different from the competition.',
  },
  {
    num: '02',
    title: 'We build your machine',
    desc: 'Our AI finds decision makers and reaches out personally across email, text, and voicemail — at scale, around the clock.',
  },
  {
    num: '03',
    title: 'You show up and close',
    desc: 'Qualified meetings land directly on your calendar. You just show up, have the conversation, and close.',
  },
];

const otherItems = [
  'Pay for ads AND their monthly fee',
  'Leads shared with 5+ competitors',
  'Generic, template-based campaigns',
  'Leads that never pick up the phone',
  'Results stop when you stop paying',
];

const zionItems = [
  'Zero ad spend. Ever.',
  'Every meeting is exclusively yours',
  'Personalized outreach at scale',
  'Pre-qualified meetings on your calendar',
  'Runs 24/7 and gets smarter over time',
];

const testimonials = [
  {
    quote:
      '"ZionShift completely changed how I get clients. I went from chasing leads to having qualified prospects calling me. Best business decision I\'ve made this year."',
    name: 'Mike R.',
    location: 'Business Owner — Tampa, FL',
  },
  {
    quote:
      '"I was skeptical at first — I\'d been burned by agencies before. But ZionShift delivered real meetings within the first two weeks. No gimmicks, no shared leads."',
    name: 'Tony S.',
    location: 'Business Owner — Orlando, FL',
  },
  {
    quote:
      '"We were spending $4,000/month on ads and barely breaking even. ZionShift costs less and books more meetings. It\'s a no-brainer."',
    name: 'David L.',
    location: 'Business Owner — Miami, FL',
  },
];

const faqs = [
  {
    q: 'How is this different from buying leads?',
    a: "Bought leads are shared with multiple competitors and are often outdated or uninterested. ZionShift builds personalized outreach to decision makers who match your ideal client profile — and every meeting booked is exclusively yours.",
  },
  {
    q: 'Do I really not need to run ads?',
    a: "Correct. Our system is entirely outbound — we find and reach out to your prospects directly. You never need to pay for clicks, impressions, or ad management. Zero ad spend, ever.",
  },
  {
    q: 'How long until I start seeing results?',
    a: "Most clients see their first qualified meetings within 1–2 weeks of launching. The system gets smarter over time, so results typically improve month over month.",
  },
  {
    q: 'What do I have to do?',
    a: "Almost nothing. You show up to the meetings we book. We handle the entire outbound process — finding prospects, writing copy, sending messages, and following up.",
  },
  {
    q: 'What industries do you work with?',
    a: "We specialize in local and B2B service businesses including: Roofing, HVAC, Law Firms, Dental, Med Spas, Insurance, and Contractors. If you're not sure if we're a fit, book a free call and we'll let you know honestly.",
  },
  {
    q: 'Can I cancel anytime?',
    a: "Yes. We don't lock you into long-term contracts. We earn your business every month based on results.",
  },
];

/* ── Component ───────────────────────────────────────────────── */
export default function Home() {
  useScrollReveal();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: '#F5F0EA', color: '#1A1715', fontFamily: "var(--font-barlow), 'Barlow', sans-serif" }}
    >
      {/* ═══════════════════════════════════════════════════
          NAV — floating pill with frosted glass
      ════════════════════════════════════════════════════ */}
      <nav className="fixed top-5 left-0 right-0 z-50 flex justify-center px-4">
        <div
          className="frosted-glass flex items-center justify-between gap-6 px-6 py-3 rounded-full shadow-lg w-full max-w-4xl"
          style={{ border: '1px solid rgba(196,184,168,0.4)' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="ZionShift"
            width={130}
            className="object-contain flex-shrink-0"
            style={{ height: 'auto' }}
          />

          <div className="hidden md:flex items-center gap-7">
            {['How It Works', 'Why Us', 'FAQ'].map((label) => {
              const href = '#' + label.toLowerCase().replace(/ /g, '-');
              return (
                <a
                  key={label}
                  href={href}
                  className="text-sm font-medium transition-colors hover:text-[#C75B2A]"
                  style={{ color: '#1A1715' }}
                >
                  {label}
                </a>
              );
            })}
          </div>

          <a
            href="#book"
            className="bg-[#1A1715] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-black transition-colors whitespace-nowrap flex-shrink-0"
          >
            Book a Free Call
          </a>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════ */}
      <section className="pt-36 pb-24 px-4 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          {/* Left copy */}
          <div className="fade-in-up">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full mb-6"
              style={{
                backgroundColor: 'rgba(91,140,90,0.12)',
                color: '#5B8C5A',
                border: '1px solid rgba(91,140,90,0.2)',
              }}
            >
              <span className="w-2 h-2 rounded-full bg-[#5B8C5A]" />
              Now Accepting Clients
            </div>

            <h1 className="text-5xl md:text-[3.4rem] font-extrabold leading-tight mb-6">
              We book{' '}
              <span style={{ color: '#C75B2A' }}>qualified meetings</span> on
              your calendar. No ads needed.
            </h1>

            <p
              className="text-lg leading-relaxed mb-8"
              style={{ color: '#8B7D6B', fontWeight: 400 }}
            >
              ZionShift builds AI-powered outbound systems that find your ideal
              prospects, reach out personally, and book meetings directly on your
              calendar — 24/7, without spending a dollar on ads.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <a
                href="#book"
                className="bg-[#1A1715] text-white font-bold px-7 py-4 rounded-full text-center hover:bg-black transition-colors"
              >
                Book a Free Strategy Call
              </a>
              <a
                href="#how-it-works"
                className="border-2 border-[#1A1715] text-[#1A1715] font-bold px-7 py-4 rounded-full text-center hover:bg-[#1A1715] hover:text-white transition-colors"
              >
                See How It Works
              </a>
            </div>

            <p className="text-sm" style={{ color: '#8B7D6B' }}>
              Free 30-minute call · No commitment
            </p>
          </div>

          {/* Right — meeting card */}
          <div className="relative fade-in-up delay-2">
            <div
              className="rounded-2xl p-6 shadow-xl"
              style={{
                backgroundColor: '#FDFCFA',
                border: '1px solid rgba(196,184,168,0.4)',
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-lg">Upcoming Meetings</h3>
                <span
                  className="text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: '#F5F0EA', color: '#8B7D6B' }}
                >
                  This Week
                </span>
              </div>

              <div className="space-y-3">
                {meetings.map((m, i) => (
                  <div
                    key={i}
                    className="meeting-row flex items-center justify-between p-3 rounded-xl"
                    style={{
                      backgroundColor: '#F5F0EA',
                      animationDelay: `${0.4 + i * 0.15}s`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs font-semibold w-16 flex-shrink-0"
                        style={{ color: '#8B7D6B' }}
                      >
                        {m.time}
                      </span>
                      <div>
                        <p className="font-semibold text-sm">{m.name}</p>
                        <p className="text-xs" style={{ color: '#8B7D6B' }}>
                          {m.company}
                        </p>
                      </div>
                    </div>
                    <span
                      className="text-xs font-bold px-3 py-1 rounded-full flex-shrink-0"
                      style={{ backgroundColor: '#5B8C5A', color: 'white' }}
                    >
                      Qualified
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating badge 1 */}
            <div
              className="animate-float absolute -top-4 -right-3 text-white text-sm font-bold px-4 py-2.5 rounded-full shadow-lg"
              style={{ backgroundColor: '#1A1715' }}
            >
              4 meetings booked today 🎯
            </div>

            {/* Floating badge 2 */}
            <div
              className="animate-float-delayed absolute -bottom-4 -left-3 text-white text-sm font-bold px-4 py-2.5 rounded-full shadow-lg"
              style={{ backgroundColor: '#C75B2A' }}
            >
              14 meetings this month 📅
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          STATS BAR
      ════════════════════════════════════════════════════ */}
      <section
        className="py-10 px-4"
        style={{
          backgroundColor: '#FDFCFA',
          borderTop: '1px solid rgba(196,184,168,0.35)',
          borderBottom: '1px solid rgba(196,184,168,0.35)',
        }}
      >
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s, i) => (
            <div key={i} className={`fade-in-up delay-${i + 1}`}>
              <p className="text-2xl font-extrabold" style={{ color: '#C75B2A' }}>
                {s.value}
              </p>
              <p className="text-sm mt-1" style={{ color: '#8B7D6B' }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          PROBLEM SECTION
      ════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-14 fade-in-up">
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: '#C75B2A' }}
          >
            The Problem
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold mt-3 max-w-2xl mx-auto leading-tight">
            Great at what you do. But finding clients shouldn&apos;t be this hard.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {problems.map((p, i) => (
            <div
              key={i}
              className={`fade-in-up delay-${i + 1} p-8 rounded-2xl`}
              style={{
                backgroundColor: '#FDFCFA',
                border: '1px solid rgba(196,184,168,0.25)',
              }}
            >
              <span className="text-4xl mb-5 block">{p.icon}</span>
              <h3 className="text-xl font-bold mb-3">{p.title}</h3>
              <p style={{ color: '#8B7D6B', fontWeight: 400, lineHeight: 1.7 }}>
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════════════ */}
      <section
        id="how-it-works"
        className="py-24 px-4"
        style={{ backgroundColor: '#FDFCFA' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14 fade-in-up">
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: '#C75B2A' }}
            >
              How It Works
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold mt-3">
              Three steps to a full calendar.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <div
                key={i}
                className={`fade-in-up delay-${i + 1} p-8 rounded-2xl relative overflow-hidden`}
                style={{
                  backgroundColor: '#F5F0EA',
                  border: '1px solid rgba(196,184,168,0.25)',
                }}
              >
                {/* Faded large number */}
                <span
                  className="absolute top-3 right-5 text-9xl font-black select-none leading-none pointer-events-none"
                  style={{ color: '#1A1715', opacity: 0.07 }}
                >
                  {s.num}
                </span>

                <span
                  className="text-xs font-bold uppercase tracking-widest mb-4 block"
                  style={{ color: '#C75B2A' }}
                >
                  Step {s.num}
                </span>
                <h3 className="text-xl font-bold mb-3">{s.title}</h3>
                <p style={{ color: '#8B7D6B', fontWeight: 400, lineHeight: 1.7 }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          VIDEO SECTION
      ════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-10 fade-in-up">
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: '#C75B2A' }}
          >
            Meet The Founder
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold mt-3">
            See why business owners are making the switch.
          </h2>
        </div>

        <div
          className="fade-in-up rounded-3xl flex items-center justify-center"
          style={{
            backgroundColor: '#FDFCFA',
            border: '1px solid rgba(196,184,168,0.25)',
            aspectRatio: '16/9',
          }}
        >
          <div
            className="flex flex-col items-center gap-4"
            style={{ color: '#8B7D6B' }}
          >
            <button
              className="w-16 h-16 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{ backgroundColor: '#C75B2A' }}
              aria-label="Play video"
            >
              <svg
                className="w-6 h-6 text-white ml-1"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
            <p className="text-sm font-medium">Video coming soon</p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          COMPARISON
      ════════════════════════════════════════════════════ */}
      <section
        id="why-us"
        className="py-24 px-4"
        style={{ backgroundColor: '#FDFCFA' }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 fade-in-up">
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: '#C75B2A' }}
            >
              Why ZionShift
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold mt-3">
              We&apos;re not another marketing agency.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Other Agencies card */}
            <div
              className="fade-in-up p-8 rounded-2xl"
              style={{
                backgroundColor: '#F5F0EA',
                border: '1px solid rgba(196,184,168,0.25)',
              }}
            >
              <h3
                className="text-xl font-bold mb-7"
                style={{ color: '#8B7D6B' }}
              >
                Other Agencies
              </h3>
              <ul className="space-y-4">
                {otherItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-red-500 font-bold text-base mt-0.5 flex-shrink-0">
                      ✕
                    </span>
                    <span style={{ color: '#8B7D6B', fontWeight: 400 }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* ZionShift card */}
            <div
              className="fade-in-up delay-2 p-8 rounded-2xl"
              style={{ backgroundColor: '#1A1715' }}
            >
              <h3 className="text-xl font-bold mb-7 text-white">ZionShift</h3>
              <ul className="space-y-4">
                {zionItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className="font-bold text-base mt-0.5 flex-shrink-0"
                      style={{ color: '#5B8C5A' }}
                    >
                      ✓
                    </span>
                    <span className="text-white" style={{ fontWeight: 400 }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          TESTIMONIALS
      ════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-14 fade-in-up">
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: '#C75B2A' }}
          >
            Results
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold mt-3">
            What our clients are saying.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className={`fade-in-up delay-${i + 1} p-8 rounded-2xl`}
              style={{
                backgroundColor: '#FDFCFA',
                border: '1px solid rgba(196,184,168,0.25)',
              }}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <span key={j} style={{ color: '#C75B2A' }}>
                    ★
                  </span>
                ))}
              </div>

              <p
                className="italic leading-relaxed mb-6"
                style={{ color: '#1A1715', fontWeight: 400 }}
              >
                {t.quote}
              </p>

              <div>
                <p className="font-bold">{t.name}</p>
                <p className="text-sm mt-0.5" style={{ color: '#8B7D6B' }}>
                  {t.location}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FAQ
      ════════════════════════════════════════════════════ */}
      <section
        id="faq"
        className="py-24 px-4"
        style={{ backgroundColor: '#FDFCFA' }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14 fade-in-up">
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: '#C75B2A' }}
            >
              FAQ
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold mt-3">
              Common questions.
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div
                key={i}
                className="fade-in-up rounded-2xl overflow-hidden"
                style={{ border: '1px solid rgba(196,184,168,0.3)' }}
              >
                <button
                  className="w-full flex items-center justify-between p-6 text-left transition-colors hover:bg-[#F5F0EA]"
                  style={{ backgroundColor: '#FDFCFA' }}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-bold text-lg pr-4">{f.q}</span>
                  <span
                    className="text-2xl flex-shrink-0 transition-transform duration-300"
                    style={{
                      color: '#C75B2A',
                      transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0deg)',
                    }}
                  >
                    +
                  </span>
                </button>

                <div
                  className={`faq-answer ${openFaq === i ? 'open' : ''}`}
                  style={{ backgroundColor: '#FDFCFA' }}
                >
                  <p
                    className="px-6 pb-6 leading-relaxed"
                    style={{ color: '#8B7D6B', fontWeight: 400 }}
                  >
                    {f.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          CTA SECTION
      ════════════════════════════════════════════════════ */}
      <section id="book" className="py-24 px-4 max-w-5xl mx-auto">
        <div
          className="fade-in-up relative rounded-3xl overflow-hidden px-8 py-16 md:px-16 md:py-20 text-center"
          style={{ backgroundColor: '#1A1715' }}
        >
          {/* Orange radial glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(199,91,42,0.28) 0%, transparent 70%)',
            }}
          />

          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5">
              Ready to fill your calendar?
            </h2>
            <p
              className="text-lg mb-10 max-w-xl mx-auto leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 400 }}
            >
              Book a free strategy call and see exactly how we&apos;d build your
              outbound system. No pitch, no pressure — just a real conversation.
            </p>
            <a
              href="#"
              className="inline-block text-white font-bold px-9 py-4 rounded-full text-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#C75B2A' }}
            >
              Book Your Free Strategy Call
            </a>
            <p
              className="mt-5 text-sm"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              No commitment · No sales pitch · Just a real conversation
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════ */}
      <footer
        className="py-8 px-4"
        style={{ borderTop: '1px solid rgba(196,184,168,0.3)' }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="ZionShift"
            width={120}
            className="object-contain"
            style={{ height: 'auto' }}
          />
          <p className="text-sm" style={{ color: '#8B7D6B' }}>
            © 2026 ZionShift. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
