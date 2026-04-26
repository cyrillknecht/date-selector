export type ErrorCode =
  | 'AUTH_REQUIRED'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'FLOW_LOCKED'
  | 'DUPLICATE_SUBMISSION'
  | 'INTERNAL_ERROR'

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly statusCode: number,
    public readonly field?: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function withErrorHandler(
  handler: (req: Request, ctx: unknown) => Promise<Response>,
) {
  return async (req: Request, ctx: unknown): Promise<Response> => {
    try {
      return await handler(req, ctx)
    } catch (err) {
      if (err instanceof AppError) {
        return Response.json(
          { error: err.message, code: err.code, ...(err.field && { field: err.field }) },
          { status: err.statusCode },
        )
      }
      console.log(JSON.stringify({
        level: 'ERROR',
        event: 'api.unhandled_error',
        path: new URL(req.url).pathname,
        error: err instanceof Error ? err.message : String(err),
      }))
      return Response.json(
        { error: 'Something went wrong', code: 'INTERNAL_ERROR' },
        { status: 500 },
      )
    }
  }
}
