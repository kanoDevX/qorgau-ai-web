"use client";

import {
  HttpTransportType,
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

const CONFIGURED_API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN ?? "http://localhost:5199";

/**
 * The hub is reached directly (the /backend proxy can't carry WebSockets). When the site is opened by
 * another host than "localhost" — a LAN IP, a phone on the same Wi-Fi — a "localhost" API origin would
 * point at the visitor's own machine, so use the page's host with the API's port instead.
 */
function hubOrigin(): string {
  if (typeof window === "undefined") return CONFIGURED_API_ORIGIN;
  const api = new URL(CONFIGURED_API_ORIGIN);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(api.hostname);
  return local && window.location.hostname !== api.hostname ? `${api.protocol}//${window.location.hostname}:${api.port}` : CONFIGURED_API_ORIGIN;
}

export type ConnState = "connecting" | "connected" | "reconnecting" | "offline";

export interface FraudAlert {
  id: string;
  kind: "regionalSpike" | "highRiskAssessment" | "clusterDetected";
  at: string;
  payload: Record<string, unknown>;
}

/**
 * Live fraud alerts over SignalR. Mirrors the backend's graceful-degradation logic:
 * WebSocket → SSE → long-polling, then a visible "offline" state (no silent failure).
 * Connects anonymously and subscribes to a region group (regionalSpike / clusterDetected).
 */
export function useFraudAlerts(regionCode = "ALA") {
  const [state, setState] = useState<ConnState>("connecting");
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const connRef = useRef<HubConnection | null>(null);

  const push = useCallback((kind: FraudAlert["kind"], payload: Record<string, unknown>) => {
    setAlerts((prev) =>
      [{ id: crypto.randomUUID(), kind, at: new Date().toISOString(), payload }, ...prev].slice(0, 30),
    );
    const region = document.getElementById("live-region");
    if (region) region.textContent = `New fraud alert: ${kind}`;
  }, []);

  useEffect(() => {
    let disposed = false;

    const connection = new HubConnectionBuilder()
      .withUrl(`${hubOrigin()}/hubs/fraud-alerts`, {
        transport:
          HttpTransportType.WebSockets | HttpTransportType.ServerSentEvents | HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 20000])
      // Critical only — we surface connection state through the UI ourselves, and this stops
      // SignalR from console.error-ing the expected "stopped during negotiation" on unmount
      // (React 19 StrictMode double-invokes effects in dev).
      .configureLogging(LogLevel.Critical)
      .build();

    connection.on("regionalSpike", (p) => push("regionalSpike", p));
    connection.on("highRiskAssessment", (p) => push("highRiskAssessment", p));
    connection.on("clusterDetected", (p) => push("clusterDetected", p));

    // withAutomaticReconnect gives up after its last delay, and a failed initial start() is never
    // retried at all — so if the API was down for ~40 s the badge stayed "offline" until a manual
    // page refresh. Keep retrying (capped backoff) and reconnect immediately when the tab regains
    // focus or the device comes back online.
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;

    const start = (): Promise<void> =>
      connection
        .start()
        .then(() => {
          if (disposed) return;
          attempt = 0;
          setState("connected");
          return connection.invoke("SubscribeToRegion", regionCode).catch(() => {});
        })
        .catch(() => {
          if (disposed) return;
          setState("offline");
          scheduleRetry();
        });

    const scheduleRetry = () => {
      clearTimeout(retryTimer);
      const delay = Math.min(30_000, 2_000 * 2 ** attempt++);
      retryTimer = setTimeout(() => {
        if (!disposed && connection.state === HubConnectionState.Disconnected) void start();
      }, delay);
    };

    const retryNow = () => {
      if (disposed || connection.state !== HubConnectionState.Disconnected) return;
      attempt = 0;
      setState("connecting");
      void start();
    };

    connection.onreconnecting(() => !disposed && setState("reconnecting"));
    connection.onreconnected(() => {
      if (disposed) return;
      setState("connected");
      connection.invoke("SubscribeToRegion", regionCode).catch(() => {});
    });
    connection.onclose(() => {
      if (disposed) return;
      setState("offline");
      scheduleRetry();
    });

    const onVisible = () => document.visibilityState === "visible" && retryNow();
    window.addEventListener("online", retryNow);
    document.addEventListener("visibilitychange", onVisible);

    // Keep a handle on the start promise so cleanup can stop() only AFTER negotiation settles.
    const started = start();

    connRef.current = connection;

    return () => {
      disposed = true;
      clearTimeout(retryTimer);
      window.removeEventListener("online", retryNow);
      document.removeEventListener("visibilitychange", onVisible);
      started.finally(() => {
        void connection.stop().catch(() => {});
      });
    };
  }, [regionCode, push]);

  const isLive = connRef.current?.state === HubConnectionState.Connected;
  return { state, alerts, isLive };
}

/* ---------------- One shared connection per app shell ---------------- */

interface FraudAlertsContextValue {
  state: ConnState;
  alerts: FraudAlert[];
  region: string;
  setRegion: (code: string) => void;
}

const FraudAlertsContext = createContext<FraudAlertsContextValue | null>(null);

const REGION_KEY = "qorgau.alertRegion";

/**
 * Owns the single hub connection for the authenticated shell. Previously the shell and every
 * page that showed alerts each opened their own WebSocket (2 connections on /dashboard and
 * /notifications). The chosen region is remembered per device.
 */
export function FraudAlertsProvider({ children }: { children: ReactNode }) {
  const [region, setRegionState] = useState("ALA");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(REGION_KEY);
      if (saved) setRegionState(saved);
    } catch {
      /* storage unavailable (private mode) — keep the default */
    }
  }, []);

  const setRegion = useCallback((code: string) => {
    setRegionState(code);
    try {
      window.localStorage.setItem(REGION_KEY, code);
    } catch {
      /* ignore */
    }
  }, []);

  const { state, alerts } = useFraudAlerts(region);
  const value = useMemo(() => ({ state, alerts, region, setRegion }), [state, alerts, region, setRegion]);
  return createElement(FraudAlertsContext.Provider, { value }, children);
}

export function useSharedFraudAlerts(): FraudAlertsContextValue {
  const ctx = useContext(FraudAlertsContext);
  if (!ctx) throw new Error("useSharedFraudAlerts must be used inside <FraudAlertsProvider>");
  return ctx;
}
