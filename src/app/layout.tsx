import type { Metadata } from "next"
import "./globals.css"
import AppShell from "@/components/AppShell"

export const metadata: Metadata = {
  title: "Thủ Thiêm Construction",
  description: "Hệ thống quản lý dự án xây dựng nội thất",
  icons: { icon: "/logo.svg" },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
