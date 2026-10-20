import { create as createAxios, isAxiosError, isCancel, type AxiosResponse } from "axios";
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from "./config.ts";
import type {
  ActivityQuery,
  CreateClaimRequest,
  CreateClaimResult,
  RequestOptions,
} from "./contracts.ts";
import { ApiError, httpError } from "./errors.ts";
import {
  DECIMAL_PATTERN,
  parseActivity,
  parseBalances,
  parseClaim,
  parseClaimOptions,
  sameDecimal,
} from "./validation.ts";

interface ClientOptions {
  token: string;
  // Test seam for Axios's built-in fetch adapter; production uses its defaults.
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

// One immutable token per client. The session layer must discard old responses
// and cancel old requests when replacing this instance after a token change.
export function createCashmineApi({
  token,
  fetchImpl,
  timeoutMs = REQUEST_TIMEOUT_MS,
}: ClientOptions) {
  if (!token.trim() || /[\r\n]/.test(token)) {
    throw new ApiError("Enter a valid API token.", { kind: "validation", field: "token" });
  }
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > 2_147_483_647) {
    throw new ApiError("Request timeout must be a positive timer-safe integer.", { kind: "validation" });
  }
  // Validate header syntax before a request starts. Never retain the raw error.
  try {
    new Headers({ Authorization: `Bearer ${token}` });
  } catch {
    throw new ApiError("Enter a valid API token.", { kind: "validation", field: "token" });
  }
  const http = createAxios({
    baseURL: API_BASE_URL,
    timeout: timeoutMs,
    adapter: "fetch",
    env: fetchImpl ? { fetch: fetchImpl } : undefined,
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    responseType: "json",
    withCredentials: false,
    fetchOptions: { cache: "no-store", redirect: "error" },
  });

  function inputError(message: string, field: string, submission = false): never {
    throw new ApiError(message, {
      kind: "validation",
      field,
      submissionOutcome: submission ? "not-sent" : "not-applicable",
    });
  }

  function required(value: string, field: string, submission = false) {
    if (typeof value !== "string" || !value.trim()) {
      inputError(`${field} is required.`, field, submission);
    }
  }

  async function request<T>(
    path: string,
    parse: (value: unknown) => T,
    options: RequestOptions = {},
    submission?: { body: string; key: string },
  ): Promise<{ data: T; response: AxiosResponse<unknown> }> {
    if (options.signal?.aborted) {
      throw new ApiError("The API request was cancelled.", {
        kind: "aborted",
        submissionOutcome: submission ? "not-sent" : "not-applicable",
      });
    }
    const submissionOutcome = submission ? "unknown" : "not-applicable";
    try {
      const response = await http.request<unknown>({
        url: path,
        method: submission ? "POST" : "GET",
        data: submission?.body,
        headers: submission ? {
          "Content-Type": "application/json",
          "Idempotency-Key": submission.key,
        } : undefined,
        signal: options.signal,
      });
      if (!(submission ? [200, 201] : [200]).includes(response.status)) {
        throw new ApiError("The API returned an unexpected success status.", {
          kind: "protocol", status: response.status, submissionOutcome,
        });
      }
      try {
        return { data: parse(response.data), response };
      } catch {
        throw new ApiError("The API returned an unexpected response shape.", {
          kind: "protocol", status: response.status, submissionOutcome,
        });
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (isAxiosError(error) && error.response) {
        throw httpError(
          error.response.status, error.response.data,
          error.response.headers["retry-after"], !!submission,
        );
      }
      const timedOut = isAxiosError(error)
        && (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED");
      const kind = isCancel(error) ? "aborted" : timedOut ? "timeout" : "network";
      const message = kind === "aborted" ? "The API request was cancelled."
        : kind === "timeout" ? "The API request timed out." : "Could not reach the API.";
      // Do not expose AxiosError/config/cause: these can contain Authorization.
      throw new ApiError(message, { kind, submissionOutcome });
    }
  }

  return {
    async getBalances(options?: RequestOptions) {
      return (await request("/v1/balances", parseBalances, options)).data;
    },
    async getClaimOptions(asset: string, options?: RequestOptions) {
      required(asset, "asset");
      const query = new URLSearchParams({ asset });
      return (await request(`/v1/claim-options?${query}`, (payload) => {
        const result = parseClaimOptions(payload);
        if (result.asset !== asset) throw new Error("Asset does not match.");
        return result;
      }, options)).data;
    },
    async createClaim(
      body: CreateClaimRequest,
      idempotencyKey: string,
      options?: RequestOptions,
    ): Promise<CreateClaimResult> {
      required(body.asset, "asset", true);
      required(body.destinationId, "destinationId", true);
      if (typeof body.amount !== "string" || !DECIMAL_PATTERN.test(body.amount)) {
        inputError("Use a canonical decimal amount.", "amount", true);
      }
      required(idempotencyKey, "idempotencyKey", true);
      if (idempotencyKey.length > 100) {
        inputError("Idempotency key must contain 1–100 characters.", "idempotencyKey", true);
      }
      if (idempotencyKey !== idempotencyKey.trim()) {
        inputError("Idempotency key must not have surrounding whitespace.", "idempotencyKey", true);
      }
      try {
        new Headers({ "Idempotency-Key": idempotencyKey });
      } catch {
        inputError("Idempotency key must be a valid HTTP header.", "idempotencyKey", true);
      }
      const frozenBody = {
        asset: body.asset,
        amount: body.amount,
        destinationId: body.destinationId,
      };
      const { data, response } = await request("/v1/claims", (payload) => {
        const result = parseClaim(payload);
        if (
          result.asset !== frozenBody.asset
          || result.destinationId !== frozenBody.destinationId
          || !sameDecimal(result.amount, frozenBody.amount)
        ) {
          throw new Error("Claim does not match the submitted request.");
        }
        return result;
      }, options, { body: JSON.stringify(frozenBody), key: idempotencyKey });
      return { claim: data, replayed: response.status === 200 || response.headers["idempotent-replayed"] === "true" };
    },
    async getClaim(id: string, options?: RequestOptions) {
      required(id, "id");
      if (id === "." || id === "..") inputError("Use a valid claim id.", "id");
      return (await request(`/v1/claims/${encodeURIComponent(id)}`, (payload) => {
        const result = parseClaim(payload);
        if (result.id !== id) throw new Error("Claim id does not match.");
        return result;
      }, options)).data;
    },
    async getActivity(query: ActivityQuery = {}, options?: RequestOptions) {
      const limit = query.limit ?? 20;
      if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
        inputError("Activity limit must be between 1 and 20.", "limit");
      }
      const params = new URLSearchParams({ limit: String(limit) });
      if (query.cursor !== undefined) {
        required(query.cursor, "cursor");
        params.set("cursor", query.cursor);
      }
      return (await request(`/v1/activity?${params}`, parseActivity, options)).data;
    },
  };
}

export type CashmineApi = ReturnType<typeof createCashmineApi>;
