'use client';

import { useMemo, useState } from 'react';

import Image from 'next/image';

import { Icon } from '@iconify/react';

import { useAdmin } from '@/features/admin/hooks/useAdmin';
import type {
  AdminKycListParams,
  AdminKycRecord,
  AdminKycStatus,
} from '@/features/admin/types/admin.type';

const PAGE_SIZE = 12;

const formatDate = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))
    : '—';

const statusClass: Record<AdminKycStatus, string> = {
  NOT_SUBMITTED: 'bg-slate-100 text-slate-600',
  PENDING_REVIEW: 'bg-amber-100 text-amber-700',
  VERIFIED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const asString = (value: unknown) =>
  typeof value === 'string' || typeof value === 'number' ? String(value) : '—';

const payloadChecks = (record?: AdminKycRecord) => {
  const checks = record?.ocrPayload?.checks;
  return Array.isArray(checks)
    ? checks.filter(
        (check): check is Record<string, unknown> =>
          Boolean(check) && typeof check === 'object' && !Array.isArray(check),
      )
    : [];
};

export function KycManagement() {
  const {
    useKycReviews,
    useKycReview,
    useKycFile,
    approveKyc,
    rejectKyc,
    isReviewingKyc,
  } = useAdmin();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<AdminKycStatus | ''>('');
  const [ocrStatus, setOcrStatus] = useState<AdminKycListParams['ocrStatus'] | ''>('');
  const [decisionSource, setDecisionSource] = useState<
    AdminKycListParams['decisionSource'] | ''
  >('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedId, setSelectedId] = useState<string>();
  const [rejectReason, setRejectReason] = useState('');
  const [actionError, setActionError] = useState<string>();

  const params = useMemo<AdminKycListParams>(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...(search.trim() && { search: search.trim() }),
      ...(status && { status }),
      ...(ocrStatus && { ocrStatus }),
      ...(decisionSource && { decisionSource }),
      ...(fromDate && { fromDate }),
      ...(toDate && { toDate }),
    }),
    [decisionSource, fromDate, ocrStatus, page, search, status, toDate],
  );

  const list = useKycReviews(params);
  const pending = useKycReviews({ page: 1, limit: 1, status: 'PENDING_REVIEW' });
  const verified = useKycReviews({ page: 1, limit: 1, status: 'VERIFIED' });
  const rejected = useKycReviews({ page: 1, limit: 1, status: 'REJECTED' });
  const detail = useKycReview(selectedId);
  const front = useKycFile(selectedId, 'idFront');
  const back = useKycFile(selectedId, 'idBack');
  const record = detail.data;
  const checks = payloadChecks(record);
  const riskLevel =
    typeof record?.ocrPayload?.riskLevel === 'string'
      ? record.ocrPayload.riskLevel.toUpperCase()
      : null;
  const approvalBlocked =
    record?.ocrStatus === 'PENDING' ||
    record?.ocrStatus === 'PROCESSING' ||
    riskLevel === 'HIGH';
  const comparisonFields: Array<[string, unknown]> = [
    ['Document type', record?.ocrPayload?.documentType],
    ['OCR ID number', record?.ocrPayload?.idNumber ? 'Detected' : null],
    ['OCR full name', record?.ocrPayload?.fullName],
    ['OCR date of birth', record?.ocrPayload?.dateOfBirth],
    ['Risk', record?.ocrPayload?.riskLevel],
    ['Decision reason', record?.decisionReason],
  ];
  const totalPages = Math.max(
    1,
    Math.ceil((list.data?.meta.total ?? 0) / PAGE_SIZE),
  );

  const resetPage = () => setPage(1);
  const closeDetail = () => {
    setSelectedId(undefined);
    setRejectReason('');
    setActionError(undefined);
  };

  const refreshAfterAction = async () => {
    await Promise.all([
      list.refetch(),
      pending.refetch(),
      verified.refetch(),
      rejected.refetch(),
    ]);
    closeDetail();
  };

  return (
    <div className="space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <div
        className="border-b pb-5"
        style={{ borderColor: 'var(--surface-panel-border)' }}
      >
        <p className="font-inter text-[10px] font-bold uppercase tracking-[3px] text-smile-description">
          Identity Operations
        </p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-poppins text-2xl font-semibold text-smile-primary-dark">
              KYC Management
            </h1>
            <p className="mt-1 font-inter text-sm text-smile-description">
              Search submission history and review citizen ID verification details.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void list.refetch()}
            className="flex h-10 w-10 items-center justify-center rounded-xl border text-smile-primary transition hover:bg-smile-primary/10"
            style={{ borderColor: 'var(--surface-panel-border)' }}
            title="Refresh KYC list"
          >
            <Icon icon="lucide:refresh-cw" width={17} />
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['All submissions', list.data?.meta.total ?? 0, 'lucide:files'],
          ['Pending review', pending.data?.meta.total ?? 0, 'lucide:clock-3'],
          ['Verified', verified.data?.meta.total ?? 0, 'lucide:badge-check'],
          ['Rejected', rejected.data?.meta.total ?? 0, 'lucide:circle-x'],
        ].map(([label, value, icon]) => (
          <div
            key={String(label)}
            className="flex items-center justify-between rounded-xl border px-4 py-3"
            style={{
              background: 'var(--surface-card-bg)',
              borderColor: 'var(--surface-card-border)',
            }}
          >
            <div>
              <p className="font-inter text-xs text-smile-description">{label}</p>
              <p className="font-poppins text-2xl font-semibold text-smile-primary-dark">
                {value}
              </p>
            </div>
            <Icon icon={String(icon)} width={20} className="text-smile-primary" />
          </div>
        ))}
      </div>

      <div
        className="grid gap-3 border-y py-4 md:grid-cols-2 xl:grid-cols-6"
        style={{ borderColor: 'var(--surface-panel-border)' }}
      >
        <label className="relative xl:col-span-2">
          <Icon
            icon="lucide:search"
            width={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-smile-description"
          />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              resetPage();
            }}
            placeholder="Name or last 4 ID digits"
            className="h-11 w-full rounded-xl border bg-transparent pl-9 pr-3 font-inter text-sm outline-none focus:border-smile-primary"
            style={{ borderColor: 'var(--surface-panel-border)' }}
          />
        </label>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as AdminKycStatus | '');
            resetPage();
          }}
          className="h-11 rounded-xl border bg-transparent px-3 font-inter text-sm"
          style={{ borderColor: 'var(--surface-panel-border)' }}
          aria-label="Verification status"
        >
          <option value="">All statuses</option>
          <option value="PENDING_REVIEW">Pending review</option>
          <option value="VERIFIED">Verified</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select
          value={ocrStatus}
          onChange={(event) => {
            setOcrStatus(event.target.value as typeof ocrStatus);
            resetPage();
          }}
          className="h-11 rounded-xl border bg-transparent px-3 font-inter text-sm"
          style={{ borderColor: 'var(--surface-panel-border)' }}
          aria-label="OCR status"
        >
          <option value="">All OCR states</option>
          <option value="PENDING">Pending</option>
          <option value="PROCESSING">Processing</option>
          <option value="COMPLETED">Completed</option>
          <option value="SKIPPED">Skipped (manual)</option>
          <option value="FAILED">Failed</option>
        </select>
        <select
          value={decisionSource}
          onChange={(event) => {
            setDecisionSource(event.target.value as typeof decisionSource);
            resetPage();
          }}
          className="h-11 rounded-xl border bg-transparent px-3 font-inter text-sm"
          style={{ borderColor: 'var(--surface-panel-border)' }}
          aria-label="Decision source"
        >
          <option value="">All decisions</option>
          <option value="AUTO">Automatic</option>
          <option value="MANUAL">Manual</option>
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(event) => {
              setFromDate(event.target.value);
              resetPage();
            }}
            className="min-w-0 rounded-xl border bg-transparent px-2 font-inter text-xs"
            style={{ borderColor: 'var(--surface-panel-border)' }}
            aria-label="Submitted from"
          />
          <input
            type="date"
            value={toDate}
            onChange={(event) => {
              setToDate(event.target.value);
              resetPage();
            }}
            className="min-w-0 rounded-xl border bg-transparent px-2 font-inter text-xs"
            style={{ borderColor: 'var(--surface-panel-border)' }}
            aria-label="Submitted to"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--surface-panel-border)' }}>
              {['Applicant', 'Citizen ID', 'Status', 'OCR', 'Decision', 'Submitted', ''].map(
                (heading) => (
                  <th
                    key={heading}
                    className="px-3 py-3 font-inter text-[10px] font-bold uppercase tracking-[1.5px] text-smile-description"
                  >
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {list.isLoading && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-smile-description">
                  Loading KYC submissions…
                </td>
              </tr>
            )}
            {list.isError && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-red-600">
                  KYC history could not be loaded.
                </td>
              </tr>
            )}
            {!list.isLoading && !list.isError && (list.data?.data.length ?? 0) === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-smile-description">
                  No submissions match these filters.
                </td>
              </tr>
            )}
            {list.data?.data.map((item) => (
              <tr
                key={item.kycId}
                className="border-b transition hover:bg-smile-primary/5"
                style={{ borderColor: 'var(--surface-panel-border)' }}
              >
                <td className="px-3 py-3">
                  <p className="font-poppins text-sm font-medium text-smile-primary-dark">
                    {item.fullName || 'Unknown applicant'}
                  </p>
                  <p className="font-inter text-xs text-smile-description">
                    {item.dateOfBirth || 'No date of birth'}
                  </p>
                </td>
                <td className="px-3 py-3 font-inter text-sm">{item.idNumberMasked || '—'}</td>
                <td className="px-3 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 font-inter text-[11px] font-semibold ${statusClass[item.status]}`}
                  >
                    {item.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-3 py-3 font-inter text-xs">
                  <p>{item.ocrStatus || '—'}</p>
                  <p className="text-smile-description">
                    {typeof item.ocrConfidence === 'number'
                      ? `${item.ocrConfidence}% confidence`
                      : 'No confidence'}
                  </p>
                </td>
                <td className="px-3 py-3 font-inter text-xs">
                  {item.decisionSource || 'Undecided'}
                </td>
                <td className="px-3 py-3 font-inter text-xs text-smile-description">
                  {formatDate(item.submittedAt)}
                </td>
                <td className="px-3 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(item.kycId);
                      setActionError(undefined);
                    }}
                    disabled={!item.kycId}
                    className="rounded-lg border px-3 py-2 font-inter text-xs font-semibold text-smile-primary hover:bg-smile-primary/10 disabled:opacity-40"
                    style={{ borderColor: 'var(--surface-panel-border)' }}
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="font-inter text-xs text-smile-description">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
            className="h-9 w-9 rounded-lg border disabled:opacity-40"
            style={{ borderColor: 'var(--surface-panel-border)' }}
            title="Previous page"
          >
            <Icon icon="lucide:chevron-left" className="mx-auto" />
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
            className="h-9 w-9 rounded-lg border disabled:opacity-40"
            style={{ borderColor: 'var(--surface-panel-border)' }}
            title="Next page"
          >
            <Icon icon="lucide:chevron-right" className="mx-auto" />
          </button>
        </div>
      </div>

      {selectedId && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-slate-950/45 backdrop-blur-sm">
          <div className="h-full w-full max-w-3xl overflow-y-auto bg-white shadow-2xl dark:bg-slate-950">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4 dark:bg-slate-950">
              <div>
                <h2 className="font-poppins text-lg font-semibold">KYC Review</h2>
                <p className="font-inter text-xs text-smile-description">{selectedId}</p>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
                title="Close review"
              >
                <Icon icon="lucide:x" width={18} />
              </button>
            </div>

            {detail.isLoading ? (
              <div className="p-10 text-center text-smile-description">Loading details…</div>
            ) : (
              <div className="space-y-6 p-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ['Submitted name', record?.fullName],
                    ['Date of birth', record?.dateOfBirth],
                    ['Citizen ID', record?.idNumberMasked],
                    ['Decision', record?.decisionSource || 'Undecided'],
                    ['OCR status', record?.ocrStatus],
                    ['Confidence', record?.ocrConfidence != null ? `${record.ocrConfidence}%` : null],
                  ].map(([label, value]) => (
                    <div key={label} className="border-b pb-2">
                      <p className="font-inter text-xs text-smile-description">{label}</p>
                      <p className="font-poppins text-sm font-medium">{value || '—'}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ['Citizen ID front', front.data],
                    ['Citizen ID back', back.data],
                  ].map(([label, src]) => (
                    <button
                      key={label}
                      type="button"
                      className="relative aspect-[1.58/1] overflow-hidden rounded-lg border bg-slate-100"
                      style={{ borderColor: 'var(--surface-panel-border)' }}
                      title={String(label)}
                    >
                      {src ? (
                        <Image
                          src={String(src)}
                          alt={String(label)}
                          fill
                          unoptimized
                          sizes="(max-width: 768px) 100vw, 360px"
                          className="object-contain"
                        />
                      ) : (
                        <span className="font-inter text-xs text-smile-description">
                          Image unavailable
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div>
                  <h3 className="mb-3 font-poppins text-sm font-semibold">OCR comparison</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {comparisonFields.map(([label, value]) => (
                      <div key={label} className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-white/5">
                        <p className="font-inter text-xs text-smile-description">{label}</p>
                        <p className="font-inter text-sm">{asString(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 font-poppins text-sm font-semibold">Automated checks</h3>
                  <div className="space-y-2">
                    {checks.length === 0 && (
                      <p className="font-inter text-sm text-smile-description">
                        No automated checks are available.
                      </p>
                    )}
                    {checks.map((check, index) => (
                      <div
                        key={`${asString(check.code)}-${index}`}
                        className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2"
                        style={{ borderColor: 'var(--surface-panel-border)' }}
                      >
                        <div>
                          <p className="font-inter text-sm font-semibold">
                            {asString(check.label)}
                          </p>
                          <p className="font-inter text-xs text-smile-description">
                            {asString(check.message)}
                          </p>
                        </div>
                        <span className="font-inter text-[10px] font-bold">
                          {asString(check.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {(record?.ocrLastError || record?.ocrPayload) && (
                  <details className="rounded-lg border p-3" style={{ borderColor: 'var(--surface-panel-border)' }}>
                    <summary className="cursor-pointer font-inter text-xs font-semibold">
                      Technical diagnostics
                    </summary>
                    {record.ocrLastError && (
                      <p className="mt-3 break-words font-mono text-xs text-red-600">
                        {record.ocrLastError}
                      </p>
                    )}
                    <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap text-xs">
                      {JSON.stringify(record.ocrPayload, null, 2)}
                    </pre>
                  </details>
                )}

                {record?.status === 'PENDING_REVIEW' && (
                  <div className="space-y-3 border-t pt-5" style={{ borderColor: 'var(--surface-panel-border)' }}>
                    <textarea
                      value={rejectReason}
                      onChange={(event) => setRejectReason(event.target.value)}
                      placeholder="Reason required for rejection"
                      className="min-h-24 w-full rounded-xl border bg-transparent p-3 font-inter text-sm outline-none focus:border-smile-primary"
                      style={{ borderColor: 'var(--surface-panel-border)' }}
                    />
                    {actionError && (
                      <p className="font-inter text-sm text-red-600">{actionError}</p>
                    )}
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        disabled={isReviewingKyc || approvalBlocked}
                        onClick={async () => {
                          try {
                            setActionError(undefined);
                            await approveKyc({ id: selectedId });
                            await refreshAfterAction();
                          } catch {
                            setActionError('This submission could not be approved.');
                          }
                        }}
                        className="rounded-xl bg-emerald-600 px-4 py-2.5 font-inter text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                        title={
                          approvalBlocked
                            ? 'Approval is unavailable while OCR is running or the submission is high risk.'
                            : 'Approve this KYC submission'
                        }
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={isReviewingKyc || rejectReason.trim().length < 3}
                        onClick={async () => {
                          try {
                            setActionError(undefined);
                            await rejectKyc({
                              id: selectedId,
                              request: { rejectionReason: rejectReason.trim() },
                            });
                            await refreshAfterAction();
                          } catch {
                            setActionError('This submission could not be rejected.');
                          }
                        }}
                        className="rounded-xl bg-red-600 px-4 py-2.5 font-inter text-sm font-semibold text-white disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
