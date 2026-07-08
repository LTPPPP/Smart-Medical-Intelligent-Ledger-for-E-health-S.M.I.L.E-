import { ForbiddenException } from '@nestjs/common';
import { Actor } from './actor.util';

/**
 * Ownership scoping for clinical data (RF-1.2 / finding F1-002).
 *
 * RolesGuard already restricts the clinical controllers to ADMIN/DOCTOR. These
 * helpers add the second layer the guards don't cover: a DOCTOR may only reach
 * resources they own (`doctor_id === their account id`); ADMIN sees everything.
 *
 * An `undefined` actor means a trusted service-to-service call (no HTTP request,
 * so no JwtAuthGuard populated an actor) — e.g. the examination flow finalizing
 * a medical record. Those bypass scoping. Every externally reachable route runs
 * behind JwtAuthGuard, so an HTTP actor is always present there.
 */

export function normalizeRole(role?: string): string | undefined {
  return role?.trim().toUpperCase();
}

/** ADMIN (and clinic managers, once modelled) bypass per-doctor scoping. */
export function isPrivilegedViewer(actor?: Actor): boolean {
  const role = normalizeRole(actor?.role);
  return role === 'ADMIN';
}

export function isDoctor(actor?: Actor): boolean {
  return normalizeRole(actor?.role) === 'DOCTOR';
}

/**
 * Throw unless the actor may access a resource owned by `resourceDoctorId`.
 * ADMIN always may; a DOCTOR only for their own resources.
 */
export function assertDoctorOwnership(
  actor: Actor | undefined,
  resourceDoctorId: string | null | undefined,
): void {
  if (!actor) return; // trusted internal call
  if (isPrivilegedViewer(actor)) return;
  if (isDoctor(actor) && actor.accountId && actor.accountId === resourceDoctorId) {
    return;
  }
  throw new ForbiddenException(
    'You can only access records for your own patients.',
  );
}

/**
 * Resolve the `doctor_id` to filter a list query by. ADMIN may request any (or
 * none); a DOCTOR is always pinned to their own id, and may not ask for another
 * doctor's data.
 */
export function resolveDoctorScope(
  actor: Actor | undefined,
  requestedDoctorId?: string,
): string | undefined {
  if (!actor) return requestedDoctorId; // trusted internal call
  if (isPrivilegedViewer(actor)) return requestedDoctorId;
  if (isDoctor(actor) && actor.accountId) {
    if (requestedDoctorId && requestedDoctorId !== actor.accountId) {
      throw new ForbiddenException(
        'You can only access your own patient records.',
      );
    }
    return actor.accountId;
  }
  throw new ForbiddenException('A doctor or admin role is required.');
}
