'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

/* ─── Constants ──────────────────────────────────────────────── */

const INDUSTRIES = [
  'Restaurants & Food Service', 'Construction & Contractors',
  'Medical & Dental', 'Real Estate', 'Retail', 'E-commerce',
  'Legal', 'Manufacturing', 'Transportation', 'Non-profit', 'Other',
];
const EMPLOYEE_COUNTS = ['1–10', '11–50', '51–200', '201–500', '501–1,000', '1,000+'];
const REVENUE_RANGES = ['Under $500K', '$500K–$2M', '$2M–$10M', '$10M+', 'Not sure'];
const GEO_OPTIONS    = ['Local only', 'Regional', 'Nationwide'];
const TONES          = ['Formal and professional', 'Friendly and conversational', 'Somewhere in between'];
const DAYS           = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS     = ['Morning (8am–12pm)', 'Afternoon (12pm–5pm)', 'Evening (5pm–8pm)'];
const CALL_LENGTHS   = ['20 minutes', '30 minutes', '45 minutes', '60 minutes'];
const TIMEZONES      = ['Eastern', 'Central', 'Mountain', 'Pacific', 'Alaska', 'Hawaii'];

/* ─── Types ──────────────────────────────────────────────────── */

interface FormState {
  firstName: string; lastName: string; businessName: string;
  cityState: string; yearsInBusiness: string; websiteUrl: string;
  logo: File | null; headshot: File | null;
  industries: string[]; otherIndustry: string;
  employeeCount: string[]; revenueRange: string[]; geoFocus: string[]; regionalStates: string;
  differentiator: string; painPoint: string; transformation: string;
  tone: string; avoidances: string;
  availableDays: string[]; timeSlots: string[]; callLength: string; timezone: string;
  exclusions: string; prospectNote: string; referralSource: string;
}

const DEFAULT_FORM: FormState = {
  firstName: '', lastName: '', businessName: '',
  cityState: '', yearsInBusiness: '', websiteUrl: '',
  logo: null, headshot: null,
  industries: [], otherIndustry: '',
  employeeCount: [], revenueRange: [], geoFocus: [], regionalStates: '',
  differentiator: '', painPoint: '', transformation: '',
  tone: '', avoidances: '',
  availableDays: [], timeSlots: [], callLength: '', timezone: '',
  exclusions: '', prospectNote: '', referralSource: '',
};

/* ─── Helpers ────────────────────────────────────────────────── */

function tog(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
}

