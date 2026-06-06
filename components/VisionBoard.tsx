'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { VisionCard, Lane, LaneId, Board } from '@/lib/types'
import { TimelineLane } from './TimelineLane'
import { AddVisionModal } from './AddVisionModal'
import { BoardManager } from './BoardManager'
import { Header } from './Header'
import { OnboardingModal, type Gender } from './OnboardingModal'
import { DataNoticeModal } from './DataNoticeModal'
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
  { id: 'v-koremade-1', text: '【サンプル】お気に入りのカフェで、淹れたてのカフェラテとスコーンを前に、スマホを眺めてリラックス', imageUrl: '/default-imgs/v-koremade-1.jpg', laneId: 'origin', rotation: -2, createdAt: new Date(), imageSource: 'pexels' },
  { id: 'v-koremade-2', text: '【サンプル】お気に入りのウェアを着て、自宅のヨガマットの上で、気持ちよくストレッチ', imageUrl: '/default-imgs/v-koremade-2.jpg', laneId: 'origin', rotation: 2, createdAt: new Date(), imageSource: 'pexels' },
  { id: 'v-1year-1', text: '【サンプル】旅行で訪れた海外の海が見えるオープンカフェのテラス席で、英語の勉強をしながら、お気に入りのコーヒーを楽しんでいる。周りには現地の外国人が歩いている。', imageUrl: '/default-imgs/v-1year-1.jpg', laneId: '1year', rotation: 1, createdAt: new Date(), imageSource: 'pexels' },
  { id: 'v-1year-2', text: '【サンプル】筋トレを始めて、一歩進んだワークアウト開始。三日坊主にならずに続いている！', imageUrl: '/default-imgs/v-1year-2.jpg', laneId: '1year', rotation: -1, createdAt: new Date(), imageSource: 'pexels' },
  { id: 'v-5year-1', text: '【サンプル】オーストラリアのカフェのテラス席で、現地の友人3人と笑顔で爆笑しながら、クロワッサンとカフェラテを楽しんでいる！', imageUrl: '/default-imgs/v-5year-1.jpg', laneId: '5year', rotation: 3, createdAt: new Date(), imageSource: 'pexels' },
  { id: 'v-5year-2', text: '【サンプル】海外のジムにお邪魔してワークアウト、現地のトレーナーや仲間とハイタッチしている！', imageUrl: '/default-imgs/v-5year-2.jpg', laneId: '5year', rotation: -3, createdAt: new Date(), imageSource: 'pexels' },
]

