'use client'

import { Plus } from 'lucide-react'
import { VisionCard as VisionCardType, Lane, LaneId } from '@/lib/types'
import { VisionCard } from './VisionCard'

interface TimelineLaneProps {
  lane: Lane
  lanes: Lane[]
  cards: VisionCardType[]
  isFirst: boolean
  isLast: boolean
  onAddClick: () => void
  onMoveCard: (cardId: string, laneId: LaneId) => void
  onDeleteCard: (cardId: string) => void
  onEditCard: (cardId: string) => void
}

export function TimelineLane({
  lane, lanes, cards, isFirst, isLast, onAddClick, onMoveCard, onDeleteCard, onEditCard,
}: TimelineLaneProps) {
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', height: '100%', flexShrink: 0,
        width: '320px',
        backgroundColor: lane.color,
        borderRight: isLast ? 'none' : `1px solid ${lane.borderColor}`,
      }}
    >
      {/* Lane header */}
      <div
        className="px-5 pt-5 pb-4 flex-shrink-0"
        style={{ borderBottom: `1px solid ${lane.borderColor}` }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <span
              className="text-[11px] font-bold tracking-[0.2em] uppercase"
              style={{ color: lane.accentColor }}
            >
              {lane.subtitle}
            </span>
            <h2 className="text-[15px] font-bold text-stone-800 mt-0.5 leading-snug">
              {lane.title}
            </h2>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
            {cards.length > 0 && (
              <span
                className="text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full"
                style={{
                  backgroundColor: lane.accentColor + '1a',
                  color: lane.accentColor,
                }}
              >
                {cards.length}
              </span>
            )}
            <button
              onClick={onAddClick}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white flex-shrink-0 transition-all duration-200 hover:scale-110 active:scale-95"
              style={{ backgroundColor: lane.accentColor }}
            >
              <Plus size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Cards area */}
      <div
        className="scrollbar-hide"
        data-scroll-area="true"
        style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '4px 18px 48px' }}
      >
        {cards.length === 0 ? (
          <button
            onClick={onAddClick}
            className="w-full mt-4 flex flex-col items-center justify-center gap-3 rounded-2xl p-8 border-2 border-dashed transition-all duration-200 group hover:opacity-75"
            style={{ borderColor: lane.accentColor + '30' }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ backgroundColor: lane.accentColor + '12' }}
            >
              <Plus size={18} style={{ color: lane.accentColor }} />
            </div>
            <span className="text-xs text-stone-400">ここにビジョンを追加</span>
          </button>
        ) : (
          <div className="relative" style={{ paddingBottom: '24px' }}>
            {cards.map((card, index) => (
              <VisionCard
                key={card.id}
                card={card}
                lanes={lanes}
                index={index}
                onMove={onMoveCard}
                onDelete={onDeleteCard}
                onEdit={onEditCard}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
