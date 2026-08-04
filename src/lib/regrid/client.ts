import { getRegridConfig, isRegridConfigured } from "@/lib/regrid/config";
import { isRetryableHttpStatus, parseRetryAfterMs, RegridClientError } from "@/lib/regrid/errors";
import { normalizeRegridFeature, normalizeRegridSearchResponse } from "@/lib/regrid/normalize";
import type {
  NormalizedParcelCandidate,
  ParcelSearchQuery,
  RegridClientOptions,
  RegridParcelFeature,
} from "@/lib/regrid/types";
import { normalizeApn } from "@/lib/properties/apn";
import { validateLatLngPair } from "@/lib/properties/geometry";

const DEFAULT_MAX_ATTEMPTS = 4;
const DEFAULT_BASE_DELAY_MS = 250;

async function defaultSleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffDelayMs(attempt: number, baseDelayMs: number, retryAfterMs?: number): number {
  if (retryAfterMs != null) return retryAfterMs;
  const exp = Math.min(baseDelayMs * 2 ** Math.max(0, attempt - 1), 8_000);
  return exp;
}

export class RegridClient {
  private readonly fetchImpl: typeof fetch;
  private readonly maxAttempts: number;
  private readonly baseDelayMs: number;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly now: () => number;
  private readonly configOverride?: { apiToken: string; baseUrl: string };

