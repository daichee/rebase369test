"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CalendarIcon, Plus, Minus, Users, User, Calendar as CalendarIconLucide } from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { parseLocalDate, formatLocalDate, calculateNights, getTodayDate } from "@/lib/utils/date-utils"
import type { SimpleBookingFormData } from "./SimpleBookingWizard"

interface BasicInfoStepProps {
  formData: SimpleBookingFormData
  onChange: (data: Partial<SimpleBookingFormData>) => void
  availabilityResults?: any[]
  onValidationChange?: (isValid: boolean, errors: Record<string, string>) => void
}

export function BasicInfoStep({ formData, onChange, availabilityResults, onValidationChange }: BasicInfoStepProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(
    formData.dateRange.startDate ? parseLocalDate(formData.dateRange.startDate) : undefined
  )
  const [endDate, setEndDate] = useState<Date | undefined>(
    formData.dateRange.endDate ? parseLocalDate(formData.dateRange.endDate) : undefined
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 代表者情報のバリデーション関数
  const validateRepresentativeInfo = () => {
    const newErrors: Record<string, string> = {}

    // 代表者名のバリデーション
    if (!formData.guestName.trim()) {
      newErrors.guestName = "代表者名は必須項目です"
    } else if (formData.guestName.trim().length < 2) {
      newErrors.guestName = "代表者名は2文字以上で入力してください"
    } else if (formData.guestName.trim().length > 50) {
      newErrors.guestName = "代表者名は50文字以内で入力してください"
    }

    // メールアドレスのバリデーション
    if (!formData.guestEmail.trim()) {
      newErrors.guestEmail = "メールアドレスは必須項目です"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guestEmail)) {
      newErrors.guestEmail = "有効なメールアドレスを入力してください"
    }

    // 電話番号のバリデーション
    if (!formData.guestPhone.trim()) {
      newErrors.guestPhone = "電話番号は必須項目です"
    } else if (!/^[\d\-\(\)\+\s]+$/.test(formData.guestPhone)) {
      newErrors.guestPhone = "有効な電話番号を入力してください"
    }

    // 団体・組織名のバリデーション（任意フィールド）
    if (formData.guestOrg.length > 100) {
      newErrors.guestOrg = "団体・組織名は100文字以内で入力してください"
    }

    // 利用目的のバリデーション（任意フィールド）
    if (formData.purpose.length > 200) {
      newErrors.purpose = "利用目的は200文字以内で入力してください"
    }

    return newErrors
  }

  // 入力値変更時のバリデーション
  const handleInputChange = (field: keyof SimpleBookingFormData, value: string) => {
    onChange({ [field]: value })
    
    // リアルタイムバリデーション - エラーがある場合のみクリア
    if (errors[field]) {
      const updatedErrors = { ...errors }
      delete updatedErrors[field]
      setErrors(updatedErrors)
    }
  }

  // バリデーション状態を親コンポーネントに通知
  useEffect(() => {
    if (onValidationChange) {
      const validationErrors = validateRepresentativeInfo()
      const isValid = Object.keys(validationErrors).length === 0
      onValidationChange(isValid, validationErrors)
    }
  }, [formData.guestName, formData.guestEmail, formData.guestPhone, formData.guestOrg, formData.purpose, onValidationChange])

  const updateDateRange = (start: Date | undefined, end: Date | undefined) => {
    if (start && end) {
      const nights = calculateNights(start, end)
      
      onChange({
        dateRange: {
          startDate: formatLocalDate(start),
          endDate: formatLocalDate(end),
          nights: nights
        }
      })
    }
  }

  const handleStartDateSelect = (date: Date | undefined) => {
    setStartDate(date)
    updateDateRange(date, endDate)
  }

  const handleEndDateSelect = (date: Date | undefined) => {
    setEndDate(date)
    updateDateRange(startDate, date)
  }

  const updateGuestCount = (type: keyof typeof formData.guests, change: number) => {
    const newCount = Math.max(0, formData.guests[type] + change)
    onChange({
      guests: {
        ...formData.guests,
        [type]: newCount
      }
    })
  }

  const guestTypes = [
    { key: "adult" as const, label: "大人", description: "中学生以上" },
    { key: "student" as const, label: "学生", description: "小中高校生" },
    { key: "child" as const, label: "小学生", description: "6-12歳" },
    { key: "infant" as const, label: "幼児", description: "3-5歳" },
    { key: "baby" as const, label: "乳児", description: "0-2歳" },
  ]

  const totalGuests = Object.values(formData.guests).reduce((sum, count) => sum + count, 0)

  return (
    <div className="space-y-8">
      {/* 日程選択 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarIconLucide className="mr-2 h-5 w-5" />
            宿泊期間
          </CardTitle>
          <CardDescription>チェックイン・チェックアウト日を選択してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>チェックイン日</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "yyyy年MM月dd日", { locale: ja }) : "日付を選択"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={handleStartDateSelect}
                    disabled={(date) => date < getTodayDate()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>チェックアウト日</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "yyyy年MM月dd日", { locale: ja }) : "日付を選択"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={handleEndDateSelect}
                    disabled={(date) => date < getTodayDate() || (startDate && date <= startDate)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {formData.dateRange.nights > 0 && (
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="font-semibold text-lg">
                {formData.dateRange.nights}泊 {formData.dateRange.nights + 1}日
              </div>
              <div className="text-sm text-muted-foreground">
                {startDate && endDate && (
                  <>
                    {format(startDate, "MM月dd日", { locale: ja })} ～ {format(endDate, "MM月dd日", { locale: ja })}
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 人数選択 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            宿泊者数
          </CardTitle>
          <CardDescription>年齢区分別に人数を設定してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {guestTypes.map((guestType) => (
            <div key={guestType.key} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="font-medium">{guestType.label}</div>
                <div className="text-sm text-muted-foreground">{guestType.description}</div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateGuestCount(guestType.key, -1)}
                  disabled={formData.guests[guestType.key] === 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-medium">
                  {formData.guests[guestType.key]}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateGuestCount(guestType.key, 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {totalGuests > 0 && (
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="font-semibold text-lg flex items-center justify-center">
                <Users className="mr-2 h-5 w-5" />
                合計 {totalGuests}名
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* 代表者情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            代表者情報
          </CardTitle>
          <CardDescription>予約代表者の連絡先を入力してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guestName">代表者名 *</Label>
              <Input
                id="guestName"
                value={formData.guestName}
                onChange={(e) => handleInputChange("guestName", e.target.value)}
                onBlur={() => {
                  const validationErrors = validateRepresentativeInfo()
                  setErrors(validationErrors)
                }}
                placeholder="山田 太郎"
                className={errors.guestName ? "border-red-500" : ""}
              />
              {errors.guestName && (
                <p className="text-sm text-red-500">{errors.guestName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="guestOrg">団体・組織名</Label>
              <Input
                id="guestOrg"
                value={formData.guestOrg}
                onChange={(e) => handleInputChange("guestOrg", e.target.value)}
                onBlur={() => {
                  const validationErrors = validateRepresentativeInfo()
                  setErrors(validationErrors)
                }}
                placeholder="関西大学"
                className={errors.guestOrg ? "border-red-500" : ""}
              />
              {errors.guestOrg && (
                <p className="text-sm text-red-500">{errors.guestOrg}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guestEmail">メールアドレス *</Label>
              <Input
                id="guestEmail"
                type="email"
                value={formData.guestEmail}
                onChange={(e) => handleInputChange("guestEmail", e.target.value)}
                onBlur={() => {
                  const validationErrors = validateRepresentativeInfo()
                  setErrors(validationErrors)
                }}
                placeholder="example@email.com"
                className={errors.guestEmail ? "border-red-500" : ""}
              />
              {errors.guestEmail && (
                <p className="text-sm text-red-500">{errors.guestEmail}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="guestPhone">電話番号 *</Label>
              <Input
                id="guestPhone"
                type="tel"
                value={formData.guestPhone}
                onChange={(e) => handleInputChange("guestPhone", e.target.value)}
                onBlur={() => {
                  const validationErrors = validateRepresentativeInfo()
                  setErrors(validationErrors)
                }}
                placeholder="090-1234-5678"
                className={errors.guestPhone ? "border-red-500" : ""}
              />
              {errors.guestPhone && (
                <p className="text-sm text-red-500">{errors.guestPhone}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">利用目的</Label>
            <Input
              id="purpose"
              value={formData.purpose}
              onChange={(e) => handleInputChange("purpose", e.target.value)}
              onBlur={() => {
                const validationErrors = validateRepresentativeInfo()
                setErrors(validationErrors)
              }}
              placeholder="研修・合宿・会議など"
              className={errors.purpose ? "border-red-500" : ""}
            />
            {errors.purpose && (
              <p className="text-sm text-red-500">{errors.purpose}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}