import { forwardRef, InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, id, ...props }, ref) => {
    const inputId = id || props.name

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-discord-text-muted"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-discord-text-dim pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full bg-discord-bg border border-discord-deep rounded-lg',
              'px-4 py-2.5 text-white',
              'placeholder:text-discord-text-dim',
              'transition-all duration-200',
              'focus:border-discord-blurple focus:ring-1 focus:ring-discord-blurple focus:outline-none',
              icon && 'pl-10',
              error && 'border-discord-red focus:border-discord-red focus:ring-discord-red',
              className
            )}
            {...props}
          />
        </div>
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

Input.displayName = 'Input'

export { Input }
