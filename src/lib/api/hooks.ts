"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { api, ApiError, uploadMultipart, type Ok } from "./client";

function unwrap<T>(res: { data?: T; error?: unknown; response: Response }): T {
  if (res.error || !res.data) {
    const p = res.error as { status?: number; code?: string; detail?: string; title?: string } | undefined;
    throw new ApiError(res.response.status, p?.code, p?.detail ?? p?.title ?? "Request failed");
  }
  return res.data;
}

/** For 204 No Content endpoints — openapi-fetch leaves `data` undefined on success, so check status. */
function expectOk(res: { error?: unknown; response: Response }, fallback = "Request failed"): true {
  if (res.error || !res.response.ok) {
    const p = res.error as { code?: string; detail?: string; title?: string } | undefined;
    throw new ApiError(res.response.status, p?.code, p?.detail ?? p?.title ?? fallback);
  }
  return true;
}

/* ---------------- Scam checking ---------------- */

export type Assessment = Ok<"/api/v1/scam-check/text", "post">;

export function useCheckText() {
  return useMutation({
    mutationFn: async (input: {
      text: string;
      isLink?: boolean;
      conversationContext?: string | null;
      languageCode?: string | null;
    }) =>
      unwrap(
        await api.POST("/api/v1/scam-check/text", {
          body: { ...input, isLink: input.isLink ?? false },
        }),
      ),
  });
}

export function useCheckMedia(kind: "image" | "audio") {
  return useMutation({
    mutationFn: async (input: { file: File; context?: string; language?: string }) => {
      const form = new FormData();
      form.set("file", input.file);
      if (input.context) form.set("context", input.context);
      if (input.language) form.set("language", input.language);
      return uploadMultipart<Assessment>(`/api/v1/scam-check/${kind}`, form);
    },
  });
}

export function useAssessment(id: string | undefined) {
  return useQuery({
    queryKey: ["assessment", id],
    enabled: !!id,
    queryFn: async () => unwrap(await api.GET("/api/v1/scam-check/{assessmentId}", { params: { path: { assessmentId: id! } } })),
  });
}

export function useDisputeAssessment() {
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) =>
      expectOk(
        await api.POST("/api/v1/scam-check/{assessmentId}/dispute", {
          params: { path: { assessmentId: id } },
          body: { reason },
        }),
        "Не удалось отправить оценку на проверку",
      ),
  });
}

/* ---------------- Second opinion ---------------- */

export type SecondOpinion = Ok<"/api/v1/payments/second-opinion", "post">;

export function useSecondOpinion() {
  return useMutation({
    mutationFn: async (body: {
      recipientIdentifier: string;
      recipientIdentifierKind?: string | null;
      amountTenge?: number | null;
      isFirstTransferToRecipient: boolean;
      recentConversation?: string | null;
    }) => unwrap(await api.POST("/api/v1/payments/second-opinion", { body: body as never })),
  });
}

/* ---------------- Lookup + Radar ---------------- */

export type Reputation = Ok<"/api/v1/lookup/{phoneOrIban}", "get">;

export function useLookup(value: string, enabled: boolean) {
  return useQuery({
    queryKey: ["lookup", value],
    enabled: enabled && value.trim().length > 3,
    queryFn: async () => unwrap(await api.GET("/api/v1/lookup/{phoneOrIban}", { params: { path: { phoneOrIban: value.trim() } } })),
  });
}

export type RecentReport = Ok<"/api/v1/reports", "get">[number];

export function useRecentReports(region?: string) {
  return useQuery({
    queryKey: ["reports", region ?? "all"],
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/reports", { params: { query: region ? { region } : {} } })),
    refetchInterval: 30_000,
  });
}

