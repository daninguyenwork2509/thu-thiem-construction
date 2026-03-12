"use client"
import { useState } from "react"
import { ChevronDown, ChevronRight, Plus, Edit2, CheckCircle, Clock, AlertTriangle } from "lucide-react"

export interface GanttTask {
  id: number
  name: string
  startDate: string   // YYYY-MM-DD
  endDate: string     // YYYY-MM-DD
  progress: number    // 0–100
  responsible?: string
  status: "not-started" | "in-progress" | "completed" | "delayed"
  parentId?: number
  children?: GanttTask[]
}

interface Props {
  tasks: GanttTask[]
  projectStart: string
  projectEnd: string
  onUpdateProgress?: (id: number, progress: number) => void
}

const STATUS_COLOR: Record<string, string> = {
  "not-started": "bg-gray-300",
  "in-progress": "bg-orange-400",
  "completed": "bg-green-500",
  "delayed": "bg-red-500",
}

const STATUS_LABEL: Record<string, string> = {
  "not-started": "Chưa bắt đầu",
  "in-progress": "Đang thực hiện",
  "completed": "Hoàn thành",
  "delayed": "Chậm tiến độ",
}

function daysBetween(a: string, b: string) {
  return Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
}

export default function GanttChart({ tasks, projectStart, projectEnd, onUpdateProgress }: Props) {
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set())
  const [editId, setEditId] = useState<number | null>(null)
  const [editPct, setEditPct] = useState(0)

  const totalDays = Math.max(1, daysBetween(projectStart, projectEnd))

  // Generate month headers
  const months: { label: string; days: number; startDay: number }[] = []
  let cursor = new Date(projectStart)
  const endDate = new Date(projectEnd)
  while (cursor <= endDate) {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const monthStart = new Date(year, month, 1)
    const monthEnd = new Date(year, month + 1, 0)
    const visibleStart = new Date(Math.max(cursor.getTime(), new Date(projectStart).getTime()))
    const visibleEnd = new Date(Math.min(monthEnd.getTime(), endDate.getTime()))
    const days = Math.round((visibleEnd.getTime() - visibleStart.getTime()) / 86400000) + 1
    const startDay = Math.round((visibleStart.getTime() - new Date(projectStart).getTime()) / 86400000)
    months.push({
      label: `T${month + 1}/${year.toString().slice(2)}`,
      days,
      startDay,
    })
    cursor = new Date(year, month + 1, 1)
    if (months.length > 18) break
  }

  const flatTasks: (GanttTask & { depth: number })[] = []
  function flatten(list: GanttTask[], depth = 0) {
    for (const t of list) {
      flatTasks.push({ ...t, depth })
      if (t.children && !collapsed.has(t.id)) {
        flatten(t.children, depth + 1)
      }
    }
  }
  flatten(tasks)

  const BAR_WIDTH = 900

  const handleProgressSave = (id: number) => {
    onUpdateProgress?.(id, editPct)
    setEditId(null)
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[1100px]">
        {/* Header row */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <div className="w-64 shrink-0 px-3 py-2 text-xs font-semibold text-gray-600 border-r border-gray-200">Công việc</div>
          <div className="w-20 shrink-0 px-2 py-2 text-xs font-semibold text-gray-600 border-r border-gray-200 text-center">Tiến độ</div>
          <div className="w-24 shrink-0 px-2 py-2 text-xs font-semibold text-gray-600 border-r border-gray-200 text-center">Trạng thái</div>
          <div className="flex-1 relative overflow-hidden" style={{ minWidth: `${BAR_WIDTH}px` }}>
            <div className="flex">
              {months.map((m, i) => (
                <div key={i} className="text-xs text-center font-medium text-gray-600 py-2 border-r border-gray-200"
                  style={{ width: `${(m.days / totalDays) * BAR_WIDTH}px` }}>
                  {m.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Task rows */}
        {flatTasks.map(task => {
          const barStart = daysBetween(projectStart, task.startDate)
          const barWidth = Math.max(daysBetween(task.startDate, task.endDate), 1)
          const barLeft = (barStart / totalDays) * BAR_WIDTH
          const barW = (barWidth / totalDays) * BAR_WIDTH
          const isParent = !!task.children?.length
          const hasChildren = !!task.children?.length

          return (
            <div key={task.id} className={`flex border-b border-gray-100 hover:bg-gray-50 transition ${task.depth === 0 ? "bg-orange-50/30" : ""}`}>
              {/* Name */}
              <div className="w-64 shrink-0 px-2 py-2 border-r border-gray-200 flex items-center gap-1 min-w-0"
                style={{ paddingLeft: `${8 + task.depth * 16}px` }}>
                {hasChildren ? (
                  <button onClick={() => setCollapsed(s => { const n = new Set(s); n.has(task.id) ? n.delete(task.id) : n.add(task.id); return n })}
                    className="text-gray-400 hover:text-gray-600 shrink-0">
                    {collapsed.has(task.id) ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                ) : <span className="w-3.5 shrink-0" />}
                <span className={`text-xs truncate ${isParent ? "font-semibold text-gray-800" : "text-gray-700"}`}>{task.name}</span>
              </div>

              {/* Progress */}
              <div className="w-20 shrink-0 border-r border-gray-200 flex items-center justify-center">
                {editId === task.id ? (
                  <div className="flex items-center gap-1">
                    <input type="number" min={0} max={100} value={editPct}
                      onChange={e => setEditPct(Number(e.target.value))}
                      className="w-10 text-xs border border-gray-300 rounded px-1 py-0.5 text-center"
                      onKeyDown={e => e.key === "Enter" && handleProgressSave(task.id)}
                    />
                    <button onClick={() => handleProgressSave(task.id)}
                      className="text-green-600 hover:text-green-800">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => { setEditId(task.id); setEditPct(task.progress) }}
                    className="flex items-center gap-1 group">
                    <span className={`text-xs font-semibold ${task.progress === 100 ? "text-green-600" : task.status === "delayed" ? "text-red-600" : "text-gray-700"}`}>
                      {task.progress}%
                    </span>
                    <Edit2 className="w-2.5 h-2.5 text-gray-300 group-hover:text-orange-500" />
                  </button>
                )}
              </div>

              {/* Status */}
              <div className="w-24 shrink-0 border-r border-gray-200 flex items-center justify-center px-1">
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium text-white ${STATUS_COLOR[task.status]}`}>
                  {task.status === "completed" ? "✓ Xong" :
                   task.status === "in-progress" ? "● Đang làm" :
                   task.status === "delayed" ? "⚠ Chậm" : "○ Chờ"}
                </span>
              </div>

              {/* Gantt bar */}
              <div className="flex-1 relative" style={{ minWidth: `${BAR_WIDTH}px`, height: "36px" }}>
                {/* Grid lines */}
                {months.map((m, i) => (
                  <div key={i} className="absolute top-0 bottom-0 border-r border-gray-100"
                    style={{ left: `${((m.startDay + m.days) / totalDays) * BAR_WIDTH}px` }} />
                ))}

                {/* Bar */}
                <div className="absolute top-1/2 -translate-y-1/2 rounded"
                  style={{
                    left: `${Math.max(0, barLeft)}px`,
                    width: `${Math.min(barW, BAR_WIDTH - barLeft)}px`,
                    height: "18px",
                    backgroundColor: task.depth === 0 ? "#f97316" : "#94a3b8",
                    opacity: 0.85,
                  }}>
                  {/* Progress fill */}
                  <div className="h-full rounded"
                    style={{
                      width: `${task.progress}%`,
                      backgroundColor: task.status === "delayed" ? "#ef4444" : task.status === "completed" ? "#22c55e" : task.depth === 0 ? "#ea580c" : "#64748b",
                    }} />
                  {/* Label on bar */}
                  {barW > 50 && (
                    <div className="absolute inset-0 flex items-center px-1.5">
                      <span className="text-[9px] text-white font-medium truncate">{task.name}</span>
                    </div>
                  )}
                </div>

                {/* Date labels for wide bars */}
                {barW > 70 && (
                  <div className="absolute text-[8px] text-gray-400"
                    style={{ left: `${Math.max(0, barLeft)}px`, top: "2px" }}>
                    {formatDate(task.startDate)}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-3 px-2 flex-wrap">
        {Object.entries(STATUS_LABEL).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className={`w-3 h-3 rounded ${STATUS_COLOR[key]}`} />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Default Gantt data generator from project ─────────────────────────────────

export function generateGanttTasks(projectStart: string, progressPct: number): GanttTask[] {
  const start = (offset: number) => shiftDays(projectStart, offset)

  return [
    {
      id: 1, name: "Phá dỡ & Chuẩn bị mặt bằng",
      startDate: start(0), endDate: start(14),
      progress: 100, status: "completed",
      children: [
        { id: 11, name: "Phá dỡ nội thất cũ", startDate: start(0), endDate: start(5), progress: 100, status: "completed" },
        { id: 12, name: "Dọn dẹp & vệ sinh", startDate: start(5), endDate: start(10), progress: 100, status: "completed" },
        { id: 13, name: "Bảo vệ sàn, cửa", startDate: start(10), endDate: start(14), progress: 100, status: "completed" },
      ]
    },
    {
      id: 2, name: "Xây dựng thô (điện, nước, điều hòa)",
      startDate: start(14), endDate: start(45),
      progress: progressPct > 40 ? 100 : progressPct > 20 ? 70 : 10,
      status: progressPct > 40 ? "completed" : progressPct > 20 ? "in-progress" : "not-started",
      children: [
        { id: 21, name: "Đi dây điện âm tường", startDate: start(14), endDate: start(28), progress: progressPct > 30 ? 100 : 50, status: progressPct > 30 ? "completed" : "in-progress" },
        { id: 22, name: "Cấp thoát nước", startDate: start(18), endDate: start(32), progress: progressPct > 35 ? 100 : 40, status: progressPct > 35 ? "completed" : "in-progress" },
        { id: 23, name: "Hệ thống điều hòa", startDate: start(28), endDate: start(45), progress: progressPct > 40 ? 100 : 20, status: progressPct > 40 ? "completed" : "not-started" },
      ]
    },
    {
      id: 3, name: "Trần & Vách ngăn",
      startDate: start(42), endDate: start(75),
      progress: progressPct > 60 ? 100 : progressPct > 45 ? 60 : 0,
      status: progressPct > 60 ? "completed" : progressPct > 45 ? "in-progress" : "not-started",
      children: [
        { id: 31, name: "Trần thạch cao", startDate: start(42), endDate: start(60), progress: progressPct > 55 ? 100 : progressPct > 45 ? 50 : 0, status: progressPct > 55 ? "completed" : progressPct > 45 ? "in-progress" : "not-started" },
        { id: 32, name: "Vách ngăn & cửa", startDate: start(55), endDate: start(75), progress: progressPct > 65 ? 100 : progressPct > 58 ? 40 : 0, status: progressPct > 65 ? "completed" : progressPct > 58 ? "in-progress" : "not-started" },
      ]
    },
    {
      id: 4, name: "Sàn & Ốp lát",
      startDate: start(70), endDate: start(100),
      progress: progressPct > 80 ? 100 : progressPct > 70 ? 50 : 0,
      status: progressPct > 80 ? "completed" : progressPct > 70 ? "in-progress" : "not-started",
      children: [
        { id: 41, name: "Lát sàn gỗ / gạch", startDate: start(70), endDate: start(88), progress: progressPct > 78 ? 100 : progressPct > 70 ? 45 : 0, status: progressPct > 78 ? "completed" : progressPct > 70 ? "in-progress" : "not-started" },
        { id: 42, name: "Ốp tường toilet", startDate: start(72), endDate: start(85), progress: progressPct > 75 ? 100 : 0, status: progressPct > 75 ? "completed" : "not-started" },
        { id: 43, name: "Ốp tường bếp", startDate: start(80), endDate: start(100), progress: progressPct > 85 ? 80 : 0, status: progressPct > 85 ? "in-progress" : "not-started" },
      ]
    },
    {
      id: 5, name: "Đồ nội thất & Hoàn thiện",
      startDate: start(95), endDate: start(130),
      progress: progressPct > 90 ? 70 : 0,
      status: progressPct > 90 ? "in-progress" : "not-started",
      children: [
        { id: 51, name: "Tủ bếp & tủ âm tường", startDate: start(95), endDate: start(115), progress: progressPct > 92 ? 60 : 0, status: progressPct > 92 ? "in-progress" : "not-started" },
        { id: 52, name: "Nội thất phòng ngủ", startDate: start(105), endDate: start(125), progress: progressPct > 95 ? 30 : 0, status: progressPct > 95 ? "in-progress" : "not-started" },
        { id: 53, name: "Đèn & trang trí", startDate: start(118), endDate: start(130), progress: 0, status: "not-started" },
      ]
    },
    {
      id: 6, name: "Nghiệm thu & Bàn giao",
      startDate: start(128), endDate: start(140),
      progress: 0, status: "not-started",
      children: [
        { id: 61, name: "Nghiệm thu nội bộ", startDate: start(128), endDate: start(133), progress: 0, status: "not-started" },
        { id: 62, name: "Nghiệm thu với khách hàng", startDate: start(133), endDate: start(138), progress: 0, status: "not-started" },
        { id: 63, name: "Bàn giao & thu tiền cuối", startDate: start(138), endDate: start(140), progress: 0, status: "not-started" },
      ]
    },
  ]
}

function shiftDays(d: string, n: number): string {
  const dt = new Date(d)
  dt.setDate(dt.getDate() + n)
  return dt.toISOString().slice(0, 10)
}
