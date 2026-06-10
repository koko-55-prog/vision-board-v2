'use client'

import { useState, useRef, useEffect } from 'react'
import { Trash2, ArrowRight, Pencil, Download, ArrowUp, ArrowDown } from 'lucide-react'
import { VisionCard as VisionCardType, Lane, LaneId } from '@/lib/types'

interface VisionCardProps {
  card: VisionCardType
  lanes: Lane[]
  index: number
  totalInLane: number
  onMove: (cardId: string, laneId: LaneId) => void
  onDelete: (cardId: string) => void
  onEdit: (cardId: string) => void
  onReorder: (cardId: string, direction: 'up' | 'down') => void
}

export function VisionCard({ card, lanes, index, totalInLane, onMove, onDelete, onEdit, onReorder }: VisionCardProps) {
  const [isHovered, setIsHovered] = useState(false)  // desktop hover
  const [isActive, setIsActive] = useState(false)    // mobile tap
  const [showMoveMenu, setShowMoveMenu] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [imgError, setImgError] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const showActions = isHovered || isActive
  const otherLanes = lanes.filter(l => l.id !== card.laneId)
  const fallbackSrc = `https://picsum.photos/seed/${card.id}/800/600`

  // Close tap-active state when touching outside
  useEffect(() => {
    if (!isActive) return
    const close = (e: TouchEvent | MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setIsActive(false)
        setShowMoveMenu(false)
      }
    }
    document.addEventListener('touchstart', close)
    document.addEventListener('mousedown', close)
    return () => {
      document.removeEventListener('touchstart', close)
      document.removeEventListener('mousedown', close)
    }
  }, [isActive])

  const handleMoveToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMoveMenu(v => !v)
  }

  const handleMove = (e: React.MouseEvent, laneId: LaneId) => {
    e.stopPropagation()
    onMove(card.id, laneId)
    setShowMoveMenu(false)
    setIsActive(false)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(card.id)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(card.id)
  }

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    const a = document.createElement('a')
    a.href = card.imageUrl
    a.download = `vision-${card.id.slice(-6)}.jpg`
    a.click()
  }

  // Mobile: tap card body to toggle action buttons
  const handleTouchEnd = (e: React.TouchEvent) => {
    // Ignore if touch was on an action button
    if ((e.target as HTMLElement).closest('button')) return
    e.preventDefault()
    setIsActive(v => !v)
    if (isActive) setShowMoveMenu(false)
  }

  // PC drag & drop
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('cardId', card.id)
    e.dataTransfer.effectAllowed = 'move'
    setIsDragging(true)
    // Small delay so the drag ghost captures the card before opacity changes
    setTimeout(() => setIsHovered(false), 0)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  return (
    <div
      ref={cardRef}
      className="relative animate-card-enter"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onTouchEnd={handleTouchEnd}
      style={{
        marginTop: index === 0 ? '8px' : '-18px',
        zIndex: isHovered || isActive ? 100 : index + 1,
        opacity: isDragging ? 0.4 : 1,
        transition: 'opacity 0.15s ease',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setShowMoveMenu(false) }}
        className="relative parchment-card select-none"
        style={{
          padding: '8px 8px 38px',
          borderRadius: '1px',
          transform: (isHovered || isActive)
            ? 'rotate(0deg) scale(1.07) translateY(-6px)'
            : `rotate(${card.rotation}deg) scale(1)`,
          boxShadow: (isHovered || isActive)
            ? '0 22px 52px rgba(0,0,0,0.20), 0 0 30px rgba(77,184,212,0.40), 0 8px 18px rgba(0,0,0,0.10)'
            : '0 4px 12px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.08)',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Photo */}
        <div className="w-full overflow-hidden bg-stone-100" style={{ aspectRatio: '4 / 3' }}>
          <img
            src={imgError ? fallbackSrc : card.imageUrl}
            alt={card.text}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
            style={{ display: 'block', objectPosition: `${card.imagePosition?.x ?? 50}% ${card.imagePosition?.y ?? 50}%` }}
          />
        </div>

        {/* Polaroid caption */}
        <div className="px-0.5 pt-2.5">
          <p className="text-xs leading-relaxed line-clamp-3" style={{ color: '#5a4030', fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '13px' }}>
            {card.text}
          </p>
          <div className="mt-1.5">
            <span className="text-[10px] font-medium" style={{ color: '#a89070' }}>
              {card.imageSource === 'face-ai' ? '✦ 顔写真AI' : card.imageSource === 'pollinations' ? '✦ AI生成' : card.imageSource === 'huggingface' ? '🤗 AI生成' : '📷'}
            </span>
          </div>
        </div>

        {/* Action buttons (hover on PC / tap on mobile) */}
        <div
          className="absolute top-2 right-2 flex gap-1.5"
          style={{
            opacity: showActions ? 1 : 0,
            transform: showActions ? 'translateY(0)' : 'translateY(-5px)',
            transition: 'opacity 0.18s ease, transform 0.18s ease',
            pointerEvents: showActions ? 'auto' : 'none',
          }}
        >
          {/* Reorder ↑↓ */}
          <button
            onClick={e => { e.stopPropagation(); onReorder(card.id, 'up') }}
            disabled={index === 0}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)', boxShadow: '0 1px 4px rgba(0,0,0,0.16)' }}
          >
            <ArrowUp size={12} className="text-stone-500" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onReorder(card.id, 'down') }}
            disabled={index === totalInLane - 1}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)', boxShadow: '0 1px 4px rgba(0,0,0,0.16)' }}
          >
            <ArrowDown size={12} className="text-stone-500" />
          </button>

          {/* Edit */}
          <button
            onClick={handleEdit}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-blue-50"
            style={{ backgroundColor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)', boxShadow: '0 1px 4px rgba(0,0,0,0.16)' }}
          >
            <Pencil size={12} className="text-stone-500" />
          </button>

          {/* Move */}
          <div className="relative">
            <button
              onClick={handleMoveToggle}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-stone-100"
              style={{ backgroundColor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)', boxShadow: '0 1px 4px rgba(0,0,0,0.16)' }}
            >
              <ArrowRight size={13} className="text-stone-600" />
            </button>

            {showMoveMenu && (
              <div
                className="absolute top-9 right-0 rounded-xl overflow-hidden"
                style={{ backgroundColor: 'white', boxShadow: '0 8px 28px rgba(0,0,0,0.16)', border: '1px solid #e7e5e4', minWidth: '148px', zIndex: 200 }}
              >
                <p className="px-3 py-2 text-[10px] font-semibold tracking-wider uppercase text-stone-400 border-b border-stone-100">
                  移動先
                </p>
                {otherLanes.map(lane => (
                  <button
                    key={lane.id}
                    onClick={(e) => handleMove(e, lane.id)}
                    className="w-full px-3 py-2 text-xs text-left flex items-center gap-2.5 hover:bg-stone-50 transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: lane.accentColor }} />
                    <span className="text-stone-700">{lane.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-green-50"
            style={{ backgroundColor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)', boxShadow: '0 1px 4px rgba(0,0,0,0.16)' }}
            title="画像をダウンロード"
          >
            <Download size={12} className="text-stone-500" />
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-red-50"
            style={{ backgroundColor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)', boxShadow: '0 1px 4px rgba(0,0,0,0.16)' }}
          >
            <Trash2 size={13} className="text-stone-400" />
          </button>
        </div>
      </div>
    </div>
  )
}
