'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { VisionCard as VisionCardType, Lane, LaneId } from '@/lib/types'
import { VisionCard } from './VisionCard'

interface TimelineLaneProps {
  lane: Lane
  lanes: Lane[]
  cards: VisionCardType[]
  isLast: boolean
  onAddClick: () => void
  onMoveCard: (cardId: string, laneId: LaneId) => void
  onDeleteCard: (cardId: string) => void
  onEditCard: (cardId: string) => void
  onReorderCard: (cardId: string, direction: 'up' | 'down') => void
}

export function TimelineLane({
  lane, lanes, cards, isLast, onAddClick, onMoveCard, onDeleteCard, onEditCard, onReorderCard,
}: TimelineLaneProps) {
  // dragOverCount avoids flickering when dragging over child elements
  const [dragOverCount, setDragOverCount] = useState(0)
  const isDragOver = dragOverCount > 0

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverCount(c => c + 1)
  }

  const handleDragLeave = () => {
    setDragOverCount(c => Math.max(0, c - 1))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverCount(0)
    const cardId = e.dataTransfer.getData('cardId')
    if (cardId) onMoveCard(cardId, lane.id)
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        display: 'flex', flexDirection: 'column', height: '100%', flexShrink: 0,
        width: '320px',
        backgroundColor: isDragOver ? lane.accentColor + '30' : lane.color,
        backdropFilter: 'blur(12px)',
        borderRight: isLast ? 'none' : `1px solid ${lane.borderColor}`,
        outline: isDragOver ? `2px dashed ${lane.accentColor}` : 'none',
        outlineOffset: '-3px',
        transition: 'background-color 0.18s ease, outline 0.15s ease',
      }}
    >
      {/* Cards area — header is sticky inside so it stays visible on mobile scroll */}
      <div
        className="scrollbar-hide"
        data-scroll-area="true"
        style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}
      >
        {/* Sticky lane header */}
        <div
          className="px-5 pt-5 pb-4"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: lane.color,
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${lane.borderColor}`,
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <span
                className="text-[11px] font-bold uppercase"
                style={{ color: lane.accentColor, fontFamily: 'var(--font-cormorant), Georgia, serif', letterSpacing: '0.22em' }}
              >
                {lane.subtitle}
              </span>
              <h2
                className="mt-0.5 leading-snug"
                style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '17px', fontWeight: 600, color: '#1c1410' }}
              >
                {lane.title}
              </h2>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
              {cards.length > 0 && (
                <span
                  className="text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full"
                  style={{ backgroundColor: lane.accentColor + '28', color: lane.accentColor }}
                >
                  {cards.length}
                </span>
              )}
              <button
                onClick={onAddClick}
                className="sheikah-circle-glow w-7 h-7 rounded-full flex items-center justify-center text-white flex-shrink-0"
                style={{ backgroundColor: lane.accentColor }}
              >
                <Plus size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Drop hint */}
        {isDragOver && (
          <div
            className="mx-4 mt-3 rounded-xl flex items-center justify-center py-3"
            style={{ border: `2px dashed ${lane.accentColor}`, color: lane.accentColor }}
          >
            <span className="text-xs font-semibold">ここにドロップ</span>
          </div>
        )}

        {/* Cards */}
        <div style={{ padding: '4px 18px 48px' }}>
          {cards.length === 0 && !isDragOver ? (
            <button
              onClick={onAddClick}
              className="sheikah-glow-hover w-full mt-4 flex flex-col items-center justify-center gap-3 rounded-2xl p-8 border border-dashed transition-all duration-200 group"
              style={{ borderColor: lane.accentColor + '45' }}
            >
              <div
                className="sheikah-circle-glow w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: lane.accentColor + '22' }}
              >
                <Plus size={18} style={{ color: lane.accentColor }} />
              </div>
              <span style={{ color: lane.accentColor + 'bb', fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '13px' }}>ここにビジョンを追加</span>
            </button>
          ) : (
            <div className="relative" style={{ paddingBottom: '24px' }}>
              {cards.map((card, index) => (
                <VisionCard
                  key={card.id}
                  card={card}
                  lanes={lanes}
                  index={index}
                  totalInLane={cards.length}
                  onMove={onMoveCard}
                  onDelete={onDeleteCard}
                  onEdit={onEditCard}
                  onReorder={onReorderCard}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
