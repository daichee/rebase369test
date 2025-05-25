import { NextResponse } from "next/server"
import { boardApiClient } from "@/lib/board/client"

export async function GET() {
  try {
    const result = await boardApiClient.testConnection()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Board connection test error:", error)
    return NextResponse.json({ success: false, message: "Board API接続テストに失敗しました" }, { status: 500 })
  }
}
