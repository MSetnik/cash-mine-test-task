import { parseClaim } from "../api/validation.ts";
import { ApiError } from "../api/errors.ts";
import type {
  Claim,
  CreateClaimRequest,
  CreateClaimResult,
} from "../api/contracts.ts";

export type Operation = {
  key: string;
  body: CreateClaimRequest;
  claim?: Claim;
};
type Snapshot = {
  operation: Operation | null;
  busy: boolean;
  error: string | null;
};
type Storage = Pick<globalThis.Storage, "getItem" | "setItem" | "removeItem">;
export function snapshotSettled(operation: Operation | null, asOf?: string) {
  return (
    !!operation?.claim &&
    operation.claim.status !== "pending" &&
    !!asOf &&
    Date.parse(asOf) >= Date.parse(operation.claim.updatedAt)
  );
}
export class ClaimWorkflow {
  private listeners = new Set<() => void>();
  private state: Snapshot;
  private storage: Storage;
  private storageKey: string;
  private post: (
    body: CreateClaimRequest,
    key: string,
  ) => Promise<CreateClaimResult>;
  constructor(
    storage: Storage,
    storageKey: string,
    post: (body: CreateClaimRequest, key: string) => Promise<CreateClaimResult>,
  ) {
    this.storage = storage;
    this.storageKey = storageKey;
    this.post = post;
    let operation: Operation | null = null,
      error: string | null = null;
    try {
      const raw = storage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as Operation;
        if (
          typeof saved.key !== "string" ||
          !saved.key ||
          saved.key.length > 100 ||
          !saved.body ||
          typeof saved.body.asset !== "string" ||
          typeof saved.body.amount !== "string" ||
          typeof saved.body.destinationId !== "string"
        )
          throw new Error("Invalid saved claim");
        // Recheck known IDs with GET, including cached terminal claims.
        operation = {
          key: saved.key,
          body: saved.body,
          ...(saved.claim
            ? {
                claim: {
                  ...parseClaim(saved.claim),
                  status: "pending" as const,
                },
              }
            : {}),
        };
      }
    } catch {
      error =
        "Saved claim could not be read. Claims are blocked to avoid creating a duplicate. Restore browser storage before continuing.";
    }
    this.state = { operation, busy: false, error };
  }
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  getSnapshot = () => this.state;
  private update(next: Snapshot) {
    this.state = next;
    this.listeners.forEach((fn) => fn());
  }
  private save(operation: Operation | null) {
    if (operation)
      this.storage.setItem(this.storageKey, JSON.stringify(operation));
    else this.storage.removeItem(this.storageKey);
  }
  async submit(body: CreateClaimRequest) {
    if (this.state.busy || this.state.operation || this.state.error) return;
    // Synchronous lock and durable write happen before the first network request.
    const operation = {
      key: crypto.randomUUID(),
      body: Object.freeze({ ...body }),
    };
    try {
      const existing = this.storage.getItem(this.storageKey);
      if (existing) {
        this.update({
          ...this.state,
          error:
            "Another tab has a saved claim. Reload to recover it before creating another.",
        });
        return;
      }
      this.save(operation);
    } catch {
      this.update({
        ...this.state,
        error:
          "Browser storage is unavailable. No claim was sent. Enable storage and reload.",
      });
      return;
    }
    await this.send(operation, false);
  }
  recover = async () => {
    if (this.state.busy || !this.state.operation) return;
    await this.send(this.state.operation, true);
  };
  private async send(operation: Operation, recovery: boolean) {
    this.update({ operation, busy: true, error: null });
    try {
      const result = await this.post(operation.body, operation.key);
      this.accept(result.claim, operation);
    } catch (error) {
      const rejected =
        !recovery &&
        error instanceof ApiError &&
        ["rejected", "not-sent"].includes(error.submissionOutcome);
      const message =
        error instanceof Error ? error.message : "Request failed.";
      if (rejected) {
        try {
          this.save(null);
          this.update({ operation: null, busy: false, error: message });
        } catch {
          this.update({
            operation,
            busy: false,
            error:
              "Could not clear saved request. Recover the original request before trying another.",
          });
        }
      } else
        this.update({
          operation,
          busy: false,
          error: `Outcome remains unknown. ${message}`,
        });
    }
  }
  accept(claim: Claim, operation = this.state.operation) {
    if (!operation) return;
    const next = { ...operation, claim };
    try {
      this.save(next);
      this.update({ operation: next, busy: false, error: null });
    } catch {
      this.update({
        operation: next,
        busy: false,
        error:
          "Claim received, but saving its status failed. The original request remains recoverable.",
      });
    }
  }
  clear(asOf?: string) {
    if (!snapshotSettled(this.state.operation, asOf) || this.state.busy) return;
    try {
      this.save(null);
      this.update({ operation: null, busy: false, error: null });
    } catch {
      this.update({
        ...this.state,
        error: "Could not clear saved claim. Please restore browser storage.",
      });
    }
  }
  dismissRejection = () => {
    if (!this.state.operation) this.update({ ...this.state, error: null });
  };
}
