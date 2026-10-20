import { Link, useLocalSearchParams } from "expo-router";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentRef,
} from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Shell } from "@/components/cashmine/shell";
import { Action, Copy, Icon, Status } from "@/components/cashmine/ui";
import { palette as c, type as font } from "@/constants/cashmine";
import { demoAssets, previewDemoClaim } from "@/data/demo";

type Stage = "edit" | "review" | "pending" | "completed" | "failed";

const subscribeToHydration = () => () => {};

export default function ClaimScreen() {
  const params = useLocalSearchParams<{ asset?: string }>();
  // Exported HTML has no query string. Match that first, then select the URL asset.
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const initialAsset = hydrated ? (params.asset ?? "USDT") : "USDT";
  return <ClaimForm key={initialAsset} initialAsset={initialAsset} />;
}

function ClaimForm({ initialAsset }: { initialAsset: string }) {
  const [selected, setSelected] = useState(initialAsset);
  const [amount, setAmount] = useState("");
  const [touched, setTouched] = useState(false);
  const [stage, setStage] = useState<Stage>("edit");
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const heading = useRef<ComponentRef<typeof View>>(null);
  const previousStage = useRef(stage);
  const asset =
    demoAssets.find((item) => item.asset === selected) ?? demoAssets[0];
  const preview = previewDemoClaim(amount, asset);
  const error = touched ? preview.error : null;
  useEffect(() => {
    // The full-page review/status view is deliberately not a modal.
    if (previousStage.current !== stage) heading.current?.focus();
    previousStage.current = stage;
  }, [stage]);

  function review() {
    setTouched(true);
    if (preview.error) {
      input.current?.focus();
      return;
    }
    setStage("review");
  }
  function reset() {
    setStage("edit");
    setAmount("");
    setTouched(false);
  }

  return (
    <Shell title="Claim payback">
      <View style={s.page}>
        <Link href="/" style={s.back}>
          ← Balances
        </Link>
        <View ref={heading} tabIndex={-1}>
          <Copy style={s.eyebrow}>MAKE IT YOURS</Copy>
          <Copy role="heading" aria-level={1} style={s.title}>
            {stage === "edit"
              ? "Claim your payback."
              : stage === "review"
                ? "Everything look right?"
                : stage === "pending"
                  ? "Your claim is on its way."
                  : stage === "completed"
                    ? "Payback, paid back."
                    : "This claim didn’t complete."}
          </Copy>
        </View>
        <Copy muted style={s.subtitle}>
          {stage === "edit"
            ? "Choose an asset and move your payback to your wallet."
            : stage === "review"
              ? "Review the details before you confirm your demo claim."
              : "This is a sample claim. Your balances have not changed."}
        </Copy>

        {stage === "edit" ? (
          <>
            <Copy weight="semibold" style={s.label}>
              Select asset
            </Copy>
            <View style={s.assets}>
              {demoAssets.map((item) => (
                <Pressable
                  key={item.asset}
                  accessibilityRole="button"
                  accessibilityState={{ selected: asset.asset === item.asset }}
                  aria-pressed={asset.asset === item.asset}
                  accessibilityLabel={`Select ${item.name}`}
                  onPress={() => {
                    setSelected(item.asset);
                    setAmount("");
                    setTouched(false);
                  }}
                  style={({ pressed }) => [
                    s.assetButton,
                    asset.asset === item.asset && s.selected,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Copy style={{ fontSize: 23, color: item.color }}>
                    {item.symbol}
                  </Copy>
                  <Copy weight="semibold">{item.asset}</Copy>
                </Pressable>
              ))}
            </View>
            <View style={s.formCard}>
              <View style={s.amountHeading}>
                <Copy nativeID="amount-label" weight="semibold">
                  Amount to claim
                </Copy>
                <Copy muted style={{ fontSize: 12 }}>
                  {asset.asset}
                </Copy>
              </View>
              <View style={[s.inputRow, error && { borderColor: c.negative }]}>
                <TextInput
                  ref={input}
                  value={amount}
                  onChangeText={setAmount}
                  onBlur={() => {
                    if (amount) setTouched(true);
                  }}
                  placeholder="0.00"
                  placeholderTextColor={c.muted}
                  style={s.input}
                  inputMode="decimal"
                  maxLength={80}
                  accessibilityLabel={`Amount to claim in ${asset.asset}`}
                  aria-labelledby="amount-label"
                  aria-describedby="amount-help"
                  aria-invalid={!!error}
                  onSubmitEditing={review}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Use maximum available amount"
                  onPress={() => {
                    setAmount(asset.available);
                    setTouched(true);
                  }}
                  style={({ pressed }) => [s.max, pressed && { opacity: 0.6 }]}
                >
                  <Copy
                    weight="semibold"
                    style={{ color: c.accent, fontSize: 12 }}
                  >
                    Max
                  </Copy>
                </Pressable>
              </View>
              <Copy
                nativeID="amount-help"
                accessibilityLiveRegion="polite"
                style={[
                  s.help,
                  error ? { color: c.negative } : { color: c.muted },
                ]}
              >
                {error ?? `Available: ${asset.available} ${asset.asset}`}
              </Copy>
              <View style={s.rule} />
              <Copy weight="semibold" style={{ marginBottom: 10 }}>
                Receive in
              </Copy>
              <View style={s.wallet}>
                <View style={s.walletIcon}>
                  <Icon name="wallet" size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Copy weight="semibold">My wallet</Copy>
                  <Copy muted style={s.small}>
                    0x8f3e…a91c
                  </Copy>
                </View>
                <Icon name="check" size={18} color={c.positive} />
              </View>
              <Copy muted style={[s.small, { marginTop: 10 }]}>
                Sample destination · Wallet selected for this demo
              </Copy>
              <View style={s.rule} />
              <View style={s.line}>
                <Copy muted>Claim fee</Copy>
                <Copy>
                  {asset.fee} {asset.asset}
                </Copy>
              </View>
              <View style={s.line}>
                <Copy muted>Minimum claim</Copy>
                <Copy>
                  {asset.min} {asset.asset}
                </Copy>
              </View>
              <View style={s.receive}>
                <Copy weight="semibold">You receive</Copy>
                <Copy weight="semibold" style={s.receiveValue}>
                  {preview.receive ?? "—"}{" "}
                  <Copy style={s.small}>{asset.asset}</Copy>
                </Copy>
              </View>
            </View>
            <View style={s.note}>
              <Icon name="info" size={17} color={c.muted} />
              <Copy muted style={[s.small, { flex: 1 }]}>
                The fee is deducted from your claim amount.
              </Copy>
            </View>
            <Action icon="arrow" onPress={review}>
              Review claim
            </Action>
          </>
        ) : stage === "review" ? (
          <>
            <View style={s.receipt}>
              <Status tone="warning">Review your claim</Status>
              <Copy muted style={{ marginTop: 16 }}>
                You receive
              </Copy>
              <Copy style={s.receiptAmount}>{preview.receive}</Copy>
              <Copy weight="semibold" style={{ color: c.accent }}>
                {asset.asset}
              </Copy>
              <View style={s.rule} />
              <View style={s.line}>
                <Copy muted>Claim amount</Copy>
                <Copy weight="semibold">
                  {amount} {asset.asset}
                </Copy>
              </View>
              <View style={s.line}>
                <Copy muted>Fee included</Copy>
                <Copy>
                  {asset.fee} {asset.asset}
                </Copy>
              </View>
              <View style={s.line}>
                <Copy muted>Destination</Copy>
                <Copy>0x8f3e…a91c</Copy>
              </View>
            </View>
            <Copy muted style={s.disclaimer}>
              Demo only. Confirming previews the claim status; no funds are
              moved.
            </Copy>
            <Action icon="check" onPress={() => setStage("pending")}>
              Confirm demo claim
            </Action>
            <Action variant="quiet" onPress={() => setStage("edit")}>
              Edit amount
            </Action>
          </>
        ) : (
          <>
            <View style={s.receipt}>
              <View
                style={[
                  s.resultIcon,
                  {
                    backgroundColor:
                      stage === "failed"
                        ? c.negativeSoft
                        : stage === "completed"
                          ? c.positiveSoft
                          : c.promo,
                  },
                ]}
              >
                <Icon
                  name={
                    stage === "failed"
                      ? "error"
                      : stage === "completed"
                        ? "check"
                        : "clock"
                  }
                  size={30}
                  color={
                    stage === "failed"
                      ? c.negative
                      : stage === "completed"
                        ? c.positive
                        : c.accent
                  }
                />
              </View>
              <Status
                tone={
                  stage === "failed"
                    ? "negative"
                    : stage === "completed"
                      ? "positive"
                      : "warning"
                }
              >
                {stage === "failed"
                  ? "Failed · sample"
                  : stage === "completed"
                    ? "Completed · sample"
                    : "Pending · sample"}
              </Status>
              <Copy style={s.receiptAmount}>{preview.receive}</Copy>
              <Copy weight="semibold" style={{ color: c.accent }}>
                {asset.asset}
              </Copy>
              <Copy muted style={{ marginTop: 12 }}>
                {stage === "failed"
                  ? "In a live claim, the claim amount would return to your available balance."
                  : stage === "completed"
                    ? "This previews a completed payment to your wallet."
                    : "In a live claim, this screen would follow its status until it completes or fails."}
              </Copy>
              <View style={s.rule} />
              <View style={s.line}>
                <Copy muted>Destination</Copy>
                <Copy>0x8f3e…a91c</Copy>
              </View>
              <View style={s.line}>
                <Copy muted>Claim amount</Copy>
                <Copy>
                  {amount} {asset.asset}
                </Copy>
              </View>
            </View>
            {stage === "pending" && (
              <View style={s.demoControls}>
                <Copy weight="semibold" style={s.small}>
                  Preview an outcome
                </Copy>
                <View style={s.outcomes}>
                  <View style={{ flex: 1 }}>
                    <Action
                      variant="secondary"
                      onPress={() => setStage("completed")}
                    >
                      Completed
                    </Action>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Action
                      variant="secondary"
                      onPress={() => setStage("failed")}
                    >
                      Failed
                    </Action>
                  </View>
                </View>
              </View>
            )}
            <Action onPress={reset}>Try another demo claim</Action>
          </>
        )}
      </View>
    </Shell>
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
