import { NextRequest, NextResponse } from "next/server";
import { getNodeMetrics, getCPUHistory, getMemoryHistory } from "@/lib/prometheus";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ instance: string }> }
) {
  try {
    const { instance } = await params;
    const decodedInstance = decodeURIComponent(instance);
    
    const [metrics, cpuHistory, memoryHistory] = await Promise.all([
      getNodeMetrics(decodedInstance),
      getCPUHistory(decodedInstance, 1),
      getMemoryHistory(decodedInstance, 1),
    ]);

    return NextResponse.json({
      metrics,
      cpuHistory,
      memoryHistory,
    });
  } catch (error) {
    console.error("Failed to fetch metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}
