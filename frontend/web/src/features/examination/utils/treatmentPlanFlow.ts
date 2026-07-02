interface TreatmentPlanFormLike {
  plan_name?: string | null;
  duration_weeks?: number | null;
  estimated_cost?: string | number | null;
  quote_currency?: string | null;
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
