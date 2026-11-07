"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

type Option<T extends string> = { value: T; label: string };
export function Dropdown<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef({ text: '', time: 0 });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const selected = Math.max(0, options.findIndex(option => option.value === value));

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  useEffect(() => {
    if (open) document.getElementById(`${id}-option-${active}`)?.scrollIntoView?.({ block: 'nearest' });
  }, [open, active, id]);

  const choose = (index: number) => {
    if (!options[index]) return;
    onChange(options[index].value);
    setOpen(false);
    trigger.current?.focus();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Tab') { setOpen(false); return; }
    if (event.key === 'Escape') {
      if (open) { event.preventDefault(); event.stopPropagation(); setOpen(false); }
      return;
    }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      setActive(event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1
        : !open ? selected : (active + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length);
      setOpen(true);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (open) choose(active);
      else { setActive(selected); setOpen(true); }
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      const now = Date.now();
      const previous = now - search.current.time < 700 ? search.current.text : '';
      const text = (previous + event.key).toLocaleLowerCase();
      search.current = { text, time: now };
      const repeated = [...text].every(char => char === text[0]);
      const prefix = repeated ? text[0] : text;
      const start = repeated ? (open ? active : selected) + 1 : 0;
      const index = Array.from({ length: options.length }, (_, i) => (start + i) % options.length)
        .find(i => options[i].label.toLocaleLowerCase().startsWith(prefix));
      if (index !== undefined) { setActive(index); setOpen(true); }
    }
  };

  return <div ref={root} className={`relative my-5 ${open ? 'z-40' : ''}`}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <label id={`${id}-label`} htmlFor={`${id}-trigger`} className="mb-2 block text-sm text-gold">{label}</label>
    <button id={`${id}-trigger`} ref={trigger} type="button" role="combobox"
      aria-labelledby={`${id}-label`} aria-expanded={open} aria-controls={`${id}-list`}
      aria-haspopup="listbox" aria-activedescendant={open ? `${id}-option-${active}` : undefined}
      className="flex min-h-12 w-full items-center justify-between gap-3 rounded-sm border border-gold/30 bg-panel px-4 py-3 text-left text-sm text-parchment hover:border-gold/60"
      onKeyDown={onKeyDown} onClick={() => { setActive(selected); search.current.text = ''; setOpen(!open); }}>
      <span>{options[selected]?.label}</span>
      <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none" className={`shrink-0 ${open ? 'rotate-180' : ''}`}>
        <path d="m2 4 4 4 4-4" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </button>
    {open && <ul id={`${id}-list`} role="listbox" aria-labelledby={`${id}-label`}
      className="absolute inset-x-0 top-full mt-2 max-h-64 overflow-y-auto rounded-sm border border-gold/30 bg-panel p-1 shadow-xl">
      {options.map((option, index) => <li id={`${id}-option-${index}`} key={option.value}
        role="option" aria-selected={option.value === value} data-value={option.value}
        onPointerDown={event => event.preventDefault()} onClick={() => choose(index)}
        className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-sm px-3 py-2 text-sm hover:bg-gold/10 ${active === index ? 'bg-gold/10' : ''} ${option.value === value ? 'text-gold' : 'text-parchment'}`}>
        <span>{option.label}</span><span aria-hidden="true">{option.value === value ? '✓' : ''}</span>
      </li>)}
    </ul>}
  </div>;
}
