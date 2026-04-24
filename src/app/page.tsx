'use client';

import { useEffect, useRef, useState, useCallback, ReactNode, RefObject } from 'react';

/* ─── HOOKS ─────────────────────────────────────────────────── */
function useReveal() {
  useEffect(() => {
    const sel = '.reveal, .reveal-blur, .headline-words, .stat, .faq-item, .hero-visual';
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          if (e.target.classList.contains('hero-visual')) e.target.classList.add('in-view');
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    requestAnimationFrame(() => {
      document.querySelectorAll(sel).forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) {
          el.classList.add('in');
          if (el.classList.contains('hero-visual')) el.classList.add('in-view');
        }
        io.observe(el);
      });
    });
    return () => io.disconnect();
  }, []);
}

function useScrollProgress() {
  useEffect(() => {
    const bar = document.querySelector('.scroll-progress');
    const nav = document.querySelector('.zs-nav-wrap');
    const onScroll = () => {
      const h = document.documentElement;
      const pct = h.scrollTop / (h.scrollHeight - h.clientHeight);
      if (bar) (bar as HTMLElement).style.width = (pct * 100) + '%';
      if (nav) nav.classList.toggle('scrolled', h.scrollTop > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
}

function useCursorOrb() {
  useEffect(() => {
    const orb = document.querySelector('.hero-orb') as HTMLElement | null;
    const hero = document.querySelector('.hero') as HTMLElement | null;
    if (!orb || !hero) return;
    let rafId: number;
    const onMove = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        orb.style.transform = `translate(${x}px, ${y}px)`;
      });
    };
    hero.addEventListener('mousemove', onMove);
    orb.style.transform = `translate(${window.innerWidth * 0.6}px, 320px)`;
    return () => {
      hero.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafId);
    };
  }, []);
}

