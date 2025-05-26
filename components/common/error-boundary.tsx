"use client"

import { Component, ErrorInfo, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                <AlertTriangle className="h-12 w-12 text-red-500" />
              </div>
              <CardTitle>エラーが発生しました</CardTitle>
              <CardDescription>
                申し訳ございませんが、予期しないエラーが発生しました。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="bg-gray-100 p-3 rounded text-sm font-mono text-gray-700">
                  {this.state.error.message}
                </div>
              )}
              <Button
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                再試行
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                ページを再読み込み
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}