import { NextResponse } from "next/server";

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    occurredAt: string;
    details?: unknown;
  };
}

export function apiError(code: string, message: string, status = 500, details?: unknown) {
  return NextResponse.json<ApiErrorResponse>(
    {
      error: {
        code,
        message,
        occurredAt: new Date().toISOString(),
        details,
      },
    },
    { status },
  );
}
