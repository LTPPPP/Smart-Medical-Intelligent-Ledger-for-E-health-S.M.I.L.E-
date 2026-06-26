'use client';

import { useState } from 'react';

import { Icon } from '@iconify/react';

import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';


export interface PatientFormValues {
  patient_code: string;
  full_name: string;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  blood_type?: string;
  allergies?: string[];
  chronic_diseases?: string[];
  user_id?: string;
}

type PatientFormState = Omit<PatientFormValues, 'allergies' | 'chronic_diseases'> & {
  allergies?: string;
  chronic_diseases?: string;
};

type PatientFormInitial = Omit<Partial<PatientFormValues>, 'allergies' | 'chronic_diseases'> & {
  allergies?: string | string[];
  chronic_diseases?: string | string[];
};

const EMPTY: PatientFormState = {
  patient_code: '',
  full_name: '',
  date_of_birth: '',
  gender: '',
  phone: '',
  email: '',
  address: '',
  blood_type: '',
  allergies: '',
  chronic_diseases: '',
  user_id: '',
};

interface LinkedProfile {
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
}

const GENDER_OPTIONS = ['', 'MALE', 'FEMALE', 'OTHER'];
const BLOOD_OPTIONS = ['', 'A', 'B', 'AB', 'O', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const inputCls =
  'h-11 rounded-xl border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-4 text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-[rgba(146,205,253,0.5)]';

function Label({ label, required, children, colSpan }: { label: string; required?: boolean; children: React.ReactNode; colSpan?: boolean }) {
  return (
    <label className={`flex flex-col gap-1.5 ${colSpan ? 'sm:col-span-2' : ''}`}>
      <span className="text-xs font-semibold uppercase tracking-[1px] text-smile-description">
        {label}{required && <span className="text-smile-primary"> *</span>}
      </span>
      {children}
    </label>
  );
}

const formatListInput = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value.join(', ') : value ?? '';

const parseListInput = (value?: string) =>
  (value ?? '')
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

function LinkedAccountField({
  selectedUserId,
  onLink,
  onUnlink,
}: {
  selectedUserId?: string;
  onLink: (p: LinkedProfile) => void;
  onUnlink: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LinkedProfile[]>([]);
  const [linked, setLinked] = useState<LinkedProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.USER_PROFILES.LIST, {
        params: { email: query.trim() },
      });
      const rows: LinkedProfile[] = (data?.data ?? data ?? []).map((u: Record<string, unknown>) => ({
        user_id: String(u.user_id ?? ''),
        full_name: String(u.full_name ?? ''),
        email: String(u.email ?? ''),
        phone: u.phone ? String(u.phone) : undefined,
      })).filter((u: LinkedProfile) => u.user_id);
      setResults(rows);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const pick = (p: LinkedProfile) => {
    setLinked(p);
    setResults([]);
    setQuery('');
    setSearched(false);
    onLink(p);
  };

  const clear = () => {
    setLinked(null);
    onUnlink();
  };

  // Show a chip when a link exists (either just picked, or pre-filled via initial).
  if (selectedUserId && (linked || !query)) {
    return (
      <div className="sm:col-span-2 flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-[1px] text-smile-description">Linked account</span>
        <div className="flex items-center justify-between gap-3 rounded-xl border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-4 py-2.5">
          <span className="flex items-center gap-2 text-sm text-smile-title">
            <Icon icon="lucide:link-2" width={16} className="text-smile-primary" />
            {linked ? `${linked.full_name} (${linked.email})` : `Account linked (${selectedUserId.slice(0, 8)}…)`}
          </span>
          <button type="button" onClick={clear} className="text-smile-description transition hover:text-red-400">
            <Icon icon="lucide:x" width={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sm:col-span-2 flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-[1px] text-smile-description">Linked account (optional)</span>
      <div className="flex gap-2">
        <input
          className={`${inputCls} flex-1`}
          value={query}
          placeholder="Search by registered email…"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); search(); } }}
        />
        <button
          type="button"
          onClick={search}
          disabled={loading || !query.trim()}
          className="flex items-center gap-2 rounded-xl border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-4 text-sm font-semibold text-smile-title transition hover:border-white/25 disabled:opacity-50"
        >
          {loading ? <Icon icon="line-md:loading-twotone-loop" width={16} /> : <Icon icon="lucide:search" width={16} />}
          Search
        </button>
      </div>
      {results.length > 0 && (
        <div className="mt-1 flex flex-col gap-1 rounded-xl border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] p-1">
          {results.map((r) => (
            <button
              key={r.user_id}
              type="button"
              onClick={() => pick(r)}
              className="flex flex-col items-start rounded-lg px-3 py-2 text-left text-sm text-smile-title transition hover:bg-smile-primary/10"
            >
              <span className="font-medium">{r.full_name || '(no name)'}</span>
              <span className="text-xs text-smile-description">{r.email}{r.phone ? ` · ${r.phone}` : ''}</span>
            </button>
          ))}
        </div>
      )}
      {searched && !loading && results.length === 0 && (
        <span className="text-xs text-smile-description">No account found for that email.</span>
      )}
    </div>
  );
}

