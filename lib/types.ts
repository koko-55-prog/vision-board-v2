export type LaneId = 'origin' | '1year' | '3year' | '5year' | 'life'
export type ImageSource = 'pexels' | 'pollinations' | 'huggingface' | 'upload' | 'mock'

export interface VisionCard {
  id: string
  text: string
  imageUrl: string
  laneId: LaneId
  rotation: number
  createdAt: Date
  imageSource: ImageSource
}

export interface Lane {
  id: LaneId
  title: string
  subtitle: string
  color: string
  accentColor: string
  borderColor: string
}

export interface Board {
  id: string
  name: string
  cards: VisionCard[]
  createdAt: string
  updatedAt: string
}
