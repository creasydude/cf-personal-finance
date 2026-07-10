import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog'
import { Button } from './button'
import { useTranslation } from '../../hooks/useTranslation'
import { AlertTriangle } from 'lucide-react'

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'danger',
}: ConfirmModalProps) {
  const { t } = useTranslation()

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <DialogTitle>
            {title || t('delete.confirmTitle')}
          </DialogTitle>
          <DialogDescription>
            {message || t('delete.confirm')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            {cancelLabel || t('account.cancel')}
          </Button>
          <Button
            variant={variant === 'danger' ? 'destructive' : 'default'}
            className="flex-1"
            onClick={handleConfirm}
          >
            {confirmLabel || t('delete.delete')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
