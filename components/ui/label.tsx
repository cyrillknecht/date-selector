import { cn } from '@/lib/utils'
import { type LabelHTMLAttributes, forwardRef } from 'react'

const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      className={cn('text-sm font-medium text-stone-700 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)}
      ref={ref}
      {...props}
    />
  ),
)
Label.displayName = 'Label'

export { Label }
