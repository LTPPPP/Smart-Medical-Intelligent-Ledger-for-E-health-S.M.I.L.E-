type OcrField = {
  label: string;
  value: string;
};

const REVIEWED_FIELDS = new Set([
  'automatedChecks',
  'checks',
  'dateOfBirth',
  'documentType',
  'fullName',
  'idNumber',
  'rawText',
  'riskLevel',
  'riskReason',
]);

const ADDITIONAL_FIELD_ORDER = ['provider', 'issueDate'];

const FIELD_LABELS: Record<string, string> = {
  provider: 'Provider',
  issueDate: 'Issue date',
};

const formatFieldLabel = (field: string) =>
  FIELD_LABELS[field] ??
  field
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^./, (character) => character.toUpperCase());

const isScalar = (value: unknown): value is string | number | boolean =>
  typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';

export const getAdditionalOcrFields = (
  payload?: Record<string, unknown> | null,
): OcrField[] => {
  if (!payload) return [];

  const entries = Object.entries(payload)
    .filter(([field, value]) => !REVIEWED_FIELDS.has(field) && isScalar(value))
    .sort(([left], [right]) => {
      const leftIndex = ADDITIONAL_FIELD_ORDER.indexOf(left);
      const rightIndex = ADDITIONAL_FIELD_ORDER.indexOf(right);
      if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right);
      if (leftIndex === -1) return 1;
      if (rightIndex === -1) return -1;
      return leftIndex - rightIndex;
    });

  return entries.map(([field, value]) => ({
    label: formatFieldLabel(field),
    value: String(value),
  }));
};

export const getTechnicalOcrPayload = (
  payload?: Record<string, unknown> | null,
): Record<string, unknown> | undefined => {
  if (!payload) return undefined;

  const technicalEntries = Object.entries(payload).filter(
    ([field, value]) =>
      !REVIEWED_FIELDS.has(field) &&
      !ADDITIONAL_FIELD_ORDER.includes(field) &&
      value !== null &&
      typeof value === 'object',
  );

  return technicalEntries.length > 0
    ? Object.fromEntries(technicalEntries)
    : undefined;
};
