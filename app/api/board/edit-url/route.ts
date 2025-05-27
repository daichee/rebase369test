import { NextRequest, NextResponse } from "next/server"
import { BoardClient } from "@/lib/board/client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, documentType = "estimate" } = body

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      )
    }

    const numericProjectId = parseInt(projectId.toString())
    
    if (isNaN(numericProjectId)) {
      return NextResponse.json(
        { error: "Invalid project ID format" },
        { status: 400 }
      )
    }

    const boardClient = new BoardClient()

    // Board API で案件の存在確認
    const projectExists = await boardClient.checkProjectExists(numericProjectId)
    
    if (!projectExists) {
      return NextResponse.json(
        { error: "Project not found in Board" },
        { status: 404 }
      )
    }

    // 書類編集URLを生成
    const editUrl = boardClient.generateEditUrl(numericProjectId, documentType)

    // アクセストークンが必要な場合の一時トークン生成
    const accessToken = await boardClient.generateAccessToken(numericProjectId)

    return NextResponse.json({
      editUrl,
      accessToken,
      projectId: numericProjectId,
      documentType,
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1時間後
      instructions: {
        usage: "この URL を新しいタブで開いてBoard書類編集画面にアクセスしてください",
        validity: "このリンクは1時間有効です",
        directAccess: "認証済みの場合は直接アクセス可能です"
      }
    })

  } catch (error) {
    console.error("Error generating Board edit URL:", error)
    
    if (error instanceof Error) {
      // Board API固有のエラーハンドリング
      if (error.message.includes("unauthorized")) {
        return NextResponse.json(
          { error: "Board API authentication failed" },
          { status: 401 }
        )
      }
      
      if (error.message.includes("forbidden")) {
        return NextResponse.json(
          { error: "Insufficient permissions for this project" },
          { status: 403 }
        )
      }

      if (error.message.includes("quota")) {
        return NextResponse.json(
          { error: "Board API quota exceeded" },
          { status: 429 }
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