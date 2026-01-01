'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

const SIZE_MAP = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl'
};

type PopupSize = keyof typeof SIZE_MAP;

export type PopupProps = {
  isOpen: boolean;
  onClose?: () => void;
  title?: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: PopupSize;
  className?: string;
  overlayClassName?: string;
  closeButtonLabel?: string;
  showCloseButton?: boolean;
};

export const Popup = ({
  isOpen,
  onClose,
  title,
  description,
  eyebrow,
  children,
  footer,
  size = 'md',
  className,
  overlayClassName,
  closeButtonLabel = 'Đóng cửa sổ',
  showCloseButton
}: PopupProps) => {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !panelRef.current) return;
    panelRef.current.focus();
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  const rootElement = document.body;

  const shouldShowCloseButton = showCloseButton ?? Boolean(onClose);

  const content = (
    <div className="fixed inset-0 z-50">
      <div
        className={cn('absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity', overlayClassName)}
        onClick={() => onClose?.()}
        aria-hidden="true"
      />
      <div className="relative flex h-full w-full items-center justify-center p-4 sm:p-8">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descriptionId : undefined}
          ref={panelRef}
          tabIndex={-1}
          className={cn('w-full rounded-3xl bg-white p-6 shadow-2xl focus:outline-none', SIZE_MAP[size], className)}
          onClick={(event) => event.stopPropagation()}
        >
          {(eyebrow || title || description || shouldShowCloseButton) && (
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{eyebrow}</p> : null}
                {title ? (
                  <h2 id={titleId} className="text-2xl font-semibold text-slate-900">
                    {title}
                  </h2>
                ) : null}
                {description ? (
                  <p id={descriptionId} className="text-sm text-slate-500">
                    {description}
                  </p>
                ) : null}
              </div>
              {shouldShowCloseButton ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40"
                  aria-label={closeButtonLabel}
                >
                  <X className="h-5 w-5" />
                </button>
              ) : null}
            </div>
          )}

          <div className={cn(eyebrow || title || description ? 'mt-6' : undefined)}>{children}</div>

          {footer ? <div className="mt-6">{footer}</div> : null}
        </div>
      </div>
    </div>
  );

  return rootElement ? createPortal(content, rootElement) : null;
};

Popup.displayName = 'Popup';
