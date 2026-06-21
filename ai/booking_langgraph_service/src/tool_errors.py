from __future__ import annotations

from enum import StrEnum


class SafeErrorCategory(StrEnum):
    READ_UNAVAILABLE = "read_unavailable"
    MALFORMED_BACKEND_RESPONSE = "malformed_backend_response"
    COMMIT_CONFLICT = "commit_conflict"
    COMMIT_UNAVAILABLE = "commit_unavailable"
    NON_ACTIONABLE_APPOINTMENT = "non_actionable_appointment"
    INVALID_CONFIRMATION = "invalid_confirmation"
    REJECTED_CONFIRMATION = "rejected_confirmation"
    OWNERSHIP_SAFE_UNAVAILABLE = "ownership_safe_unavailable"


class DomainToolError(RuntimeError):
    pass


class DomainNotFoundError(DomainToolError):
    pass


class DomainConflictError(DomainToolError):
    pass


class ReadToolFailure(RuntimeError):
    pass


class MalformedToolPayload(RuntimeError):
    pass


class NonActionableAppointment(RuntimeError):
    pass
