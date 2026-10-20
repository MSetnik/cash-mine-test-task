export type ApiErrorKind =
  | "http"
  | "network"
  | "timeout"
  | "aborted"
  | "protocol"
  | "validation";

// Describes this request attempt, never the entire persisted claim operation.
// For example, a 401 on a replay cannot disprove an earlier accepted claim.
export type SubmissionOutcome =
  | "not-applicable"
  | "not-sent"
  | "rejected"
  | "unknown";

interface ApiErrorDetails {
  kind: ApiErrorKind;
  submissionOutcome?: SubmissionOutcome;
  status?: number;
  code?: string;
  field?: string;
  retryAfterMs?: number;
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly submissionOutcome: SubmissionOutcome;
  readonly status?: number;
  readonly code?: string;
  readonly field?: string;
  readonly retryAfterMs?: number;

  constructor(message: string, details: ApiErrorDetails) {
    super(message);
    this.name = "ApiError";
    this.kind = details.kind;
    this.submissionOutcome = details.submissionOutcome ?? "not-applicable";
    this.status = details.status;
    this.code = details.code;
    this.field = details.field;
    this.retryAfterMs = details.retryAfterMs;
  }
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

export function httpError(
  response: Response,
  payload: unknown,
  isSubmission: boolean,
): ApiError {
  const error = record(record(payload)?.error);
  const code = typeof error?.code === "string" ? error.code : undefined;
  const bodyDelay = error?.retryAfterMs;
  const header = response.headers.get("Retry-After");
  let headerDelay: number | undefined;
  if (header !== null) {
    const seconds = Number(header);
    const parsed = header.trim() !== "" && Number.isFinite(seconds)
      ? seconds * 1000
      : Date.parse(header) - Date.now();
    if (Number.isFinite(parsed) && parsed >= 0) headerDelay = Math.ceil(parsed);
  }
  const delays = [
    typeof bodyDelay === "number" && Number.isFinite(bodyDelay) && bodyDelay >= 0
      ? Math.ceil(bodyDelay)
      : undefined,
    headerDelay,
  ].filter((delay): delay is number => delay !== undefined);

  // Only explicit, documented rejection pairs establish rejection of this
  // attempt. A mismatch may refer to an existing operation and needs recovery.
  const rejectionCodes: Record<number, string> = {
    400: "VALIDATION",
    401: "UNAUTHORIZED",
    404: "NOT_FOUND",
    429: "RATE_LIMITED",
  };
  const rejected = code !== undefined && rejectionCodes[response.status] === code;
  return new ApiError(
    typeof error?.message === "string"
      ? error.message
      : `API request failed (HTTP ${response.status}).`,
    {
      kind: "http",
      status: response.status,
      code,
      field: typeof error?.field === "string" ? error.field : undefined,
      retryAfterMs: delays.length ? Math.max(...delays) : undefined,
      submissionOutcome: isSubmission
        ? rejected ? "rejected" : "unknown"
        : "not-applicable",
    },
  );
}
