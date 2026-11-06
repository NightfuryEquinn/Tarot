import { cards, type TarotCard, type Meaning } from '../data/cards';

export type DrawnCard = { id: string; reversed: boolean };
export type ReadingState = {
  version: 1; question: string; reversals: boolean;
  deck: DrawnCard[]; selected: number[]; revealed: string[];
};
export const positions = [
  { name: 'The present', label: 'Present situation', prompt: 'What is asking for your attention?', context: 'At the heart of your present situation' },
  { name: 'The challenge', label: 'Challenge', prompt: 'What is getting in your way?', context: 'As a challenge to work with' },
  { name: 'The root', label: 'Underlying influence', prompt: 'What is moving beneath the surface?', context: 'Beneath the surface of this situation' },
  { name: 'The guidance', label: 'Advice', prompt: 'What could help you move forward?', context: 'As guidance for your next step' },
  { name: 'The possibility', label: 'Possible outcome', prompt: 'What might unfold from here?', context: 'As one possible direction from here' },
] as const;
export const emptyReading: ReadingState = { version: 1, question: '', reversals: true, deck: [], selected: [], revealed: [] };
export const cardById = new Map(cards.map(card => [card.id, card]));
export function meaningFor(draw: DrawnCard): Meaning {
  const card = cardById.get(draw.id);
  if (!card) throw new Error('Unknown card');
  return draw.reversed ? card.reversed : card.upright;
}

// Rejection sampling avoids modulo bias. The injectable source supports reproducible tests.
export function randomInt(limit: number, source = () => crypto.getRandomValues(new Uint32Array(1))[0]): number {
  if (!Number.isInteger(limit) || limit < 1 || limit > 0x100000000) throw new Error('Invalid random range');
  const ceiling = Math.floor(0x100000000 / limit) * limit;
  let value: number;
  do { value = source(); } while (value >= ceiling);
  return value % limit;
}
export function shuffleDeck(reversals = true, source?: () => number): DrawnCard[] {
  const deck = cards.map(card => ({ id: card.id, reversed: reversals && randomInt(2, source) === 1 }));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = randomInt(i + 1, source);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
export type ReadingAction =
  | { type: 'restore'; state: ReadingState }
  | { type: 'question'; value: string }
  | { type: 'reversals'; value: boolean }
  | { type: 'start'; deck: DrawnCard[] }
  | { type: 'select'; index: number }
  | { type: 'reveal'; id: string }
  | { type: 'reset' };
export function readingReducer(state: ReadingState, action: ReadingAction): ReadingState {
  switch (action.type) {
    case 'restore': return action.state;
    case 'question': return state.deck.length ? state : { ...state, question: action.value.slice(0, 300) };
    case 'reversals': return state.deck.length ? state : { ...state, reversals: action.value };
    case 'start': return { ...state, deck: action.deck, selected: [], revealed: [] };
    case 'select':
      if (state.selected.length >= 5 || !Number.isInteger(action.index) || !state.deck[action.index] || state.selected.includes(action.index)) return state;
      return { ...state, selected: [...state.selected, action.index] };
    case 'reveal':
      if (state.selected.length !== 5 || !state.selected.some(i => state.deck[i].id === action.id) || state.revealed.includes(action.id)) return state;
      return { ...state, revealed: [...state.revealed, action.id] };
    case 'reset': return { ...emptyReading, reversals: state.reversals };
  }
}
export function restoreReading(raw: string | null): ReadingState | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as ReadingState;
    if (v.version !== 1 || typeof v.question !== 'string' || v.question.length > 300 || typeof v.reversals !== 'boolean') return null;
    if (!Array.isArray(v.deck) || ![0, 78].includes(v.deck.length) || !v.deck.every(d => d && cardById.has(d.id) && typeof d.reversed === 'boolean' && (v.reversals || !d.reversed)) || new Set(v.deck.map(d => d.id)).size !== v.deck.length) return null;
    if (!Array.isArray(v.selected) || v.selected.length > 5 || new Set(v.selected).size !== v.selected.length || !v.selected.every(i => Number.isInteger(i) && i >= 0 && i < v.deck.length)) return null;
    if (!Array.isArray(v.revealed) || new Set(v.revealed).size !== v.revealed.length || !v.revealed.every(id => v.selected.some(i => v.deck[i].id === id)) || (v.revealed.length && v.selected.length !== 5)) return null;
    return { version: 1, question: v.question, reversals: v.reversals, deck: v.deck, selected: v.selected, revealed: v.revealed };
  } catch { return null; }
}

