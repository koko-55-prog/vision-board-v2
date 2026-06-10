'use client'

import { Plus, Download, ChevronDown, Loader2, Undo2, Redo2, UserCircle2, ExternalLink } from 'lucide-react'

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
  onRedo: () => void
  canRedo: boolean
  redoCount: number
  onGenderSettings: () => void
  currentGender: string | null
  onDataInfo: () => void
}

export function Header({ boardName, onAddClick, onBoardManagerClick, onDownload, isDownloading, onUndo, canUndo, undoCount, onRedo, canRedo, redoCount, onGenderSettings, currentGender, onDataInfo }: HeaderProps) {
  return (
    <header
      className="flex-shrink-0 flex flex-col border-b"
      style={{
        position: 'sticky',
        top: 0,
        backgroundColor: 'rgba(190, 235, 245, 0.82)',
        backdropFilter: 'blur(22px)',
        borderBottomColor: 'rgba(77, 184, 212, 0.30)',
        zIndex: 30,
      }}
    >
      {/* Row 1: logo + actions (always visible, compact on mobile) */}
      <div className="flex items-center justify-between px-4 sm:px-6 h-14 gap-2">

        {/* Left: logo + brand + board name (desktop only) */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #1a8fa8 0%, #2d6a4f 100%)', boxShadow: '0 0 12px rgba(77,184,212,0.50)' }}
          >
            ✦
          </div>
          {/* Brand text — desktop only */}
          <div className="hidden sm:flex flex-col flex-shrink-0" style={{ gap: '2px' }}>
            <p
              className="leading-none tracking-[0.14em] text-stone-900 font-bold"
              style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '18px' }}
            >
              VISION BOARD
            </p>
            <p
              className="leading-none tracking-wide"
              style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '10px', color: '#78716c', fontStyle: 'italic' }}
            >
              あなたの時間軸に、夢を貼ろう
              <a href="https://note.com/koko_eigo_/" target="_blank" rel="noopener noreferrer" style={{ marginLeft: '5px', fontStyle: 'normal', color: '#1a8fa8', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>· by KOKO<ExternalLink size={7} strokeWidth={2.5} /></a>
            </p>
          </div>
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
            className="sheikah-glow-hover flex items-center px-2.5 py-2 rounded-xl border border-white/40 text-teal-800 transition-all"
            title="データの保存について"
          >
            <span className="text-sm font-bold leading-none">ℹ</span>
          </button>

          {/* AI gender settings */}
          <button
            onClick={onGenderSettings}
            className="sheikah-glow-hover flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl border border-white/40 text-sm font-medium text-teal-900 transition-all"
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
            className="sheikah-glow-hover relative flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl border border-white/40 text-sm font-medium text-teal-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="元に戻す (⌘Z)"
          >
            <Undo2 size={14} />
            <span className="hidden sm:inline">元に戻す</span>
            {canUndo && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a8fa8, #2d6a4f)' }}>
                {undoCount > 9 ? '9+' : undoCount}
              </span>
            )}
          </button>

          {/* Redo */}
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="sheikah-glow-hover relative flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl border border-white/40 text-sm font-medium text-teal-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="一つ進む (⌘⇧Z)"
          >
            <Redo2 size={14} />
            <span className="hidden sm:inline">一つ進む</span>
            {canRedo && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a8fa8, #2d6a4f)' }}>
                {redoCount > 9 ? '9+' : redoCount}
              </span>
            )}
          </button>

          {/* Download */}
          <button
            onClick={onDownload}
            disabled={isDownloading}
            className="sheikah-glow-hover flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl border border-white/40 text-sm font-medium text-teal-900 disabled:opacity-50 transition-all"
            title="画像として保存"
          >
            {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            <span className="hidden sm:inline">保存</span>
          </button>

          {/* Add vision */}
          <button
            onClick={onAddClick}
            className="sheikah-btn flex items-center gap-1 sm:gap-1.5 text-sm font-medium text-white rounded-full active:scale-95"
            style={{ padding: '8px 12px' }}
          >
            <Plus size={15} strokeWidth={2.5} />
            <span className="hidden sm:inline">ビジョンを追加</span>
          </button>
        </div>
      </div>

      {/* Row 2: mobile only — brand name + board name + tagline */}
      <div className="sm:hidden flex flex-col px-4 pb-2" style={{ gap: '2px' }}>
        <div className="flex items-center gap-2">
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
        <p
          className="leading-none tracking-wide"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '10px', color: '#78716c', fontStyle: 'italic' }}
        >
          あなたの時間軸に、夢を貼ろう
          <a href="https://note.com/koko_eigo_/" target="_blank" rel="noopener noreferrer" style={{ marginLeft: '5px', fontStyle: 'normal', color: '#1a8fa8', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>· by KOKO<ExternalLink size={7} strokeWidth={2.5} /></a>
        </p>
      </div>
    </header>
  )
}
