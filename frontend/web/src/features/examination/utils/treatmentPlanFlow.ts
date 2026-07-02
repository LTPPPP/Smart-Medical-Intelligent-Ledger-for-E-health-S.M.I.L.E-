interface TreatmentPlanFormLike {
  plan_name?: string | null;
  duration_weeks?: number | null;
  estimated_cost?: string | number | null;
  quote_currency?: string | null;
  quote_version?: string | null;
  risk_disclosure?: string | null;
  alternative_options?: string | null;
}

export function validateTreatmentPlanForm({
  plan_name,
  duration_weeks,
  estimated_cost,
  quote_currency,
}: TreatmentPlanFormLike): string | null {
  if (!plan_name?.trim()) {
    return 'Plan name is required.';
  }
  if (
    duration_weeks != null &&
    (!Number.isInteger(duration_weeks) || duration_weeks <= 0)
  ) {
    return 'Duration must be a positive whole number.';
  }
  if (estimated_cost !== undefined && estimated_cost !== null && estimated_cost !== '') {
    const amount = Number(estimated_cost);
    if (!Number.isFinite(amount) || amount <= 0) {
      return 'Estimated cost must be a positive amount.';
    }
  }
  if (quote_currency && !/^[A-Z]{3}$/.test(quote_currency.trim().toUpperCase())) {
    return 'Currency must use a three-letter code.';
  }
  return null;
}

export function getTreatmentPlanProposalBlocker({
  estimated_cost,
  quote_version,
  risk_disclosure,
  alternative_options,
}: TreatmentPlanFormLike): string | null {
  const amount = Number(estimated_cost);
  if (!Number.isFinite(amount) || amount <= 0) {
    return 'Estimated cost is required before proposing.';
  }
  if (!quote_version?.trim()) {
    return 'Quote version is required before proposing.';
  }
  if (!risk_disclosure?.trim()) {
    return 'Risk disclosure is required before proposing.';
  }
  if (!alternative_options?.trim()) {
    return 'Alternative options are required before proposing.';
  }
  return null;
}
