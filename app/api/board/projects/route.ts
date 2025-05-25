import { type NextRequest, NextResponse } from "next/server"
import { boardApiClient } from "@/lib/board/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const params = {
      client_name: searchParams.get("client_name") || undefined,
      status: searchParams.get("status") || undefined,
      date_from: searchParams.get("date_from") || undefined,
      date_to: searchParams.get("date_to") || undefined,
      limit: Number(searchParams.get("limit")) || 50,
      offset: Number(searchParams.get("offset")) || 0,
    }

    const result = await boardApiClient.getProjects(params)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Board projects API error:", error)
    return NextResponse.json({ error: "Board案件の取得に失敗しました" }, { status: 500 })
  }
}
