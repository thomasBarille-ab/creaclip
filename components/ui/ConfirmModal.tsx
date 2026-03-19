'use client'

import { useTranslation } from 'react-i18next'
import { Modal, Button } from '@/components/ui'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  warning?: string
  confirmLabel?: string
  confirmVariant?: 'primary' | 'danger'
  icon?: React.ElementType
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  warning,
  confirmLabel,
  confirmVariant = 'danger',
  icon: Icon,
}: Props) {
  const { t } = useTranslation()
  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6">
        <div className="mb-4 flex items-center gap-3">
          {Icon && (
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${confirmVariant === 'primary' ? 'bg-orange-500/20' : 'bg-red-500/20'}`}>
              <Icon className={`h-5 w-5 ${confirmVariant === 'primary' ? 'text-orange-400' : 'text-red-400'}`} />
            </div>
          )}
          <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>

        <p className="mb-2 text-sm text-white/60">{description}</p>
        {warning && <p className="mb-6 text-sm text-red-400/80">{warning}</p>}

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            {t('confirmModal.cancel')}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} className="flex-1">
            {confirmLabel || t('confirmModal.confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
