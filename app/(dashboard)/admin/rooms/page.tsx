import { RoomManagement } from "@/components/admin/room-management"

export default function RoomsAdminPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">部屋管理</h1>
        <p className="text-muted-foreground">部屋の追加、編集、削除を行います</p>
      </div>
      <RoomManagement />
    </div>
  )
}