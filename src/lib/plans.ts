import type { Plan } from "@/generated/prisma/enums";

export interface PlanLimits {
  label: string;
  priceClp: number | null;
  maxPublishedFunnels: number;
  maxResponsesPerMonth: number;
  canRemoveBranding: boolean;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: {
    label: "Free",
    priceClp: 0,
    maxPublishedFunnels: 1,
    maxResponsesPerMonth: 50,
    canRemoveBranding: false,
  },
  START: {
    label: "Start",
    priceClp: 19990,
    maxPublishedFunnels: 3,
    maxResponsesPerMonth: 500,
    canRemoveBranding: true,
  },
  GROWTH: {
    label: "Growth",
    priceClp: 39990,
    maxPublishedFunnels: Infinity,
    maxResponsesPerMonth: 3000,
    canRemoveBranding: true,
  },
  AGENCY: {
    label: "Agencia",
    priceClp: 79990,
    maxPublishedFunnels: Infinity,
    maxResponsesPerMonth: 10000,
    canRemoveBranding: true,
  },
};

export const PLAN_ORDER: Plan[] = ["FREE", "START", "GROWTH", "AGENCY"];

const clpFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export function formatClp(amount: number): string {
  return clpFormatter.format(amount);
}

export function formatLimit(value: number): string {
  return Number.isFinite(value) ? String(value) : "ilimitados";
}
