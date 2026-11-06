"use client";

import { useLayoutEffect, type RefObject } from 'react';
import { animate } from 'animejs';
import type { RitualStage } from './cinematic';

export function isRitualFocused(stage: RitualStage, question: string) {
  return stage === 'question' ? question.trim().length > 0 : stage !== 'complete';
}

/** Keep layout stable while removing unrelated controls from interaction. */
export function useSecondaryFade(root: RefObject<HTMLElement | null>, focused: boolean, reduced: boolean) {
  useLayoutEffect(() => {
    const elements = [...(root.current?.querySelectorAll<HTMLElement>('[data-ritual-secondary]') ?? [])];
    for (const element of elements) {
      element.toggleAttribute('inert', focused);
      if (focused) element.setAttribute('aria-hidden', 'true');
      else element.removeAttribute('aria-hidden');
      element.style.pointerEvents = focused ? 'none' : '';
    }
    if (reduced) {
      elements.forEach(element => { element.style.opacity = focused ? '0' : '1'; });
      return;
    }
    const animation = animate(elements, { opacity: focused ? 0 : 1, duration: 300, ease: 'out(3)' });
    return () => { animation.cancel(); };
  }, [root, focused, reduced]);
}
