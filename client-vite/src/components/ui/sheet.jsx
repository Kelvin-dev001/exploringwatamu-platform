import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Slide-in panel (mobile menu, filters, trip cart). Built on Radix Dialog
 * so focus trapping, Escape and scroll-locking are handled for us.
 */
export function Sheet({ open, onOpenChange, side = 'right', title, description, className, children }) {
  const sides = {
    right: 'inset-y-0 right-0 h-full w-[88vw] max-w-sm data-[state=open]:animate-[sheet-in-right_.35s_var(--ease-tide)]',
    bottom: 'inset-x-0 bottom-0 max-h-[88vh] rounded-t-[1.75rem] data-[state=open]:animate-[sheet-in-bottom_.35s_var(--ease-tide)]',
  };
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ocean-950/50 backdrop-blur-[2px] data-[state=open]:animate-[fade-in_.25s_ease-out]" />
        <Dialog.Content
          className={cn('fixed z-50 flex flex-col overflow-y-auto bg-sand-50 shadow-lift focus:outline-none', sides[side], className)}
        >
          <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-6">
            <div>
              <Dialog.Title className="font-display text-2xl text-ocean-900">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-sm text-ocean-900/60">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            <Dialog.Close
              className="-mr-2 rounded-full p-2 text-ocean-900/70 transition hover:bg-ocean-900/5 hover:text-ocean-900"
              aria-label="Close"
            >
              <X className="size-5" />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
