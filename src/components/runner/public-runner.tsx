"use client";

import { useCallback, useRef } from "react";

import {
  FunnelExperience,
  type FunnelExperienceCallbacks,
  type LeadData,
} from "@/components/runner/funnel-experience";
import type { CtaConfig, FunnelSnapshot } from "@/lib/funnel-config";
import type { AnswerValue } from "@/lib/result-engine";

const VISITOR_KEY = "afc_visitor_id";

function getVisitorId(): string {
  try {
    const existing = localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

async function post(path: string, body: unknown): Promise<unknown> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    // El tracking nunca debe romper la experiencia del visitante.
    return null;
  }
}

/**
 * Envoltorio del runner público: conecta FunnelExperience con los endpoints
 * de sesiones, respuestas, leads y eventos. Las llamadas se encadenan sobre
 * la promesa de sesión para tolerar latencia sin bloquear la UI.
 */
export function PublicRunner({ snapshot }: { snapshot: FunnelSnapshot }) {
  const sessionPromise = useRef<Promise<string | null> | null>(null);
  // Cola serial: garantiza que respuestas → complete → lead lleguen en orden
  // al servidor (complete recalcula desde las respuestas persistidas).
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  const withSession = useCallback(
    (fn: (sessionId: string) => Promise<unknown>) => {
      queue.current = queue.current
        .then(() => sessionPromise.current)
        .then((sessionId) => {
          if (sessionId) return fn(sessionId);
        })
        .catch(() => undefined);
    },
    []
  );

  const callbacks: FunnelExperienceCallbacks = {
    onStart: () => {
      const params = new URLSearchParams(window.location.search);
      sessionPromise.current = post("/api/public/sessions", {
        slug: snapshot.slug,
        visitorId: getVisitorId(),
        utmSource: params.get("utm_source"),
        utmMedium: params.get("utm_medium"),
        utmCampaign: params.get("utm_campaign"),
        referrer: document.referrer || null,
      }).then((data) =>
        data && typeof data === "object" && "sessionId" in data
          ? String((data as { sessionId: string }).sessionId)
          : null
      );
    },
    onAnswer: (questionId: string, value: AnswerValue) => {
      withSession((sessionId) =>
        post("/api/public/answers", { sessionId, questionId, value })
      );
    },
    onComplete: () => {
      withSession((sessionId) => post("/api/public/complete", { sessionId }));
    },
    onLead: (lead: LeadData) => {
      withSession((sessionId) =>
        post("/api/public/leads", { sessionId, ...lead })
      );
    },
    onResultView: (profile) => {
      withSession((sessionId) =>
        post("/api/public/track", {
          sessionId,
          type: "RESULT_VIEWED",
          metadata: { profileId: profile?.id ?? null },
        })
      );
    },
    onCtaClick: (cta: CtaConfig) => {
      withSession((sessionId) =>
        post("/api/public/track", {
          sessionId,
          type: "CTA_CLICKED",
          metadata: { ctaType: cta.type },
        })
      );
    },
  };

  return (
    <FunnelExperience
      snapshot={snapshot}
      callbacks={callbacks}
      className="min-h-svh"
    />
  );
}
