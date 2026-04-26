import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn', () => {
  it('returns a single class unchanged', () => {
    expect(cn('foo')).toBe('foo')
  })

  it('merges multiple classes', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('deduplicates conflicting Tailwind classes (last wins)', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('filters falsy values', () => {
    expect(cn('foo', false, undefined, null, '', 'bar')).toBe('foo bar')
  })

  it('handles conditional object syntax', () => {
    expect(cn({ 'font-bold': true, italic: false })).toBe('font-bold')
  })

  it('returns empty string with no args', () => {
    expect(cn()).toBe('')
  })
})
