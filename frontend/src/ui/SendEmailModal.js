'use client';

import React, { useEffect, useState } from 'react';
import { Button, Input } from '@material-tailwind/react';
import Modal from '@/ui/Modal';

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {string} props.title
 * @param {string} [props.customerName]
 * @param {string} [props.customerEmail]
 * @param {boolean} [props.loading]
 * @param {(payload: { email?: string; useCustomerEmail?: boolean }) => void | Promise<void>} props.onSend
 */
export default function SendEmailModal({
  isOpen,
  onClose,
  title,
  customerName = '',
  customerEmail = '',
  loading = false,
  onSend,
}) {
  const hasCustomerEmail = Boolean(customerEmail?.trim());
  const [recipientMode, setRecipientMode] = useState('customer');
  const [otherEmail, setOtherEmail] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setRecipientMode(hasCustomerEmail ? 'customer' : 'other');
    setOtherEmail('');
  }, [isOpen, hasCustomerEmail, customerEmail, customerName]);

  const handleSend = () => {
    if (recipientMode === 'customer') {
      if (!hasCustomerEmail) return;
      onSend({ useCustomerEmail: true });
      return;
    }
    const email = otherEmail.trim();
    if (!email) {
      alert('Please enter an email address');
      return;
    }
    onSend({ email });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4 text-black">
        {hasCustomerEmail ? (
          <label className="flex items-start gap-2 cursor-pointer text-sm">
            <input
              type="radio"
              name="recipientMode"
              checked={recipientMode === 'customer'}
              onChange={() => setRecipientMode('customer')}
              className="mt-1"
            />
            <span>
              <span className="font-medium">Send to client</span>
              <span className="block text-gray-600">
                {customerName ? `${customerName} · ` : ''}
                {customerEmail}
              </span>
            </span>
          </label>
        ) : (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
            Client email is not on file. Enter a recipient address below.
          </p>
        )}

        <label className="flex items-start gap-2 cursor-pointer text-sm">
          <input
            type="radio"
            name="recipientMode"
            checked={recipientMode === 'other'}
            onChange={() => setRecipientMode('other')}
            className="mt-1"
          />
          <span className="font-medium w-full">
            Send to another email
            {recipientMode === 'other' && (
              <Input
                type="email"
                label="Email address"
                value={otherEmail}
                onChange={(e) => setOtherEmail(e.target.value)}
                className="mt-2"
                containerProps={{ className: 'min-w-0' }}
              />
            )}
          </span>
        </label>

        <div className="flex justify-end space-x-2 pt-2">
          <Button variant="text" color="red" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button color="green" onClick={handleSend} disabled={loading}>
            {loading ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
