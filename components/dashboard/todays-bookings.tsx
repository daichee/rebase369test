"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useDashboardStats } from "@/lib/hooks/use-dashboard-stats"
import { LogIn, LogOut, Users, Clock } from "lucide-react"

export function TodaysBookings() {
  const { stats, loading } = useDashboardStats()

  if (loading || !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>本日の予約</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getInitials = (name: string) => {
    return name
      .split('')
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  const hasNoBookings = stats.todayCheckIns.length === 0 && stats.todayCheckOuts.length === 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          本日の予約
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasNoBookings ? (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>本日の予約はありません</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* チェックイン */}
            {stats.todayCheckIns.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <LogIn className="h-4 w-4 text-green-600" />
                  <h3 className="font-medium text-sm">チェックイン ({stats.todayCheckIns.length}件)</h3>
                </div>
                <div className="space-y-3">
                  {stats.todayCheckIns.map((booking) => (
                    <div key={booking.id} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-green-500 text-white text-xs">
                          {getInitials(booking.guestName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{booking.guestName}</p>
                          <Badge variant="outline" className="border-green-600 text-green-700">
                            {booking.roomName}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {booking.guestCount}名
                          </span>
                          <span>{formatTime(booking.checkIn)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* チェックアウト */}
            {stats.todayCheckOuts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <LogOut className="h-4 w-4 text-orange-600" />
                  <h3 className="font-medium text-sm">チェックアウト ({stats.todayCheckOuts.length}件)</h3>
                </div>
                <div className="space-y-3">
                  {stats.todayCheckOuts.map((booking) => (
                    <div key={booking.id} className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-orange-500 text-white text-xs">
                          {getInitials(booking.guestName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{booking.guestName}</p>
                          <Badge variant="outline" className="border-orange-600 text-orange-700">
                            {booking.roomName}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {booking.guestCount}名
                          </span>
                          <span>{formatTime(booking.checkOut)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Fix missing import
import { Calendar } from "lucide-react"