'use client'

import { X } from 'lucide-react'

export type Gender = 'male' | 'female' | 'unspecified'

interface OnboardingModalProps {
  onSelect: (gender: Gender) => void
  mode?: 'onboard' | 'settings'
  onClose?: () => void
}

export function OnboardingModal({ onSelect, mode = 'onboard', onClose }: OnboardingModalProps) {
  const isSettings = mode === 'settings'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(15,10,5,0.28)', backdropFilter: 'blur(10px)' }}
        onClick={isSettings ? onClose : undefined}
      />

      {/* Modal card */}
      <div
        className="relative w-full max-w-sm rounded-3xl flex flex-col items-center text-center px-8 py-10"
        style={{
          backgroundColor: 'rgba(255,255,255,0.97)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.22), 0 8px 24px rgba(0,0,0,0.10)',
          border: '1px solid rgba(255,255,255,0.8)',
          animation: 'fadeInScale 0.25s ease both',
        }}
      >
        {/* Close button (settings mode only) */}
        {isSettings && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors"
          >
            <X size={14} className="text-stone-500" />
          </button>
        )}

        {/* Logo mark */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base mb-5 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #1a8fa8 0%, #2d6a4f 100%)', boxShadow: '0 0 18px rgba(77,184,212,0.50)' }}
        >
          ✦
        </div>

        {/* Headline */}
        <h2
          className="text-2xl font-bold text-stone-900 leading-tight mb-6"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          {isSettings ? 'AI生成の設定' : 'ビジョンボードを\n始めましょう'}
        </h2>

        {/* Gender prompt */}
        <p className="text-[13px] font-semibold text-stone-600 mb-3">
          あなたのことを教えてください
        </p>

        {/* Gender buttons */}
        <div className="flex gap-2.5 w-full mb-6">
          {([
            { value: 'male',        label: '男性',    emoji: '👔' },
            { value: 'female',      label: '女性',    emoji: '👗' },
            { value: 'unspecified', label: '指定なし', emoji: '✦' },
          ] as const).map(({ value, label, emoji }) => (
            <button
              key={value}
              onClick={() => onSelect(value)}
              className="flex-1 flex flex-col items-center gap-1.5 py-3.5 rounded-2xl border-2 text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
              style={{ borderColor: '#e7e5e4', color: '#57534e', backgroundColor: 'rgba(245,242,237,0.6)' }}
              onMouseEnter={e => {
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#d97706'
                ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = '#fffbf2'
                ;(e.currentTarget as HTMLButtonElement).style.color = '#92400e'
              }}
              onMouseLeave={e => {
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#e7e5e4'
                ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(245,242,237,0.6)'
                ;(e.currentTarget as HTMLButtonElement).style.color = '#57534e'
              }}
            >
              <span className="text-lg">{emoji}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Note */}
        <p className="text-[10px] text-stone-400 leading-relaxed">
          ※ AI生成画像の雰囲気がより自分らしくなります
        </p>
      </div>

      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
