import { SelectorFlow } from '@/components/selector/SelectorFlow'

if (process.env.NODE_ENV === 'production') {
  throw new Error('Dev preview is not available in production')
}

const MOCK_MODULES = [
  {
    type: 'decision' as const,
    id: 'mod-1',
    promptText: 'Wohär wotsch go ässe?',
    allowMultiSelect: false,
    cards: [
      {
        id: 'card-1',
        title: 'Rosaly',
        description: 'Gemütlichs Bistro im Langstrassequartier',
        location: 'Zürich Langstrasse',
        price_range: '$$',
        mood_tags: ['gemütlich', 'romantisch'],
        photo_urls: [],
      },
      {
        id: 'card-2',
        title: 'Clouds',
        description: 'Fine Dining mit Blick übers ganz Züri',
        location: 'Zürich Innenstadt',
        price_range: '$$$',
        mood_tags: ['fancy', 'romantisch'],
        photo_urls: [],
      },
      {
        id: 'card-3',
        title: 'Tibits',
        description: 'Vegetarischs Buffet, entspannt und lecker',
        location: 'Zürich HB',
        price_range: '$',
        mood_tags: ['locker', 'gesund'],
        photo_urls: [],
      },
    ],
  },
  {
    type: 'quiz' as const,
    id: 'mod-2',
    title: 'Wie isch din Mood?',
    questions: [
      {
        id: 'q-1',
        question_text: 'Wie viel Energie hesch hüt?',
        options: ['Mega viel – ich will was erlebe!', 'So mittel', 'Eher chillig bliibe'],
      },
      {
        id: 'q-2',
        question_text: 'Drin oder drauss?',
        options: ['Drin isch mir lieber', 'Drauss wär toll', 'Egal mir'],
      },
    ],
  },
]

export default function DevPreviewPage() {
  return (
    <SelectorFlow
      flowId="dev-preview"
      introMessage={null}
      outroMessage={null}
      modules={MOCK_MODULES}
    />
  )
}
