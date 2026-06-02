'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { VisionCard, Lane, LaneId, Board } from '@/lib/types'
import { TimelineLane } from './TimelineLane'
import { AddVisionModal } from './AddVisionModal'
import { BoardManager } from './BoardManager'
import { Header } from './Header'
import * as storage from '@/lib/storage'

export const LANES: Lane[] = [
  { id: 'origin', title: 'これまでの私', subtitle: 'Origin', color: '#fffbf2', accentColor: '#b45309', borderColor: '#fde68a' },
  { id: '1year',  title: '1年後までに',  subtitle: '1 Year',  color: '#f2fbf6', accentColor: '#047857', borderColor: '#a7f3d0' },
  { id: '3year',  title: '3年後までに',  subtitle: '3 Years', color: '#eff6ff', accentColor: '#1d4ed8', borderColor: '#bfdbfe' },
  { id: '5year',  title: '5年後までに',  subtitle: '5 Years', color: '#f7f4ff', accentColor: '#6d28d9', borderColor: '#ddd6fe' },
  { id: 'life',   title: '生きている間に', subtitle: 'Life',  color: '#fff3f5', accentColor: '#be123c', borderColor: '#fecdd3' },
]

const ROTATIONS = [-3, -2, -1, 1, 2, 3]
const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

const INITIAL_CARDS: VisionCard[] = [
  { id: 'sample-1', text: '子どもの頃、図書館で本を読みふけった夏の記憶', imageUrl: 'https://picsum.photos/seed/library42/800/600', laneId: 'origin', rotation: -2, createdAt: new Date(), imageSource: 'mock' },
  { id: 'sample-2', text: '毎朝コーヒーを飲みながら、静かに日記を書く習慣', imageUrl: 'https://picsum.photos/seed/morningcoffee/800/600', laneId: '1year', rotation: 2, createdAt: new Date(), imageSource: 'mock' },
  { id: 'sample-3', text: '海の見えるテラスで、好きな仕事をする', imageUrl: 'https://picsum.photos/seed/oceanterrace/800/600', laneId: '5year', rotation: -1, createdAt: new Date(), imageSource: 'mock' },
]