export function PatientFormDark({
  initial, submitting, submitLabel, onSubmit, onCancel,
}: {
  initial?: PatientFormInitial;
  submitting?: boolean;
  submitLabel: string;
  onSubmit: (values: PatientFormValues) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<PatientFormState>({
    ...EMPTY,
    ...initial,
    allergies: formatListInput(initial?.allergies),
    chronic_diseases: formatListInput(initial?.chronic_diseases),
  });
  const [error, setError] = useState('');
  const set = (k: keyof PatientFormState) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patient_code.trim() || !form.full_name.trim()) {
      setError('Patient code and full name are required.');
      return;
    }
    setError('');
    // Strip empty optional strings so the BE receives undefined instead of ''.
    const allergies = parseListInput(form.allergies);
    const chronicDiseases = parseListInput(form.chronic_diseases);
    const { allergies: _allergies, chronic_diseases: _chronicDiseases, ...base } = form;
    const cleaned: PatientFormValues = {
      ...base,
      ...(allergies.length > 0 ? { allergies } : {}),
      ...(chronicDiseases.length > 0 ? { chronic_diseases: chronicDiseases } : {}),
    };
    (Object.keys(cleaned) as (keyof PatientFormValues)[]).forEach((k) => {
      if (
        k !== 'patient_code' &&
        k !== 'full_name' &&
        (cleaned[k] === '' || (Array.isArray(cleaned[k]) && cleaned[k].length === 0))
      ) {
        delete cleaned[k];
      }
    });
    onSubmit(cleaned);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          <Icon icon="lucide:alert-circle" width={16} /> {error}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Label label="Patient code" required>
          <input className={inputCls} value={form.patient_code} placeholder="PAT-001" onChange={(e) => set('patient_code')(e.target.value)} />
        </Label>
        <Label label="Full name" required>
          <input className={inputCls} value={form.full_name} placeholder="Nguyễn Văn A" onChange={(e) => set('full_name')(e.target.value)} />
        </Label>
        <Label label="Date of birth">
          <input type="date" className={inputCls} value={form.date_of_birth ?? ''} onChange={(e) => set('date_of_birth')(e.target.value)} />
        </Label>
        <Label label="Gender">
          <select className={inputCls} value={form.gender ?? ''} onChange={(e) => set('gender')(e.target.value)}>
            {GENDER_OPTIONS.map((g) => <option key={g || 'none'} value={g} className="[background:var(--surface-input-bg)] text-smile-title">{g || '— select —'}</option>)}
          </select>
        </Label>
        <Label label="Phone">
          <input className={inputCls} value={form.phone ?? ''} placeholder="09xx xxx xxx" onChange={(e) => set('phone')(e.target.value)} />
        </Label>
        <Label label="Email">
          <input type="email" className={inputCls} value={form.email ?? ''} placeholder="patient@email.com" onChange={(e) => set('email')(e.target.value)} />
        </Label>
        <Label label="Blood type">
          <select className={inputCls} value={form.blood_type ?? ''} onChange={(e) => set('blood_type')(e.target.value)}>
            {BLOOD_OPTIONS.map((b) => <option key={b || 'none'} value={b} className="[background:var(--surface-input-bg)] text-smile-title">{b || '— select —'}</option>)}
          </select>
        </Label>
        <Label label="Address" colSpan>
          <input className={inputCls} value={form.address ?? ''} placeholder="Street, ward, district, city" onChange={(e) => set('address')(e.target.value)} />
        </Label>
        <Label label="Allergies" colSpan>
          <textarea className={`${inputCls} h-20 resize-none py-2.5`} value={form.allergies ?? ''} placeholder="Penicillin, latex…" onChange={(e) => set('allergies')(e.target.value)} />
        </Label>
        <Label label="Chronic diseases" colSpan>
          <textarea className={`${inputCls} h-20 resize-none py-2.5`} value={form.chronic_diseases ?? ''} placeholder="Diabetes, hypertension…" onChange={(e) => set('chronic_diseases')(e.target.value)} />
        </Label>
        <LinkedAccountField
          selectedUserId={form.user_id || undefined}
          onLink={(p) => setForm((f) => ({
            ...f,
            user_id: p.user_id,
            full_name: f.full_name || p.full_name,
            email: f.email || p.email,
            phone: f.phone || p.phone || '',
          }))}
          onUnlink={() => set('user_id')('')}
        />
      </div>
      <div className="flex justify-end gap-3">
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-full border [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)] px-5 py-3 text-sm font-semibold text-smile-title transition hover:border-white/25">
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition hover:bg-smile-primary-dark disabled:opacity-60 bg-smile-primary"
        >
          {submitting && <Icon icon="line-md:loading-twotone-loop" width={16} />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export default PatientFormDark;
