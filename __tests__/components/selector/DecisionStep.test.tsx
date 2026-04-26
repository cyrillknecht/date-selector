import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DecisionStep } from '@/components/selector/DecisionStep'
import { t } from '@/i18n/selector'

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
    expect(screen.getByText(t.singleSelectHint)).toBeInTheDocument()
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
    expect(screen.getByText(t.multiSelectHint)).toBeInTheDocument()
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

  it('renders location and price metadata in expand panel after tapping expand', async () => {
    render(
      <DecisionStep
        promptText="Pick one"
        allowMultiSelect={false}
        cards={CARDS}
        onAnswer={vi.fn()}
      />,
    )
    const expandBtn = screen.getAllByLabelText('Expand')[0]
    await userEvent.click(expandBtn)
    // getAllByText because both desktop (hover) and mobile (tap) panels may render in jsdom
    expect(screen.getAllByText('City Center').length).toBeGreaterThan(0)
    expect(screen.getAllByText('$$').length).toBeGreaterThan(0)
  })

  it('renders mood tags in expand panel after tapping expand', async () => {
    render(
      <DecisionStep
        promptText="Pick one"
        allowMultiSelect={false}
        cards={CARDS}
        onAnswer={vi.fn()}
      />,
    )
    const expandBtn = screen.getAllByLabelText('Expand')[0]
    await userEvent.click(expandBtn)
    expect(screen.getAllByText('romantic').length).toBeGreaterThan(0)
    expect(screen.getAllByText('cozy').length).toBeGreaterThan(0)
  })
})
