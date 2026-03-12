"use client"
import { useParams } from "next/navigation"
import { useAppStore } from "@/lib/app-store"
import { mockProjects } from "@/lib/mock-data"
import BOQTable from "@/components/BOQTable"
import Link from "next/link"
import { ArrowLeft, FileText, User, Phone } from "lucide-react"

export default function ProjectBOQPage() {
  const { id } = useParams<{ id: string }>()
  const { state } = useAppStore()

  // Search store first (includes newly created projects), then fallback to mock data
  const project =
    state.projects.find(p => p.id === Number(id)) ??
    (mockProjects as { id: number; project_code: string; project_name: string; customer_name: string; customer_phone: string }[])
      .find(p => p.id === Number(id))

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 font-medium mb-2">Không tìm thấy dự án #{id}</p>
        <Link href="/projects" className="text-orange-500 underline text-sm">← Về danh sách dự án</Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Project context bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-800 text-white border-b border-slate-700 shrink-0 flex-wrap">
        <Link href={`/projects/${id}`}
          className="flex items-center gap-1.5 text-slate-300 hover:text-white text-sm transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" /> Dự án
        </Link>
        <span className="text-slate-600">/</span>
        <FileText className="w-4 h-4 text-orange-400 shrink-0" />
        <span className="text-sm font-bold text-orange-300 shrink-0">{project.project_code}</span>
        <span className="text-slate-500">—</span>
        <span className="text-sm font-semibold text-white truncate">{project.project_name}</span>
        <div className="ml-auto flex items-center gap-4 text-xs text-slate-400 shrink-0">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" /> {project.customer_name}
          </span>
          <span className="flex items-center gap-1">
            <Phone className="w-3 h-3" /> {project.customer_phone}
          </span>
        </div>
      </div>

      {/* BOQ Table fills remaining height */}
      <div className="flex-1 overflow-hidden">
        <BOQTable />
      </div>
    </div>
  )
}
