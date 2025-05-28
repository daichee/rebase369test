import { NextRequest, NextResponse } from "next/server"
import { BoardClient } from "@/lib/board/client"

interface RouteContext {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params
    const projectId = parseInt(id)

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      )
    }

    const boardClient = new BoardClient()

    // Board API から案件詳細を取得
    const projectDetails = await boardClient.getProjectDetails(projectId)

    if (!projectDetails) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      projectDetails,
      fetchedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error("Error fetching Board project details:", error)
    
    if (error instanceof Error) {
      // Board API固有のエラーハンドリング
      if (error.message.includes("unauthorized")) {
        return NextResponse.json(
          { error: "Board API authentication failed" },
          { status: 401 }
        )
      }
      
      if (error.message.includes("not found")) {
        return NextResponse.json(
          { error: "Project not found in Board" },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: `Board API error: ${error.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}