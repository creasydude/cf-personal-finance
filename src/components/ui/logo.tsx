import { cn } from '../../lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ className, size = 'md' }: LogoProps) {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  }

  return (
    <div className={cn(
      'flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20',
      sizes[size],
      className
    )}>
      <svg viewBox="0 0 24 24" fill="none" className="h-[60%] w-[60%]" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 20h20" />
        <path d="M4 20V12" />
        <path d="M8 20V8" />
        <path d="M12 20V10" />
        <path d="M16 20V6" />
        <path d="M20 20V4" />
      </svg>
    </div>
  )
}
