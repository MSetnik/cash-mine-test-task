import { strings } from "@/localization";
import { Link, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Shell } from "@/components/cashmine/shell";
import { Action, Copy } from "@/components/cashmine/ui";
import {
  ClaimStatusCard,
  RequestError,
} from "@/components/cashmine/live-state";
import { palette as c, typography as font } from "@/styles/theme";
import { useBalances, useOperation, useSession } from "@/state/session";
import { previewClaim } from "@/lib/amounts";

export default function ClaimScreen() {
  const params = useLocalSearchParams<{ asset?: string }>();
  return (
    <Shell title="Claim">
      <ClaimForm key={params.asset ?? "default"} initialAsset={params.asset} />
    </Shell>
  );
}
function ClaimForm({ initialAsset }: { initialAsset?: string }) {
  const { api, request, workflow } = useSession();
  const balances = useBalances();
  const { operation, error, busy } = useOperation();
  const [selected, setSelected] = useState(initialAsset);
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState<string>();
  const [review, setReview] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const asset =
    balances.data?.items.find((b) => b.asset === selected) ??
    balances.data?.items[0];
  const options = useQuery({
    queryKey: ["claim-options", asset?.asset],
    enabled: !!asset,
    queryFn: ({ signal }) =>
      request(() => api.getClaimOptions(asset!.asset, { signal })),
  });
  const destinationId = destination ?? options.data?.destinations[0]?.id ?? "";
  const preview =
    asset && options.data
      ? previewClaim(amount, asset, options.data, destinationId)
      : null;
  const signature = JSON.stringify({
    asset: asset?.asset,
    amount: preview?.amount,
    receive: preview?.receive,
    options: options.data,
    destinationId,
  });
  const reviewing = review !== null && review === signature && !preview?.error;
  const valid =
    !!preview && !preview.error && !options.isError && !balances.isError;
  const reload = () => {
    void balances.refetch();
    void options.refetch();
  };
  return (
    <View style={s.page}>
      <Link href="/" style={s.back}>
        ← Back to balances
      </Link>
      <Copy style={s.eyebrow}>READY WHEN YOU ARE</Copy>
      <Copy role="heading" aria-level={1} style={s.title}>
        {operation
          ? "Your claim"
          : reviewing
            ? "Review your claim."
            : "Make it yours."}
      </Copy>
      <Copy muted style={s.subtitle}>
        Claim your confirmed payback. The fee is deducted once from the amount
        you choose.
      </Copy>
      <ClaimStatusCard />
      <RequestError error={balances.error ?? options.error} retry={reload} />
      {!operation && (
        <>
          {error && (
            <View style={{ gap: 12, marginBottom: 20 }}>
              <Copy role="alert" style={{ color: c.negative }}>
                {error}
              </Copy>
              <Action
                variant="secondary"
                onPress={() => {
                  workflow.dismissRejection();
                  setReview(null);
                  reload();
                }}
              >
                Review updated balances
              </Action>
            </View>
          )}
          {!asset || !options.data ? (
            <Copy>
              {balances.isPending || options.isPending
                ? "Loading claim rules…"
                : "No assets available to claim."}
            </Copy>
          ) : (
            <>
              {!reviewing && (
                <>
                  <Copy weight="semibold" style={s.label}>
                    Choose an asset
                  </Copy>
                  <View style={s.assets}>
                    {balances.data?.items.map((b) => (
                      <Pressable
                        key={b.asset}
                        accessibilityRole="button"
                        aria-pressed={asset.asset === b.asset}
                        onPress={() => {
                          setSelected(b.asset);
                          setAmount("");
                          setDestination(undefined);
                          setReview(null);
                          setTouched(false);
                        }}
                        style={[
                          s.assetButton,
                          asset.asset === b.asset && s.selected,
                        ]}
                      >
                        <Copy weight="semibold">{b.asset}</Copy>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}
              <View style={s.formCard}>
                <Copy weight="semibold" style={s.label}>
                  {reviewing ? "Claim amount" : "Amount"}
                </Copy>
                {reviewing ? (
                  <Copy style={{ fontSize: 26, lineHeight: 36 }}>
                    {preview?.amount} {asset.asset}
                  </Copy>
                ) : (
                  <>
                    <View
                      style={[
                        s.inputRow,
                        touched &&
                          !!preview?.error && { borderColor: c.negative },
                      ]}
                    >
                      <TextInput
                        accessibilityLabel="Claim amount"
                        aria-describedby="amount-help"
                        aria-invalid={touched && !!preview?.error}
                        value={amount}
                        onChangeText={(value) => {
                          setAmount(value);
                          setReview(null);
                        }}
                        onBlur={() => setTouched(true)}
                        inputMode="decimal"
                        autoCorrect={false}
                        maxLength={80}
                        placeholder="0.00"
                        style={s.input}
                      />
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Use maximum available amount"
                        style={s.max}
                        onPress={() => {
                          setAmount(asset.available);
                          setTouched(true);
                        }}
                      >
                        <Copy style={{ color: c.accent }} weight="semibold">
                          {strings.claim.max}
                        </Copy>
                      </Pressable>
                    </View>
                    <Copy
                      nativeID="amount-help"
                      role={touched && preview?.error ? "alert" : undefined}
                      style={[
                        s.help,
                        {
                          color:
                            touched && preview?.error ? c.negative : c.muted,
                        },
                      ]}
                    >
                      {touched && preview?.error
                        ? preview.error
                        : `Available: ${asset.available} ${asset.asset} · Minimum: ${options.data.minAmount}`}
                    </Copy>
                  </>
                )}
                <View style={s.rule} />
                <Copy weight="semibold" style={s.label}>
                  {strings.claim.destination}
                </Copy>
                {reviewing ? (
                  <Copy>
                    {
                      options.data.destinations.find(
                        (d) => d.id === destinationId,
                      )?.label
                    }
                  </Copy>
                ) : (
                  options.data.destinations.map((d) => (
                    <Pressable
                      key={d.id}
                      accessibilityRole="button"
                      aria-pressed={destinationId === d.id}
                      onPress={() => setDestination(d.id)}
                      style={{
                        borderWidth: 1,
                        borderColor:
                          destinationId === d.id ? c.accent : c.border,
                        backgroundColor:
                          destinationId === d.id ? c.promo : c.card,
                        padding: 14,
                        borderRadius: 12,
                        marginBottom: 8,
                      }}
                    >
                      <Copy>{d.label}</Copy>
                    </Pressable>
                  ))
                )}
                {!options.data.destinations.length && (
                  <Copy>No destinations available.</Copy>
                )}
                <View style={s.rule} />
                <View style={s.line}>
                  <Copy muted>Fixed fee</Copy>
                  <Copy>
                    {options.data.fee} {asset.asset}
                  </Copy>
                </View>
                <View style={s.line}>
                  <Copy weight="semibold">{strings.claim.receive}</Copy>
                  <Copy weight="semibold">
                    {preview?.receive ?? "—"} {asset.asset}
                  </Copy>
                </View>
                <Copy muted style={s.small}>
                  Snapshot: {new Date(balances.data!.asOf).toUTCString()}. The
                  server checks your available funds again on submission.
                </Copy>
              </View>
              <View style={{ gap: 10, marginTop: 20 }}>
                {review !== null && !reviewing && (
                  <Copy role="alert">
                    Claim details changed. Please review them again.
                  </Copy>
                )}
                {reviewing ? (
                  <>
                    <Action
                      busy={busy}
                      disabled={
                        !valid ||
                        options.isFetching ||
                        balances.isFetching ||
                        !!error
                      }
                      onPress={() => {
                        if (valid && signature === review && preview?.amount)
                          void workflow.submit({
                            asset: asset.asset,
                            amount: preview.amount,
                            destinationId,
                          });
                      }}
                    >
                      Confirm claim
                    </Action>
                    <Action variant="quiet" onPress={() => setReview(null)}>
                      {strings.claim.edit}
                    </Action>
                  </>
                ) : (
                  <Action
                    disabled={
                      !valid ||
                      options.isFetching ||
                      balances.isFetching ||
                      !!error
                    }
                    onPress={() => {
                      setTouched(true);
                      if (valid) setReview(signature);
                    }}
                  >
                    {strings.claim.review}
                  </Action>
                )}
              </View>
            </>
          )}
        </>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  page: { width: "100%", maxWidth: 520, alignSelf: "center" },
  back: {
    fontFamily: font.regular,
    color: c.muted,
    fontSize: 12,
    paddingVertical: 10,
    marginBottom: 15,
    alignSelf: "flex-start",
  },
  eyebrow: {
    fontSize: 10,
    color: c.accent,
    letterSpacing: 1.8,
    fontFamily: font.semibold,
    marginBottom: 8,
  },
  title: {
    fontFamily: font.semibold,
    fontSize: 27,
    lineHeight: 35,
    letterSpacing: -1,
  },
  subtitle: { marginTop: 10, marginBottom: 28 },
  label: { marginBottom: 12 },
  assets: { flexDirection: "row", gap: 10, marginBottom: 20 },
  assetButton: {
    flex: 1,
    minHeight: 75,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.card,
  },
  selected: { borderColor: c.accent, backgroundColor: c.promo },
  formCard: { padding: 20, borderRadius: 20, backgroundColor: c.card },
  amountHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  inputRow: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    backgroundColor: c.background,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    minHeight: 72,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 27,
    lineHeight: 36,
    fontFamily: font.semibold,
    color: c.ink,
    paddingVertical: 14,
  },
  max: {
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  help: { minHeight: 44, paddingTop: 9, fontSize: 11, lineHeight: 17 },
  rule: { height: 1, backgroundColor: c.border, marginVertical: 20 },
  wallet: { flexDirection: "row", alignItems: "center", gap: 12 },
  walletIcon: {
    height: 42,
    width: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: c.field,
  },
  small: { fontSize: 12, lineHeight: 18 },
  line: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  receive: {
    backgroundColor: c.promo,
    padding: 14,
    borderRadius: 12,
    gap: 4,
    marginTop: 7,
  },
  receiveValue: { fontSize: 22, lineHeight: 30, color: c.accent },
  note: {
    flexDirection: "row",
    gap: 7,
    marginVertical: 16,
    alignItems: "center",
  },
  receipt: { padding: 24, backgroundColor: c.card, borderRadius: 20 },
  receiptAmount: {
    fontSize: 36,
    lineHeight: 46,
    fontFamily: font.semibold,
    letterSpacing: -1,
    marginTop: 12,
  },
  disclaimer: {
    fontSize: 12,
    lineHeight: 18,
    marginVertical: 18,
    textAlign: "center",
  },
  resultIcon: {
    height: 64,
    width: 64,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  demoControls: { paddingVertical: 20, gap: 12 },
  outcomes: { flexDirection: "row", gap: 10 },
});
