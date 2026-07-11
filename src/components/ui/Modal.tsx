import { Dialog, DialogContent } from './dialog'
import { cn } from '../../lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  dismissible?: boolean
}

export function Modal({ open, onClose, children, className, dismissible = true }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => dismissible && !v && onClose()}>
      <DialogContent className={cn('max-w-lg', className)} onPointerDownOutside={(e) => !dismissible && e.preventDefault()}>
        {children}
      </DialogContent>
    </Dialog>
  )
}
