import { NextResponse } from "next/server";
import { authorizePushDispatch } from "@/lib/push-dispatch-auth";
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

// Server-to-server only: callers must send `Authorization: Bearer <PUSH_DISPATCH_SECRET>`.
// Browsers must not call this route.
export async function POST(request: Request) {
  const auth = authorizePushDispatch(request.headers.get("authorization"));
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error, message: auth.message },
      { status: auth.status },
    );
  }

  let payload: { alert?: unknown };
  try {
    payload = (await request.json()) as { alert?: unknown };
  } catch {
    payload = {};
  }

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