function useTilt(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `translateY(-4px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
    };
    const onLeave = () => { el.style.transform = ''; };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [ref]);
}

/* ─── ANIMATED COUNTER ───────────────────────────── */
function Counter({ to, suffix = '', duration = 1800 }: { to: number; suffix?: string; duration?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setVal(Math.round(to * eased));
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      });
    }, { threshold: 0.4 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [to, duration]);
  return <span ref={ref}>{val}{suffix}</span>;
}

/* ─── TYPEWRITER ─────────────────────────────────── */
function Typewriter({ text, speed = 48, startDelay = 800 }: { text: string; speed?: number; startDelay?: number }) {
  const [out, setOut] = useState('');
  useEffect(() => {
    let i = 0;
    let timeout: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (i <= text.length) {
        setOut(text.slice(0, i));
        i++;
        timeout = setTimeout(tick, speed);
      } else {
        timeout = setTimeout(() => { i = 0; tick(); }, 8000);
      }
    };
    timeout = setTimeout(tick, startDelay);
    return () => clearTimeout(timeout);
  }, [text, speed, startDelay]);
  return <>{out}<span className="caret" /></>;
}

/* ─── WORD REVEAL ────────────────────────────────── */
function WordReveal({ children, className = '', style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  const out: ReactNode[] = [];
  let key = 0;
  const process = (child: ReactNode) => {
    if (typeof child === 'string') {
      const parts = child.split(/(\s+)/);
      parts.forEach((p) => {
        if (p === '') return;
        if (p.trim() === '') out.push(<span key={key++}>{p}</span>);
        else out.push(<span key={key++} className="w"><span>{p}</span></span>);
      });
    } else if (child != null && child !== false) {
      out.push(<span key={key++} className="w"><span>{child}</span></span>);
    }
  };
  if (Array.isArray(children)) children.forEach(process);
  else process(children);
  return <span className={`headline-words ${className}`} style={style}>{out}</span>;
}

/* ─── NAV ────────────────────────────────────────── */
function Nav({ onBook }: { onBook: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);
  return (
    <div className="zs-nav-wrap">
      <div className="zs-nav">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="ZionShift" />
        <div className="zs-nav-links">
          <a href="#how">How it works</a>
          <a href="#why">Why us</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </div>
        <div className="zs-nav-cta">
          <button className="btn btn-primary" onClick={onBook} style={{ padding: '10px 18px', fontSize: 13 }}>
            Book a call<span className="chev">→</span>
          </button>
          <a href="/login" className="btn btn-ghost" style={{ padding: '10px 18px', fontSize: 13, textDecoration: 'none' }}>Log in</a>
        </div>
        <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
          <span className={menuOpen ? 'x' : ''} />
          <span className={menuOpen ? 'x' : ''} />
          <span className={menuOpen ? 'x' : ''} />
        </button>
      </div>
      {menuOpen && (
        <div className="mobile-menu">
          <a href="#how" onClick={close}>How it works</a>
          <a href="#why" onClick={close}>Why us</a>
          <a href="#pricing" onClick={close}>Pricing</a>
          <a href="#faq" onClick={close}>FAQ</a>
        </div>
      )}
    </div>
  );
}

/* ─── HERO ───────────────────────────────────────── */
function Hero({ onBook }: { onBook: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  useTilt(panelRef);
  useCursorOrb();

  const meetings = [
    { time: '09:00', name: 'Marcus Thompson',  co: 'Thompson HVAC & Plumbing' },
    { time: '10:30', name: 'Sarah Mitchell',   co: 'Mitchell Dental Practice' },
    { time: '13:00', name: 'James Rivera',     co: 'Rivera Law Offices' },
    { time: '15:30', name: 'Amanda Chen',      co: 'Chen Design Studio' },
  ];

  return (
    <section className="hero">
      <div className="hero-orb" />
      <div className="zs-container hero-inner">
        <h1 style={{ marginTop: 28 }}>
          <WordReveal>A sales engine</WordReveal><br />
          <WordReveal>that <em>never sleeps.</em></WordReveal>
        </h1>
        <p className="lead reveal-blur d3">
          ZionShift is a fully autonomous AI built for bookkeeping firms. It finds small business owners who need your services, reaches out personally, and books them directly onto your calendar — so you can stop depending on referrals and start growing on demand.
        </p>
        <div className="reveal d4" style={{ marginTop: 40, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-lg" onClick={onBook}>
            Book a free strategy call<span className="chev">→</span>
          </button>
          <a href="#how" className="btn btn-ghost btn-lg">See how it works</a>
        </div>
        <div className="trust-row reveal d5">
          <span className="chip-mini">24/7 autonomous</span>
          <span className="chip-mini">No software to learn</span>
          <span className="chip-mini">Cancel anytime</span>
        </div>

        <div className="hero-visual">
          <div className="visual-grid">
            {/* LEFT — AI composing */}
            <div className="h-panel h-panel-dark" ref={panelRef}>
              <div className="h-panel-head">
                <span className="h-panel-title">
                  <span className="live" />ZionShift · composing
                </span>
                <span style={{ font: '500 11px var(--zs-mono)', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>03:42 PM</span>
              </div>
              <div className="h-panel-body">
                <div className="ai-draft">
                  <span className="tag">To · Marcus Thompson, Owner · Thompson HVAC &amp; Plumbing</span>
                  <Typewriter text={"Hi Marcus — noticed Thompson HVAC just brought on two new trucks and you're already hiring again. That kind of growth is exciting, but it usually means the financial side of the business starts slipping through the cracks — invoices piling up, tax time turning into a scramble, never quite sure what you actually made last month. I help trades owners like you keep that side of the business completely off your plate. You run the jobs. We handle the numbers. Worth a quick call?"} />
                </div>
              </div>
            </div>

            {/* RIGHT — calendar */}
            <div className="h-panel">
              <div className="h-panel-head">
                <span className="h-panel-title">
                  <span className="live" />This week · booked by AI
                </span>
                <span className="h-panel-count" style={{ font: '500 11px var(--zs-mono)', color: 'var(--zs-ink-5)', letterSpacing: '0.1em' }}>4 QUALIFIED</span>
              </div>
              <div className="h-panel-body" style={{ padding: '4px 22px 22px' }}>
                {meetings.map((m, i) => (
                  <div key={i} className="cal-day">
                    <span className="cal-time">{m.time}</span>
                    <div className="cal-who">
                      <div className="cal-name">{m.name}</div>
                      <div className="cal-co">{m.co}</div>
                    </div>
                    <span className="cal-pill">Qualified</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="hero-badge hero-badge-1">
            <div>
              <div className="lbl">New clients this mo.</div>
              <div className="n"><Counter to={3} /></div>
            </div>
          </div>
          <div className="hero-badge hero-badge-2 ink">
            <div>
              <div className="lbl">Avg. retainer</div>
              <div className="n" style={{ color: '#fff' }}>$<Counter to={850} /></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


/* ─── STATS ──────────────────────────────────────── */
function Stats() {
  const stats = [
    { idx: 'Always on',         val: '24/7',                                                                              lbl: 'Autonomous AI operation' },
    { idx: 'No learning curve', val: 'Zero',                                                                              lbl: 'Software for you to learn' },
    { idx: 'Time reclaimed',    val: <><Counter to={40} /><span className="unit">hrs</span></>,                           lbl: 'Saved per month, per client' },
    { idx: 'Fully managed',     val: <><Counter to={100} /><span className="unit">%</span></>,                            lbl: 'Done for you, end to end' },
  ];
  return (
    <section className="zs-section-sm" style={{ borderBottom: '1px solid var(--zs-border)', borderTop: '1px solid var(--zs-border)' }}>
      <div className="zs-container">
        <div className="stats-row">
          {stats.map((s, i) => (
            <div key={i} className={`stat reveal d${i + 1}`}>
              <div className="idx">{s.idx}</div>
              <div className="val"><span className="val-mask"><span>{s.val}</span></span></div>
              <div className="lbl">{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CALENDAR SLIDE ─────────────────────────────── */
function CalendarSlide() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay(); // 0=Sun
  const monthName = now.toLocaleString('default', { month: 'long' });

  // Scatter ~6 "booked" days across the month, avoiding today and day 1
  const bookedDays = new Set<number>();
  const seeds = [3, 7, 11, 15, 19, 24].map(d => Math.min(d, daysInMonth));
  seeds.forEach(d => { if (d !== today) bookedDays.add(d); });

  const cells: (number | null)[] = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="slide-cal">
      <div className="chdr"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div>
      <div className="cgrid">
        {cells.map((d, i) => (
          <div key={i} className={`cd ${d && bookedDays.has(d) ? 'has' : ''} ${d === today ? 'today' : ''} ${!d ? 'empty' : ''}`}>
            {d || ''}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--zs-mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--zs-ink-5)' }}>
        <span>{bookedDays.size} booked</span>
        <span>{monthName} {year}</span>
      </div>
    </div>
  );
}

/* ─── PROCESS ────────────────────────────────────── */
function Process() {
  const [step, setStep] = useState(0);
  const wrapRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = Math.max(0, -r.top);
      const pct = Math.min(1, Math.max(0, scrolled / total));
      setStep(Math.min(2, Math.floor(pct * 3)));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const steps = [
    { num: '01 / 03', h: 'You tell us who you want.', p: 'One onboarding call. Share your ideal client, offer, and target market. We handle everything after that.' },
    { num: '02 / 03', h: 'The AI builds your pipeline.', p: 'We find decision makers showing buying signals, write personalized outreach that reads human, and handle entire conversations 24/7 — even while you sleep.' },
    { num: '03 / 03', h: 'Meetings land on your calendar.', p: 'Qualified prospects show up as booked calls. You open your calendar, see who\'s next, and close. That\'s the whole interaction.' },
  ];

  return (
    <section id="how" className="process" ref={wrapRef as React.RefObject<HTMLElement>}>

      {/* Desktop: sticky scroll animation */}
      <div className="process-sticky process-desktop">
        <div className="zs-container">
          <div className="process-grid">
            <div className="process-copy">
              <div className="eyebrow" style={{ marginBottom: 20 }}>How it works</div>
              {steps.map((s, i) => (
                <div key={i} style={{
                  position: i === step ? 'relative' : 'absolute',
                  opacity: i === step ? 1 : 0,
                  transform: `translateY(${i === step ? 0 : 20}px)`,
                  transition: 'opacity 600ms var(--zs-ease), transform 700ms var(--zs-ease)',
                }}>
                  <div className="step-num">{s.num}</div>
                  <h2>{s.h}</h2>
                  <p>{s.p}</p>
                </div>
              ))}
            </div>
            <div className="process-stage">
              <div className="process-track">
                {[0, 1, 2].map((i) => <div key={i} className={`dot ${i === step ? 'active' : ''}`} />)}
              </div>
              <div className={`process-slide ${step === 0 ? 'active' : ''}`}>
                <div className="slide-form">
                  <div className="row"><span className="k">Ideal client</span><span className="v">Business owners who need bookkeeping{step === 0 && <span className="cursor" />}</span></div>
                  <div className="row"><span className="k">Target geography</span><span className="v">United States · $500K–$5M revenue</span></div>
                  <div className="row"><span className="k">Offer</span><span className="v">Your service, positioned to your ICP</span></div>
                </div>
              </div>
              <div className={`process-slide ${step === 1 ? 'active' : ''}`}>
                {step === 1 && (
                  <div className="prospect-feed">
                    {[
                      { name: 'David Okafor',    co: 'Okafor Plumbing Co.',       signal: 'Hiring · 4 roles' },
                      { name: 'Lisa Tran',        co: 'Tran Family Dental',         signal: 'Just expanded' },
                      { name: 'Carlos Mendez',   co: 'Mendez Construction LLC',    signal: 'Revenue growth' },
                      { name: 'Rachel Kim',       co: 'Kim & Park Law Group',       signal: 'New entity' },
                    ].map((p, i) => (
                      <div key={i} className="prospect-card">
                        <div className="pc-info">
                          <div className="pc-name">{p.name}</div>
                          <div className="pc-co">{p.co}</div>
                        </div>
                        <span className="pc-signal">{p.signal}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 4, fontFamily: 'var(--zs-mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--zs-ink-5)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Scanning signals</span>
                      <span>412 prospects</span>
                    </div>
                  </div>
                )}
              </div>
              <div className={`process-slide ${step === 2 ? 'active' : ''}`}>
                <CalendarSlide />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: stacked step cards with visuals */}
      <div className="process-mobile">
        <div className="zs-container">
          <div className="eyebrow reveal" style={{ marginBottom: 32 }}>How it works</div>

          <div className="process-card reveal">
            <div className="step-num">{steps[0].num}</div>
            <h3>{steps[0].h}</h3>
            <p>{steps[0].p}</p>
            <div className="process-card-stage">
              <div className="slide-form">
                <div className="row"><span className="k">Ideal client</span><span className="v">Business owners who need bookkeeping<span className="cursor" /></span></div>
                <div className="row"><span className="k">Target geography</span><span className="v">United States · $500K–$5M revenue</span></div>
                <div className="row"><span className="k">Offer</span><span className="v">Your service, positioned to your ICP</span></div>
              </div>
            </div>
          </div>

          <div className="process-card reveal d1">
            <div className="step-num">{steps[1].num}</div>
            <h3>{steps[1].h}</h3>
            <p>{steps[1].p}</p>
            <div className="process-card-stage">
              <div className="prospect-feed">
                {[
                  { name: 'David Okafor',    co: 'Okafor Plumbing Co.',       signal: 'Hiring · 4 roles' },
                  { name: 'Lisa Tran',        co: 'Tran Family Dental',         signal: 'Just expanded' },
                  { name: 'Carlos Mendez',   co: 'Mendez Construction LLC',    signal: 'Revenue growth' },
                  { name: 'Rachel Kim',       co: 'Kim & Park Law Group',       signal: 'New entity' },
                ].map((p, i) => (
                  <div key={i} className="prospect-card">
                    <div className="pc-info">
                      <div className="pc-name">{p.name}</div>
                      <div className="pc-co">{p.co}</div>
                    </div>
                    <span className="pc-signal">{p.signal}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="process-card reveal d2">
            <div className="step-num">{steps[2].num}</div>
            <h3>{steps[2].h}</h3>
            <p>{steps[2].p}</p>
            <div className="process-card-stage">
              <CalendarSlide />
            </div>
          </div>

        </div>
      </div>

    </section>
  );
}

/* ─── BENTO ──────────────────────────────────────── */
function Bento() {
  return (
    <section className="zs-section zs-section-paper" id="why">
      <div className="zs-container">
        <div className="reveal" style={{ maxWidth: 860, marginBottom: 72 }}>
          <span className="eyebrow">Why ZionShift</span>
          <h2 style={{ fontSize: 'clamp(40px,5vw,80px)', fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 0.98, marginTop: 20, color: 'var(--zs-ink)' }}>
            Outbound, handled.
          </h2>
        </div>

        <div className="bento">
          <div className="tile wide reveal d1">
            <h3>Personalized outreach that reads human.</h3>
            <p>Every message is researched, written and sent for each prospect — matched to their role, their company, and the signal that made them a fit.</p>
            <div className="bt-typing">
              <div className="tl" /><div className="tl" /><div className="tl" /><div className="tl" />
            </div>
          </div>

          <div className="tile reveal d2">
            <h3>Never clocks out.</h3>
            <p>While you sleep, the AI researches, drafts, and sends — at exactly the right time.</p>
            <div className="bt-24">
              <div className="bt-24-ring" />
              <div className="bt-24-ring2" />
              <div className="bt-24-hands">
                <div className="bt-24-hand bt-24-hour" />
                <div className="bt-24-hand bt-24-min" />
              </div>
            </div>
          </div>

          <div className="tile reveal d3">
            <h3>We operate it. You own it.</h3>
            <p>No tools. No team. No guesswork. Just results showing up on your calendar.</p>
            <div className="bt-dots">
              {Array.from({ length: 24 }).map((_, i) => <div key={i} className="d" />)}
            </div>
          </div>

          <div className="tile reveal d2" style={{ gridColumn: 'span 2' }}>
            <h3>Learns. Adapts. Compounds.</h3>
            <p>The AI continuously learns what messaging resonates with your ideal client — so results compound month over month.</p>
            <div className="bt-graph">
              <svg viewBox="0 0 400 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="graphGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0B0B0C" stopOpacity="1" />
                    <stop offset="100%" stopColor="#0B0B0C" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path className="graph-fill" d="M0 100 L0 88 C60 85 120 75 180 60 C240 44 300 28 400 8 L400 100 Z" />
                <path className="graph-line" d="M0 88 C60 85 120 75 180 60 C240 44 300 28 400 8" />
                <circle className="graph-dot" cx="400" cy="8" r="5" />
              </svg>
            </div>
          </div>

          <div className="tile reveal d3">
            <h3>Only qualified meetings.</h3>
            <p>The AI qualifies every prospect before a single meeting gets booked. You only talk to people worth your time.</p>
            <div className="bt-check">
              <svg viewBox="0 0 110 110">
                <path className="ck-path" d="M18 58 L42 82 L92 28" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── VIDEO ──────────────────────────────────────── */
function Video() {
  return (
    <section className="video-section">
      <div className="zs-container" style={{ maxWidth: 900 }}>
        <div className="reveal">
          <span className="eyebrow">Meet The Founder</span>
          <h2 style={{ fontSize: 'clamp(40px,5vw,72px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, marginTop: 20, color: 'var(--zs-ink)' }}>See it for yourself.</h2>
        </div>
        <div className="video-wrap reveal d1">
          <iframe
            src="https://www.youtube.com/embed/xYVrAxbh_pI?rel=0&modestbranding=1&showinfo=0"
            title="Meet Ryan, Founder of ZionShift"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}

/* ─── PRICING ───────────────────────────────────── */
function Pricing({ onBook }: { onBook: () => void }) {
  return (
    <section id="pricing" className="zs-section">
      <div className="zs-narrow">
        <div className="reveal" style={{ marginBottom: 56 }}>
          <span className="eyebrow">Pricing</span>
          <h2 style={{ fontSize: 'clamp(40px,5vw,72px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, marginTop: 20, color: 'var(--zs-ink)' }}>Simple, transparent pricing.</h2>
        </div>
        <div className="pricing-card reveal d1">
          <div className="pricing-row">
            <div className="pricing-item">
              <span className="pricing-label">One-time setup</span>
              <span className="pricing-amount">$1,000</span>
            </div>
            <div className="pricing-divider" />
            <div className="pricing-item">
              <span className="pricing-label">Monthly retainer</span>
              <span className="pricing-amount">$2,000</span>
            </div>
          </div>
          <p className="pricing-note" style={{ fontWeight: 600, fontSize: 15, color: 'var(--zs-ink)' }}>
            You don&apos;t pay a single dollar of the monthly retainer until a qualified prospect is on your calendar. No contracts. Cancel anytime.
          </p>
          <button className="btn btn-primary" onClick={onBook} style={{ marginTop: 32 }}>
            Book a free call<span className="chev">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ────────────────────────────────────────── */
function FAQ() {
  const [open, setOpen] = useState(0);
  const faqs = [
    { q: 'How does the AI find qualified leads?', a: 'Our AI scans thousands of signals to identify small business owners who are growing and likely need bookkeeping support — recent hiring, revenue growth, new entity formations, funding, and more. It writes and sends personalized outreach on your behalf, 24/7, positioning your firm as the right solution at the right time.' },
    { q: 'Is this really hands-free?', a: "Yes. After a quick onboarding call where you tell us your ideal client, the AI handles everything — prospect research, personalized outreach, follow-ups, and conversation management." },
    { q: 'How long until I see booked calls?', a: 'After a quick onboarding and setup period, most clients begin seeing qualified meetings within the first few weeks. The AI continuously learns what messaging resonates best with your specific audience, so results typically improve month over month.' },
    { q: 'What does it cost?', a: 'Simple and transparent: a one-time $1,000 setup fee and a $2,000 monthly retainer — a fraction of what a human SDR or traditional agency would cost. No contract. Book a call and we\'ll walk through everything.' },
    { q: 'What kinds of businesses do you work with?', a: 'We work exclusively with bookkeeping firms that serve small to mid-sized businesses. Our AI targets the types of owner-operated businesses that make ideal bookkeeping clients — trades, contractors, dental and medical practices, law firms, real estate teams, e-commerce brands, and more.' },
    { q: 'Can I cancel anytime?', a: 'Yes. Month-to-month. No contract. No cancellation fees.' },
  ];
  return (
    <section id="faq" className="zs-section">
      <div className="zs-narrow">
        <div className="reveal" style={{ marginBottom: 56 }}>
          <span className="eyebrow">Common questions</span>
          <h2 style={{ fontSize: 'clamp(40px,5vw,72px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, marginTop: 20, color: 'var(--zs-ink)' }}>
            Questions, answered.
          </h2>
        </div>
        <div className="reveal d1">
          {faqs.map((f, i) => (
            <div key={i} className="faq-item" data-open={open === i ? true : undefined}>
              <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)}>
                <span>{f.q}</span>
                <span className="faq-plus">+</span>
              </button>
              <div className="faq-a"><p>{f.a}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ────────────────────────────────────────── */
function CTA({ onBook }: { onBook: () => void }) {
  return (
    <section className="zs-section">
      <div className="zs-container">
        <div className="cta-wrap reveal">
          <h2>Your next client isn&apos;t coming from a referral.</h2>
          <p style={{ margin: '32px auto 0', maxWidth: 560, fontSize: 19, lineHeight: 1.5 }}>
            One call. We&apos;ll show you exactly what a consistent, referral-free pipeline looks like for your firm.
          </p>
          <div style={{ marginTop: 40, position: 'relative', zIndex: 1 }}>
            <button className="btn btn-primary btn-lg" onClick={onBook} style={{ background: '#fff', color: 'var(--zs-ink)' }}>
              Book a free call<span className="chev">→</span>
            </button>
          </div>
          <p style={{ marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.5)', position: 'relative', zIndex: 1 }}>
            No commitment · No sales pitch · Just a real conversation
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─── FOOTER ─────────────────────────────────────── */
function Footer() {
  return (
    <footer className="zs-footer">
      <div className="zs-container inner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="ZionShift" />
        <p>© 2026 ZionShift. All rights reserved.</p>
      </div>
    </footer>
  );
}

/* ─── MODAL ──────────────────────────────────────── */
interface FormState { name: string; email: string; phone: string; business: string; challenge: string; }

function Modal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState<FormState>({ name: '', email: '', phone: '', business: '', challenge: '' });
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; }, [open]);

  const close = useCallback(() => {
    setSubmitted(false);
    setFormError('');
    setForm({ name: '', email: '', phone: '', business: '', challenge: '' });
    onClose();
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFormError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) close(); }}
    >
      <div className="modal">
        <button className="modal-close" onClick={close} aria-label="Close">✕</button>
        <div className="modal-scroll">
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: 999, background: '#E8F1EA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1F6B3A" strokeWidth="2.5">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.025em', margin: 0 }}>You&apos;re in.</h3>
              <p style={{ color: 'var(--zs-ink-4)', marginTop: 10 }}>We&apos;ll reach out within 24 hours to schedule your call.</p>
              <button className="btn btn-primary" style={{ marginTop: 28, width: '100%' }} onClick={close}>Close</button>
            </div>
          ) : (
            <>
              <h3 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', margin: 0 }}>Book a free strategy call</h3>
              <p style={{ fontSize: 14, color: 'var(--zs-ink-4)', marginTop: 6, marginBottom: 20 }}>No commitment · No sales pitch · Just a real conversation.</p>

              {/* ── Calendly quick-book ── */}
              <div className="modal-cal-block">
                <div>
                  <div className="modal-cal-label">Ready to jump on now?</div>
                  <div className="modal-cal-sub">Skip the form — pick a time and we&apos;ll meet on Zoom.</div>
                </div>
                {/* TODO (Calendly): replace href="#" with your Calendly link */}
                <a href="#" target="_blank" rel="noopener noreferrer" className="btn btn-primary modal-cal-btn">
                  See availability <span className="chev">→</span>
                </a>
              </div>

              {/* ── Divider ── */}
              <div className="modal-divider">
                <span>or tell us about your business first</span>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="field"><label>Your name</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Rivera" /></div>
                <div className="field"><label>Email</label><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@firm.com" /></div>
                <div className="field"><label>Phone</label><input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(555) 000-0000" /></div>
                <div className="field"><label>Business</label><input value={form.business} onChange={(e) => setForm({ ...form, business: e.target.value })} placeholder="Rivera Consulting LLC" /></div>
                <div className="field"><label>Biggest challenge</label><textarea value={form.challenge} onChange={(e) => setForm({ ...form, challenge: e.target.value })} placeholder="e.g. Too reliant on referrals, need a consistent pipeline…" /></div>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: 20, width: '100%', padding: '14px' }}>
                  {loading ? 'Sending…' : <>Book your free strategy call<span className="chev">→</span></>}
                </button>
                {formError && <p style={{ marginTop: 12, fontSize: 13, color: 'var(--zs-signal)', textAlign: 'center' }}>{formError}</p>}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── ROOT ───────────────────────────────────────── */
export default function Home() {
  useReveal();
  useScrollProgress();
  const [modal, setModal] = useState(false);
  const openModal = useCallback(() => setModal(true), []);
  const closeModal = useCallback(() => setModal(false), []);

  return (
    <>
      <div className="scroll-progress" />
      <Nav onBook={openModal} />
      <Hero onBook={openModal} />
      <Stats />
      <Process />
      <Bento />
      <Video />
      <Pricing onBook={openModal} />
      <FAQ />
      <CTA onBook={openModal} />
      <Footer />
      <Modal open={modal} onClose={closeModal} />
    </>
  );
}
