import { forwardRef, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const textareaId = id || props.name

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-discord-text-muted"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full bg-discord-bg border border-discord-deep rounded-lg',
            'px-4 py-2.5 text-white',
            'placeholder:text-discord-text-dim',
            'transition-all duration-200 resize-none',
            'focus:border-discord-blurple focus:ring-1 focus:ring-discord-blurple focus:outline-none',
            error && 'border-discord-red focus:border-discord-red focus:ring-discord-red',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-discord-red">{error}</p>
        )}
        {hint && !error && (
          <p className="text-sm text-discord-text-dim">{hint}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export { Textarea }