export type Connection = { ids: [string, string]; title: string; text: string; kind: 'bridge' | 'resonance' | 'tension' | 'position'; score: number };
const contrasts: [string, string, string][] = [
  ['action', 'patience', 'Movement needs room to mature. Consider where a small step would help and where waiting would protect your energy.'],
  ['connection', 'independence', 'Closeness and autonomy both deserve space. A clear boundary can make connection more sustainable.'],
  ['stability', 'change', 'Something wants to evolve while something else needs a dependable foundation. Keep one anchor as you experiment.'],
  ['clarity', 'uncertainty', 'Some facts are available while others are still emerging. Act on what you know without forcing a final answer.'],
  ['release', 'responsibility', 'Separate what is yours to carry from what can be set down. Commitment does not require holding everything.'],
  ['conflict', 'balance', 'A disagreement may reveal what needs rebalancing. Look for a fair response before trying to win.'],
];
const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
const cardLabel = (draw: DrawnCard) => `${cardById.get(draw.id)!.name}${draw.reversed ? ' reversed' : ''}`;
export function connectReading(draws: DrawnCard[]): Connection[] {
  const candidates: Connection[] = [];
  for (let i = 0; i < draws.length; i++) for (let j = i + 1; j < draws.length; j++) {
    const a = draws[i], b = draws[j], ca = cardById.get(a.id)!, cb = cardById.get(b.id)!;
    const ma = meaningFor(a), mb = meaningFor(b);
    const shared = ma.themes.filter(theme => mb.themes.includes(theme));
    const tension = contrasts.find(([x,y]) => (ma.themes.includes(x) && mb.themes.includes(y)) || (ma.themes.includes(y) && mb.themes.includes(x)));
    const bridge = ca.arcana !== cb.arcana;
    const sameSuit = !!ca.suit && ca.suit === cb.suit;
    let title = `${positions[i].name} meets ${positions[j].name.toLowerCase()}`;
    let text = `${cardLabel(a)} brings ${ma.keywords[0].toLowerCase()} to your ${positions[i].label.toLowerCase()}, while ${cardLabel(b)} brings ${mb.keywords[0].toLowerCase()} to your ${positions[j].label.toLowerCase()}. Read the second as a response to the first: ${mb.advice}`;
    let kind: Connection['kind'] = 'position';
    let score = 1;
    if (shared.length) {
      title = `${titleCase(shared[0])}, seen twice`;
      text = `${cardLabel(a)} and ${cardLabel(b)} share a theme of ${shared[0]}. In the ${positions[i].label.toLowerCase()} position, it appears as ${ma.keywords[0].toLowerCase()}; in the ${positions[j].label.toLowerCase()} position, it takes the form of ${mb.keywords[0].toLowerCase()}. ${mb.advice}`;
      kind = 'resonance'; score += 5 + shared.length;
    } else if (tension) {
      title = `${titleCase(tension[0])} & ${tension[1]}`;
      text = `${cardLabel(a)} (${ma.keywords[0].toLowerCase()}) and ${cardLabel(b)} (${mb.keywords[0].toLowerCase()}) pull in different directions. ${tension[2]}`;
      kind = 'tension'; score += 5;
    }
    if (sameSuit) { score += 2; text += ` Their shared suit of ${titleCase(ca.suit!)} places this exchange in ${suitDomains[ca.suit!]}.`; }
    if (ca.arcana === 'minor' && cb.arcana === 'minor' && ca.number === cb.number) { score += 2; text += ' Their matching ranks echo a similar stage of development across different areas of life.'; }
    if (bridge) {
      const major = ca.arcana === 'major' ? a : b, minor = ca.arcana === 'minor' ? a : b;
      const majorMeaning = meaningFor(major), minorMeaning = meaningFor(minor), minorCard = cardById.get(minor.id)!;
      text += ` ${cardLabel(major)} supplies the larger lesson of ${majorMeaning.keywords[0].toLowerCase()}; ${cardLabel(minor)} makes it tangible through ${minorMeaning.keywords[0].toLowerCase()} in ${suitDomains[minorCard.suit!]}.`;
      kind = 'bridge'; score += 3;
      if (!shared.length && !tension) title = 'The larger lesson, made personal';
    }
    candidates.push({ ids: [a.id,b.id], title, text, kind, score });
  }
  candidates.sort((a,b) => b.score - a.score);
  const bridge = candidates.find(c => c.kind === 'bridge');
  const result: Connection[] = bridge ? [bridge] : [];
  for (const c of candidates) { if (result.length >= 3) break; if (!result.includes(c)) result.push(c); }
  return result;
}
export const suitDomains: Record<string,string> = { wands: 'creative energy and purposeful action', cups: 'feelings and relationships', swords: 'thoughts, decisions, and communication', pentacles: 'work, resources, and everyday care' };
export function summarizeReading(draws: DrawnCard[]): string {
  if (draws.length !== 5) return '';
  const majorCount = draws.filter(d => cardById.get(d.id)!.arcana === 'major').length;
  const opening = majorCount >= 3 ? 'Several Major Arcana cards give this reading the shape of a larger transition.' : majorCount === 0 ? 'This reading speaks through everyday choices, relationships, and habits.' : 'A larger life theme is unfolding through practical, everyday experiences.';
  return `${opening} ${cardLabel(draws[0])} puts ${meaningFor(draws[0]).keywords[0].toLowerCase()} at the center. Your guidance, ${cardLabel(draws[3])}, suggests: ${meaningFor(draws[3]).advice} ${cardLabel(draws[4])} offers ${meaningFor(draws[4]).keywords[0].toLowerCase()} as a possibility to reflect on, rather than a fixed destination.`;
}
