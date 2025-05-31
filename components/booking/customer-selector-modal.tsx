"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, User } from "lucide-react"
import { CustomerRegistrationForm } from "./customer-registration-form"
import { SyncConfirmationDialog } from "./sync-confirmation-dialog"

interface CustomerSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  booking: any
  customer: any
  room: any
}

// モック顧客データ（実際にはAPIから取得）
const mockCustomers = [
  {
    id: "cust-001",
    name: "田中太郎",
    company: "田中商事株式会社",
    email: "tanaka@example.com",
    phone: "03-1234-5678",
    address: "東京都渋谷区...",
  },
  {
    id: "cust-002", 
    name: "佐藤花子",
    company: "佐藤工業",
    email: "sato@example.com",
    phone: "03-2345-6789",
    address: "東京都新宿区...",
  },
  {
    id: "cust-003",
    name: "山田次郎",
    company: "",
    email: "yamada@example.com",
    phone: "03-3456-7890",
    address: "東京都港区...",
  },
]

export function CustomerSelectorModal({ 
  isOpen, 
  onClose, 
  booking, 
  customer, 
  room 
}: CustomerSelectorModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [showRegistrationForm, setShowRegistrationForm] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [customers, setCustomers] = useState(mockCustomers)

  // 現在の予約者情報と近い顧客を最初に表示するために検索
  useEffect(() => {
    if (isOpen && customer) {
      setSearchTerm(customer.name || "")
    }
  }, [isOpen, customer])

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCustomerSelect = (selectedCustomer: any) => {
    setSelectedCustomer(selectedCustomer)
  }

  const handleProceedToConfirmation = () => {
    if (selectedCustomer) {
      setShowConfirmation(true)
    }
  }

  const handleNewCustomerRegistration = () => {
    setShowRegistrationForm(true)
  }

  const handleRegistrationComplete = (newCustomer: any) => {
    setSelectedCustomer(newCustomer)
    setShowRegistrationForm(false)
    setShowConfirmation(true)
  }

  const handleConfirmationComplete = () => {
    setShowConfirmation(false)
    onClose()
    // ここで実際にAPIに送信する処理を実装
  }

  if (showRegistrationForm) {
    return (
      <CustomerRegistrationForm
        isOpen={true}
        onClose={() => setShowRegistrationForm(false)}
        onComplete={handleRegistrationComplete}
        initialData={customer}
      />
    )
  }

  if (showConfirmation) {
    return (
      <SyncConfirmationDialog
        isOpen={true}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmationComplete}
        type="new"
        booking={booking}
        customer={customer}
        room={room}
        selectedCustomer={selectedCustomer}
      />
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            顧客選択
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 検索バー */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="顧客名、会社名、メールアドレスで検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={handleNewCustomerRegistration}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              新規顧客登録
            </Button>
          </div>

          {/* 現在の予約者情報 */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">現在の予約者</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">氏名</Label>
                  <p className="font-medium">{customer.name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">メール</Label>
                  <p>{customer.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">電話番号</Label>
                  <p>{customer.phone}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">住所</Label>
                  <p>{customer.address || "未登録"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Board顧客一覧 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Board登録済み顧客から選択 ({filteredCustomers.length}件)
            </Label>
            <div className="grid gap-2 max-h-96 overflow-y-auto">
              {filteredCustomers.map((boardCustomer) => (
                <Card 
                  key={boardCustomer.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedCustomer?.id === boardCustomer.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => handleCustomerSelect(boardCustomer)}
                >
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <Label className="text-xs text-muted-foreground">氏名</Label>
                        <p className="font-medium">{boardCustomer.name}</p>
                        {boardCustomer.company && (
                          <>
                            <Label className="text-xs text-muted-foreground">会社名</Label>
                            <p className="text-xs">{boardCustomer.company}</p>
                          </>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">連絡先</Label>
                        <p className="text-xs">{boardCustomer.email}</p>
                        <p className="text-xs">{boardCustomer.phone}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">住所</Label>
                        <p className="text-xs">{boardCustomer.address}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredCustomers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>該当する顧客が見つかりません</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNewCustomerRegistration}
                    className="mt-2"
                  >
                    新規顧客登録
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button
            onClick={handleProceedToConfirmation}
            disabled={!selectedCustomer}
          >
            選択した顧客で進む
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}