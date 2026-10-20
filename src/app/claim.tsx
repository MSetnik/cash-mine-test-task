import { strings } from "@/localization";
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
import { palette as c, typography as font, assetColors } from "@/styles/theme";
import { demoAssets, demoWallet, previewDemoClaim } from "@/data/demo";

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
  const error =
    touched && preview.error
      ? strings.claim.validation[preview.error](asset)
      : null;
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
    <Shell title={strings.claim.pageTitle}>
      <View style={s.page}>
        <Link href="/" style={s.back}>
          {strings.claim.back}
        </Link>
        <View ref={heading} tabIndex={-1}>
          <Copy style={s.eyebrow}>{strings.claim.eyebrow}</Copy>
          <Copy role="heading" aria-level={1} style={s.title}>
            {strings.claim.titles[stage]}
          </Copy>
        </View>
        <Copy muted style={s.subtitle}>
          {stage === "edit"
            ? strings.claim.editSubtitle
            : stage === "review"
              ? strings.claim.reviewSubtitle
              : strings.claim.sampleSubtitle}
        </Copy>

        {stage === "edit" ? (
          <>
            <Copy weight="semibold" style={s.label}>
              {strings.claim.selectAsset}
            </Copy>
            <View style={s.assets}>
              {demoAssets.map((item) => (
                <Pressable
                  key={item.asset}
                  accessibilityRole="button"
                  accessibilityState={{ selected: asset.asset === item.asset }}
                  aria-pressed={asset.asset === item.asset}
                  accessibilityLabel={strings.claim.selectAssetLabel(
                    strings.common.assets[item.asset],
                  )}
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
                  <Copy
                    style={{
                      fontSize: 23,
                      color: assetColors[item.asset].color,
                    }}
                  >
                    {item.symbol}
                  </Copy>
                  <Copy weight="semibold">{item.asset}</Copy>
                </Pressable>
              ))}
            </View>
            <View style={s.formCard}>
              <View style={s.amountHeading}>
                <Copy nativeID="amount-label" weight="semibold">
                  {strings.claim.amountLabel}
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
                  placeholder={strings.common.amountPlaceholder}
                  placeholderTextColor={c.muted}
                  style={s.input}
                  inputMode="decimal"
                  maxLength={80}
                  accessibilityLabel={strings.claim.amountAccessibilityLabel(
                    asset.asset,
                  )}
                  aria-labelledby="amount-label"
                  aria-describedby="amount-help"
                  aria-invalid={!!error}
                  onSubmitEditing={review}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={strings.claim.maxLabel}
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
                    {strings.claim.max}
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
                {error ?? strings.claim.available(asset.available, asset.asset)}
              </Copy>
              <View style={s.rule} />
              <Copy weight="semibold" style={{ marginBottom: 10 }}>
                {strings.claim.receiveIn}
              </Copy>
              <View style={s.wallet}>
                <View style={s.walletIcon}>
                  <Icon name="wallet" size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Copy weight="semibold">{strings.claim.myWallet}</Copy>
                  <Copy muted style={s.small}>
                    {demoWallet}
                  </Copy>
                </View>
                <Icon name="check" size={18} color={c.positive} />
              </View>
              <Copy muted style={[s.small, { marginTop: 10 }]}>
                {strings.claim.sampleDestination}
              </Copy>
              <View style={s.rule} />
              <View style={s.line}>
                <Copy muted>{strings.claim.fee}</Copy>
                <Copy>
                  {strings.common.assetAmount(asset.fee, asset.asset)}
                </Copy>
              </View>
              <View style={s.line}>
                <Copy muted>{strings.claim.minimum}</Copy>
                <Copy>
                  {strings.common.assetAmount(asset.min, asset.asset)}
                </Copy>
              </View>
              <View style={s.receive}>
                <Copy weight="semibold">{strings.claim.receive}</Copy>
                <Copy weight="semibold" style={s.receiveValue}>
                  {preview.receive ?? strings.common.unavailable}{" "}
                  <Copy style={s.small}>{asset.asset}</Copy>
                </Copy>
              </View>
            </View>
            <View style={s.note}>
              <Icon name="info" size={17} color={c.muted} />
              <Copy muted style={[s.small, { flex: 1 }]}>
                {strings.claim.feeNote}
              </Copy>
            </View>
            <Action icon="arrow" onPress={review}>
              {strings.claim.review}
            </Action>
          </>
        ) : stage === "review" ? (
          <>
            <View style={s.receipt}>
              <Status tone="warning">{strings.claim.reviewStatus}</Status>
              <Copy muted style={{ marginTop: 16 }}>
                {strings.claim.receive}
              </Copy>
              <Copy style={s.receiptAmount}>{preview.receive}</Copy>
              <Copy weight="semibold" style={{ color: c.accent }}>
                {asset.asset}
              </Copy>
              <View style={s.rule} />
              <View style={s.line}>
                <Copy muted>{strings.claim.amount}</Copy>
                <Copy weight="semibold">
                  {strings.common.assetAmount(amount, asset.asset)}
                </Copy>
              </View>
              <View style={s.line}>
                <Copy muted>{strings.claim.feeIncluded}</Copy>
                <Copy>
                  {strings.common.assetAmount(asset.fee, asset.asset)}
                </Copy>
              </View>
              <View style={s.line}>
                <Copy muted>{strings.claim.destination}</Copy>
                <Copy>{demoWallet}</Copy>
              </View>
            </View>
            <Copy muted style={s.disclaimer}>
              {strings.claim.disclaimer}
            </Copy>
            <Action icon="check" onPress={() => setStage("pending")}>
              {strings.claim.confirm}
            </Action>
            <Action variant="quiet" onPress={() => setStage("edit")}>
              {strings.claim.edit}
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
                {strings.claim.statuses[stage]}
              </Status>
              <Copy style={s.receiptAmount}>{preview.receive}</Copy>
              <Copy weight="semibold" style={{ color: c.accent }}>
                {asset.asset}
              </Copy>
              <Copy muted style={{ marginTop: 12 }}>
                {strings.claim.descriptions[stage]}
              </Copy>
              <View style={s.rule} />
              <View style={s.line}>
                <Copy muted>{strings.claim.destination}</Copy>
                <Copy>{demoWallet}</Copy>
              </View>
              <View style={s.line}>
                <Copy muted>{strings.claim.amount}</Copy>
                <Copy>{strings.common.assetAmount(amount, asset.asset)}</Copy>
              </View>
            </View>
            {stage === "pending" && (
              <View style={s.demoControls}>
                <Copy weight="semibold" style={s.small}>
                  {strings.claim.previewOutcome}
                </Copy>
                <View style={s.outcomes}>
                  <View style={{ flex: 1 }}>
                    <Action
                      variant="secondary"
                      onPress={() => setStage("completed")}
                    >
                      {strings.common.statuses.Completed}
                    </Action>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Action
                      variant="secondary"
                      onPress={() => setStage("failed")}
                    >
                      {strings.common.statuses.Failed}
                    </Action>
                  </View>
                </View>
              </View>
            )}
            <Action onPress={reset}>{strings.claim.tryAgain}</Action>
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
