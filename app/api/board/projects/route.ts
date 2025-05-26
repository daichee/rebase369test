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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, projectData } = body

    switch (action) {
      case "sync":
        // Board側からプロジェクト一覧を同期
        const syncedProjects = await boardApiClient.syncProjects()
        return NextResponse.json({ 
          success: true, 
          syncedCount: syncedProjects.length,
          projects: syncedProjects
        })

      case "create":
        // 新しいBoard案件を作成
        const newProject = await boardApiClient.createProject(projectData)
        return NextResponse.json({ 
          success: true, 
          project: newProject
        })

      default:
        return NextResponse.json(
          { success: false, error: "不正なアクション" },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error("Board API POST error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Board API操作に失敗しました",
        details: String(error)
      },
      { status: 500 }
    )
  }
}
