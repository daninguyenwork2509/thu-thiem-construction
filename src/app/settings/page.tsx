"use client"
import Link from "next/link"
import { Users, Database, Building2, Ruler, Tag, Package, BookOpen, Shield, ChevronRight } from "lucide-react"
import { useAuth } from "@/lib/auth-store"

const SETTING_GROUPS = [
  {
    title: "Quản lý hệ thống",
    items: [
      { href: "/settings/users", icon: Users, label: "Người dùng & Phân quyền", desc: "Quản lý tài khoản, vai trò, và quyền truy cập", color: "bg-blue-50 text-blue-600", adminOnly: true },
      { href: "/settings/profile", icon: Shield, label: "Hồ sơ cá nhân", desc: "Cập nhật thông tin cá nhân và đổi mật khẩu", color: "bg-purple-50 text-purple-600" },
    ]
  },
  {
    title: "Danh mục dữ liệu",
    items: [
      { href: "/settings/master-data/categories", icon: Tag, label: "Danh mục công trình", desc: "Loại dự án, hạng mục, công tác", color: "bg-orange-50 text-orange-600" },
      { href: "/settings/master-data/uom", icon: Ruler, label: "Đơn vị tính (UOM)", desc: "m², m³, bộ, cái, kg...", color: "bg-green-50 text-green-600" },
      { href: "/settings/master-data/materials", icon: Package, label: "Vật tư & Thiết bị", desc: "Danh mục vật tư, nhà cung cấp, giá nhập", color: "bg-teal-50 text-teal-600" },
      { href: "/settings/master-data/price-library", icon: BookOpen, label: "Thư viện đơn giá", desc: "Đơn giá tham chiếu theo hạng mục / vùng miền", color: "bg-indigo-50 text-indigo-600" },
      { href: "/settings/master-data/contractors", icon: Building2, label: "Nhà thầu phụ", desc: "Danh sách & thông tin nhà thầu đã hợp tác", color: "bg-red-50 text-red-600" },
      { href: "/settings/master-data", icon: Database, label: "Tất cả danh mục", desc: "Xem toàn bộ dữ liệu master", color: "bg-gray-100 text-gray-600" },
    ]
  },
]

export default function SettingsPage() {
  const { state } = useAuth()
  const user = state.user

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cài đặt</h1>
        <p className="text-gray-500 mt-1 text-sm">Quản lý hệ thống, người dùng, và danh mục dữ liệu</p>
      </div>

      <div className="space-y-6">
        {SETTING_GROUPS.map(group => (
          <div key={group.title}>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{group.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {group.items
                .filter(item => !item.adminOnly || user?.role === "admin")
                .map(item => (
                <Link key={item.href} href={item.href}
                  className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-sm transition group">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm">{item.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* System info */}
      <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Thông tin hệ thống</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Phiên bản", value: "v1.0.0-beta" },
            { label: "Môi trường", value: "Demo" },
            { label: "Người dùng", value: user?.fullName ?? "—" },
            { label: "Vai trò", value: user?.roleLabel ?? "—" },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-xs text-gray-400">{label}</div>
              <div className="text-sm font-medium text-gray-700 mt-0.5">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