export function useSubmitReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      primaryIdentifier: string;
      primaryIdentifierKind?: string | null;
      category: string;
      narrative: string;
      regionCode?: string | null;
      claimedLossTenge?: number | null;
    }) => {
      const res = await fetch("/backend/api/v1/reports", {
        method: "POST",
        headers: { "content-type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const p = await res.json().catch(() => ({}));
        throw new ApiError(res.status, p.code, p.detail ?? p.title ?? "Failed to submit report");
      }
      return res.json() as Promise<Ok<"/api/v1/reports", "post">>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
}

/* ---------------- Fraud graph ---------------- */

export type FraudCluster = Ok<"/api/v1/fraud-graph/clusters", "get">[number];
export type IdentifierGraph = Ok<"/api/v1/fraud-graph/identifier/{identifier}", "get">;

export function useFraudClusters(take = 20) {
  return useQuery({
    queryKey: ["clusters", take],
    queryFn: async () => unwrap(await api.GET("/api/v1/fraud-graph/clusters", { params: { query: { take } } })),
  });
}

export function useIdentifierGraph(identifier: string | undefined, depth = 2) {
  return useQuery({
    queryKey: ["graph", identifier, depth],
    enabled: !!identifier,
    queryFn: async () =>
      unwrap(
        await api.GET("/api/v1/fraud-graph/identifier/{identifier}", {
          params: { path: { identifier: identifier! }, query: { depth } },
        }),
      ),
  });
}

/* ---------------- Courses / learning ---------------- */

export type CourseSummary = Ok<"/api/v1/courses", "get">[number];
export type CourseDetail = Ok<"/api/v1/courses/{courseId}", "get">;
export type Leaderboard = Ok<"/api/v1/leaderboard", "get">;
export type LessonProgress = Ok<"/api/v1/courses/{courseId}/progress", "post">;

export function useCourses(lang: string, track?: string) {
  return useQuery({
    queryKey: ["courses", lang, track ?? "all"],
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/courses", { params: { query: { lang, ...(track ? { track } : {}) } } as never })),
  });
}

export function useCourseDetail(courseId: string | undefined, lang: string) {
  return useQuery({
    queryKey: ["course", courseId, lang],
    enabled: !!courseId,
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/courses/{courseId}", { params: { path: { courseId: courseId! }, query: { lang } } as never })),
  });
}

/** Region league: names appear only for people who opted in (LeaderboardName consent). */
export function useLeaderboard(region?: string | null, take = 15) {
  return useQuery({
    queryKey: ["leaderboard", region ?? "all", take],
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/leaderboard", { params: { query: { take, ...(region ? { region } : {}) } } as never })),
  });
}

export function useRecordProgress(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    // The server grades the answer — the correct option never reaches the browser.
    mutationFn: async (body: { lessonId: string; selectedOptionIndex: number | null }) =>
      unwrap(await api.POST("/api/v1/courses/{courseId}/progress", { params: { path: { courseId } }, body })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      qc.invalidateQueries({ queryKey: ["resilience"] });
      qc.invalidateQueries({ queryKey: ["course", courseId] });
    },
  });
}

export function useResilienceScore(userId: string | undefined) {
  return useQuery({
    queryKey: ["resilience", userId],
    enabled: !!userId,
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/users/{userId}/resilience-score", { params: { path: { userId: userId! } } })),
  });
}

/* ---------------- Guardian / family ---------------- */

export function useSetSafeWord() {
  return useMutation({
    mutationFn: async (body: { familyLabel: string; phrase: string }) =>
      unwrap(await api.POST("/api/v1/family/safe-word", { body })),
  });
}

export function useVerifyCaller() {
  return useMutation({
    mutationFn: async (body: { ownerUserId: string; providedPhrase: string }) =>
      unwrap(await api.POST("/api/v1/family/verify-caller", { body })),
  });
}

export function useVulnerabilityIndex(userId: string | undefined) {
  return useQuery({
    queryKey: ["vulnerability", userId],
    enabled: !!userId,
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/guardian/{userId}/vulnerability-index", { params: { path: { userId: userId! } } })),
  });
}

export function useSetProtectionMode(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { mode: "Standard" | "Heightened" | "Lockdown" }) =>
      expectOk(await api.POST("/api/v1/guardian/{userId}/protection-mode", { params: { path: { userId } }, body: body as never })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vulnerability", userId] }),
  });
}

/* ---------------- Assistant / admin ---------------- */

export type PartnerRiskCheck = Ok<"/api/v1/partners/risk-check", "post">;

