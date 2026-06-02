'use client'

import { useState } from 'react'
import { Trash2, ArrowRight, Pencil } from 'lucide-react'
import { VisionCard as VisionCardType, Lane, LaneId } from '@/lib/types'

interface VisionCardProps {
  card: VisionCardType
  lanes: Lane[]
  index: number
  onMove: (cardId: string, laneId: LaneId) => void
  onDelete: (cardId: string) => void
  onEdit: (cardId: string) => void
}

export function VisionCard({ card, lanes, index, onMove, onDelete, onEdit }: VisionCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showMoveMenu, setShowMoveMenu] = useState(false)
  const [imgError, setImgError] = useState(false)

  const otherLanes = lanes.filter(l => l.id !== card.laneId)
  const fallbackSrc = `https://picsum.photos/seed/${card.id}/800/600`

  const handleMoveToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMoveMenu(v => !v)
  }

  const handleMove = (e: React.MouseEvent, laneId: LaneId) => {
    e.stopPropagation()
    onMove(card.id, laneId)
    setShowMoveMenu(false)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(card.id)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(card.id)
  }

  return (
    <div
      className="relative animate-card-enter"
      style={{
        marginTop: index === 0 ? '8px' : '-18px',
        zIndex: isHovered ? 100 : index + 1,
      }}
    >
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setShowMoveMenu(false) }}
        className="relative bg-white cursor-pointer select-none"
        style={{
          padding: '8px 8px 38px',
          borderRadius: '1px',
          transform: isHovered
            ? 'rotate(0deg) scale(1.07) translateY(-6px)'
            : `rotate(${card.rotation}deg) scale(1)`,
          boxShadow: isHovered
            ? '0 22px 52px rgba(0,0,0,0.22), 0 8px 18px rgba(0,0,0,0.12)'
            : '0 3px 10px rgba(0,0,0,0.13), 0 1px 3px rgba(0,0,0,0.08)',
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
            style={{ display: 'block' }}
          />
        </div>

        {/* Polaroid caption */}
        <div className="px-0.5 pt-2.5">
          <p className="text-xs leading-relaxed text-stone-600 line-clamp-3">
            {card.text}
          </p>
          <div className="mt-1.5">
            <span className="text-[10px] font-medium" style={{ color: '#c8b9a5' }}>
              {card.imageSource === 'huggingface' ? '🤗 AI生成' : card.imageSource === 'pollinations' ? '✦ AI生成' : '📷'}
            </span>
          </div>
        </div>

        {/* Hover actions */}
        <div
          className="absolute top-2 right-2 flex gap-1.5"
          style={{
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? 'translateY(0)' : 'translateY(-5px)',
            transition: 'opacity 0.18s ease, transform 0.18s ease',
          }}
        >
          {/* Edit */}
          <button
            onClick={handleEdit}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-blue-50"
            style={{
              backgroundColor: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(4px)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.16)',
            }}
          >
            <Pencil size={12} className="text-stone-500" />
          </button>

          {/* Move */}
          <div className="relative">
            <button
              onClick={handleMoveToggle}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-stone-100"
              style={{
                backgroundColor: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(4px)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.16)',
              }}
            >
              <ArrowRight size={13} className="text-stone-600" />
            </button>

            {showMoveMenu && (
              <div
                className="absolute top-9 right-0 rounded-xl overflow-hidden"
                style={{
                  backgroundColor: 'white',
                  boxShadow: '0 8px 28px rgba(0,0,0,0.16)',
                  border: '1px solid #e7e5e4',
                  minWidth: '148px',
                  zIndex: 200,
                }}
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
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: lane.accentColor }}
                    />
                    <span className="text-stone-700">{lane.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Delete */}
          <button
            onClick={handleDelete}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-red-50"
            style={{
              backgroundColor: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(4px)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.16)',
            }}
          >
            <Trash2 size={13} className="text-stone-400" />
          </button>
        </div>
      </div>
    </div>
  )
}
