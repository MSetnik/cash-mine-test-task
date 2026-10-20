import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { ActivityIndicator, ScrollView, TextInput, View } from "react-native";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ApiError, createCashmineApi, type CashmineApi } from "@/api";
import { Action, Copy } from "@/components/cashmine/ui";
import { palette as c } from "@/constants/cashmine";
import { ClaimWorkflow, snapshotSettled } from "./claim-workflow";

const SESSION_KEY = "cashmine.session.v1";
type Session = { token: string; scope: string };
type Context = {
  api: CashmineApi;
  workflow: ClaimWorkflow;
  changeToken: () => void;
  request: <T>(fn: () => Promise<T>) => Promise<T>;
};
const SessionContext = createContext<Context | null>(null);
const subscribe = () => () => {};
export function SessionGate({ children }: { children: ReactNode }) {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return hydrated ? (
    <BrowserSession>{children}</BrowserSession>
  ) : (
    <ActivityIndicator accessibilityLabel="Loading session" />
  );
}
function BrowserSession({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null");
      return saved?.token && saved?.scope ? saved : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function connect() {
    if (!token.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const clean = token.trim();
      createCashmineApi({ token: clean });
      const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(clean),
      );
      const next = {
        token: clean,
        scope: Array.from(new Uint8Array(digest), (b) =>
          b.toString(16).padStart(2, "0"),
        ).join(""),
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      setSession(next);
      setToken("");
    } catch {
      setError(
        "Use a valid token without spaces, enable browser storage, and connect over HTTPS or localhost.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (session)
    return (
      <ConnectedSession
        key={session.scope}
        session={session}
        changeToken={() => {
          try {
            localStorage.removeItem(SESSION_KEY);
          } catch {
            /* Current session still closes. */
          }
          setSession(null);
        }}
      >
        {children}
      </ConnectedSession>
    );
  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "center",
        padding: 24,
        backgroundColor: c.background,
      }}
    >
      <View
        style={{ maxWidth: 440, width: "100%", alignSelf: "center", gap: 20 }}
      >
        <Copy style={{ color: c.accent, letterSpacing: 2 }} weight="semibold">
          CASHMINE
        </Copy>
        <Copy
          role="heading"
          aria-level={1}
          style={{ fontSize: 32, lineHeight: 40 }}
          weight="semibold"
        >
          Your payback starts here.
        </Copy>
        <Copy muted>
          Enter your CashMine test API token. It stays in this browser so you
          can pick up where you left off.
        </Copy>
        <Copy weight="semibold" nativeID="token-label">
          API token
        </Copy>
        <TextInput
          aria-labelledby="token-label"
          accessibilityLabel="API token"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          value={token}
          onChangeText={setToken}
          onSubmitEditing={connect}
          style={{
            backgroundColor: c.card,
            borderWidth: 1,
            borderColor: c.border,
            padding: 16,
            borderRadius: 12,
            fontSize: 16,
          }}
        />
        {error ? (
          <Copy role="alert" style={{ color: c.negative }}>
            {error}
          </Copy>
        ) : null}
        <Action busy={busy} disabled={!token.trim()} onPress={connect}>
          Connect to CashMine
        </Action>
        <Copy muted style={{ fontSize: 12 }}>
          Use your own token. You can change it at any time. Unresolved claims
          are kept separately for each token.
        </Copy>
      </View>
    </ScrollView>
  );
}
function ConnectedSession({
  session,
  changeToken,
  children,
}: {
  session: Session;
  changeToken: () => void;
  children: ReactNode;
}) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            staleTime: 10000,
            refetchOnWindowFocus: true,
          },
          mutations: { retry: false },
        },
      }),
  );
  const [context] = useState<Context>(() => {
    const api = createCashmineApi({ token: session.token });
    let blockedUntil = 0;
    const request: Context["request"] = async (fn) => {
      const remaining = blockedUntil - Date.now();
      if (remaining > 0)
        throw new ApiError(
          `Rate limit: retry in ${Math.ceil(remaining / 1000)} seconds.`,
          {
            kind: "http",
            status: 429,
            retryAfterMs: remaining,
            submissionOutcome: "not-sent",
          },
        );
      try {
        return await fn();
      } catch (error) {
        if (error instanceof ApiError && error.status === 429)
          blockedUntil = Date.now() + (error.retryAfterMs ?? 5000);
        throw error;
      }
    };
    return {
      api,
      request,
      changeToken,
      workflow: new ClaimWorkflow(
        localStorage,
        `cashmine.claim.v1.${session.scope}`,
        (body, key) => request(() => api.createClaim(body, key)),
      ),
    };
  });
  useEffect(
    () => () => {
      void client.cancelQueries();
      client.clear();
    },
    [client],
  );
  return (
    <SessionContext.Provider value={context}>
      <QueryClientProvider client={client}>
        <ClaimTracker />
        {children}
      </QueryClientProvider>
    </SessionContext.Provider>
  );
}
export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("Missing session");
  return value;
}
export function useOperation() {
  const { workflow } = useSession();
  return useSyncExternalStore(
    workflow.subscribe,
    workflow.getSnapshot,
    workflow.getSnapshot,
  );
}
function ClaimTracker() {
  const queryClient = useQueryClient();
  const { api, request, workflow } = useSession();
  const { operation } = useOperation();
  const claim = operation?.claim;
  const query = useQuery({
    queryKey: ["claim", claim?.id],
    queryFn: ({ signal }) => request(() => api.getClaim(claim!.id, { signal })),
    enabled: claim?.status === "pending",
    refetchInterval: (q) =>
      q.state.error instanceof ApiError && q.state.error.status === 401
        ? false
        : Math.max(
            3000,
            q.state.error instanceof ApiError
              ? (q.state.error.retryAfterMs ?? 0)
              : 0,
          ),
  });
  useEffect(() => {
    if (query.data) {
      workflow.accept(query.data);
      if (query.data.status !== "pending") {
        void queryClient.invalidateQueries({ queryKey: ["balances"] });
        void queryClient.invalidateQueries({ queryKey: ["activity"] });
      }
    }
  }, [query.data, workflow, queryClient]);
  return query.error && claim?.status === "pending" ? (
    <View style={{ padding: 12, backgroundColor: c.promo }}>
      <Copy role="alert">
        Tracking interrupted; your claim is still pending.{" "}
        {query.error instanceof ApiError && query.error.status === 401
          ? "Change your token to restore access."
          : query.error.message}
      </Copy>
      <Action variant="quiet" onPress={() => void query.refetch()}>
        Retry tracking
      </Action>
    </View>
  ) : null;
}
export function useBalances() {
  const { api, request } = useSession();
  const { operation } = useOperation();
  return useQuery({
    queryKey: ["balances"],
    queryFn: ({ signal }) => request(() => api.getBalances({ signal })),
    refetchInterval: (q) =>
      q.state.error instanceof ApiError && q.state.error.status === 401
        ? false
        : operation && !snapshotSettled(operation, q.state.data?.asOf)
          ? Math.max(
              15000,
              q.state.error instanceof ApiError
                ? (q.state.error.retryAfterMs ?? 0)
                : 0,
            )
          : false,
  });
}