/** B2B risk-check. Requires an X-Api-Key (the proxy passes the header through to the backend). */
export function usePartnerRiskCheck(apiKey: string) {
  return useMutation({
    mutationFn: async (body: {
      text?: string;
      recipientIdentifier?: string;
      recipientIdentifierKind?: string | null;
      languageCode?: string | null;
    }) => {
      const res = await fetch("/backend/api/v1/partners/risk-check", {
        method: "POST",
        headers: { "content-type": "application/json", "X-Api-Key": apiKey },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const p = await res.json().catch(() => ({}));
        throw new ApiError(res.status, p.code, p.detail ?? p.title ?? "Risk check failed");
      }
      return res.json() as Promise<PartnerRiskCheck>;
    },
  });
}

export function useGoldenHour() {
  return useMutation({
    mutationFn: async (body: { category: string; languageCode?: string | null; incidentSummary?: string | null }) =>
      unwrap(await api.POST("/api/v1/assistant/golden-hour", { body: body as never })),
  });
}

export function useAuditLedger(enabled: boolean) {
  return useQuery({
    queryKey: ["audit-ledger"],
    enabled,
    queryFn: async () => unwrap(await api.GET("/api/v1/transparency/audit-ledger")),
  });
}

export function useHealth() {
  return useQuery<{ status: string; checks: { name: string; status: string }[] }>({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await fetch("/backend/health/ready");
      return res.json();
    },
    refetchInterval: 15_000,
  });
}

export type { UseQueryOptions };

/* ---------------- Account & privacy ---------------- */

export type MyConsents = Ok<"/api/v1/me/consents", "get">;
export type ConsentScopeName = MyConsents["consents"][number]["scope"];

export function useMyConsents(enabled = true) {
  return useQuery({
    queryKey: ["me", "consents"],
    enabled,
    retry: false,
    queryFn: async () => unwrap(await api.GET("/api/v1/me/consents")),
  });
}

export function useSetConsent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { scope: ConsentScopeName; granted: boolean }) =>
      unwrap(await api.PUT("/api/v1/me/consents", { body: body as never })),
    onSuccess: (data) => qc.setQueryData(["me", "consents"], data),
  });
}

export function useDeletionStatus(enabled = true) {
  return useQuery({
    queryKey: ["me", "deletion"],
    enabled,
    retry: false,
    queryFn: async () => unwrap(await api.GET("/api/v1/me/delete")),
  });
}

export function useRequestDeletion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => unwrap(await api.POST("/api/v1/me/delete")),
    onSuccess: (data) => qc.setQueryData(["me", "deletion"], data),
  });
}

export function useCancelDeletion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => unwrap(await api.DELETE("/api/v1/me/delete")),
    onSuccess: (data) => qc.setQueryData(["me", "deletion"], data),
  });
}

export function useExportMyData() {
  return useMutation({
    mutationFn: async () => unwrap(await api.POST("/api/v1/me/export")),
  });
}

export type MySession = Ok<"/api/v1/me/sessions", "get">[number];

export function useMySessions(enabled = true) {
  return useQuery({
    queryKey: ["me", "sessions"],
    enabled,
    retry: false,
    queryFn: async () => unwrap(await api.GET("/api/v1/me/sessions")),
  });
}

export function useRevokeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) =>
      expectOk(await api.DELETE("/api/v1/me/sessions/{sessionId}", { params: { path: { sessionId } } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me", "sessions"] }),
  });
}

/* ---------------- Check 2.0: URL, QR, streamed check, patterns ---------------- */

export type UrlScan = Ok<"/api/v1/scam-check/url", "post">;
export type QrScan = Ok<"/api/v1/scam-check/qr", "post">;
export type ScamPattern = Ok<"/api/v1/scam-patterns", "get">[number];

export function useScanUrl() {
  return useMutation({
    mutationFn: async (body: { url: string; languageCode?: string | null }) =>
      unwrap(await api.POST("/api/v1/scam-check/url", { body: { url: body.url, languageCode: body.languageCode ?? null } })),
  });
}

