import { cards } from './cards';
import { historyMajor } from './history-major';
import { historyWandsCups } from './history-wands-cups';
import { historySwordsPentacles } from './history-swords-pentacles';
import type { BilingualStory } from './history-types';

export const histories: Record<string, BilingualStory> = { ...historyMajor, ...historyWandsCups, ...historySwordsPentacles };

// Fail the static build instead of publishing incomplete or mismatched articles.
export function validateHistories() {
  if (Object.keys(histories).length !== cards.length) throw new Error('History must cover exactly 78 cards');
  for (const card of cards) {
    for (const locale of ['en', 'zh-CN'] as const) {
      const story = histories[card.id]?.[locale];
      if (!story || !story.teaser.trim() || !story.detail.trim() ||
        [story.origin, story.evolution, story.today].some(section => !section.length || section.some(p => !p.trim())) ||
        story.symbols.length < 3 || story.symbols.some(s => !s.name.trim() || !s.text.trim()) ||
        !story.sources.length || story.sources.some(url => { try { return new URL(url).protocol !== 'https:'; } catch { return true; } })) {
        throw new Error(`Incomplete history: ${card.id} / ${locale}`);
      }
    }
  }
}
