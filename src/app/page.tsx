'use client';

import { useEffect, useRef, useState } from 'react';

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
  { time: '9:00 AM',  name: 'Marcus Thompson', company: 'Apex Marketing Group' },
  { time: '10:30 AM', name: 'Sarah Mitchell',  company: 'Mitchell IT Solutions' },
  { time: '1:00 PM',  name: 'James Rivera',    company: 'Rivera Consulting LLC' },
  { time: '3:30 PM',  name: 'Amanda Chen',     company: 'Chen Staffing Partners' },
];

const stats = [
  { value: '24/7',  label: 'Autonomous AI operation' },
  { value: 'Hands-Free', label: 'Zero manual prospecting' },
  { value: '40hrs', label: 'Saved per month per client' },
  { value: '100%',  label: 'Done for you' },
];

const problems = [
  {
    icon: '📉',
    title: 'Your pipeline keeps running dry',
    desc: "Referrals are inconsistent. Word of mouth is unpredictable. Without a reliable outbound system, revenue stays feast-or-famine and growth feels impossible to plan.",
  },
  {
    icon: '⏰',
    title: "You're too busy doing the work to sell the work",
    desc: "You're delivering for current clients all day. By the time you have a free moment, prospecting is the last thing you want to do — and your pipeline suffers for it.",
  },
  {
    icon: '💸',
    title: 'Traditional agencies charge $5,000+/mo and underdeliver',
    desc: "Old-school agencies use human SDRs, manual processes, and outdated playbooks. You pay a premium for mediocre results while they take weeks just to get started.",
  },
];

const steps = [
  {
    num: '01',
    title: 'We learn your business',
    desc: 'One quick onboarding call. You tell us your ideal client profile, your offer, and your target market. That\'s it — we handle everything from there.',
  },
  {
    num: '02',
    title: 'AI builds your pipeline',
    desc: 'Our cutting-edge AI finds decision makers showing buying signals, writes hyper-personalized outreach, and handles conversations 24/7 — completely hands-free.',
  },
  {
    num: '03',
    title: 'Meetings appear on your calendar',
    desc: 'Qualified B2B leads show up as booked meetings directly on your calendar. No software to learn, no manual work. Just show up and close the deal.',
  },
];

const agencyItems = [
  'Human SDRs with limited hours',
  'Weeks to onboard and launch',
  'Generic, templated outreach',
];

const diyItems = [
  'Steep learning curve',
  'You manage everything yourself',
  'Hours of daily manual work',
  'No support when things break',
  'Still need to hire someone to run it',
];

const zionItems = [
  'AI-powered, 24/7 autonomous operation',
  'Completely hands-free — no software to learn',
  'Hyper-personalized outreach at scale',
  'Gets smarter and more effective over time',
];


const faqs = [
  {
    q: 'How does the AI find qualified B2B leads?',
    a: "Our AI scans thousands of data points to identify decision makers at companies showing active buying signals — things like recent funding, hiring patterns, technology changes, and engagement activity. It then writes and sends hyper-personalized outreach on your behalf, 24/7.",
  },
  {
    q: 'Is this really completely hands-free?',
    a: "Yes. After a quick onboarding call where you tell us your ideal client, our AI handles everything — prospect research, personalized outreach, follow-ups, and conversation management. You don't touch any software. Meetings just appear on your calendar.",
  },
  {
    q: 'How long until I start seeing results?',
    a: "After a quick onboarding and setup period, most clients begin seeing qualified meetings within the first few weeks. The AI continuously learns what messaging resonates best with your specific audience, so results typically improve month over month.",
  },
  {
    q: 'What does it cost?',
    a: "We offer a simple, transparent pricing structure with a one-time setup fee and an affordable monthly retainer — a fraction of what traditional agencies charge. No long-term contracts — we earn your business every month based on results. Book a free call and we will walk you through exactly what it costs and what you get.",
  },
  {
    q: 'What B2B industries do you work with?',
    a: "We work with B2B service businesses including: Marketing Agencies, IT Services, Staffing & Recruiting, Business Consulting, Web Design, Insurance Brokers, Accounting Firms, and similar professional service companies. If you're unsure if we're a fit, book a free call and we'll tell you honestly.",
  },
  {
    q: 'Can I cancel anytime?',
    a: "Yes. No long-term contracts, no cancellation fees. We operate month-to-month because we're confident the results speak for themselves.",
  },
];

/* ── Component ───────────────────────────────────────────────── */
const inputClass =
  'w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors';