export function useScanQr() {
  return useMutation({
    mutationFn: async (input: { file: File; language?: string }) => {
      const form = new FormData();
      form.append("file", input.file);
      if (input.language) form.append("language", input.language);
      return uploadMultipart<QrScan>("/api/v1/scam-check/qr", form);
    },
  });
}

export function useScamPatterns(lang: string) {
  return useQuery({
    queryKey: ["scam-patterns", lang],
    staleTime: 60 * 60_000,
    queryFn: async () => unwrap(await api.GET("/api/v1/scam-patterns", { params: { query: { lang } } })),
  });
}

/* ---------------- Community, threat map, notifications (Э5) ---------------- */

export type Heatmap = Ok<"/api/v1/reports/heatmap", "get">;
export type Trend = Ok<"/api/v1/trends", "get">[number];
export type NotificationPrefs = Ok<"/api/v1/me/notification-preferences", "get">;
export type ModerationItem = Ok<"/api/v1/admin/reports/pending", "get">[number];

export function useHeatmap(days: number) {
  return useQuery({
    queryKey: ["heatmap", days],
    queryFn: async () => unwrap(await api.GET("/api/v1/reports/heatmap", { params: { query: { days } } })),
  });
}

export function useTrends(days: number) {
  return useQuery({
    queryKey: ["trends", days],
    queryFn: async () => unwrap(await api.GET("/api/v1/trends", { params: { query: { days } } })),
  });
}

export function useVoteOnReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { reportId: string; helpful: boolean }) =>
      expectOk(await api.POST("/api/v1/reports/{reportId}/vote", { params: { path: { reportId: v.reportId } }, body: { helpful: v.helpful } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
}

export function useModerationQueue(enabled = true) {
  return useQuery({
    queryKey: ["moderation"],
    enabled,
    retry: false,
    queryFn: async () => unwrap(await api.GET("/api/v1/admin/reports/pending", { params: { query: { take: 50 } } })),
  });
}

export function useModerate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { reportId: string; approve: boolean }) =>
      expectOk(await api.POST("/api/v1/admin/reports/{reportId}/moderate", { params: { path: { reportId: v.reportId } }, body: { approve: v.approve } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["moderation"] }),
  });
}

export function useNotificationPrefs(enabled = true) {
  return useQuery({
    queryKey: ["me", "notifications"],
    enabled,
    retry: false,
    queryFn: async () => unwrap(await api.GET("/api/v1/me/notification-preferences")),
  });
}

export function useSaveNotificationPrefs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { regionCode: string | null; categories: string[]; emailDigest: boolean; pushAlerts: boolean }) =>
      unwrap(await api.PUT("/api/v1/me/notification-preferences", { body })),
    onSuccess: (data) => qc.setQueryData(["me", "notifications"], data),
  });
}

/* ---------------- Profile, family circle, certificates, simulations, quests (Э6) ---------------- */

export type MyProfile = Ok<"/api/v1/me", "get">;
export type FamilyView = Ok<"/api/v1/family", "get">;
type FamilyDtoT = FamilyView;
export type FamilyMemberView = FamilyView["members"][number];
export type Certificate = Ok<"/api/v1/certificates", "get">[number];
export type Simulation = Ok<"/api/v1/simulations", "post">;
export type SimulationFeedback = Ok<"/api/v1/simulations/{simulationId}/respond", "post">;
export type FamilyRole = "Guardian" | "Member" | "Protected";

export function useMyProfile(enabled = true) {
  return useQuery({
    queryKey: ["me", "profile"],
    enabled,
    retry: false,
    queryFn: async () => unwrap(await api.GET("/api/v1/me")),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      displayName: string;
      track: string;
      homeRegionCode: string | null;
      birthYear: number | null;
      birthMonth: number | null;
    }) => unwrap(await api.PUT("/api/v1/me", { body: body as never })),
    onSuccess: (data) => {
      qc.setQueryData(["me", "profile"], data);
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}

export function useMyFamily(enabled = true) {
  return useQuery({
    queryKey: ["family"],
    enabled,
    retry: false,
    queryFn: async () => {
      // An empty 200 means "not in a family yet" — a state, not an error — so read the body as text.
      const res = await api.GET("/api/v1/family", { parseAs: "text" });
      if (!res.response.ok) unwrap(res as never);
      const body = res.data as unknown as string | undefined;
      return body ? (JSON.parse(body) as FamilyDtoT) : null;
    },
  });
}

function useFamilyMutation<TIn, TOut>(fn: (input: TIn) => Promise<TOut>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: ["family"] }) });
}