export function VisionBoard() {
  const [cards, setCards] = useState<VisionCard[]>(INITIAL_CARDS)
  const [boards, setBoards] = useState<Board[]>([])
  const [activeBoardId, setActiveBoardId] = useState<string>('')
  const [boardName, setBoardName] = useState('マイビジョンボード')
  const [isLoaded, setIsLoaded] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [initialLane, setInitialLane] = useState<LaneId | null>(null)
  const [editingCard, setEditingCard] = useState<VisionCard | null>(null)
  const [showBoardManager, setShowBoardManager] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout>>()

  // ── Load from localStorage on mount ──────────────────────────────────────
  useEffect(() => {
    const storedBoards = storage.loadBoards()
    const activeId = storage.loadActiveBoardId()
    if (storedBoards.length > 0) {
      const active = storedBoards.find(b => b.id === activeId) ?? storedBoards[0]
      setBoards(storedBoards)
      setActiveBoardId(active.id)
      setBoardName(active.name)
      setCards(active.cards)
    } else {
      const id = genId()
      const defaultBoard: Board = { id, name: 'マイビジョンボード', cards: INITIAL_CARDS, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      setBoards([defaultBoard])
      setActiveBoardId(id)
      storage.saveBoards([defaultBoard])
      storage.saveActiveBoardId(id)
    }
    setIsLoaded(true)
  }, [])

  // ── Auto-save ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded || !activeBoardId) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      setBoards(prev => {
        const next = prev.map(b => b.id === activeBoardId ? { ...b, cards, name: boardName, updatedAt: new Date().toISOString() } : b)
        storage.saveBoards(next)
        return next
      })
    }, 800)
    return () => clearTimeout(saveTimer.current)
  }, [cards, boardName, activeBoardId, isLoaded])

  // ── Card operations ───────────────────────────────────────────────────────
  const addCard = useCallback((data: Omit<VisionCard, 'id' | 'createdAt' | 'rotation'>) => {
    setCards(prev => [...prev, { ...data, id: `card-${genId()}`, rotation: ROTATIONS[Math.floor(Math.random() * ROTATIONS.length)], createdAt: new Date() }])
  }, [])

  const editCard = useCallback((cardId: string, updates: Omit<VisionCard, 'id' | 'createdAt' | 'rotation'>) => {
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, ...updates } : c))
  }, [])

  const moveCard = useCallback((cardId: string, laneId: LaneId) => {
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, laneId } : c))
  }, [])

  const deleteCard = useCallback((cardId: string) => {
    setCards(prev => prev.filter(c => c.id !== cardId))
  }, [])

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const openModal = useCallback((laneId?: LaneId) => {
    setEditingCard(null); setInitialLane(laneId || null); setIsModalOpen(true)
  }, [])

  const openEditModal = useCallback((cardId: string) => {
    const card = cards.find(c => c.id === cardId)
    if (!card) return
    setEditingCard(card); setInitialLane(null); setIsModalOpen(true)
  }, [cards])

  const closeModal = useCallback(() => {
    setIsModalOpen(false); setEditingCard(null); setInitialLane(null)
  }, [])

  // ── Board operations ──────────────────────────────────────────────────────
  const switchBoard = useCallback((id: string) => {
    const board = boards.find(b => b.id === id)
    if (!board) return
    setActiveBoardId(id); setBoardName(board.name); setCards(board.cards)
    storage.saveActiveBoardId(id); setShowBoardManager(false)
  }, [boards])

  const createBoard = useCallback((name: string) => {
    const id = genId()
    const newBoard: Board = { id, name, cards: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    setBoards(prev => { const next = [...prev, newBoard]; storage.saveBoards(next); return next })
    setActiveBoardId(id); setBoardName(name); setCards([])
    storage.saveActiveBoardId(id); setShowBoardManager(false)
  }, [])

  const renameBoard = useCallback((id: string, name: string) => {
    setBoards(prev => { const next = prev.map(b => b.id === id ? { ...b, name } : b); storage.saveBoards(next); return next })
    if (id === activeBoardId) setBoardName(name)
  }, [activeBoardId])

  const deleteBoard = useCallback((id: string) => {
    setBoards(prev => {
      const next = prev.filter(b => b.id !== id)
      storage.saveBoards(next)
      if (id === activeBoardId && next.length > 0) {
        const nb = next[0]
        setActiveBoardId(nb.id); setBoardName(nb.name); setCards(nb.cards)
        storage.saveActiveBoardId(nb.id)
      }
      return next
    })
  }, [activeBoardId])

  // ── Download ──────────────────────────────────────────────────────────────
  const handleDownload = useCallback(async () => {
    setIsDownloading(true)
    try {
      const { default: html2canvas } = await import('html2canvas')
      const source = document.getElementById('board-lanes-inner')
      if (!source) return

      // Clone the board and mount off-screen so overflow doesn't clip anything
      const clone = source.cloneNode(true) as HTMLElement
      clone.style.height = 'auto'
      clone.style.alignItems = 'flex-start'

      // Each lane: auto height
      Array.from(clone.children).forEach(child => {
        (child as HTMLElement).style.height = 'auto'
      })

      // Each card area: remove scroll restrictions so all cards show
      clone.querySelectorAll<HTMLElement>('[data-scroll-area]').forEach(el => {
        el.style.overflowY = 'visible'
        el.style.maxHeight = 'none'
        el.style.flex = 'none'
        el.style.height = 'auto'
      })

      // Mount off-screen
      const wrapper = document.createElement('div')
      wrapper.style.cssText = 'position:fixed;top:-99999px;left:0;background:#f5f2ed;z-index:-1;'
      wrapper.appendChild(clone)
      document.body.appendChild(wrapper)

      // Wait for layout + images
      await new Promise(r => setTimeout(r, 150))

      const canvas = await html2canvas(clone, {
        backgroundColor: '#f5f2ed',
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
      })

      document.body.removeChild(wrapper)

      const link = document.createElement('a')
      link.download = `${boardName || 'vision-board'}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Download failed:', err)
    } finally {
      setIsDownloading(false)
    }
  }, [boardName])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', backgroundColor: '#f5f2ed', overflow: 'hidden' }}>
      <Header
        boardName={boardName}
        onAddClick={() => openModal()}
        onBoardManagerClick={() => setShowBoardManager(true)}
        onDownload={handleDownload}
        isDownloading={isDownloading}
      />

      <main style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <div className="lanes-scroll" style={{ height: '100%', overflowX: 'auto', overflowY: 'hidden' }}>
          <div id="board-lanes-inner" style={{ display: 'flex', height: '100%' }}>
            {LANES.map((lane, index) => (
              <TimelineLane
                key={lane.id} lane={lane} lanes={LANES}
                cards={cards.filter(c => c.laneId === lane.id)}
                isFirst={index === 0} isLast={index === LANES.length - 1}
                onAddClick={() => openModal(lane.id)}
                onMoveCard={moveCard} onDeleteCard={deleteCard} onEditCard={openEditModal}
              />
            ))}
          </div>
        </div>
      </main>

      {isModalOpen && (
        <AddVisionModal
          lanes={LANES} initialLaneId={initialLane}
          editingCard={editingCard || undefined}
          onAdd={addCard} onEdit={editCard} onClose={closeModal}
        />
      )}

      {showBoardManager && (
        <BoardManager
          boards={boards} activeBoardId={activeBoardId}
          onSwitch={switchBoard} onCreate={createBoard}
          onRename={renameBoard} onDelete={deleteBoard}
          onClose={() => setShowBoardManager(false)}
        />
      )}
    </div>
  )
}
