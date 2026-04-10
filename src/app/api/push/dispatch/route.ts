import { NextResponse } from "next/server";
import { dispatchPushAlert } from "@/lib/push-sender";
import type { AlertEvent } from "@/types/incident";

function isAlertEvent(value: unknown): value is AlertEvent {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<AlertEvent>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.dedupeKey === "string" &&
    typeof candidate.incidentId === "string" &&
    typeof candidate.incidentTitle === "string" &&
    typeof candidate.incidentSeverity === "string" &&
    typeof candidate.incidentRegion === "string" &&
    typeof candidate.message === "string"
  );
}

export async function POST(request: Request) {
  const payload = (await request.json()) as { alert?: unknown };

  if (!isAlertEvent(payload.alert)) {
    return NextResponse.json(
      { error: "invalid_alert", message: "Missing or invalid alert payload." },
      { status: 400 },
    );
  }

  try {
    const result = await dispatchPushAlert(payload.alert);
    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json(
      {
        error: "push_dispatch_failed",
        message: error instanceof Error ? error.message : "Push dispatch failed.",
      },
      { status: 500 },
    );
  }
}
