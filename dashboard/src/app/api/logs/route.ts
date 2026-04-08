import { NextRequest, NextResponse } from "next/server";
import { getActivityLogs, clearActivityLogs, logActivity } from "@/lib/activityLogger";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get("limit") || "100");
  const type = searchParams.get("type") || undefined;
  
  const logs = await getActivityLogs(limit, type);
  
  return NextResponse.json({ logs, total: logs.length });
}

export async function DELETE() {
  await clearActivityLogs();
  await logActivity({
    type: "system",
    action: "logs_cleared",
    details: "Activity logs cleared by user",
    status: "success",
  });
  return NextResponse.json({ success: true });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await logActivity(body);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to log activity" }, { status: 500 });
  }
}
