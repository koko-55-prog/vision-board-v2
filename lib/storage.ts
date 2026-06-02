import { Board, VisionCard } from './types'

const BOARDS_KEY = 'vb:boards'
const ACTIVE_KEY = 'vb:active'

function reviveCard(raw: Record<string, unknown>): VisionCard {
  return { ...raw, createdAt: new Date(raw.createdAt as string) } as VisionCard
}

function reviveBoard(raw: Record<string, unknown>): Board {
  return {
    ...raw,
    cards: ((raw.cards ?? []) as Record<string, unknown>[]).map(reviveCard),
  } as Board
}

export function loadBoards(): Board[] {
  try {
    const raw = localStorage.getItem(BOARDS_KEY)
    if (!raw) return []
    return (JSON.parse(raw) as Record<string, unknown>[]).map(reviveBoard)
  } catch {
    return []
  }
}

export function saveBoards(boards: Board[]): void {
  try {
    const serialized = boards.map(b => ({
      ...b,
      cards: b.cards.map(c => ({
        ...c,
        createdAt: c.createdAt instanceof Date
          ? c.createdAt.toISOString()
          : c.createdAt,
      })),
    }))
    localStorage.setItem(BOARDS_KEY, JSON.stringify(serialized))
  } catch (e) {
    console.warn('localStorage full or unavailable:', e)
  }
}

export function loadActiveBoardId(): string | null {
  return localStorage.getItem(ACTIVE_KEY)
}

export function saveActiveBoardId(id: string): void {
  localStorage.setItem(ACTIVE_KEY, id)
}
