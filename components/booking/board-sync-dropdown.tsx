"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Upload, RefreshCw } from "lucide-react"
import { CustomerSelectorModal } from "./customer-selector-modal"
import { ProjectSelectorModal } from "./project-selector-modal"

interface BoardSyncDropdownProps {
  booking: any
  customer: any
  room: any
}

export function BoardSyncDropdown({ booking, customer, room }: BoardSyncDropdownProps) {
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)

  const handleNewEstimate = () => {
    setShowCustomerModal(true)
  }

  const handleUpdateEstimate = () => {
    setShowProjectModal(true)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2">
            Boardと同期
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-56">
          <DropdownMenuItem onClick={handleNewEstimate} className="cursor-pointer">
            <Upload className="mr-2 h-4 w-4" />
            新規の見積書を登録
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleUpdateEstimate} className="cursor-pointer">
            <RefreshCw className="mr-2 h-4 w-4" />
            既存の見積書を更新
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 顧客選択モーダル */}
      <CustomerSelectorModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        booking={booking}
        customer={customer}
        room={room}
      />

      {/* 案件選択モーダル */}
      <ProjectSelectorModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        booking={booking}
        customer={customer}
        room={room}
      />
    </>
  )
}