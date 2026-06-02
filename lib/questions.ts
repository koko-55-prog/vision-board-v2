import { LaneId } from './types'

export interface Question {
  text: string
  suggestedLane: LaneId
}

export const questions: Question[] = [
  // Origin — past & roots
  { text: 'これまでの人生で一番熱中したことは？', suggestedLane: 'origin' },
  { text: '今のあなたを形作っている、大好きなものは何ですか？', suggestedLane: 'origin' },
  { text: '人生で誇りに思う瞬間を挙げるとしたら？', suggestedLane: 'origin' },
  { text: '子どもの頃、何に夢中でしたか？', suggestedLane: 'origin' },
  { text: '「自分らしいな」と感じる瞬間はどんなとき？', suggestedLane: 'origin' },
  { text: 'あなたが大切にしている価値観や信念は？', suggestedLane: 'origin' },
  { text: 'あなたの強みだと思うことは何ですか？', suggestedLane: 'origin' },
  // 1 year
  { text: '1年後に達成したい小さな変化は？', suggestedLane: '1year' },
  { text: '毎日の習慣にしたいことは何ですか？', suggestedLane: '1year' },
  { text: '1年後のあなたは、今と何が違いますか？', suggestedLane: '1year' },
  { text: '今年、絶対にやってみたいことは？', suggestedLane: '1year' },
  { text: '1年後の朝、起きたときどんな気分でいたい？', suggestedLane: '1year' },
  // 3 years
  { text: '3年後に新しく挑戦したいことは？', suggestedLane: '3year' },
  { text: '3年後のあなたはどんな仕事をしていますか？', suggestedLane: '3year' },
  { text: '3年後に身につけていたいスキルや知識は？', suggestedLane: '3year' },
  { text: '3年後、どんな人間関係に囲まれていたい？', suggestedLane: '3year' },
  { text: '3年後に実現していたい環境は？', suggestedLane: '3year' },
  // 5 years
  { text: '5年後、どんな場所に住んでいたい？', suggestedLane: '5year' },
  { text: '5年後の理想の1日を描いてみて', suggestedLane: '5year' },
  { text: '5年後、どんな自分でいたい？', suggestedLane: '5year' },
  { text: '5年後に一緒にいたい人は？', suggestedLane: '5year' },
  // Life
  { text: '人生で絶対にやりたいことは？', suggestedLane: 'life' },
  { text: 'あなたが世界に残したいものは何ですか？', suggestedLane: 'life' },
  { text: '死ぬ前に「やってよかった」と思いたいことは？', suggestedLane: 'life' },
  { text: 'あなたにとっての「最高の人生」とはどんな状態？', suggestedLane: 'life' },
  { text: '100歳のあなたが振り返って微笑む瞬間は？', suggestedLane: 'life' },
]
