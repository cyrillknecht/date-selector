import { describe, it, expect, vi } from 'vitest'
import { AppError, withErrorHandler } from '@/lib/errors'

describe('AppError', () => {
  it('sets all fields correctly', () => {
    const err = new AppError('Not found', 'NOT_FOUND', 404, 'id')
    expect(err.message).toBe('Not found')
    expect(err.code).toBe('NOT_FOUND')
    expect(err.statusCode).toBe(404)
    expect(err.field).toBe('id')
    expect(err.name).toBe('AppError')
  })

  it('is an instance of Error', () => {
    expect(new AppError('oops', 'INTERNAL_ERROR', 500)).toBeInstanceOf(Error)
  })

  it('field is optional', () => {
    const err = new AppError('locked', 'FLOW_LOCKED', 423)
    expect(err.field).toBeUndefined()
  })
})

describe('withErrorHandler', () => {
  const makeReq = () => new Request('http://localhost/api/test')

  it('returns the handler response on success', async () => {
    const handler = async () => Response.json({ ok: true })
    const wrapped = withErrorHandler(handler)
    const res = await wrapped(makeReq(), {})
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })

  it('maps AppError to typed JSON response', async () => {
    const handler = async () => {
      throw new AppError('Not found', 'NOT_FOUND', 404)
    }
    const wrapped = withErrorHandler(handler)
    const res = await wrapped(makeReq(), {})
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.code).toBe('NOT_FOUND')
    expect(body.error).toBe('Not found')
    expect(body.field).toBeUndefined()
  })

  it('includes field in AppError response when present', async () => {
    const handler = async () => {
      throw new AppError('Invalid', 'VALIDATION_ERROR', 422, 'email')
    }
    const wrapped = withErrorHandler(handler)
    const res = await wrapped(makeReq(), {})
    const body = await res.json()
    expect(body.field).toBe('email')
  })

  it('returns 500 for unknown errors', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const handler = async () => {
      throw new Error('boom')
    }
    const wrapped = withErrorHandler(handler)
    const res = await wrapped(makeReq(), {})
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.code).toBe('INTERNAL_ERROR')
    consoleSpy.mockRestore()
  })
})