export function useCreateFamily() {
  return useFamilyMutation(async (name: string) => unwrap(await api.POST("/api/v1/family", { body: { name } })));
}

export function useCreateFamilyInvite() {
  return useMutation({ mutationFn: async () => unwrap(await api.POST("/api/v1/family/invites")) });
}

export function useJoinFamily() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { familyId: string; code: string; role: FamilyRole; shareRiskBandWithGuardians: boolean }) =>
      expectOk(await api.POST("/api/v1/family/join", { body: body as never })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["family"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useRemoveFamilyMember() {
  return useFamilyMutation(async (userId: string) =>
    expectOk(await api.DELETE("/api/v1/family/members/{userId}", { params: { path: { userId } } })),
  );
}

export function useApproveMinor() {
  return useFamilyMutation(async (userId: string) =>
    expectOk(await api.POST("/api/v1/family/minors/{userId}/approve", { params: { path: { userId } } })),
  );
}

export function useFamilySos() {
  return useMutation({ mutationFn: async () => unwrap(await api.POST("/api/v1/family/sos")) });
}

export function useSetSafeWordRotation() {
  return useFamilyMutation(async (days: number) =>
    expectOk(await api.PUT("/api/v1/family/safe-word/rotation", { body: { days } })),
  );
}

export function useMyCertificates(lang: string, enabled = true) {
  return useQuery({
    queryKey: ["certificates", lang],
    enabled,
    queryFn: async () => unwrap(await api.GET("/api/v1/certificates", { params: { query: { lang } } as never })),
  });
}

export function useIssueCertificate(lang: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (courseId: string) =>
      unwrap(
        await api.POST("/api/v1/courses/{courseId}/certificate", {
          params: { path: { courseId }, query: { lang } } as never,
        }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["certificates"] }),
  });
}

export function useVerifyCertificate(serial: string, lang: string) {
  return useQuery({
    queryKey: ["certificate-verify", serial, lang],
    enabled: serial.length > 0,
    queryFn: async () =>
      unwrap(
        await api.GET("/api/v1/certificates/{serial}/verify", { params: { path: { serial }, query: { lang } } as never }),
      ),
  });
}

/** Same-origin URL for the PDF (the httpOnly session cookie authorises the download). */
export function certificatePdfUrl(serial: string, lang: string) {
  return `/backend/api/v1/certificates/${encodeURIComponent(serial)}/pdf?lang=${lang}`;
}

export function useStartSimulation(lang: string) {
  return useMutation({
    mutationFn: async () => unwrap(await api.POST("/api/v1/simulations", { params: { query: { lang } } as never })),
  });
}

export function useRespondToSimulation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { simulationId: string; action: "Reported" | "FellForIt" | "Ignored"; lang: string }) =>
      unwrap(
        await api.POST("/api/v1/simulations/{simulationId}/respond", {
          params: { path: { simulationId: input.simulationId } },
          body: { action: input.action, lang: input.lang } as never,
        }),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quests"] });
      qc.invalidateQueries({ queryKey: ["resilience"] });
    },
  });
}

export function useTodayQuests(enabled = true) {
  return useQuery({
    queryKey: ["quests", "today"],
    enabled,
    queryFn: async () => unwrap(await api.GET("/api/v1/quests/today")),
  });
}

/* ---------------- Partner cabinet (Э7) ---------------- */

export type PartnerAccount = Ok<"/api/v1/partners/me", "get">;
export type PartnerKey = Ok<"/api/v1/partners/me/keys", "get">[number];
export type IssuedKey = Ok<"/api/v1/partners/me/keys", "post">;
export type PartnerUsage = Ok<"/api/v1/partners/me/usage", "get">;
export type WebhookDelivery = Ok<"/api/v1/partners/me/webhook/deliveries", "get">[number];
export type PartnerInvoice = Ok<"/api/v1/partners/me/invoices", "get">[number];
export type PricingPlan = Ok<"/api/v1/pricing", "get">[number];

