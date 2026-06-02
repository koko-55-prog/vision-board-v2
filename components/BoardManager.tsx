'use client'

import { useState } from 'react'
import { X, Plus, Trash2, Check, Pencil } from 'lucide-react'
import { Board } from '@/lib/types'

interface BoardManagerProps {
  boards: Board[]
  activeBoardId: string
  onSwitch: (id: string) => void
  onCreate: (name: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  onClose: () => void
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
}

export function BoardManager({
  boards, activeBoardId, onSwitch, onCreate, onRename, onDelete, onClose,
}: BoardManagerProps) {
  const [newName, setNewName] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const handleCreate = () => {
    const name = newName.trim() || '新しいボード'
    onCreate(name)
    setNewName('')
    setShowInput(false)
  }

  const startRename = (board: Board) => {
    setEditingId(board.id)
    setEditingName(board.name)
  }

  const commitRename = (id: string) => {
    if (editingName.trim()) onRename(id, editingName.trim())
    setEditingId(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(15,10,5,0.22)', backdropFilter: 'blur(7px)' }} />

      <div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{
          maxHeight: '80vh',
          backgroundColor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 36px 90px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10)',
          border: '1px solid rgba(255,255,255,0.72)',
        }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-stone-100 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-stone-400">Boards</p>
            <h2 className="text-xl font-bold text-stone-900" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
              ボードを管理
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors">
            <X size={14} className="text-stone-500" />
          </button>
        </div>

        {/* Board list */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-3 space-y-1.5">
          {boards.map(board => {
            const isActive = board.id === activeBoardId
            const isEditing = editingId === board.id
            return (
              <div
                key={board.id}
                className="group flex items-center gap-3 px-3 py-3 rounded-2xl cursor-pointer transition-all duration-150"
                style={{ backgroundColor: isActive ? '#1c191708' : 'transparent' }}
                onClick={() => !isEditing && onSwitch(board.id)}
              >
                {/* Active indicator */}
                <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                  {isActive && <Check size={14} className="text-stone-700" strokeWidth={2.5} />}
                </div>

                {/* Name / edit input */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <input
                      autoFocus
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onBlur={() => commitRename(board.id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitRename(board.id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      onClick={e => e.stopPropagation()}
                      className="w-full text-sm font-medium text-stone-900 bg-white border border-stone-300 rounded-lg px-2 py-0.5 focus:outline-none"
                    />
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-stone-800 truncate">{board.name}</p>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        {board.cards.length}枚 · {formatDate(board.updatedAt)}更新
                      </p>
                    </>
                  )}
                </div>

                {/* Actions */}
                {!isEditing && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => { e.stopPropagation(); startRename(board) }}
                      className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-stone-100 transition-colors"
                    >
                      <Pencil size={12} className="text-stone-400" />
                    </button>
                    {boards.length > 1 && (
                      <button
                        onClick={e => { e.stopPropagation(); onDelete(board.id) }}
                        className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={12} className="text-stone-400" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Create new board */}
        <div className="px-4 pb-5 pt-2 border-t border-stone-100 flex-shrink-0">
          {showInput ? (
            <div className="flex gap-2">
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowInput(false) }}
                placeholder="ボード名を入力..."
                className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:border-stone-400"
              />
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-700 transition-colors"
              >
                作成
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowInput(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-stone-200 text-sm font-medium text-stone-400 hover:border-stone-300 hover:text-stone-600 transition-all"
            >
              <Plus size={15} />
              新しいボードを作る
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
