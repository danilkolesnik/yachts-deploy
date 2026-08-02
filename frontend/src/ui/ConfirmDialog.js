'use client';

import { Button } from '@material-tailwind/react';
import { ClipLoader } from 'react-spinners';
import Modal from '@/ui/Modal';

/**
 * Shared confirm dialog for irreversible actions (delete, clear, etc.).
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm',
  message,
  confirmLabel = 'Yes, confirm',
  cancelLabel = 'Cancel',
  loading = false,
  confirmColor = 'red',
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!loading) onClose();
      }}
      title={title}
      size="sm"
    >
      <div className="space-y-4">
        {typeof message === 'string' ? (
          <p className="text-gray-700 text-sm leading-relaxed">{message}</p>
        ) : (
          message
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="text"
            color="gray"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button color={confirmColor} onClick={onConfirm} disabled={loading}>
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <ClipLoader size={13} color="#ffffff" />
                <span>Please wait…</span>
              </span>
            ) : (
              confirmLabel
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