export function usePartnerAccount(enabled = true) {
  return useQuery({
    queryKey: ["partner", "account"],
    enabled,
    retry: false,
    queryFn: async () => {
      // Empty 200 = no partner account yet.
      const res = await api.GET("/api/v1/partners/me", { parseAs: "text" });
      if (!res.response.ok) unwrap(res as never);
      const body = res.data as unknown as string | undefined;
      return body ? (JSON.parse(body) as PartnerAccount) : null;
    },
  });
}

function usePartnerMutation<TIn, TOut>(fn: (input: TIn) => Promise<TOut>, keys: string[][] = [["partner"]]) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => keys.forEach((k) => qc.invalidateQueries({ queryKey: k })) });
}

export function useCreatePartnerAccount() {
  return usePartnerMutation(async (name: string) => unwrap(await api.POST("/api/v1/partners/me", { body: { name } })));
}

export function useChoosePartnerPlan() {
  return usePartnerMutation(async (planCode: string) => unwrap(await api.PUT("/api/v1/partners/me/plan", { body: { planCode } })));
}

export function usePartnerKeys(enabled = true) {
  return useQuery({
    queryKey: ["partner", "keys"],
    enabled,
    queryFn: async () => unwrap(await api.GET("/api/v1/partners/me/keys")),
  });
}

export function useCreatePartnerKey() {
  return usePartnerMutation(async (body: { live: boolean; label: string | null }) =>
    unwrap(await api.POST("/api/v1/partners/me/keys", { body })),
  );
}

export function useRotatePartnerKey() {
  return usePartnerMutation(async (keyId: string) =>
    unwrap(await api.POST("/api/v1/partners/me/keys/{keyId}/rotate", { params: { path: { keyId } } })),
  );
}

export function useRevokePartnerKey() {
  return usePartnerMutation(async (keyId: string) =>
    expectOk(await api.DELETE("/api/v1/partners/me/keys/{keyId}", { params: { path: { keyId } } })),
  );
}

export function usePartnerUsage(days: number, enabled = true) {
  return useQuery({
    queryKey: ["partner", "usage", days],
    enabled,
    queryFn: async () => unwrap(await api.GET("/api/v1/partners/me/usage", { params: { query: { days } } as never })),
  });
}

export function useConfigureWebhook() {
  return usePartnerMutation(async (body: { url: string; events: string[] }) =>
    unwrap(await api.PUT("/api/v1/partners/me/webhook", { body })),
  );
}

export function useRemoveWebhook() {
  return usePartnerMutation(async () => expectOk(await api.DELETE("/api/v1/partners/me/webhook")));
}

export function useRotateWebhookSecret() {
  return usePartnerMutation(async () => unwrap(await api.POST("/api/v1/partners/me/webhook/rotate-secret")));
}

export function useTestWebhook() {
  return usePartnerMutation(async () => unwrap(await api.POST("/api/v1/partners/me/webhook/test")));
}

export function useWebhookDeliveries(enabled = true) {
  return useQuery({
    queryKey: ["partner", "deliveries"],
    enabled,
    refetchInterval: 30_000,
    queryFn: async () => unwrap(await api.GET("/api/v1/partners/me/webhook/deliveries")),
  });
}

export function usePartnerInvoices(enabled = true) {
  return useQuery({
    queryKey: ["partner", "invoices"],
    enabled,
    queryFn: async () => unwrap(await api.GET("/api/v1/partners/me/invoices")),
  });
}

export function partnerInvoicePdfUrl(period: string, lang: string) {
  return `/backend/api/v1/partners/me/invoices/${encodeURIComponent(period)}/pdf?lang=${lang}`;
}

export function usePricingPlans() {
  return useQuery({
    queryKey: ["pricing"],
    staleTime: 300_000,
    queryFn: async () => unwrap(await api.GET("/api/v1/pricing")),
  });
}
