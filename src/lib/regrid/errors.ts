export type RegridErrorCode =
  | "unconfigured"
  | "invalid_request"
  | "invalid_apn"
  | "unauthorized"
  | "rate_limited"
  | "not_found"
  | "api_error"
  | "network_error"
  | "parse_error";

export type RegridFailure = {
  code: RegridErrorCode;
  message: string;
  httpStatus?: number;
  retryAfterMs?: number;
  retryable: boolean;
};

export class RegridClientError extends Error {
  readonly code: RegridErrorCode;
  readonly httpStatus?: number;
  readonly retryAfterMs?: number;
  readonly retryable: boolean;

  constructor(failure: RegridFailure) {
    super(failure.message);
    this.name = "RegridClientError";
    this.code = failure.code;
    this.httpStatus = failure.httpStatus;
    this.retryAfterMs = failure.retryAfterMs;
    this.retryable = failure.retryable;
  }

  toFailure(): RegridFailure {
    return {
      code: this.code,
      message: this.message,
      httpStatus: this.httpStatus,
      retryAfterMs: this.retryAfterMs,
      retryable: this.retryable,
    };
  }
}

export function isRetryableHttpStatus(status: number): boolean {
  return status === 429 || status === 408 || status >= 500;
}

export function parseRetryAfterMs(header: string | null, nowMs: number): number | undefined {
  if (!header) return undefined;
  const asSeconds = Number(header);
  if (Number.isFinite(asSeconds) && asSeconds >= 0) {
    return Math.round(asSeconds * 1000);
  }
  const asDate = Date.parse(header);
  if (Number.isFinite(asDate)) {
    return Math.max(0, asDate - nowMs);
  }
  return undefined;
}
