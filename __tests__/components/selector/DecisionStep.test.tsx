import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DecisionStep } from '@/components/selector/DecisionStep'

const CARDS = [
  {
    id: 'card-1',
    title: 'Sushi Bar',
    description: 'Fresh sushi',
    location: 'City Center',
    price_range: '$$',
    mood_tags: ['romantic', 'cozy'],
    photo_urls: [],
  },
  {
    id: 'card-2',
    title: 'Rooftop Bar',
    description: null,
    location: null,
    price_range: null,
    mood_tags: [],
    photo_urls: [],
  },
]

describe('DecisionStep', () => {
  it('renders prompt text and card titles', () => {
    render(
      <DecisionStep
        promptText="Where do you want to go?"
        allowMultiSelect={false}
        cards={CARDS}
        onAnswer={vi.fn()}
      />,
    )
    expect(screen.getByText('Where do you want to go?')).toBeInTheDocument()
    expect(screen.getByText('Sushi Bar')).toBeInTheDocument()
    expect(screen.getByText('Rooftop Bar')).toBeInTheDocument()
  })

  it('shows "Pick your favourite" hint in single-select mode', () => {
    render(
      <DecisionStep
        promptText="Pick one"
        allowMultiSelect={false}
        cards={CARDS}
        onAnswer={vi.fn()}
      />,
    )
    expect(screen.getByText('Pick your favourite')).toBeInTheDocument()
  })

  it('shows "Select all that you like" hint in multi-select mode', () => {
    render(
      <DecisionStep
        promptText="Pick many"
        allowMultiSelect={true}
        cards={CARDS}
        onAnswer={vi.fn()}
      />,
    )
    expect(screen.getByText('Select all that you like')).toBeInTheDocument()
  })

  it('calls onAnswer with the card id when clicked (single select)', () => {
    const onAnswer = vi.fn()
    render(
      <DecisionStep
        promptText="Pick one"
        allowMultiSelect={false}
        cards={CARDS}
        onAnswer={onAnswer}
      />,
    )
    fireEvent.click(screen.getByText('Sushi Bar'))
    expect(onAnswer).toHaveBeenCalledWith(['card-1'])
  })

  it('toggles off a selected card in single-select mode', () => {
    const onAnswer = vi.fn()
    render(
      <DecisionStep
        promptText="Pick one"
        allowMultiSelect={false}
        cards={CARDS}
        onAnswer={onAnswer}
        initialSelection={['card-1']}
      />,
    )
    fireEvent.click(screen.getByText('Sushi Bar'))
    expect(onAnswer).toHaveBeenLastCalledWith([])
  })

  it('allows multiple selections in multi-select mode', () => {
    const onAnswer = vi.fn()
    render(
      <DecisionStep
        promptText="Pick many"
        allowMultiSelect={true}
        cards={CARDS}
        onAnswer={onAnswer}
      />,
    )
    fireEvent.click(screen.getByText('Sushi Bar'))
    fireEvent.click(screen.getByText('Rooftop Bar'))
    expect(onAnswer).toHaveBeenLastCalledWith(['card-1', 'card-2'])
  })

  it('replaces selection when clicking a new card in single-select mode', () => {
    const onAnswer = vi.fn()
    render(
      <DecisionStep
        promptText="Pick one"
        allowMultiSelect={false}
        cards={CARDS}
        onAnswer={onAnswer}
        initialSelection={['card-1']}
      />,
    )
    fireEvent.click(screen.getByText('Rooftop Bar'))
    expect(onAnswer).toHaveBeenLastCalledWith(['card-2'])
  })

  it('renders location and price metadata when present', () => {
    render(
      <DecisionStep
        promptText="Pick one"
        allowMultiSelect={false}
        cards={CARDS}
        onAnswer={vi.fn()}
      />,
    )
    expect(screen.getByText('City Center')).toBeInTheDocument()
    expect(screen.getByText('$$')).toBeInTheDocument()
  })

  it('renders mood tags', () => {
    render(
      <DecisionStep
        promptText="Pick one"
        allowMultiSelect={false}
        cards={CARDS}
        onAnswer={vi.fn()}
      />,
    )
    expect(screen.getByText('romantic')).toBeInTheDocument()
    expect(screen.getByText('cozy')).toBeInTheDocument()
  })
})
