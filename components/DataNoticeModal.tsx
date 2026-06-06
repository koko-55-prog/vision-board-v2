'use client'

interface DataNoticeModalProps {
  onClose: () => void
  /** trueのとき「始める」ボタンでカードをリセットする（初回オンボーディング） */
  isOnboarding?: boolean
}

export function DataNoticeModal({ onClose, isOnboarding = false }: DataNoticeModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(15,10,5,0.28)', backdropFilter: 'blur(10px)' }}
      />

      {/* Card */}
      <div
        className="relative w-full max-w-sm rounded-3xl px-8 py-9 flex flex-col gap-5"
        style={{
          backgroundColor: 'rgba(255,255,255,0.97)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.22), 0 8px 24px rgba(0,0,0,0.10)',
          border: '1px solid rgba(255,255,255,0.8)',
          animation: 'fadeInScale 0.25s ease both',
        }}
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #d97706 0%, #be185d 100%)' }}
          >
            ℹ
          </div>
          <h2
            className="text-xl font-bold text-stone-900"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
          >
            データの保存について
          </h2>
          <p className="text-xs text-stone-400 leading-relaxed">
            ビジョンボードのデータはあなたが今見ているこのブラウザにのみ保存されます
          </p>
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden border border-stone-100 text-sm">
          {[
            { ok: true,  text: 'ブラウザを閉じて再度開く',            note: '残る' },
            { ok: true,  text: 'PCの電源を落として再起動',            note: '残る' },
            { ok: false, text: '別のブラウザ・デバイスで開く',        note: '引き継げない' },
            { ok: false, text: 'PC ↔ スマートフォンでの同期',         note: 'できない' },
            { ok: false, text: 'プライベート（シークレット）モード',   note: '引き継げない' },
            { ok: false, text: 'ブラウザのキャッシュを削除',          note: '消える' },
          ].map(({ ok, text, note }) => (
            <div
              key={text}
              className="flex items-center gap-3 px-4 py-2.5 border-b border-stone-50 last:border-0"
              style={{ backgroundColor: ok ? '#f2fbf6' : '#fff3f5' }}
            >
              <span className="text-base flex-shrink-0">{ok ? '✅' : '❌'}</span>
              <span className={ok ? 'text-emerald-800' : 'text-rose-700'}>{text}</span>
              <span className="ml-auto text-xs font-semibold flex-shrink-0 text-right" style={{ color: ok ? '#047857' : '#be123c' }}>
                {note}
              </span>
            </div>
          ))}
        </div>

        {/* Device note */}
        <div className="rounded-2xl px-4 py-3 flex gap-3 items-center text-xs leading-relaxed" style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }}>
          <span className="text-base flex-shrink-0">📱💻</span>
          <p className="text-sky-800">
            PC・スマートフォンどちらでも対応しています。<br />
            やりやすい方のデバイスで始めてください。
          </p>
        </div>

        {/* Tip */}
        <div
          className="rounded-2xl px-4 py-3.5 flex gap-3 items-start text-xs leading-relaxed"
          style={{ backgroundColor: '#fffbf2', border: '1px solid #fde68a' }}
        >
          <span className="text-base flex-shrink-0">💡</span>
          <p className="text-amber-800">
            気に入ったボードや画像ができたら、<br />
            ヘッダーの <strong>「保存」</strong> ボタンでPNGとしてダウンロードしておくと安心です。
            カード上のダウンロードボタンでAI画像だけを保存することもできます。
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-full text-sm font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #d97706 0%, #be185d 100%)',
            boxShadow: '0 4px 16px rgba(217,119,6,0.35)',
          }}
        >
          {isOnboarding ? 'わかりました　→　作成を始める' : 'とじる'}
        </button>
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
