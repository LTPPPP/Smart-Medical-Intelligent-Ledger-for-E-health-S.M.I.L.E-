// Shared fixture identifiers for GENERATED *.uc.spec.ts files (payment-service).
//
// Why this file exists (defect T1): a generated spec that reuses one literal for two
// different entities can produce a FALSE PASS — an ownership or equality check succeeds only
// because the two ids happened to be identical. Every entity kind therefore gets exactly one
// id, defined exactly once, here. Collisions are impossible by construction: an id cannot be
// duplicated because it is never written twice, and `assertDistinct()` below fails at import
// time if that ever stops being true.
//
// Scheme: each entity kind owns a distinct leading hex word, so ids are visually
// distinguishable at a glance in assertion diffs. All values are RFC-4122 v4 shaped
// (version nibble `4`, variant nibble in 8-b).

export const UC_IDS = {
  payment: 'aaaa1111-1111-4111-8111-111111111111',
  otherPayment: 'aaaa2222-2222-4222-8222-222222222222',
  appointment: 'bbbb3333-3333-4333-8333-333333333333',
  actorUser: 'cccc4444-4444-4444-8444-444444444444',
  otherActorUser: 'cccc5555-5555-4555-8555-555555555555',
  refund: 'dddd6666-6666-4666-8666-666666666666',
} as const;

export type UcEntity = keyof typeof UC_IDS;

/**
 * Import-time guard for defect T1. If two entity kinds are ever given the same literal this
 * throws immediately, so the collision surfaces as a hard failure in every generated spec
 * rather than as a silently passing assertion.
 */
function assertDistinct(ids: Record<string, string>): void {
  const seen = new Map<string, string>();
  for (const [name, value] of Object.entries(ids)) {
    const previous = seen.get(value);
    if (previous) {
      throw new Error(
        `uc-fixtures: id collision — "${name}" and "${previous}" share ${value}. ` +
          'Every entity kind must own a distinct id (defect T1).',
      );
    }
    seen.set(value, name);
  }
}

assertDistinct(UC_IDS);

/** Non-uuid string used where a case supplies a malformed identifier. */
export const UC_MALFORMED_ID = 'not-a-uuid-12345';