function single(current: string, val: string): string {
  return current === val ? '' : val;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ─── ChipGroup ──────────────────────────────────────────────── */

function ChipGroup({ options, selected, onToggle }: {
  options: string[];
  selected: string[];
  onToggle: (val: string) => void;
}) {
  return (
    <div className="ob-chip-group">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          className={`ob-chip${selected.includes(opt) ? ' selected' : ''}`}
          onClick={() => onToggle(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

/* ─── CheckDropdown ──────────────────────────────────────────── */

function CheckDropdown({ options, selected, onToggle, placeholder, multi = true, radio = false, inlineInput, descriptions }: {
  options: string[];
  selected: string[];
  onToggle: (val: string) => void;
  placeholder: string;
  multi?: boolean;
  radio?: boolean;
  inlineInput?: {
    forOption: string;
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
  };
  descriptions?: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  function triggerLabel() {
    if (selected.length === 0) return placeholder;
    return selected.join(', ');
  }

  function handleToggle(val: string) {
    onToggle(val);
    if (!multi) setOpen(false);
  }

  return (
    <div className="ob-dd" ref={ref}>
      <button
        type="button"
        className={`ob-dd-trigger${open ? ' open' : ''}${selected.length > 0 ? ' has-value' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="ob-dd-trigger-label">{triggerLabel()}</span>
        <svg
          className={`ob-dd-caret${open ? ' open' : ''}`}
          width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          aria-hidden
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="ob-dd-panel" role="listbox" aria-multiselectable={multi}>
          {options.flatMap(opt => {
            const checked = selected.includes(opt);
            const rows = [
              <button
                key={opt}
                type="button"
                className={`ob-dd-row${checked ? ' checked' : ''}`}
                onClick={() => handleToggle(opt)}
                role="option"
                aria-selected={checked}
              >
                <span className={`ob-dd-check${radio ? ' radio' : ''}${checked ? ' checked' : ''}`} aria-hidden>
                  {checked && (
                    radio
                      ? <span className="ob-dd-radio-dot" />
                      : <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="2 6 5 9 10 3" />
                        </svg>
                  )}
                </span>
                <span className="ob-dd-opt-label">{opt}</span>
                {descriptions?.[opt] && (
                  <span className="ob-dd-opt-desc">{descriptions[opt]}</span>
                )}
              </button>,
            ];
            if (inlineInput && opt === inlineInput.forOption && checked) {
              rows.push(
                <div key={`${opt}-inline`} className="ob-dd-inline-row">
                  <input
                    type="text"
                    className="ob-dd-inline-input"
                    value={inlineInput.value}
                    onChange={e => inlineInput.onChange(e.target.value)}
                    placeholder={inlineInput.placeholder}
                    autoFocus
                    onClick={e => e.stopPropagation()}
                  />
                </div>
              );
            }
            return rows;
          })}
        </div>
      )}
    </div>
  );
}

/* ─── FileUpload ─────────────────────────────────────────────── */

function FileUpload({ label, helper, file, onChange }: {
  label: string;
  helper: string;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  const inputRef  = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [err, setErr]         = useState('');

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleFile(f: File) {
    setErr('');
    if (f.size > 2 * 1024 * 1024) { setErr('File must be under 2MB.'); return; }
    onChange(f);
  }

  return (
    <div>
      <div className="ob-upload-zone" onClick={() => inputRef.current?.click()}>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Preview" className="ob-upload-preview" />
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--zs-ink-5)', flexShrink: 0 }} aria-hidden>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span className="ob-upload-label">{label}</span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
        />
      </div>
      {file && (
        <button type="button" className="ob-upload-reselect" onClick={() => { onChange(null); setErr(''); }}>
          Remove
        </button>
      )}
      <p className="ob-helper">{helper}</p>
      {err && <p className="ob-error" style={{ margin: '4px 0 0' }}>{err}</p>}
    </div>
  );
}

/* ─── Screen 1 ───────────────────────────────────────────────── */

function Screen1({ form, set }: { form: FormState; set: (f: FormState) => void }) {
  const upd = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    set({ ...form, [key]: e.target.value });
  return (
    <div className="ob-screen">
      <h2 className="ob-screen-title">About you.</h2>
      <p className="ob-screen-sub">Tell us about yourself and your firm so we can build your campaign around you.</p>

      <div className="ob-row-2">
        <div className="field">
          <label>First name <span className="ob-req">*</span></label>
          <input type="text" value={form.firstName} onChange={upd('firstName')} placeholder="John" autoFocus />
        </div>
        <div className="field">
          <label>Last name <span className="ob-req">*</span></label>
          <input type="text" value={form.lastName} onChange={upd('lastName')} placeholder="Smith" />
        </div>
      </div>

      <div className="field">
        <label>Business name <span className="ob-req">*</span></label>
        <input type="text" value={form.businessName} onChange={upd('businessName')} placeholder="Smith Bookkeeping LLC" />
      </div>

      <div className="ob-row-2">
        <div className="field">
          <label>City &amp; state <span className="ob-req">*</span></label>
          <input type="text" value={form.cityState} onChange={upd('cityState')} placeholder="Austin, TX" />
        </div>
        <div className="field">
          <label>Years in business <span className="ob-req">*</span></label>
          <input type="number" min="0" value={form.yearsInBusiness} onChange={upd('yearsInBusiness')} placeholder="5" />
        </div>
      </div>

      <div className="field">
        <label>Business website</label>
        <input type="url" value={form.websiteUrl} onChange={upd('websiteUrl')} placeholder="https://yourfirm.com" />
        <p className="ob-helper">Don&apos;t have one? Leave this blank.</p>
      </div>

      <div className="ob-row-2" style={{ marginTop: 20 }}>
        <div>
          <p className="ob-upload-heading">Logo <span className="ob-optional">(optional)</span></p>
          <FileUpload
            label="Upload logo"
            helper="Appears on your ZionShift dashboard. PNG or JPG, under 2MB."
            file={form.logo}
            onChange={f => set({ ...form, logo: f })}
          />
        </div>
        <div>
          <p className="ob-upload-heading">Headshot <span className="ob-optional">(optional)</span></p>
          <FileUpload
            label="Upload headshot"
            helper="Recommended — used on your booking page so prospects know who they&apos;re meeting. If skipped, we&apos;ll use your initials."
            file={form.headshot}
            onChange={f => set({ ...form, headshot: f })}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Screen 2 ───────────────────────────────────────────────── */

function Screen2({ form, set }: { form: FormState; set: (f: FormState) => void }) {
  return (
    <div className="ob-screen">
      <h2 className="ob-screen-title">Your ideal client.</h2>
      <p className="ob-screen-sub">We use this to target the right business owners for your firm.</p>

      <div className="ob-field-group">
        <label className="ob-group-label">Industries your best clients come from <span className="ob-req">*</span></label>
        <CheckDropdown
          options={INDUSTRIES}
          selected={form.industries}
          onToggle={val => set({ ...form, industries: tog(form.industries, val) })}
          placeholder="Select industries…"
          multi
          inlineInput={{
            forOption: 'Other',
            value: form.otherIndustry,
            onChange: v => set({ ...form, otherIndustry: v }),
            placeholder: 'e.g. Agriculture, Entertainment…',
          }}
        />
      </div>

      <div className="ob-field-group">
        <label className="ob-group-label">Typical employee count of ideal clients <span className="ob-req">*</span></label>
        <CheckDropdown
          options={EMPLOYEE_COUNTS}
          selected={form.employeeCount}
          onToggle={val => set({ ...form, employeeCount: tog(form.employeeCount, val) })}
          placeholder="Select employee ranges…"
          multi
        />
      </div>

      <div className="ob-field-group">
        <label className="ob-group-label">Typical annual revenue <span className="ob-req">*</span></label>
        <CheckDropdown
          options={REVENUE_RANGES}
          selected={form.revenueRange}
          onToggle={val => set({ ...form, revenueRange: tog(form.revenueRange, val) })}
          placeholder="Select revenue ranges…"
          multi
        />
      </div>

      <div className="ob-field-group" style={{ marginBottom: 0 }}>
        <label className="ob-group-label">Geographic focus <span className="ob-req">*</span></label>
        <CheckDropdown
          options={GEO_OPTIONS}
          selected={form.geoFocus}
          onToggle={val => set({ ...form, geoFocus: form.geoFocus[0] === val ? [] : [val] })}
          placeholder="Select geographic focus…"
          radio
          descriptions={{
            'Local only':   '~50 mi radius of your city',
            'Regional':     'cluster of nearby states',
            'Nationwide':   'all 50 states, any time zone',
          }}
          inlineInput={{
            forOption: 'Regional',
            value: form.regionalStates,
            onChange: v => set({ ...form, regionalStates: v }),
            placeholder: 'e.g. Texas, Oklahoma, Louisiana…',
          }}
        />
      </div>

      <div className="field">
        <label>Any types of businesses you absolutely do NOT want as clients? <span className="ob-optional">(optional)</span></label>
        <textarea
          value={form.exclusions}
          onChange={e => set({ ...form, exclusions: e.target.value })}
          rows={3}
          placeholder="e.g. Businesses under 1 year old, sole proprietors, companies outside my target industries…"
        />
      </div>
    </div>
  );
}

/* ─── Screen 3 ───────────────────────────────────────────────── */

function Screen3({ form, set }: { form: FormState; set: (f: FormState) => void }) {
  const ta = (key: keyof FormState) => (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    set({ ...form, [key]: e.target.value });
  return (
    <div className="ob-screen">
      <h2 className="ob-screen-title">Your voice.</h2>
      <p className="ob-screen-sub">This shapes how we write your outreach — the more specific, the better.</p>

      <div className="field">
        <label>In one sentence, what makes your firm different from every other bookkeeper? <span className="ob-req">*</span></label>
        <textarea
          value={form.differentiator}
          onChange={ta('differentiator')}
          rows={3}
          placeholder="e.g. We specialize in construction companies and give every client a dedicated bookkeeper who actually picks up the phone."
        />
      </div>

      <div className="field">
        <label>What is the #1 pain your clients feel before they find you? <span className="ob-req">*</span></label>
        <textarea
          value={form.painPoint}
          onChange={ta('painPoint')}
          rows={3}
          placeholder="e.g. They're drowning in receipts, behind on their books, and terrified of tax season."
        />
      </div>

      <div className="field">
        <label>What does life look like for your clients 90 days after working with you? <span className="ob-req">*</span></label>
        <textarea
          value={form.transformation}
          onChange={ta('transformation')}
          rows={3}
          placeholder="e.g. Their books are clean, they have real-time P&L reports, and they finally feel in control of their business finances."
        />
      </div>

      <div className="ob-field-group">
        <label className="ob-group-label">Preferred tone for outreach <span className="ob-req">*</span></label>
        <CheckDropdown
          options={TONES}
          selected={form.tone ? [form.tone] : []}
          onToggle={val => set({ ...form, tone: single(form.tone, val) })}
          placeholder="Select a tone…"
          radio
          multi={false}
        />
      </div>

      <div className="field">
        <label>Anything specific prospects should know before getting on a call with you? <span className="ob-optional">(optional)</span></label>
        <textarea
          value={form.prospectNote}
          onChange={e => set({ ...form, prospectNote: e.target.value })}
          rows={3}
          placeholder="e.g. I prefer clients who have been in business at least one year and have a dedicated point of contact for their finances."
        />
      </div>

      <div className="field">
        <label>Anything you never want said in outreach — competitors, phrases, or topics to avoid <span className="ob-optional">(optional)</span></label>
        <textarea
          value={form.avoidances}
          onChange={ta('avoidances')}
          rows={2}
          placeholder="e.g. Don't reference competitors by name, no industry jargon or buzzwords…"
        />
      </div>
    </div>
  );
}

/* ─── Screen 4 ───────────────────────────────────────────────── */

function Screen4({ form, set }: { form: FormState; set: (f: FormState) => void }) {
  return (
    <div className="ob-screen">
      <h2 className="ob-screen-title">Your availability.</h2>
      <p className="ob-screen-sub">We use this to set up your booking page so prospects can only schedule when you&apos;re free.</p>

      <div className="ob-field-group">
        <label className="ob-group-label">What days are you available for discovery calls? <span className="ob-req">*</span></label>
        <ChipGroup
          options={DAYS}
          selected={form.availableDays}
          onToggle={val => set({ ...form, availableDays: tog(form.availableDays, val) })}
        />
      </div>

      <div className="ob-field-group">
        <label className="ob-group-label">What time slots work best? <span className="ob-req">*</span></label>
        <ChipGroup
          options={TIME_SLOTS}
          selected={form.timeSlots}
          onToggle={val => set({ ...form, timeSlots: tog(form.timeSlots, val) })}
        />
      </div>

      <div className="ob-field-group">
        <label className="ob-group-label">How long should each discovery call be? <span className="ob-req">*</span></label>
        <ChipGroup
          options={CALL_LENGTHS}
          selected={form.callLength ? [form.callLength] : []}
          onToggle={val => set({ ...form, callLength: single(form.callLength, val) })}
        />
      </div>

      <div className="ob-field-group">
        <label className="ob-group-label">Your time zone <span className="ob-req">*</span></label>
        <select
          className="ob-select"
          value={form.timezone}
          onChange={e => set({ ...form, timezone: e.target.value })}
        >
          <option value="">Select a time zone…</option>
          {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
        </select>
      </div>
    </div>
  );
}

/* ─── Screen 5 ───────────────────────────────────────────────── */

function Screen5({ form, set }: { form: FormState; set: (f: FormState) => void }) {
  return (
    <div className="ob-screen">
      <h2 className="ob-screen-title">Final details.</h2>
      <p className="ob-screen-sub">A few last things to make sure your campaign is dialed in perfectly.</p>

      <div className="field">
        <label>How did you hear about ZionShift?</label>
        <input
          type="text"
          value={form.referralSource}
          onChange={e => set({ ...form, referralSource: e.target.value })}
          placeholder="Referred by a friend, social media, Google…"
        />
      </div>
    </div>
  );
}

/* ─── Screen 6 — Confirmation ────────────────────────────────── */

function Screen6({ submitting, submitError, onSubmit }: {
  submitting: boolean;
  submitError: string;
  onSubmit: () => void;
}) {
  return (
    <div className="ob-screen">
      <h2 className="ob-screen-title">You&apos;re all set.</h2>
      <p className="ob-screen-sub" style={{ marginBottom: 24 }}>Here&apos;s what happens from here.</p>

      <div className="ob-confirm-grid">
        <div className="ob-confirm-card">
          <div className="ob-confirm-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <p className="ob-confirm-label">Your campaign launches in 14 days.</p>
          <p className="ob-confirm-body">We spend the first two weeks warming up your email system so your messages land in inboxes, not spam. This is normal and intentional.</p>
        </div>

        <div className="ob-confirm-card">
          <div className="ob-confirm-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
          </div>
          <p className="ob-confirm-label">You won&apos;t be charged anything yet.</p>
          <p className="ob-confirm-body">Your $2,000/month retainer doesn&apos;t start until the first qualified lead lands on your calendar &mdash; and even then, billing begins 30 days after that.</p>
        </div>
      </div>

      {submitError && <p className="ob-error" style={{ marginTop: 16 }}>{submitError}</p>}

      <button
        type="button"
        className="btn btn-primary"
        onClick={onSubmit}
        disabled={submitting}
        style={{ width: '100%', marginTop: 28, padding: '16px', borderRadius: '10px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        {submitting ? (
          <><span className="ob-spinner" aria-hidden /> Setting up your account…</>
        ) : (
          <>Go to my dashboard <span className="chev">→</span></>
        )}
      </button>
    </div>
  );
}

/* ─── Validation ─────────────────────────────────────────────── */

function validate(step: number, form: FormState): string | null {
  if (step === 1) {
    if (!form.firstName.trim())      return 'First name is required.';
    if (!form.lastName.trim())       return 'Last name is required.';
    if (!form.businessName.trim())   return 'Business name is required.';
    if (!form.cityState.trim())      return 'City & state is required.';
    if (!form.yearsInBusiness.trim()) return 'Years in business is required.';
  }
  if (step === 2) {
    if (form.industries.length === 0) return 'Select at least one industry.';
    if (form.employeeCount.length === 0) return 'Select at least one employee range.';
    if (form.revenueRange.length === 0) return 'Select a revenue range.';
    if (form.geoFocus.length === 0)    return 'Select a geographic focus.';
    if (form.geoFocus.includes('Regional') && !form.regionalStates.trim()) return 'Please specify which states or region you want to target.';
  }
  if (step === 3) {
    if (!form.differentiator.trim()) return 'Tell us what makes your firm different.';
    if (!form.painPoint.trim())      return 'Tell us the #1 pain your clients feel.';
    if (!form.transformation.trim()) return 'Tell us what success looks like for your clients.';
    if (!form.tone)                  return 'Select a preferred tone.';
  }
  if (step === 4) {
    if (form.availableDays.length === 0) return 'Select at least one available day.';
    if (form.timeSlots.length === 0)     return 'Select at least one time slot.';
    if (!form.callLength)                return 'Select a call length.';
    if (!form.timezone)                  return 'Select your time zone.';
  }
  return null;
}

/* ─── OnboardInner ───────────────────────────────────────────── */

function OnboardInner() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const token        = searchParams.get('token') ?? '';

  type TState = 'loading' | 'valid' | 'invalid';
  const [tokenState, setTokenState]   = useState<TState>('loading');
  const [clientEmail, setClientEmail] = useState('');

  const [step, setStep]                   = useState(1);
  const [form, setForm]                   = useState<FormState>(DEFAULT_FORM);
  const [validationError, setValErr]      = useState('');
  const [submitting, setSubmitting]       = useState(false);
  const [submitError, setSubmitError]     = useState('');

  /* Validate token on mount */
  useEffect(() => {
    if (!token) { setTokenState('invalid'); return; }
    fetch(`/api/validate-token?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(d => {
        if (d.valid) { setClientEmail(d.email); setTokenState('valid'); }
        else         { setTokenState('invalid'); }
      })
      .catch(() => setTokenState('invalid'));
  }, [token]);

  function next() {
    const err = validate(step, form);
    if (err) { setValErr(err); return; }
    setValErr('');
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function back() {
    setValErr('');
    setStep(s => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submit() {
    setSubmitting(true);
    setSubmitError('');
    try {
      let logoBase64: string | null = null, logoExt: string | null = null;
      let headshotBase64: string | null = null, headshotExt: string | null = null;

      if (form.logo) {
        logoBase64 = await fileToBase64(form.logo);
        logoExt    = form.logo.name.split('.').pop()?.toLowerCase() ?? 'png';
      }
      if (form.headshot) {
        headshotBase64 = await fileToBase64(form.headshot);
        headshotExt    = form.headshot.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      }

      const res = await fetch('/api/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          firstName: form.firstName, lastName: form.lastName,
          businessName: form.businessName, cityState: form.cityState,
          yearsInBusiness: form.yearsInBusiness, websiteUrl: form.websiteUrl,
          logoBase64, logoExt, headshotBase64, headshotExt,
          industries: form.industries, otherIndustry: form.otherIndustry,
          employeeCount: form.employeeCount, revenueRange: form.revenueRange,
          geoFocus: form.geoFocus, differentiator: form.differentiator,
          painPoint: form.painPoint, transformation: form.transformation,
          tone: form.tone, avoidances: form.avoidances,
          availableDays: form.availableDays, timeSlots: form.timeSlots,
          callLength: form.callLength, timezone: form.timezone,
          exclusions: form.exclusions, prospectNote: form.prospectNote,
          referralSource: form.referralSource,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setSubmitError(data.error ?? 'Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }

      /* Sign in with temp credentials if provided */
      if (data.tempPass) {
        const supabase = createClient();
        await supabase.auth.signInWithPassword({ email: clientEmail, password: data.tempPass });
      }

      router.push('/client');
    } catch {
      setSubmitError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  /* ── Loading ── */
  if (tokenState === 'loading') {
    return (
      <div className="login-page">
        <div className="ob-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 36px', gap: 10 }}>
            <span className="ob-spinner-dark" aria-hidden />
            <span style={{ font: '400 14px var(--zs-mono)', color: 'var(--zs-ink-4)' }}>Verifying your link…</span>
          </div>
        </div>
      </div>
    );
  }

  /* ── Expired / Invalid ── */
  if (tokenState === 'invalid') {
    return (
      <div className="login-page">
        <div className="ob-card" style={{ textAlign: 'center', padding: '52px 40px 48px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <a href="/" style={{ display: 'inline-block', marginBottom: 32 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="ZionShift" className="login-logo" style={{ margin: '0 auto' }} />
          </a>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FFF1F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <h1 style={{ font: '700 28px var(--zs-sans)', letterSpacing: '-0.04em', color: 'var(--zs-ink)', margin: '0 0 10px', lineHeight: 1.1 }}>
            This link has expired.
          </h1>
          <p style={{ font: '400 15px var(--zs-sans)', color: 'var(--zs-ink-4)', margin: 0, lineHeight: 1.65 }}>
            Reply to your welcome email and we&apos;ll send you a new one.
          </p>
        </div>
      </div>
    );
  }

  /* ── Form ── */
  const TOTAL = 5;
  const pct   = Math.min(step, TOTAL) / TOTAL * 100;

  return (
    <div className="login-page" style={{ alignItems: 'flex-start', paddingTop: 40, paddingBottom: 40 }}>
      <div className="ob-card">

        {/* Logo */}
        <div className="ob-logo-row">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <a href="/"><img src="/logo.png" alt="ZionShift" className="login-logo" style={{ marginBottom: 0 }} /></a>
        </div>

        {/* Progress bar (steps 1–5 only) */}
        {step <= TOTAL && (
          <div className="ob-progress-track">
            <div className="ob-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        )}

        {/* Nav row (steps 1–5 only) */}
        {step <= TOTAL && (
          <div className="ob-nav">
            {step > 1 ? (
              <button type="button" className="ob-back-btn" onClick={back}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Back
              </button>
            ) : <span />}
            <span className="ob-step-label">Step {step} of {TOTAL}</span>
          </div>
        )}

        {/* Screen body — key drives re-mount + animation on step change */}
        <div className="ob-body" key={step}>
          {step === 1 && <Screen1 form={form} set={setForm} />}
          {step === 2 && <Screen2 form={form} set={setForm} />}
          {step === 3 && <Screen3 form={form} set={setForm} />}
          {step === 4 && <Screen4 form={form} set={setForm} />}
          {step === 5 && <Screen5 form={form} set={setForm} />}
          {step === 6 && <Screen6 submitting={submitting} submitError={submitError} onSubmit={submit} />}
        </div>

        {/* Validation error */}
        {validationError && step <= TOTAL && (
          <p className="ob-error" style={{ padding: '0 36px' }}>{validationError}</p>
        )}

        {/* Next button (steps 1–5 only) */}
        {step <= TOTAL && (
          <div className="ob-footer">
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', borderRadius: '10px', fontSize: '15px' }}
              onClick={next}
            >
              {step === TOTAL
                ? <>Review &amp; finish <span className="chev">→</span></>
                : <>Next <span className="chev">→</span></>
              }
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

/* ─── Default export ─────────────────────────────────────────── */

export default function OnboardPage() {
  return (
    <Suspense fallback={
      <div className="login-page">
        <div className="ob-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 36px', gap: 10 }}>
            <span className="ob-spinner-dark" aria-hidden />
            <span style={{ font: '400 14px var(--zs-mono)', color: 'var(--zs-ink-4)' }}>Loading…</span>
          </div>
        </div>
      </div>
    }>
      <OnboardInner />
    </Suspense>
  );
}
