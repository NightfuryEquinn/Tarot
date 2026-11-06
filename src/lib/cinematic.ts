import type { ReadingState } from './reading';
export type RitualStage = 'question' | 'gather' | 'choose' | 'reveal' | 'complete';
export function resumeRitual(reading: ReadingState): { stage: RitualStage; focus: number } {
  if (!reading.deck.length) return { stage: 'question', focus: 0 };
  if (reading.selected.length < 5) return { stage: 'choose', focus: 0 };
  const focus = reading.selected.findIndex(index => !reading.revealed.includes(reading.deck[index].id));
  return focus < 0 ? { stage: 'complete', focus: 4 } : { stage: 'reveal', focus };
}
export function nextReveal(reading: ReadingState, focus: number) {
  return reading.selected.findIndex((index, slot) => slot > focus && !reading.revealed.includes(reading.deck[index].id));
}
export function canTurn(reading: ReadingState, stage: RitualStage, focus: number, busy: boolean) {
  const index=reading.selected[focus];
  return stage==='reveal' && !busy && reading.selected.length===5 && index!==undefined && !reading.revealed.includes(reading.deck[index].id);
}
