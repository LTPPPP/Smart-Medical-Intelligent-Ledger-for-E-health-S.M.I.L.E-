export interface AmendmentFormLike {
  amendment_reason?: string | null;
  amendment_text?: string | null;
  amended_by?: string | null;
}

interface AmendmentContext {
  isFinalized: boolean;
  sessionId?: string | null;
  amendmentReason?: string | null;
  amendmentText?: string | null;
  amendedBy?: string | null;
}

export function getAmendmentFormBlocker({
  isFinalized,
  sessionId,
  amendmentReason,
  amendmentText,
  amendedBy,
}: AmendmentContext): string | null {
  if (!isFinalized) return 'Only finalized encounters can be amended.';
  if (!sessionId?.trim()) return 'Session is not loaded.';
  if (!amendmentReason?.trim()) return 'Amendment reason is required.';
  if (amendmentReason.trim().length < 3) {
    return 'Amendment reason must be at least 3 characters.';
  }
  if (!amendmentText?.trim()) return 'Amendment note is required.';
  if (amendmentText.trim().length < 3) {
    return 'Amendment note must be at least 3 characters.';
  }
  if (!amendedBy?.trim()) return 'Current user is required.';
  return null;
}

export function buildExaminationAmendmentPayload({
  amendment_reason,
  amendment_text,
  amended_by,
}: AmendmentFormLike) {
  return {
    amendment_reason: amendment_reason?.trim(),
    amendment_text: amendment_text?.trim(),
    amended_by,
  };
}
