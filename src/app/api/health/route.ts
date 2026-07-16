import { NextResponse } from "next/server";
import { getServerEnv } from "@/config/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = getServerEnv();
  return NextResponse.json({
    ok: true,
    mode: env.NEXT_PUBLIC_DATA_MODE,
    checkedAt: new Date().toISOString(),
  });
}
