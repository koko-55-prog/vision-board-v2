'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { X, RefreshCw, Search, Loader2, CheckCircle2, Sparkles, Upload } from 'lucide-react'
import { VisionCard, Lane, LaneId, ImageSource } from '@/lib/types'
import { questions } from '@/lib/questions'
import { fetchVisionImageReal, fetchPollinationsImage, uploadImageFile } from '@/lib/imageEngine'

interface AddVisionModalProps {
  lanes: Lane[]
  initialLaneId: LaneId | null
  editingCard?: VisionCard
  onAdd: (card: Omit<VisionCard, 'id' | 'createdAt' | 'rotation'>) => void
  onEdit?: (cardId: string, updates: Omit<VisionCard, 'id' | 'createdAt' | 'rotation'>) => void
  onClose: () => void
}

export function AddVisionModal({ lanes, initialLaneId, editingCard, onAdd, onEdit, onClose }: AddVisionModalProps) {
  const isEditing = !!editingCard
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [qIndex, setQIndex] = useState(() => Math.floor(Math.random() * questions.length))
  const [text, setText] = useState(editingCard?.text ?? '')
  const [selectedLaneId, setSelectedLaneId] = useState<LaneId>(editingCard?.laneId ?? initialLaneId ?? 'origin')
  const [imageUrl, setImageUrl] = useState<string | null>(editingCard?.imageUrl ?? null)
  const [imageSource, setImageSource] = useState<ImageSource>(editingCard?.imageSource ?? 'mock')
  const [isPexelsSearching, setIsPexelsSearching] = useState(false)
  const [isAIGenerating, setIsAIGenerating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isImgLoading, setIsImgLoading] = useState(false)
  const [imgPreviewError, setImgPreviewError] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // AI usage limit (3 total, passphrase to unlock more)
  const AI_LIMIT = 3
  const USAGE_KEY = 'vb:ai-usage-count'
  const [aiUsageCount, setAiUsageCount] = useState(0)
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [passphraseInput, setPassphraseInput] = useState('')
  const [passphraseError, setPassphraseError] = useState(false)
  const [passphraseChecking, setPassphraseChecking] = useState(false)
  const isAILocked = aiUsageCount >= AI_LIMIT

  useEffect(() => {
    const stored = parseInt(localStorage.getItem(USAGE_KEY) ?? '0', 10)
    setAiUsageCount(isNaN(stored) ? 0 : stored)
  }, [])

  const incrementAIUsage = () => {
    const next = aiUsageCount + 1
    setAiUsageCount(next)
    localStorage.setItem(USAGE_KEY, String(next))
  }

  const handlePassphraseSubmit = async () => {
    if (!passphraseInput.trim()) return
    setPassphraseChecking(true)
    setPassphraseError(false)
    try {
      const res = await fetch('/api/verify-passphrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passphrase: passphraseInput.trim() }),
      })
      const { valid } = await res.json()
      if (valid) {
        localStorage.setItem(USAGE_KEY, '0')
        setAiUsageCount(0)
        setShowPassphrase(false)
        setPassphraseInput('')
      } else {
        setPassphraseError(true)
      }
    } finally {
      setPassphraseChecking(false)
    }
  }

  const isAnyLoading = isPexelsSearching || isAIGenerating || isUploading
  const currentQuestion = questions[qIndex]
  const selectedLane = lanes.find(l => l.id === selectedLaneId) || lanes[0]
  const canSubmit = text.trim().length > 0 && imageUrl !== null

  useEffect(() => { if (!isEditing && initialLaneId) setSelectedLaneId(initialLaneId) }, [initialLaneId, isEditing])

  const shuffleQuestion = () => {
    setQIndex(prev => { let n; do { n = Math.floor(Math.random() * questions.length) } while (n === prev); return n })
  }

  const setImage = (url: string, source: ImageSource) => {
    setImageUrl(url)
    setImageSource(source)
    setIsImgLoading(true)
    setImgPreviewError(false)
    setFetchError(null)
  }

  const searchPexels = useCallback(async () => {
    if (!text.trim() || isAnyLoading) return
    setIsPexelsSearching(true)
    setImageUrl(null)
    setFetchError(null)
    try {
      const result = await fetchVisionImageReal(text)
      setImage(result.url, result.source)
    } catch (err) {
      setFetchError('画像の取得に失敗しました。もう一度お試しください。')
    } finally { setIsPexelsSearching(false) }
  }, [text, isAnyLoading])

  const generateAI = useCallback(async () => {
    if (!text.trim() || isAnyLoading || isAILocked) return
    incrementAIUsage()
    setIsAIGenerating(true)
    setImageUrl(null)
    setFetchError(null)
    try {
      const result = await fetchPollinationsImage(text)
      setImage(result.url, result.source)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI生成に失敗しました。'
      setFetchError(msg)
    } finally { setIsAIGenerating(false) }
  }, [text, isAnyLoading, isAILocked, aiUsageCount])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    setImageUrl(null)
    try {
      const result = await uploadImageFile(file)
      setImage(result.url, result.source)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSubmit = () => {
    if (!canSubmit) return
    const data = { text: text.trim(), imageUrl: imageUrl!, laneId: selectedLaneId, imageSource }
    if (isEditing && onEdit) { onEdit(editingCard!.id, data) } else { onAdd(data) }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose} onKeyDown={e => e.key === 'Escape' && onClose()}>
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(15,10,5,0.22)', backdropFilter: 'blur(7px)' }} />

      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{
          maxHeight: '90vh',
          backgroundColor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 36px 90px rgba(0,0,0,0.20), 0 8px 24px rgba(0,0,0,0.10)',
          border: '1px solid rgba(255,255,255,0.72)',
        }}
      >
        <div className="h-1 w-full flex-shrink-0 transition-colors duration-300" style={{ backgroundColor: selectedLane.accentColor }} />

        {/* Header */}
        <div className="px-7 pt-6 pb-5 border-b border-stone-100 flex-shrink-0 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-stone-400">Vision Board</p>
            <h2 className="text-2xl font-bold text-stone-900 mt-0.5" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
              {isEditing ? 'ビジョンを編集' : 'ビジョンを追加'}
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors">
            <X size={14} className="text-stone-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-7 py-6 space-y-5">
          {/* Question */}
          {!isEditing && (
            <div className="rounded-2xl p-4 transition-colors duration-300" style={{ backgroundColor: selectedLane.color }}>
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0 mt-0.5">💭</span>
                <p className="text-sm font-medium text-stone-700 leading-relaxed flex-1">{currentQuestion.text}</p>
                <button onClick={shuffleQuestion} className="w-8 h-8 flex-shrink-0 rounded-full bg-white flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-300 hover:rotate-180">
                  <RefreshCw size={12} className="text-stone-500" />
                </button>
              </div>
            </div>
          )}

          {/* Text */}
          <div>
            <label className="block text-[11px] font-bold tracking-wider uppercase text-stone-400 mb-2">あなたのビジョン</label>
            <textarea
              value={text} onChange={e => setText(e.target.value)}
              placeholder="自由に書いてみてください..." rows={3}
              className="w-full px-4 py-3 rounded-xl border text-sm text-stone-800 placeholder-stone-300 focus:outline-none resize-none transition-all duration-200"
              style={{ borderColor: text ? selectedLane.accentColor + '60' : '#e7e5e4', backgroundColor: 'white', boxShadow: text ? `0 0 0 3px ${selectedLane.accentColor}14` : 'none' }}
            />
          </div>

          {/* Lane */}
          <div>
            <label className="block text-[11px] font-bold tracking-wider uppercase text-stone-400 mb-2">どの時間軸に貼る？</label>
            <div className="flex flex-wrap gap-2">
              {lanes.map(lane => {
                const sel = selectedLaneId === lane.id
                return (
                  <button key={lane.id} onClick={() => setSelectedLaneId(lane.id)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150"
                    style={{ backgroundColor: sel ? lane.accentColor : lane.color, color: sel ? 'white' : lane.accentColor, border: `1.5px solid ${sel ? lane.accentColor : lane.accentColor + '28'}` }}>
                    {lane.title}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Image */}
          <div>
            <label className="block text-[11px] font-bold tracking-wider uppercase text-stone-400 mb-2">イメージ画像</label>

            {/* Pexels + Upload side by side */}
            <div className="flex gap-2">
              <button onClick={searchPexels} disabled={!text.trim() || isAnyLoading}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border-2 border-dashed transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ borderColor: text.trim() ? selectedLane.accentColor + '45' : '#d6d3d1', color: text.trim() ? selectedLane.accentColor : '#a8a29e', backgroundColor: text.trim() ? selectedLane.color : 'transparent' }}>
                {isPexelsSearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                <span>{isPexelsSearching ? '検索中' : 'Pexels'}</span>
              </button>

              <button onClick={() => fileInputRef.current?.click()} disabled={isAnyLoading}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border-2 border-dashed transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ borderColor: '#d6d3d1', color: isUploading ? '#a8a29e' : '#57534e', backgroundColor: 'transparent' }}>
                {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                <span>{isUploading ? 'Loading' : 'アップロード'}</span>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
            <p className="text-[10px] leading-relaxed mt-2" style={{ color: '#b5b0a8' }}>
              ※本アプリはサーバーを持っていません。テキストやアップロードした画像は、あなたがお使いのブラウザ内（localStorage）でのみ処理・保存されます。外部に送信されたり、開発者を含め第三者に見られることはありませんのでご安心ください。
            </p>

            {/* Divider */}
            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-stone-200" />
              <span className="text-xs text-stone-400">または</span>
              <div className="flex-1 h-px bg-stone-200" />
            </div>

            {/* AI generate */}
            {isAILocked ? (
              /* Locked state */
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">🔒</span>
                  <p className="text-sm font-semibold text-amber-800">
                    AI生成の無料枠を使い切りました（{AI_LIMIT}/{AI_LIMIT}回）
                  </p>
                </div>
                {showPassphrase ? (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        type="text"
                        value={passphraseInput}
                        onChange={e => { setPassphraseInput(e.target.value); setPassphraseError(false) }}
                        onKeyDown={e => e.key === 'Enter' && handlePassphraseSubmit()}
                        placeholder="合言葉を入力..."
                        className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none"
                        style={{ borderColor: passphraseError ? '#ef4444' : '#d6d3d1' }}
                      />
                      <button
                        onClick={handlePassphraseSubmit}
                        disabled={passphraseChecking || !passphraseInput.trim()}
                        className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-40 transition-colors"
                      >
                        {passphraseChecking ? <Loader2 size={14} className="animate-spin" /> : '解除'}
                      </button>
                    </div>
                    {passphraseError && (
                      <p className="text-xs text-red-500">合言葉が違います</p>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowPassphrase(true)}
                    className="text-xs text-amber-700 underline hover:text-amber-900"
                  >
                    合言葉を入力してロックを解除する →
                  </button>
                )}
              </div>
            ) : (
              /* Normal button with remaining count */
              <>
                <button onClick={generateAI} disabled={!text.trim() || isAnyLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ borderColor: text.trim() ? '#a855f740' : '#e7e5e4', color: text.trim() ? '#7c3aed' : '#a8a29e', backgroundColor: text.trim() ? '#faf5ff' : 'transparent' }}>
                  {isAIGenerating
                    ? <><Loader2 size={15} className="animate-spin" /> AIが生成中...</>
                    : <><Sparkles size={15} /> AIで生成する
                      {aiUsageCount > 0 && (
                        <span className="ml-1 text-[11px] opacity-60">
                          (残り{AI_LIMIT - aiUsageCount}回)
                        </span>
                      )}
                    </>}
                </button>
                {isAIGenerating && (
                  <p className="text-[11px] text-center text-stone-400 mt-1">
                    高品質AIで生成中です。そのままお待ちください ✨
                  </p>
                )}
              </>
            )}

            {/* Error message */}
            {fetchError && (
              <p className="mt-2 text-xs text-red-500 text-center">{fetchError}</p>
            )}

            {/* Preview */}
            {imageUrl && (
              <div className="mt-3 relative rounded-xl overflow-hidden bg-stone-100" style={{ aspectRatio: '4/3' }}>
                {isImgLoading && !imgPreviewError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-stone-100 z-10">
                    <Loader2 size={22} className="animate-spin text-stone-400" />
                    <span className="text-xs text-stone-400">
                      {imageSource === 'pollinations' ? 'AI画像を読み込み中...' : '読み込み中...'}
                    </span>
                  </div>
                )}
                <img src={imageUrl} alt="preview" className="w-full h-full object-cover"
                  onLoad={() => setIsImgLoading(false)}
                  onError={() => { setImgPreviewError(true); setIsImgLoading(false) }} />
                {!imgPreviewError && !isImgLoading && (
                  <div className="absolute top-2 left-2"><CheckCircle2 size={16} className="text-white drop-shadow" /></div>
                )}
                {!isImgLoading && (
                  <div className="absolute bottom-2 right-2">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'rgba(0,0,0,0.52)', color: 'white' }}>
                      {imageSource === 'huggingface' ? '🤗 HF生成' : imageSource === 'pollinations' ? '✦ AI生成' : imageSource === 'upload' ? '📁 アップロード' : '📷 Pexels'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 py-5 border-t border-stone-100 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors">
            キャンセル
          </button>
          <button onClick={handleSubmit} disabled={!canSubmit}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed hover:opacity-88 active:scale-95"
            style={{ backgroundColor: canSubmit ? selectedLane.accentColor : '#a8a29e' }}>
            {isEditing ? '変更を保存 ✦' : 'ボードに貼る ✦'}
          </button>
        </div>
      </div>
    </div>
  )
}
