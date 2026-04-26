import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QuizStep } from '@/components/selector/QuizStep'

const QUESTIONS = [
  { id: 'q1', question_text: 'Mood?', options: ['Cozy', 'Adventurous', 'Romantic'] },
  { id: 'q2', question_text: 'Time?', options: ['Afternoon', 'Evening', 'Night'] },
]

describe('QuizStep', () => {
  it('renders the title and all questions', () => {
    render(<QuizStep title="Your Preferences" questions={QUESTIONS} onAnswer={vi.fn()} />)
    expect(screen.getByText('Your Preferences')).toBeInTheDocument()
    expect(screen.getByText('Mood?')).toBeInTheDocument()
    expect(screen.getByText('Time?')).toBeInTheDocument()
  })

  it('renders all options for each question', () => {
    render(<QuizStep title="Prefs" questions={QUESTIONS} onAnswer={vi.fn()} />)
    expect(screen.getByText('Cozy')).toBeInTheDocument()
    expect(screen.getByText('Adventurous')).toBeInTheDocument()
    expect(screen.getByText('Night')).toBeInTheDocument()
  })

  it('calls onAnswer with encoded string when an option is selected', () => {
    const onAnswer = vi.fn()
    render(<QuizStep title="Prefs" questions={QUESTIONS} onAnswer={onAnswer} />)
    fireEvent.click(screen.getByText('Cozy'))
    expect(onAnswer).toHaveBeenCalledWith('Mood?: Cozy')
  })

  it('encodes all answered questions in order', () => {
    const onAnswer = vi.fn()
    render(<QuizStep title="Prefs" questions={QUESTIONS} onAnswer={onAnswer} />)
    fireEvent.click(screen.getByText('Cozy'))
    fireEvent.click(screen.getByText('Evening'))
    expect(onAnswer).toHaveBeenLastCalledWith('Mood?: Cozy\nTime?: Evening')
  })

  it('updates answer when a different option is clicked', () => {
    const onAnswer = vi.fn()
    render(<QuizStep title="Prefs" questions={QUESTIONS} onAnswer={onAnswer} />)
    fireEvent.click(screen.getByText('Cozy'))
    fireEvent.click(screen.getByText('Romantic'))
    expect(onAnswer).toHaveBeenLastCalledWith('Mood?: Romantic')
  })

  it('pre-selects initial answers', () => {
    render(
      <QuizStep
        title="Prefs"
        questions={QUESTIONS}
        onAnswer={vi.fn()}
        initialAnswers={{ 'Mood?': 'Cozy' }}
      />,
    )
    const cozyBtn = screen.getByText('Cozy')
    expect(cozyBtn).toHaveClass('border-rose-400')
  })
})
