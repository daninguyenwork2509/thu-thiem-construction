"use client"
import { useState } from "react"
import { Check, AlertTriangle, X, Plus, ChevronDown, ChevronRight } from "lucide-react"
import { type PipelineItem } from "@/lib/project-data"

// ── Types ──────────────────────────────────────────────────────────────────────
type AcceptStatus = "not_started" | "gs_done" | "pm_done" | "kh_approved" | "has_snag"
type SnagSeverity = "minor" | "medium" | "major"
type SnagStatus   = "open" | "fixing" | "fixed" | "verified"

interface SnagItem {
  id: string; location: string; description: string
  severity: SnagSeverity; assignedTo: string
  status: SnagStatus; deadline: string
}
interface AcceptRound {
  id: string; order: number; name: string
  timing: string; phases: string
  status: AcceptStatus
  checklist: { label: string; done: boolean }[]
  snagItems: SnagItem[]
  paidUnlocksAt?: string  // đợt thanh toán được mở khoá
}

// ── Seed data ─────────────────────────────────────────────────────────────────
const SEED_ROUNDS: AcceptRound[] = [
  {
    id:"nt1", order:1, name:"NT Phá dỡ & Mặt bằng", timing:"Xong phá dỡ",
    phases:"Giai đoạn 1", status:"kh_approved",
    checklist:[
      { label:"Phá dỡ đúng vị trí theo bản vẽ",             done:true },
      { label:"Dọn sạch xà bần toàn bộ",                    done:true },
      { label:"Ảnh Before/After đã upload (3 ảnh)",          done:true },
      { label:"KH xác nhận qua Guest link",                  done:true },
    ],
    snagItems:[],
    paidUnlocksAt:"Đợt 2",
  },
  {
    id:"nt2", order:2, name:"NT Phần thô (tường, chống thấm, sàn)", timing:"Xong giai đoạn 2",
    phases:"Giai đoạn 2", status:"pm_done",
    checklist:[
      { label:"Xây tường đúng vị trí, đúng kích thước",     done:true  },
      { label:"Chống thấm toilet test nước 24h",             done:true  },
      { label:"Điện âm tường thông mạch (test megger)",      done:false },
      { label:"Ống nước test áp lực 30 phút",               done:true  },
      { label:"Ảnh B/A hạng mục xây thô upload",            done:true  },
      { label:"KH xác nhận qua Guest link",                  done:false },
    ],
    snagItems:[
      { id:"sg1", location:"Toilet phòng ngủ 2", description:"Vết nứt nhỏ ở góc tường tiếp giáp sàn", severity:"minor", assignedTo:"Đội Minh Phát", status:"fixing", deadline:"20/03" },
    ],
    paidUnlocksAt:"Đợt 2",
  },
  {
    id:"nt3", order:3, name:"NT Hoàn thiện (gạch, sơn, trần, cửa)", timing:"Xong giai đoạn 3",
    phases:"Giai đoạn 3", status:"not_started",
    checklist:[
      { label:"Lát gạch nền phẳng, đều màu, không rỗng",    done:false },
      { label:"Ốp gạch toilet phẳng, khớp mạch",            done:false },
      { label:"Sơn đều màu, không loang, 3 lớp",            done:false },
      { label:"Trần thạch cao phẳng, không nứt",            done:false },
      { label:"Cửa đóng mở trơn, khóa hoạt động",          done:false },
      { label:"Ảnh B/A đầy đủ từng hạng mục",              done:false },
    ],
    snagItems:[],
    paidUnlocksAt:"Đợt 3",
  },
  {
    id:"nt4", order:4, name:"NT Nội thất + Thiết bị VS", timing:"Xong giai đoạn 4+5",
    phases:"Giai đoạn 4, 5", status:"not_started",
    checklist:[
      { label:"Tủ bếp lắp đúng kích thước, cánh phẳng",   done:false },
      { label:"Tủ quần áo chạy ray trơn, không lắc",       done:false },
      { label:"Thiết bị VS lắp đúng, không rò",            done:false },
      { label:"Test vận hành toàn bộ thiết bị",            done:false },
      { label:"Ảnh B/A nội thất upload",                   done:false },
    ],
    snagItems:[],
    paidUnlocksAt:"Đợt 3",
  },
  {
    id:"nt5", order:5, name:"NT Tổng — Trước bàn giao", timing:"Trước bàn giao",
    phases:"Toàn bộ", status:"not_started",
    checklist:[
      { label:"Snag list = 0 item mở",                     done:false },
      { label:"Dọn dẹp vệ sinh công trường",               done:false },
      { label:"Kiểm tra tổng thể toàn bộ căn",             done:false },
      { label:"GĐ công ty ký biên bản tổng",               done:false },
      { label:"KH ký chấp nhận bàn giao",                  done:false },
    ],
    snagItems:[],
    paidUnlocksAt:"Đợt 4",
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
const ACC_STATUS: Record<AcceptStatus, { label: string; cls: string; icon: string }> = {
  not_started:  { label:"Chưa bắt đầu",       cls:"bg-gray-100 text-gray-500",        icon:"⚪" },
  gs_done:      { label:"GS đã lập BB",        cls:"bg-blue-100 text-blue-700",        icon:"🔵" },
  pm_done:      { label:"PM đã duyệt",         cls:"bg-purple-100 text-purple-700",    icon:"🟣" },
  kh_approved:  { label:"KH đã duyệt ✓",      cls:"bg-green-100 text-green-700",      icon:"✅" },
  has_snag:     { label:"Có snag list",        cls:"bg-yellow-100 text-yellow-700",    icon:"🟡" },
}
const SNAG_SEVERITY: Record<SnagSeverity, string> = {
  minor:"bg-yellow-100 text-yellow-700", medium:"bg-orange-100 text-orange-700", major:"bg-red-100 text-red-700"
}
const SNAG_SEV_LABEL: Record<SnagSeverity, string> = { minor:"Nhẹ", medium:"TB", major:"Nghiêm trọng" }
const SNAG_STATUS: Record<SnagStatus, string> = {
  open:"🔴 Mở", fixing:"🟡 Đang sửa", fixed:"🔵 Đã sửa", verified:"✅ Đã kiểm tra OK"
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProjectAcceptanceStep({
  project, showToast,
}: {
  project: PipelineItem
  showToast: (msg: string, type?: "success" | "error" | "warn") => void
}) {
  const [rounds, setRounds] = useState<AcceptRound[]>(SEED_ROUNDS)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ nt2:true })
  const [newSnagTarget, setNewSnagTarget] = useState<string | null>(null)
  const [newSnag, setNewSnag] = useState({ location:"", description:"", severity:"minor" as SnagSeverity, assignedTo:"", deadline:"" })

  const doneCount = rounds.filter(r => r.status === "kh_approved").length
  const openSnags = rounds.flatMap(r => r.snagItems).filter(s => s.status !== "verified").length

  const updateSnagStatus = (roundId: string, snagId: string, status: SnagStatus) => {
    setRounds(p => p.map(r => r.id === roundId
      ? { ...r, snagItems: r.snagItems.map(s => s.id === snagId ? { ...s, status } : s) }
      : r
    ))
    if (status === "verified") showToast("✓ Snag item đã được kiểm tra OK", "success")
  }

  const addSnag = (roundId: string) => {
    if (!newSnag.description || !newSnag.assignedTo) return
    const id = `sg-${Date.now()}`
    setRounds(p => p.map(r => r.id === roundId
      ? { ...r, snagItems: [...r.snagItems, { ...newSnag, id, status:"open" }] }
      : r
    ))
    setNewSnagTarget(null)
    setNewSnag({ location:"", description:"", severity:"minor", assignedTo:"", deadline:"" })
    showToast("Đã thêm snag item", "warn")
  }

  const advanceStatus = (roundId: string) => {
    setRounds(p => p.map(r => {
      if (r.id !== roundId) return r
      const next: AcceptStatus =
        r.status === "not_started" ? "gs_done"
        : r.status === "gs_done"   ? "pm_done"
        : r.status === "pm_done"   ? "kh_approved"
        : r.status
      const msg = next==="gs_done"?"GS đã lập biên bản nghiệm thu":next==="pm_done"?"PM đã duyệt nghiệm thu":next==="kh_approved"?"KH đã duyệt — mở khóa thanh toán!":""
      if (msg) showToast(msg, next==="kh_approved"?"success":"success")
      return { ...r, status: next }
    }))
  }

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center gap-4 px-4 py-3 bg-purple-50 border border-purple-100 rounded-xl text-xs">
        <div className="text-center">
          <div className="text-lg font-black text-purple-700">{doneCount}/{rounds.length}</div>
          <div className="text-gray-500">Đợt NT xong</div>
        </div>
        <div className="border-l border-purple-200 pl-4 text-center">
          <div className={`text-lg font-black ${openSnags > 0 ? "text-red-600" : "text-green-600"}`}>{openSnags}</div>
          <div className="text-gray-500">Snag mở</div>
        </div>
        <div className="flex-1 pl-4 text-gray-600 text-[11px]">
          {openSnags > 0
            ? <span className="text-red-600 font-semibold">⚠️ Còn {openSnags} snag item chưa xử lý — không thể bàn giao</span>
            : doneCount === rounds.length
              ? <span className="text-green-600 font-semibold">✅ Toàn bộ nghiệm thu đã hoàn tất — sẵn sàng bàn giao</span>
              : <span>Tiếp tục nghiệm thu từng giai đoạn…</span>
          }
        </div>
      </div>

      {/* Acceptance rounds */}
      <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
        {rounds.map(r => {
          const cfg     = ACC_STATUS[r.status]
          const isOpen  = expanded[r.id]
          const doneChk = r.checklist.filter(c => c.done).length
          const openSnag = r.snagItems.filter(s => s.status !== "verified").length
          const nextBtnLabel =
            r.status === "not_started" ? "GS: Lập biên bản"
            : r.status === "gs_done"   ? "PM: Duyệt BB"
            : r.status === "pm_done"   ? "KH: Xác nhận → Mở thanh toán"
            : null

          return (
            <div key={r.id}>
              <button type="button"
                onClick={() => setExpanded(p => ({ ...p, [r.id]: !p[r.id] }))}
                className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                  r.status === "kh_approved" ? "bg-green-50/30" : r.status !== "not_started" ? "bg-purple-50/20" : "hover:bg-gray-50"
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  r.status === "kh_approved" ? "bg-green-100 text-green-700"
                  : r.status !== "not_started" ? "bg-purple-100 text-purple-700"
                  : "bg-gray-100 text-gray-500"
                }`}>{r.order}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-gray-800">{r.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.icon} {cfg.label}</span>
                    {openSnag > 0 && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">{openSnag} snag</span>}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{r.timing} · {r.phases} · Checklist: {doneChk}/{r.checklist.length}</div>
                </div>
                {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-2 space-y-3 border-t border-gray-100 bg-gray-50/20">
                  {/* Checklist */}
                  <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Checklist nghiệm thu</div>
                    <div className="space-y-1">
                      {r.checklist.map((c, ci) => (
                        <div key={ci} className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg ${
                          c.done ? "bg-green-50 text-green-700" : r.status !== "not_started" ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-500"
                        }`}>
                          {c.done
                            ? <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            : <div className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 ${r.status !== "not_started" ? "border-red-300" : "border-gray-300"}`} />}
                          {c.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Snag list */}
                  {(r.snagItems.length > 0 || r.status !== "not_started") && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                          Snag list {r.snagItems.length > 0 && `(${r.snagItems.length})`}
                        </div>
                        {r.status !== "not_started" && r.status !== "kh_approved" && (
                          <button onClick={() => setNewSnagTarget(r.id)}
                            className="flex items-center gap-1 text-[10px] font-bold text-red-600 hover:text-red-700">
                            <Plus className="w-3 h-3" /> Thêm snag
                          </button>
                        )}
                      </div>
                      {r.snagItems.length === 0 ? (
                        <div className="text-[11px] text-gray-400 text-center py-2">Không có snag ✓</div>
                      ) : (
                        <div className="space-y-2">
                          {r.snagItems.map(s => (
                            <div key={s.id} className={`border rounded-lg px-3 py-2 text-xs ${
                              s.status === "verified" ? "bg-green-50 border-green-100" : "bg-white border-gray-200"
                            }`}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${SNAG_SEVERITY[s.severity]}`}>
                                      {SNAG_SEV_LABEL[s.severity]}
                                    </span>
                                    <span className="font-semibold text-gray-700">{s.location}</span>
                                  </div>
                                  <div className="text-gray-600 mt-0.5">{s.description}</div>
                                  <div className="text-gray-400 mt-0.5 text-[10px]">
                                    {s.assignedTo} · Hạn: {s.deadline} · {SNAG_STATUS[s.status]}
                                  </div>
                                </div>
                              </div>
                              {s.status !== "verified" && (
                                <div className="flex gap-1.5 mt-2">
                                  {s.status === "open"   && <button onClick={() => updateSnagStatus(r.id, s.id, "fixing")}   className="text-[10px] font-bold px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200">Bắt đầu sửa</button>}
                                  {s.status === "fixing" && <button onClick={() => updateSnagStatus(r.id, s.id, "fixed")}    className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Đã sửa xong</button>}
                                  {s.status === "fixed"  && <button onClick={() => updateSnagStatus(r.id, s.id, "verified")} className="text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded hover:bg-green-200">GS kiểm tra OK ✓</button>}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add snag form */}
                      {newSnagTarget === r.id && (
                        <div className="mt-2 border border-dashed border-red-200 bg-red-50 rounded-lg p-3 space-y-2">
                          <div className="text-[10px] font-bold text-red-700 uppercase">Thêm snag item</div>
                          <input value={newSnag.location} onChange={e => setNewSnag(p => ({...p,location:e.target.value}))}
                            placeholder="Vị trí (VD: toilet phòng ngủ 2)"
                            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-200" />
                          <input value={newSnag.description} onChange={e => setNewSnag(p => ({...p,description:e.target.value}))}
                            placeholder="Mô tả lỗi"
                            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-200" />
                          <div className="flex gap-2">
                            <select value={newSnag.severity} onChange={e => setNewSnag(p => ({...p,severity:e.target.value as SnagSeverity}))}
                              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none">
                              <option value="minor">Nhẹ</option>
                              <option value="medium">Trung bình</option>
                              <option value="major">Nghiêm trọng</option>
                            </select>
                            <input value={newSnag.assignedTo} onChange={e => setNewSnag(p => ({...p,assignedTo:e.target.value}))}
                              placeholder="Giao cho NTP"
                              className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none" />
                            <input value={newSnag.deadline} onChange={e => setNewSnag(p => ({...p,deadline:e.target.value}))}
                              placeholder="DD/MM" type="text"
                              className="w-16 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none text-center" />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => addSnag(r.id)}
                              className="flex-1 text-xs font-bold bg-red-500 text-white rounded-lg py-1.5 hover:bg-red-600">Thêm</button>
                            <button onClick={() => setNewSnagTarget(null)}
                              className="text-xs text-gray-500 hover:text-gray-700 px-3">Huỷ</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Payment unlock info */}
                  {r.paidUnlocksAt && (
                    <div className="text-[10px] text-gray-500 flex items-center gap-1">
                      🔓 Khi NT này pass → mở khóa thanh toán <span className="font-bold text-orange-600">{r.paidUnlocksAt}</span>
                    </div>
                  )}

                  {/* Advance status button */}
                  {nextBtnLabel && r.snagItems.filter(s => s.status !== "verified").length === 0 && (
                    <button onClick={() => advanceStatus(r.id)}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-purple-500 text-white rounded-lg hover:bg-purple-600 shadow-sm">
                      <Check className="w-3.5 h-3.5" /> {nextBtnLabel}
                    </button>
                  )}
                  {nextBtnLabel && r.snagItems.filter(s => s.status !== "verified").length > 0 && (
                    <div className="text-[11px] text-red-600 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Xử lý hết {r.snagItems.filter(s=>s.status!=="verified").length} snag trước khi tiếp tục
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
