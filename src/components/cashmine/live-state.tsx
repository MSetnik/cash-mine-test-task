import { useEffect, useState } from "react";
import { View } from "react-native";
import { ApiError } from "@/api";
import { useBalances, useOperation, useSession } from "@/state/session";
import { snapshotSettled } from "@/state/claim-workflow";
import { palette as c } from "@/styles/theme";
import { Action, Copy, Status } from "./ui";

export function RequestError({
  error,
  retry,
}: {
  error: Error | null;
  retry: () => void;
}) {
  const { changeToken } = useSession();
  if (!error) return null;
  const unauthorized = error instanceof ApiError && error.status === 401;
  return (
    <View
      style={{
        gap: 8,
        padding: 16,
        backgroundColor: c.negativeSoft,
        borderRadius: 12,
        marginVertical: 12,
      }}
    >
      <Copy role="alert" style={{ color: c.negative }}>
        {unauthorized
          ? "Your token is invalid or expired. Any unresolved claim is still saved."
          : error.message}
      </Copy>
      {error instanceof ApiError && error.status === 429 && (
        <Copy muted>
          Requests are paused for the server’s retry interval. Retrying early
          will not send another request.
        </Copy>
      )}
      <Action variant="secondary" onPress={unauthorized ? changeToken : retry}>
        {unauthorized ? "Replace token" : "Retry"}
      </Action>
    </View>
  );
}
export function ClaimStatusCard() {
  const { workflow } = useSession();
  const { operation, busy, error } = useOperation();
  const balances = useBalances();
  if (!operation) return null;
  const claim = operation.claim;
  const terminal = claim && claim.status !== "pending";
  const settled = snapshotSettled(operation, balances.data?.asOf);
  return (
    <View
      style={{
        gap: 12,
        padding: 20,
        backgroundColor: c.promo,
        borderRadius: 18,
        marginBottom: 20,
      }}
      accessibilityLiveRegion="polite"
    >
      <Status
        tone={
          claim?.status === "failed"
            ? "negative"
            : claim?.status === "completed"
              ? "positive"
              : "warning"
        }
      >
        {busy
          ? "Submitting claim"
          : claim
            ? `Claim ${claim.status}`
            : "Claim outcome unknown"}
      </Status>
      <Copy weight="semibold">
        {operation.body.amount} {operation.body.asset}
      </Copy>
      <Copy>
        {busy
          ? "Waiting for the server. This request is saved for recovery."
          : !claim
            ? "The request may have been accepted. Recover its result before making another claim."
            : claim.status === "pending"
              ? "Your claim is reserved. We’re checking its status; balances may still show the earlier snapshot."
              : claim.status === "failed"
                ? `The claim failed: ${claim.failureReason ?? "No reason provided"}. The server returns the amount to available.`
                : `You received ${claim.receiveAmount} ${claim.asset}.`}
      </Copy>
      {error && (
        <Copy role="alert" style={{ color: c.negative }}>
          {error}
        </Copy>
      )}
      {!claim && (
        <Action busy={busy} onPress={() => void workflow.recover()}>
          Recover original claim
        </Action>
      )}
      {terminal && (
        <>
          <Copy muted>
            {settled
              ? "The balance snapshot now includes settlement."
              : "Waiting for a balance snapshot dated after settlement. Another claim stays blocked until then."}
          </Copy>
          <Action
            variant="secondary"
            busy={balances.isFetching}
            onPress={() => void balances.refetch()}
          >
            Refresh balances
          </Action>
          <Action
            disabled={!settled}
            onPress={() => workflow.clear(balances.data?.asOf)}
          >
            Start another claim
          </Action>
        </>
      )}
    </View>
  );
}

export function SnapshotTime({
  asOf,
  refreshing,
}: {
  asOf?: string;
  refreshing: boolean;
}) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);
  const seconds = asOf
    ? Math.max(0, Math.floor((now - Date.parse(asOf)) / 1000))
    : 0;
  const age =
    seconds < 60
      ? `${seconds}s`
      : seconds < 3600
        ? `${Math.floor(seconds / 60)}m`
        : `${Math.floor(seconds / 3600)}h`;
  return (
    <Copy
      muted
      style={{
        fontSize: 11,
        lineHeight: 17,
        flexShrink: 1,
        textAlign: "center",
      }}
    >
      {asOf
        ? `Snapshot: ${new Date(asOf).toUTCString()} · ${age} old${refreshing ? " · refreshing…" : " · server updates every 15s"}`
        : "No balance snapshot yet"}
    </Copy>
  );
}