  constructor(options: RegridClientOptions = {}) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
    this.baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
    this.sleep = options.sleep ?? defaultSleep;
    this.now = options.now ?? Date.now;
    this.configOverride = options.config;
  }

  private resolveConfig() {
    if (this.configOverride) return this.configOverride;
    if (!isRegridConfigured()) {
      throw new RegridClientError({
        code: "unconfigured",
        message: "Regrid is not configured. Set REGRID_API_TOKEN.",
        retryable: false,
      });
    }
    return getRegridConfig();
  }

  async search(query: ParcelSearchQuery): Promise<NormalizedParcelCandidate[]> {
    this.validateSearchQuery(query);
    const path = this.pathForSearch(query);
    const params = this.paramsForSearch(query);
    const body = await this.requestJson<unknown>(path, params);
    return normalizeRegridSearchResponse(body);
  }

  async getByProviderParcelId(providerParcelId: string): Promise<NormalizedParcelCandidate | null> {
    const id = providerParcelId.trim();
    if (!id) {
      throw new RegridClientError({
        code: "invalid_request",
        message: "providerParcelId is required.",
        retryable: false,
      });
    }
    const body = await this.requestJson<unknown>(
      `/api/v2/parcels/${encodeURIComponent(id)}`,
      new URLSearchParams(),
    );
    // Lookup returns the same grouped shape as search. Fall back to treating the
    // body as a bare Feature so a single-feature response still resolves.
    const candidates = normalizeRegridSearchResponse(body);
    return candidates[0] ?? normalizeRegridFeature(body as RegridParcelFeature);
  }

  private validateSearchQuery(query: ParcelSearchQuery): void {
    if (query.mode === "address") {
      if (!query.query.trim()) {
        throw new RegridClientError({
          code: "invalid_request",
          message: "Address query must not be empty.",
          retryable: false,
        });
      }
      return;
    }
    if (query.mode === "apn") {
      if (!normalizeApn(query.apn)) {
        throw new RegridClientError({
          code: "invalid_apn",
          message: "APN is missing or invalid after normalization.",
          retryable: false,
        });
      }
      return;
    }
    const latLng = validateLatLngPair(query.latitude, query.longitude);
    if (!latLng.ok || latLng.latitude == null || latLng.longitude == null) {
      throw new RegridClientError({
        code: "invalid_request",
        message: "Coordinates must be a valid latitude/longitude pair.",
        retryable: false,
      });
    }
  }

  private pathForSearch(query: ParcelSearchQuery): string {
    if (query.mode === "address") return "/api/v2/parcels/address";
    if (query.mode === "apn") return "/api/v2/parcels/apn";
    return "/api/v2/parcels/point";
  }

  private paramsForSearch(query: ParcelSearchQuery): URLSearchParams {
    const params = new URLSearchParams();
    if (query.mode === "address") {
      params.set("query", query.query.trim());
      if (query.limit != null) params.set("limit", String(query.limit));
      return params;
    }
    if (query.mode === "apn") {
      // The v2 APN endpoint requires `parcelnumb`; `apn` is rejected with
      // HTTP 400 "Please provide a 'parcelnumb' parameter".
      params.set("parcelnumb", query.apn.trim());
      if (query.stateCode) params.set("state_code", query.stateCode.trim().toUpperCase());
      if (query.county) params.set("county", query.county.trim());
      if (query.limit != null) params.set("limit", String(query.limit));
      return params;
    }
    params.set("lat", String(query.latitude));
    params.set("lon", String(query.longitude));
    if (query.limit != null) params.set("limit", String(query.limit));
    return params;
  }

  private async requestJson<T>(path: string, params: URLSearchParams): Promise<T> {
    const { apiToken, baseUrl } = this.resolveConfig();
    params.set("token", apiToken);
    const url = `${baseUrl}${path}?${params.toString()}`;

    let lastError: RegridClientError | null = null;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        const response = await this.fetchImpl(url, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (response.ok) {
          try {
            return (await response.json()) as T;
          } catch {
            throw new RegridClientError({
              code: "parse_error",
              message: "Regrid response was not valid JSON.",
              httpStatus: response.status,
              retryable: false,
            });
          }
        }

        const retryAfterMs = parseRetryAfterMs(response.headers.get("retry-after"), this.now());
        const failure = this.failureFromStatus(response.status, retryAfterMs);
        lastError = new RegridClientError(failure);

        if (!failure.retryable || attempt >= this.maxAttempts) {
          throw lastError;
        }

        await this.sleep(backoffDelayMs(attempt, this.baseDelayMs, retryAfterMs));
      } catch (error) {
        if (error instanceof RegridClientError) {
          if (!error.retryable || attempt >= this.maxAttempts) throw error;
          lastError = error;
          await this.sleep(backoffDelayMs(attempt, this.baseDelayMs, error.retryAfterMs));
          continue;
        }
        lastError = new RegridClientError({
          code: "network_error",
          message: error instanceof Error ? error.message : "Network request to Regrid failed.",
          retryable: true,
        });
        if (attempt >= this.maxAttempts) throw lastError;
        await this.sleep(backoffDelayMs(attempt, this.baseDelayMs));
      }
    }

    throw (
      lastError ??
      new RegridClientError({
        code: "api_error",
        message: "Regrid request failed.",
        retryable: false,
      })
    );
  }

  private failureFromStatus(status: number, retryAfterMs?: number) {
    if (status === 401 || status === 403) {
      return {
        code: "unauthorized" as const,
        message: "Regrid rejected the API token.",
        httpStatus: status,
        retryable: false,
      };
    }
    if (status === 404) {
      return {
        code: "not_found" as const,
        message: "Regrid returned no matching parcel.",
        httpStatus: status,
        retryable: false,
      };
    }
    if (status === 400) {
      return {
        code: "invalid_request" as const,
        message: "Regrid rejected the request parameters.",
        httpStatus: status,
        retryable: false,
      };
    }
    if (status === 429) {
      return {
        code: "rate_limited" as const,
        message: "Regrid rate limit exceeded.",
        httpStatus: status,
        retryAfterMs,
        retryable: true,
      };
    }
    return {
      code: "api_error" as const,
      message: `Regrid request failed with HTTP ${status}.`,
      httpStatus: status,
      retryAfterMs,
      retryable: isRetryableHttpStatus(status),
    };
  }
}

export function createRegridClient(options?: RegridClientOptions): RegridClient {
  return new RegridClient(options);
}
