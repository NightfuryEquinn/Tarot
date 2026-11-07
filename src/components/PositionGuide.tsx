"use client";

import { useEffect, useId, useRef, useState } from 'react';
import { spreadName, spreadPositions, type SpreadContext } from '@/lib/spreads';
import { useLanguage } from './Language';
import { SpreadDiagram } from './SpreadDiagram';
import { Icon } from './Icon';
import { iconButton, textButton } from './ui';

export function PositionGuide({ spread }: { spread: SpreadContext }) {
  const { locale, t } = useLanguage();
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const positions = spreadPositions(locale, spread);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  return <>
    <button ref={trigger} type="button" className={`${textButton} my-2`} aria-haspopup="dialog"
      aria-controls={id} onClick={() => {
        dialog.current?.showModal();
        setOpen(true);
        closeButton.current?.focus();
      }}>
      <Icon name="book" size={17} />{t('Position guide', '牌位说明')}
    </button>
    <dialog ref={dialog} id={id} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}
      className="fixed max-h-[90dvh] w-[calc(100%-2rem)] max-w-6xl overflow-hidden rounded-lg border border-gold/30 bg-panel p-0 text-parchment shadow-2xl backdrop:bg-ink/85 backdrop:backdrop-blur-sm open:flex open:flex-col"
      onClose={() => { setOpen(false); trigger.current?.focus(); }}
      onCancel={event => { event.preventDefault(); dialog.current?.close(); }}
      onClick={event => {
        if (event.target !== dialog.current) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.current?.close();
      }}>
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-8 sm:py-6">
        <div>
          <p className="mb-2 text-sm text-gold">{t('Position guide', '牌位说明')}</p>
          <h2 id={`${id}-title`} className="font-display text-3xl sm:text-4xl">{spreadName(spread.spreadId ?? 'five', locale)}</h2>
        </div>
        <button ref={closeButton} type="button" className={iconButton} aria-label={t('Close position guide', '关闭牌位说明')}
          onClick={() => dialog.current?.close()}><Icon name="close" /></button>
      </header>
      <div className="min-h-0 overflow-y-auto overscroll-contain px-5 pb-6 sm:px-8 sm:pb-8">
        <p id={`${id}-description`} className="mt-5 text-base leading-7 text-muted">
          {t('Each number marks the order you draw and reveal a card. Read its meaning through the question for that position.', '数字表示抽牌与翻牌的顺序。解读时，结合每个牌位的问题来理解牌义。')}
        </p>
        <div className="mx-auto max-w-4xl"><SpreadDiagram spread={spread} /></div>
        <ol className="grid gap-4 sm:grid-cols-2">
          {positions.map((position, index) => <li key={position.id} className="rounded border border-line bg-ink/30 p-4 sm:p-5">
            <h3 className="mb-2 text-base font-semibold text-gold">{index + 1}. {position.label}</h3>
            <p className="text-base leading-7 text-muted">{position.prompt}</p>
          </li>)}
        </ol>
      </div>
    </dialog>
  </>;
}