const INITIAL_IDS = new Set(INITIAL_CARDS.map(c => c.id))
const isSampleOnly = (cards: VisionCard[]) =>
  cards.length > 0 && cards.every(c => INITIAL_IDS.has(c.id))

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

  // ── Onboarding & Gender settings ─────────────────────────────────────────
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showGenderSettings, setShowGenderSettings] = useState(false)
  const [showDataNotice, setShowDataNotice] = useState(false)
  const [showDataNoticeInfo, setShowDataNoticeInfo] = useState(false)
  const [currentGender, setCurrentGender] = useState<string | null>(null)

  useEffect(() => {
    setCurrentGender(localStorage.getItem('vb:gender'))
  }, [])

  // Show the start banner when: loaded + sample cards only + not yet onboarded
  const showSampleBanner = isLoaded && !currentGender && isSampleOnly(cards)

  const handleOnboardingSelect = (gender: Gender) => {
    localStorage.setItem('vb:gender', gender)
    setCurrentGender(gender)
    setShowOnboarding(false)
    setShowDataNotice(true)   // 性別選択後にデータ通知を表示
  }

  const handleDataNoticeClose = () => {
    setCards([])              // ここでサンプルをリセット
    setShowDataNotice(false)
  }

  const handleGenderChange = (gender: Gender) => {
    localStorage.setItem('vb:gender', gender)
    setCurrentGender(gender)
    setShowGenderSettings(false)
  }
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

  // ── Undo history ──────────────────────────────────────────────────────────
  const cardsRef = useRef<VisionCard[]>(cards)
  useEffect(() => { cardsRef.current = cards }, [cards])

  const undoStackRef = useRef<VisionCard[][]>([])
  const [undoCount, setUndoCount] = useState(0)

  const pushUndo = useCallback(() => {
    undoStackRef.current = [...undoStackRef.current.slice(-29), [...cardsRef.current]]
    setUndoCount(undoStackRef.current.length)
  }, [])

  const undo = useCallback(() => {
    if (undoStackRef.current.length === 0) return
    const previous = undoStackRef.current.pop()!
    setUndoCount(undoStackRef.current.length)
    setCards(previous)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo])

  // ── Card operations ───────────────────────────────────────────────────────
  const addCard = useCallback((data: Omit<VisionCard, 'id' | 'createdAt' | 'rotation'>) => {
    pushUndo()
    setCards(prev => [...prev, { ...data, id: `card-${genId()}`, rotation: ROTATIONS[Math.floor(Math.random() * ROTATIONS.length)], createdAt: new Date() }])
  }, [pushUndo])

  const editCard = useCallback((cardId: string, updates: Omit<VisionCard, 'id' | 'createdAt' | 'rotation'>) => {
    pushUndo()
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, ...updates } : c))
  }, [pushUndo])

  const moveCard = useCallback((cardId: string, laneId: LaneId) => {
    pushUndo()
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, laneId } : c))
  }, [pushUndo])

  const deleteCard = useCallback((cardId: string) => {
    pushUndo()
    setCards(prev => prev.filter(c => c.id !== cardId))
  }, [pushUndo])

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
        onUndo={undo}
        canUndo={undoCount > 0}
        undoCount={undoCount}
        onGenderSettings={() => setShowGenderSettings(true)}
        currentGender={currentGender}
        onDataInfo={() => setShowDataNoticeInfo(true)}
      />

      <main style={{ flex: 1, overflow: 'hidden', minHeight: 0, position: 'relative' }}>
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

        {/* Centered floating CTA — shows when sample board is displayed */}
        {showSampleBanner && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ zIndex: 20 }}
          >
            <div
              className="pointer-events-auto flex flex-col items-center gap-4 px-8 py-7 rounded-3xl mx-4"
              style={{
                backgroundColor: 'rgba(255,255,255,0.94)',
                backdropFilter: 'blur(18px)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.20), 0 6px 20px rgba(0,0,0,0.10)',
                border: '1px solid rgba(255,255,255,0.85)',
                maxWidth: '420px',
                width: '100%',
              }}
            >
              {/* Logo */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #d97706 0%, #be185d 100%)' }}
              >
                ✦
              </div>

              {/* Text */}
              <div className="text-center">
                <p className="text-[11px] font-bold tracking-widest uppercase text-stone-400 mb-1">Sample Board</p>
                <p className="text-base font-semibold text-stone-700 leading-snug">
                  あなただけのビジョンボードを
                  <br />作りましょう
                </p>
              </div>

              {/* CTA button */}
              <button
                onClick={() => setShowOnboarding(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-95 w-full justify-center"
                style={{
                  background: 'linear-gradient(135deg, #d97706 0%, #be185d 100%)',
                  boxShadow: '0 4px 18px rgba(217,119,6,0.40)',
                }}
              >
                サンプルをリセットして作成を始める
                <span className="text-base">→</span>
              </button>

              <p className="text-[10px] text-stone-400">
                タップするとサンプルが消えて、空のボードになります
              </p>
            </div>
          </div>
        )}
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

      {showOnboarding && (
        <OnboardingModal onSelect={handleOnboardingSelect} mode="onboard" />
      )}

      {showDataNotice && (
        <DataNoticeModal onClose={handleDataNoticeClose} isOnboarding />
      )}

      {showDataNoticeInfo && (
        <DataNoticeModal onClose={() => setShowDataNoticeInfo(false)} />
      )}

      {showGenderSettings && (
        <OnboardingModal
          onSelect={handleGenderChange}
          mode="settings"
          onClose={() => setShowGenderSettings(false)}
        />
      )}
    </div>
  )
}