const inputStyle = {
  backgroundColor: '#F5F0EA',
  border: '1px solid rgba(196,184,168,0.5)',
  color: '#1A1715',
  fontFamily: "var(--font-barlow), 'Barlow', sans-serif",
};

export default function Home() {
  useScrollReveal();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  /* ── Modal state ── */
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', phone: '', business: '', challenge: '',
  });
  const overlayRef = useRef<HTMLDivElement>(null);

  /* Lock body scroll when modal is open */
  useEffect(() => {
    document.body.style.overflow = modalOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [modalOpen]);

  function openModal() {
    setSubmitted(false);
    setFormError('');
    setForm({ name: '', email: '', phone: '', business: '', challenge: '' });
    setModalOpen(true);
  }
  function closeModal() { setModalOpen(false); }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) closeModal();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFormError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          business: form.business,
          challenge: form.challenge,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setSubmitted(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

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

          <button
            onClick={openModal}
            className="bg-[#1A1715] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-black transition-colors whitespace-nowrap flex-shrink-0"
          >
            Book a Free Call
          </button>
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
              Your AI-Powered Sales Engine{' '}
              <span style={{ color: '#C75B2A' }}>That Never Sleeps.</span>
            </h1>

            <p
              className="text-lg leading-relaxed mb-8"
              style={{ color: '#8B7D6B', fontWeight: 400 }}
            >
              ZionShift is a fully autonomous, 24/7 AI outbound system that finds
              qualified B2B leads, reaches out personally, and books meetings
              directly on your calendar — completely hands-free. No software to
              learn. No manual work. Just meetings appearing on your calendar.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <button
                onClick={openModal}
                className="bg-[#1A1715] text-white font-bold px-7 py-4 rounded-full text-center hover:bg-black transition-colors"
              >
                Book a Free Strategy Call
              </button>
              <a
                href="#how-it-works"
                className="border-2 border-[#1A1715] text-[#1A1715] font-bold px-7 py-4 rounded-full text-center hover:bg-[#1A1715] hover:text-white transition-colors"
              >
                See How It Works
              </a>
            </div>

            <p className="text-sm" style={{ color: '#8B7D6B' }}>
              ✦ Free 30-minute call · No commitment
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
            Great at what you do. But growing your client base shouldn&apos;t feel impossible.
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
              Three steps to a full calendar of qualified B2B meetings.
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
          className="fade-in-up rounded-3xl overflow-hidden"
          style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}
        >
          <iframe
            src="https://www.youtube.com/embed/xYVrAxbh_pI?rel=0&modestbranding=1&showinfo=0"
            title="Meet Ryan, Founder of ZionShift"
            width="100%"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
          />
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
              ZionShift vs. the alternatives.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Traditional Agencies card */}
            <div
              className="fade-in-up p-8 rounded-2xl"
              style={{
                backgroundColor: '#F5F0EA',
                border: '1px solid rgba(196,184,168,0.25)',
              }}
            >
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#8B7D6B' }}>Traditional Agencies</p>
              <h3
                className="text-xl font-bold mb-6"
                style={{ color: '#1A1715' }}
              >
                Outdated and overpriced
              </h3>
              <ul className="space-y-4">
                {agencyItems.map((item, i) => (
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

            {/* DIY AI Tools card */}
            <div
              className="fade-in-up delay-2 p-8 rounded-2xl"
              style={{
                backgroundColor: '#F5F0EA',
                border: '1px solid rgba(196,184,168,0.25)',
              }}
            >
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#8B7D6B' }}>DIY AI Tools</p>
              <h3
                className="text-xl font-bold mb-6"
                style={{ color: '#1A1715' }}
              >
                Powerful but overwhelming
              </h3>
              <ul className="space-y-4">
                {diyItems.map((item, i) => (
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
              className="fade-in-up delay-3 p-8 rounded-2xl"
              style={{ backgroundColor: '#1A1715' }}
            >
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#C75B2A' }}>ZionShift</p>
              <h3 className="text-xl font-bold mb-6 text-white">AI-powered, completely hands-free</h3>
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
          WHO WE HELP
      ════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 max-w-5xl mx-auto">
        <div className="text-center mb-12 fade-in-up">
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: '#C75B2A' }}
          >
            Who We Help
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold mt-3 mb-4">
            Built For B2B Service Businesses That Need More Clients.
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto leading-relaxed"
            style={{ color: '#8B7D6B', fontWeight: 400 }}
          >
            If you sell a B2B service and need a consistent flow of qualified
            meetings with decision makers, ZionShift was built for you.
          </p>
        </div>

        <div className="fade-in-up flex flex-wrap justify-center gap-4">
          {[
            { icon: '📣', label: 'Marketing Agencies' },
            { icon: '💻', label: 'IT Services' },
            { icon: '🤝', label: 'Staffing & Recruiting' },
            { icon: '📊', label: 'Business Consulting' },
            { icon: '🌐', label: 'Web Design' },
            { icon: '🛡️', label: 'Insurance Brokers' },
            { icon: '🧾', label: 'Accounting Firms' },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 px-6 py-4 rounded-2xl font-semibold"
              style={{
                backgroundColor: '#FDFCFA',
                border: '1px solid rgba(196,184,168,0.25)',
              }}
            >
              <span className="text-2xl">{item.icon}</span>
              <span style={{ color: '#1A1715' }}>{item.label}</span>
            </div>
          ))}

          {/* And More — accent style */}
          <div
            className="flex items-center gap-3 px-6 py-4 rounded-2xl font-semibold"
            style={{
              backgroundColor: 'rgba(199,91,42,0.06)',
              border: '1px solid rgba(199,91,42,0.3)',
            }}
          >
            <span className="text-2xl">➕</span>
            <span style={{ color: '#C75B2A' }}>And More</span>
          </div>
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
              Ready to put your lead generation on autopilot?
            </h2>
            <p
              className="text-lg mb-10 max-w-xl mx-auto leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 400 }}
            >
              Book a free strategy call and see exactly how our 24/7 autonomous
              AI would build your hands-free outbound pipeline. No pitch, no
              pressure — just a real conversation.
            </p>
            <button
              onClick={openModal}
              className="inline-block text-white font-bold px-9 py-4 rounded-full text-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#C75B2A' }}
            >
              Book Your Free Strategy Call
            </button>
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
          MODAL
      ════════════════════════════════════════════════════ */}
      {modalOpen && (
        <div
          ref={overlayRef}
          onClick={handleOverlayClick}
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', animation: 'fadeInOverlay 0.2s ease' }}
        >
          <div
            className="relative w-full rounded-3xl p-8 shadow-2xl"
            style={{
              backgroundColor: '#FDFCFA',
              maxWidth: 480,
              animation: 'fadeInModal 0.25s ease',
            }}
          >
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-[#F5F0EA]"
              style={{ color: '#8B7D6B' }}
              aria-label="Close"
            >
              ✕
            </button>

            {submitted ? (
              /* ── Confirmation ── */
              <div className="text-center py-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ backgroundColor: 'rgba(91,140,90,0.12)' }}
                >
                  <svg className="w-8 h-8" style={{ color: '#5B8C5A' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-extrabold mb-2" style={{ color: '#1A1715' }}>You&apos;re in.</h3>
                <p className="mb-8" style={{ color: '#8B7D6B', fontWeight: 400 }}>
                  We&apos;ll reach out within 24 hours to schedule your call.
                </p>
                <button
                  onClick={closeModal}
                  className="w-full py-3 rounded-full font-bold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#1A1715' }}
                >
                  Close
                </button>
              </div>
            ) : (
              /* ── Form ── */
              <>
                <h3 className="text-2xl font-extrabold mb-1" style={{ color: '#1A1715' }}>Book a Free Strategy Call</h3>
                <p className="text-sm mb-6" style={{ color: '#8B7D6B' }}>No commitment · No sales pitch · Just a real conversation.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#8B7D6B' }}>Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="John Smith"
                      className={inputClass}
                      style={inputStyle}
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#8B7D6B' }}>Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="john@example.com"
                      className={inputClass}
                      style={inputStyle}
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#8B7D6B' }}>Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="(555) 000-0000"
                      className={inputClass}
                      style={inputStyle}
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#8B7D6B' }}>Business Name</label>
                    <input
                      type="text"
                      placeholder="Your Business LLC"
                      className={inputClass}
                      style={inputStyle}
                      value={form.business}
                      onChange={e => setForm(f => ({ ...f, business: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#8B7D6B' }}>What&apos;s your biggest challenge right now?</label>
                    <textarea
                      rows={3}
                      placeholder="Tell us what's holding you back..."
                      className={inputClass}
                      style={{ ...inputStyle, resize: 'none' }}
                      value={form.challenge}
                      onChange={e => setForm(f => ({ ...f, challenge: e.target.value }))}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-full font-bold text-white text-base transition-opacity hover:opacity-90 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#C75B2A' }}
                  >
                    {loading ? 'Sending...' : 'Book Your Free Strategy Call'}
                  </button>

                  {formError && (
                    <p className="text-sm text-center" style={{ color: '#C75B2A' }}>
                      {formError}
                    </p>
                  )}
                </form>
              </>
            )}
          </div>
        </div>
      )}

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
