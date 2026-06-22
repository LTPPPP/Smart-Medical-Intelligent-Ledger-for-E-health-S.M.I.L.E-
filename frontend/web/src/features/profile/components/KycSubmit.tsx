'use client';

import { useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { useMyKyc, useSubmitKyc } from '../hooks/useKyc';

const STATUS_CONFIG = {
  NOT_SUBMITTED: { icon: 'lucide:shield-off', color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200 dark:bg-slate-900/20 dark:border-slate-700', label: 'Not Submitted', desc: 'Submit your ID to verify your identity.' },
  PENDING_REVIEW: { icon: 'lucide:clock', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700', label: 'Pending Review', desc: "Your submission is under review. We'll notify you once complete." },
  VERIFIED: { icon: 'lucide:shield-check', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700', label: 'Verified', desc: 'Your identity has been successfully verified.' },
  REJECTED: { icon: 'lucide:shield-x', color: 'text-red-600', bg: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700', label: 'Rejected', desc: 'Your submission was rejected. Please resubmit with correct documents.' },
} as const;

function FileDropZone({ label, file, onChange, accept }: {
  label: string;
  file: File | null;
  onChange: (f: File) => void;
  accept?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <p className="mb-1.5 font-inter text-xs font-semibold uppercase tracking-[1.5px] text-smile-description">{label}</p>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-6 transition-colors hover:border-smile-primary hover:bg-smile-primary-light/30"
        style={{ borderColor: file ? 'var(--color-smile-primary)' : 'var(--surface-panel-border)', background: file ? 'var(--surface-footer-bg)' : undefined }}
      >
        {file ? (
          <>
            <Icon icon="lucide:file-check-2" width={28} className="text-smile-primary" />
            <span className="max-w-[180px] truncate font-inter text-xs font-medium text-smile-primary">{file.name}</span>
            <span className="font-inter text-[10px] text-smile-description">{(file.size / 1024).toFixed(0)} KB — click to change</span>
          </>
        ) : (
          <>
            <Icon icon="lucide:upload-cloud" width={28} className="text-smile-description" />
            <span className="font-inter text-xs text-smile-description">Click to upload</span>
            <span className="font-inter text-[10px] text-smile-description">JPG, PNG, PDF · max 5 MB</span>
          </>
        )}
      </button>
      <input ref={ref} type="file" accept={accept ?? 'image/jpeg,image/png,application/pdf'} className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onChange(f); }} />
    </div>
  );
}

function ConsentRow({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <span className={`relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${checked ? 'border-smile-primary bg-smile-primary' : 'border-gray-300 dark:border-white/20'}`}>
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        {checked && <Icon icon="lucide:check" width={10} className="pointer-events-none text-white" />}
      </span>
      <span className="font-inter text-xs text-smile-title">{children}</span>
    </label>
  );
}

export function KycSubmit() {
  const { data: kyc, isLoading } = useMyKyc();
  const submitKyc = useSubmitKyc();

  const [form, setForm] = useState({ idNumber: '', fullName: '', dateOfBirth: '' });
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [consents, setConsents] = useState({ main: false, storage: false, ocr: false, noMarketing: false });
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const status = kyc?.status ?? 'NOT_SUBMITTED';
  const cfg = STATUS_CONFIG[status];
  const canSubmit = status === 'NOT_SUBMITTED' || status === 'REJECTED';
  const allConsents = consents.main && consents.storage && consents.ocr && consents.noMarketing;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idFront || !idBack) { setMsg({ type: 'error', text: 'Please upload both front and back of your ID.' }); return; }
    if (!allConsents) { setMsg({ type: 'error', text: 'Please accept all consents to proceed.' }); return; }
    if (!/^\d{12}$/.test(form.idNumber)) { setMsg({ type: 'error', text: 'ID number must be exactly 12 digits.' }); return; }
    try {
      await submitKyc.mutateAsync({ ...form, idFront, idBack });
      setMsg({ type: 'success', text: 'KYC submitted successfully! Your documents are under review.' });
      setForm({ idNumber: '', fullName: '', dateOfBirth: '' });
      setIdFront(null); setIdBack(null);
      setConsents({ main: false, storage: false, ocr: false, noMarketing: false });
    } catch {
      setMsg({ type: 'error', text: 'Submission failed. Please try again.' });
    }
    setTimeout(() => setMsg(null), 5000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Icon icon="line-md:loading-twotone-loop" width={32} className="text-smile-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Current status banner */}
      <div className={`flex items-start gap-4 rounded-2xl border p-5 ${cfg.bg}`}>
        <Icon icon={cfg.icon} width={28} className={`mt-0.5 shrink-0 ${cfg.color}`} />
        <div className="min-w-0">
          <p className={`font-poppins text-sm font-semibold ${cfg.color}`}>{cfg.label}</p>
          <p className="mt-0.5 font-inter text-xs text-smile-title">{cfg.desc}</p>

          {status === 'REJECTED' && kyc?.rejectionReason && (
            <p className="mt-2 font-inter text-xs text-red-700 dark:text-red-400">
              <span className="font-semibold">Reason:</span> {kyc.rejectionReason}
            </p>
          )}

          {status === 'VERIFIED' && (
            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 font-inter text-xs text-smile-description">
              {kyc?.fullName && <span><span className="font-semibold">Name:</span> {kyc.fullName}</span>}
              {kyc?.idNumberMasked && <span><span className="font-semibold">ID:</span> {kyc.idNumberMasked}</span>}
              {kyc?.verifiedAt && <span><span className="font-semibold">Verified:</span> {new Date(kyc.verifiedAt).toLocaleDateString()}</span>}
            </div>
          )}

          {status === 'PENDING_REVIEW' && kyc?.submittedAt && (
            <p className="mt-1.5 font-inter text-xs text-smile-description">
              Submitted {new Date(kyc.submittedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Submission form — only when allowed */}
      {canSubmit && (
        <form onSubmit={handleSubmit} className="space-y-5">
          {msg && (
            <div className={`flex items-center gap-2 rounded-xl px-4 py-3 font-inter text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'}`}>
              <Icon icon={msg.type === 'success' ? 'lucide:check-circle' : 'lucide:alert-circle'} width={16} />
              {msg.text}
            </div>
          )}

          {/* ID type badge */}
          <div>
            <p className="mb-1.5 font-inter text-xs font-semibold uppercase tracking-[1.5px] text-smile-description">Document Type</p>
            <div className="inline-flex items-center gap-2 rounded-full border bg-smile-primary-light px-4 py-2 font-inter text-sm font-semibold text-smile-primary" style={{ borderColor: 'var(--color-smile-primary)' }}>
              <Icon icon="lucide:id-card" width={15} />
              Citizen ID (CCCD)
            </div>
          </div>

          {/* Text fields */}
          {([
            { label: 'Full Name (as on ID)', key: 'fullName' as const, type: 'text', placeholder: 'Nguyen Van A' },
            { label: 'ID Number (12 digits)', key: 'idNumber' as const, type: 'text', placeholder: '079123456789', maxLength: 12 },
          ]).map(({ label, key, type, placeholder, maxLength }) => (
            <div key={key} className="group">
              <p className="mb-1 font-inter text-xs font-semibold uppercase tracking-[1.5px] text-smile-description">{label}</p>
              <div className="flex items-center gap-2 pb-2">
                <input
                  required
                  type={type}
                  placeholder={placeholder}
                  maxLength={maxLength}
                  value={form[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  className="w-full bg-transparent py-1 font-poppins text-sm text-smile-title outline-none placeholder:text-smile-description"
                />
              </div>
              <div className="h-px w-full transition-colors group-focus-within:bg-smile-primary" style={{ background: 'var(--surface-panel-border)' }} />
            </div>
          ))}

          <div className="group">
            <p className="mb-1 font-inter text-xs font-semibold uppercase tracking-[1.5px] text-smile-description">Date of Birth</p>
            <div className="pb-2">
              <input
                required
                type="date"
                value={form.dateOfBirth}
                onChange={e => setForm({ ...form, dateOfBirth: e.target.value })}
                className="bg-transparent py-1 font-poppins text-sm text-smile-title outline-none [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
            <div className="h-px w-full transition-colors group-focus-within:bg-smile-primary" style={{ background: 'var(--surface-panel-border)' }} />
          </div>

          {/* File uploads */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FileDropZone label="ID Front *" file={idFront} onChange={setIdFront} />
            <FileDropZone label="ID Back *" file={idBack} onChange={setIdBack} />
          </div>

          {/* Consents */}
          <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface-footer-bg)', borderColor: 'var(--surface-panel-border)' }}>
            <p className="font-inter text-xs font-semibold uppercase tracking-[1.5px] text-smile-description">Consent & Privacy</p>
            <ConsentRow checked={consents.main} onChange={v => setConsents({ ...consents, main: v })}>
              I consent to S.M.I.L.E processing my identity information for KYC verification purposes.
            </ConsentRow>
            <ConsentRow checked={consents.storage} onChange={v => setConsents({ ...consents, storage: v })}>
              I allow S.M.I.L.E to securely store my uploaded identity document images for manual review.
            </ConsentRow>
            <ConsentRow checked={consents.ocr} onChange={v => setConsents({ ...consents, ocr: v })}>
              I allow OCR processing of my identity documents to support verification.
            </ConsentRow>
            <ConsentRow checked={consents.noMarketing} onChange={v => setConsents({ ...consents, noMarketing: v })}>
              I acknowledge that my KYC data will not be used for marketing purposes.
            </ConsentRow>
          </div>

          <button
            type="submit"
            disabled={submitKyc.isPending || !allConsents}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-smile-primary py-3.5 font-poppins text-sm font-semibold text-white shadow-[0_4px_16px_rgba(65,126,170,0.4)] transition-all hover:bg-smile-primary-dark hover:shadow-[0_6px_20px_rgba(65,126,170,0.5)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitKyc.isPending && <Icon icon="line-md:loading-twotone-loop" width={16} />}
            {status === 'REJECTED' ? 'Resubmit KYC' : 'Submit KYC'}
          </button>
        </form>
      )}
    </div>
  );
}
