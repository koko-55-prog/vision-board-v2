'use client'

import { Plus, Download, ChevronDown, Loader2 } from 'lucide-react'

interface HeaderProps {
  boardName: string
  onAddClick: () => void
  onBoardManagerClick: () => void
  onDownload: () => void
  isDownloading: boolean
}

export function Header({ boardName, onAddClick, onBoardManagerClick, onDownload, isDownloading }: HeaderProps) {
  return (
    <header
      className="flex-shrink-0 flex items-center justify-between px-6 border-b gap-3"
      style={{
        height: '64px',
        backgroundColor: 'rgba(245, 242, 237, 0.88)',
        backdropFilter: 'blur(14px)',
        borderBottomColor: 'rgba(0,0,0,0.08)',
        position: 'relative',
        zIndex: 30,
      }}
    >
      {/* Left: logo + board name */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #d97706 0%, #be185d 100%)' }}
        >
          ✦
        </div>
        <div className="hidden sm:block flex-shrink-0">
          <p
            className="leading-none tracking-[0.14em] text-stone-900 font-bold"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '18px' }}
          >
            VISION BOARD
          </p>
        </div>

        {/* Board name selector */}
        <button
          onClick={onBoardManagerClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-stone-100 transition-colors min-w-0 max-w-[180px]"
        >
          <span className="text-sm font-semibold text-stone-700 truncate">{boardName}</span>
          <ChevronDown size={13} className="text-stone-400 flex-shrink-0" />
        </button>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Download */}
        <button
          onClick={onDownload}
          disabled={isDownloading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 text-sm font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-50 transition-all"
          title="画像として保存"
        >
          {isDownloading
            ? <Loader2 size={14} className="animate-spin" />
            : <Download size={14} />}
          <span className="hidden sm:inline">保存</span>
        </button>

        {/* Add vision */}
        <button
          onClick={onAddClick}
          className="flex items-center gap-1.5 text-sm font-medium text-white rounded-full transition-all duration-200 hover:opacity-90 active:scale-95"
          style={{ backgroundColor: '#1c1917', padding: '8px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>ビジョンを追加</span>
        </button>
      </div>
    </header>
  )
}
