'use client'

import { Plus, Download, ChevronDown, Loader2, Undo2, UserCircle2 } from 'lucide-react'

const GENDER_LABEL: Record<string, string> = { male: '男性', female: '女性', unspecified: '指定なし' }

interface HeaderProps {
  boardName: string
  onAddClick: () => void
  onBoardManagerClick: () => void
  onDownload: () => void
  isDownloading: boolean
  onUndo: () => void
  canUndo: boolean
  undoCount: number
  onGenderSettings: () => void
  currentGender: string | null
  onDataInfo: () => void
}

export function Header({ boardName, onAddClick, onBoardManagerClick, onDownload, isDownloading, onUndo, canUndo, undoCount, onGenderSettings, currentGender, onDataInfo }: HeaderProps) {
  return (
    <header
      className="flex-shrink-0 flex flex-col border-b"
      style={{
        position: 'sticky',
        top: 0,
        backgroundColor: 'rgba(245, 242, 237, 0.95)',
        backdropFilter: 'blur(14px)',
        borderBottomColor: 'rgba(0,0,0,0.08)',
        zIndex: 30,
      }}
    >
      {/* Row 1: logo + actions (always visible, compact on mobile) */}
      <div className="flex items-center justify-between px-4 sm:px-6 h-14 gap-2">

        {/* Left: logo + brand + board name (desktop only) */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #d97706 0%, #be185d 100%)' }}
          >
            ✦
          </div>
          {/* Brand text — desktop only */}
          <p
            className="hidden sm:block leading-none tracking-[0.14em] text-stone-900 font-bold flex-shrink-0"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '18px' }}
          >
            VISION BOARD
          </p>
          {/* Board name — desktop only */}
          <button
            onClick={onBoardManagerClick}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-stone-100 transition-colors min-w-0 max-w-[180px]"
          >
            <span className="text-sm font-semibold text-stone-700 truncate">{boardName}</span>
            <ChevronDown size={13} className="text-stone-400 flex-shrink-0" />
          </button>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Data info */}
          <button
            onClick={onDataInfo}
            className="flex items-center px-2.5 py-2 rounded-xl border border-stone-200 text-stone-400 hover:bg-stone-50 hover:text-stone-600 transition-all"
            title="データの保存について"
          >
            <span className="text-sm font-bold leading-none">ℹ</span>
          </button>

          {/* AI gender settings */}
          <button
            onClick={onGenderSettings}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl border border-stone-200 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-all"
            title="AI生成の性別設定を変更"
          >
            <UserCircle2 size={14} />
            <span className="hidden sm:inline text-xs">
              {currentGender ? (GENDER_LABEL[currentGender] ?? 'AI設定') : 'AI設定'}
            </span>
          </button>

          {/* Undo */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl border border-stone-200 text-sm font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="元に戻す (⌘Z)"
          >
            <Undo2 size={14} />
            <span className="hidden sm:inline">元に戻す</span>
            {canUndo && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-stone-700 text-white text-[9px] font-bold flex items-center justify-center">
                {undoCount > 9 ? '9+' : undoCount}
              </span>
            )}
          </button>

          {/* Download */}
          <button
            onClick={onDownload}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl border border-stone-200 text-sm font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-50 transition-all"
            title="画像として保存"
          >
            {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            <span className="hidden sm:inline">保存</span>
          </button>

          {/* Add vision */}
          <button
            onClick={onAddClick}
            className="flex items-center gap-1 sm:gap-1.5 text-sm font-medium text-white rounded-full transition-all duration-200 hover:opacity-90 active:scale-95"
            style={{ backgroundColor: '#1c1917', padding: '8px 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}
          >
            <Plus size={15} strokeWidth={2.5} />
            <span className="hidden sm:inline">ビジョンを追加</span>
          </button>
        </div>
      </div>

      {/* Row 2: mobile only — brand name + board name */}
      <div className="sm:hidden flex items-center gap-2 px-4 pb-2">
        <p
          className="leading-none tracking-[0.12em] text-stone-800 font-bold flex-shrink-0 text-[15px]"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          VISION BOARD
        </p>
        <button
          onClick={onBoardManagerClick}
          className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-stone-100 transition-colors min-w-0"
        >
          <span className="text-sm font-semibold text-stone-600 truncate">{boardName}</span>
          <ChevronDown size={12} className="text-stone-400 flex-shrink-0" />
        </button>
      </div>
    </header>
  )
}
