import { getCard, local, themeName, type Locale } from './locale';
import { cards, type TarotCard, type Meaning } from '../data/cards';
import { topicContext } from './topics';

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
const chinesePositions = [
  { name:'当下', label:'当前处境', prompt:'什么正等待你的关注？', context:'在当前处境的核心' },
  { name:'挑战', label:'面临的挑战', prompt:'什么阻碍着你？', context:'面对需要处理的挑战' },
  { name:'根源', label:'潜在影响', prompt:'表面之下，什么正在发生？', context:'在局势的深处' },
  { name:'指引', label:'行动建议', prompt:'什么能帮助你向前？', context:'作为下一步的指引' },
  { name:'可能', label:'可能的发展', prompt:'从这里可能走向何方？', context:'作为一种可能的发展方向' },
];
export const getPositions = (locale:Locale='en') => locale==='en'?positions:chinesePositions;
export const emptyReading: ReadingState = { version: 1, question: '', reversals: true, deck: [], selected: [], revealed: [] };
export const cardById = new Map(cards.map(card => [card.id, card]));
export function meaningFor(draw: DrawnCard, locale:Locale = 'en'): Meaning {
  const card = getCard(draw.id,locale);
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
    case 'start': return state.selected.length ? state : { ...state, deck: action.deck, selected: [], revealed: [] };
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

type ConnectionKind = 'bridge' | 'resonance' | 'tension' | 'position';
export type Connection = { ids: [string, string]; title: string; text: string; kind: ConnectionKind; relations: ConnectionKind[]; score: number };
const contrasts: [string, string, string][] = [
  ['action', 'patience', 'Movement needs room to mature. Consider where a small step would help and where waiting would protect your energy.'],
  ['connection', 'independence', 'Closeness and autonomy both deserve space. A clear boundary can make connection more sustainable.'],
  ['stability', 'change', 'Something wants to evolve while something else needs a dependable foundation. Keep one anchor as you experiment.'],
  ['clarity', 'uncertainty', 'Some facts are available while others are still emerging. Act on what you know without forcing a final answer.'],
  ['release', 'responsibility', 'Separate what is yours to carry from what can be set down. Commitment does not require holding everything.'],
  ['conflict', 'balance', 'A disagreement may reveal what needs rebalancing. Look for a fair response before trying to win.'],
];
const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
const cardLabel = (draw: DrawnCard, locale:Locale='en') => `${getCard(draw.id,locale).name}${draw.reversed ? local(locale,' reversed','（逆位）') : ''}`;
export function connectReading(draws: DrawnCard[], locale:Locale='en'): Connection[] {
  if (draws.length !== 5) return [];
  const positions=getPositions(locale);
  const label=(draw:DrawnCard)=>cardLabel(draw,locale);
  const domain=(suit:string)=>locale==='en'?suitDomains[suit]:chineseSuitDomains[suit];
  const candidates: Connection[] = [];
  for (let i = 0; i < draws.length; i++) for (let j = i + 1; j < draws.length; j++) {
    const a = draws[i], b = draws[j], ca = getCard(a.id,locale), cb = getCard(b.id,locale);
    const ma = meaningFor(a,locale), mb = meaningFor(b,locale);
    const shared = ma.themes.filter(theme => mb.themes.includes(theme));
    const tension = contrasts.find(([x,y]) => (ma.themes.includes(x) && mb.themes.includes(y)) || (ma.themes.includes(y) && mb.themes.includes(x)));
    const bridge = ca.arcana !== cb.arcana;
    const sameSuit = !!ca.suit && ca.suit === cb.suit;
    let title = local(locale,`${positions[i].name} meets ${positions[j].name.toLowerCase()}`,`${positions[i].name}与${positions[j].name}的对话`);
    let text = local(locale,
      `${label(a)} brings ${ma.keywords[0].toLowerCase()} to your ${positions[i].label.toLowerCase()}, while ${label(b)} brings ${mb.keywords[0].toLowerCase()} to your ${positions[j].label.toLowerCase()}. Read the second as a response to the first: ${mb.advice}`,
      `${label(a)}为「${positions[i].label}」带来${ma.keywords[0]}，${label(b)}则以${mb.keywords[0]}回应「${positions[j].label}」。把后者视为对前者的回应：${mb.advice}`);
    let kind: Connection['kind'] = 'position';
    const relations: ConnectionKind[] = [];
    let score = 1;
    if (shared.length) {
      title = local(locale,`${titleCase(shared[0])}, seen twice`,`${themeName(shared[0],locale)}，在两张牌中呼应`);
      text = local(locale,
        `${label(a)} and ${label(b)} share a theme of ${shared[0]}. In the ${positions[i].label.toLowerCase()} position, it appears as ${ma.keywords[0].toLowerCase()}; in the ${positions[j].label.toLowerCase()} position, it takes the form of ${mb.keywords[0].toLowerCase()}. ${mb.advice}`,
        `${label(a)}与${label(b)}共同指向「${themeName(shared[0],locale)}」。在「${positions[i].label}」中，它表现为${ma.keywords[0]}；在「${positions[j].label}」中，它呈现为${mb.keywords[0]}。${mb.advice}`);
      kind = 'resonance'; score += 5 + shared.length;
      relations.push('resonance');
    }
    if (tension) {
      if (!shared.length) title = local(locale,`${titleCase(tension[0])} & ${tension[1]}`,`${themeName(tension[0],locale)}与${themeName(tension[1],locale)}`);
      const aTheme = ma.themes.includes(tension[0]) && mb.themes.includes(tension[1]) ? tension[0] : tension[1];
      const bTheme = aTheme === tension[0] ? tension[1] : tension[0];
      const tensionText = local(locale,
        `${label(a)} emphasizes ${aTheme} in the ${positions[i].label.toLowerCase()} position, while ${label(b)} emphasizes ${bTheme} in the ${positions[j].label.toLowerCase()} position. ${tension[2]}`,
        `${label(a)}在「${positions[i].label}」中强调${themeName(aTheme,locale)}，而${label(b)}在「${positions[j].label}」中强调${themeName(bTheme,locale)}，提示不同的需要。${chineseContrasts[contrasts.indexOf(tension)]}`);
      text = shared.length ? `${text} ${tensionText}` : tensionText;
      kind = 'tension'; score += 5;
      relations.push('tension');
    }
    if (sameSuit) { score += 2; text += local(locale,` Their shared suit of ${titleCase(ca.suit!)} places this exchange in ${domain(ca.suit!)}.`,` 两张牌同属一个牌组，让这份对话落在${domain(ca.suit!)}之中。`); }
    if (ca.arcana === 'minor' && cb.arcana === 'minor' && ca.number === cb.number) { score += 2; text += local(locale,' Their matching ranks echo a similar stage of development across different areas of life.',' 相同的牌阶也提示：生活的不同领域，可能正经历相似的发展阶段。'); }
    if (bridge) {
      const major = ca.arcana === 'major' ? a : b, minor = ca.arcana === 'minor' ? a : b;
      const majorMeaning = meaningFor(major,locale), minorMeaning = meaningFor(minor,locale), minorCard = getCard(minor.id,locale);
      text += local(locale,
        ` ${label(major)} supplies the larger lesson of ${majorMeaning.keywords[0].toLowerCase()}; ${label(minor)} makes it tangible through ${minorMeaning.keywords[0].toLowerCase()} in ${domain(minorCard.suit!)}.`,
        ` 大阿尔卡那的${label(major)}提出关于${majorMeaning.keywords[0]}的整体课题；小阿尔卡那的${label(minor)}则通过${minorMeaning.keywords[0]}，将它落实到${domain(minorCard.suit!)}。`);
      kind = 'bridge'; score += 3;
      relations.push('bridge');
      if (!shared.length && !tension) title = local(locale,'The larger lesson, made personal','让整体课题走进日常');
    }
    candidates.push({ ids: [a.id,b.id], title, text, kind, relations: relations.length ? relations : ['position'], score });
  }
  candidates.sort((a,b) => b.score - a.score);
  const bridge = candidates.find(c => c.kind === 'bridge');
  const result: Connection[] = bridge ? [bridge] : [];
  while (result.length < 3) {
    const usedIds = new Set(result.flatMap(c => c.ids));
    const usedRelations = new Set(result.flatMap(c => c.relations));
    const value = (c: Connection) => c.score
      + c.ids.filter(id => !usedIds.has(id)).length * 8
      + c.relations.filter(relation => !usedRelations.has(relation)).length * 4;
    const next = candidates.filter(c => !result.includes(c)).sort((a,b) => value(b) - value(a))[0];
    if (!next) break;
    result.push(next);
  }
  return result;
}
export const suitDomains: Record<string,string> = { wands: 'creative energy and purposeful action', cups: 'feelings and relationships', swords: 'thoughts, decisions, and communication', pentacles: 'work, resources, and everyday care' };
const chineseSuitDomains: Record<string,string> = {wands:'创造力与有方向的行动',cups:'情感与关系',swords:'思考、决定与沟通',pentacles:'工作、资源与日常照顾'};
const chineseContrasts = [
  '行动需要时间成熟。想一想，哪里适合迈出一小步，哪里又需要耐心来保护自己的精力。',
  '亲近与独立都值得被照顾。清楚的界限，能让关系更长久。',
  '一部分渴望改变，另一部分需要可靠的基础。尝试新方向时，保留一个稳定的支点。',
  '有些事实已经清楚，另一些仍在浮现。依据已知行动，同时给未知留出空间。',
  '分清属于自己的责任，以及可以放下的负担。承诺并不意味着承担一切。',
  '分歧可能揭示需要调整的地方。先寻找公平的回应，再考虑谁对谁错。',
];
export function summarizeReading(draws: DrawnCard[], locale:Locale='en'): string {
  if (draws.length !== 5) return '';
  const majorCount = draws.filter(d => cardById.get(d.id)!.arcana === 'major').length;
  const opening = majorCount >= 3 ? local(locale,'Several Major Arcana cards give this reading the shape of a larger transition.','多张大阿尔卡那牌，为这次解读勾勒出一个较大的人生转变。') : majorCount === 0 ? local(locale,'This reading speaks through everyday choices, relationships, and habits.','这次解读聚焦于日常的选择、关系与习惯。') : local(locale,'A larger life theme is unfolding through practical, everyday experiences.','一个较大的人生主题，正在日常的具体经历中展开。');
  return local(locale,
    `${opening} ${cardLabel(draws[0],locale)} puts ${meaningFor(draws[0],locale).keywords[0].toLowerCase()} at the center. The challenge, ${cardLabel(draws[1],locale)}, asks how you handle ${meaningFor(draws[1],locale).keywords[0].toLowerCase()}. Underneath, ${cardLabel(draws[2],locale)} points to ${meaningFor(draws[2],locale).keywords[0].toLowerCase()} as an influence worth examining. Your guidance, ${cardLabel(draws[3],locale)}, suggests: ${meaningFor(draws[3],locale).advice} In light of this guidance, ${cardLabel(draws[4],locale)} offers ${meaningFor(draws[4],locale).keywords[0].toLowerCase()} as a possible direction, not a fixed destination.`,
    `${opening}${cardLabel(draws[0],locale)}将${meaningFor(draws[0],locale).keywords[0]}放在当下的中心。作为挑战，${cardLabel(draws[1],locale)}邀请你审视如何应对${meaningFor(draws[1],locale).keywords[0]}。在深层，${cardLabel(draws[2],locale)}提示你留意${meaningFor(draws[2],locale).keywords[0]}的影响。作为指引，${cardLabel(draws[3],locale)}建议：${meaningFor(draws[3],locale).advice}结合这份指引，${cardLabel(draws[4],locale)}带来的${meaningFor(draws[4],locale).keywords[0]}，是值得思考的一种可能，而非注定的终点。`);
}

export function interpretPosition(draw: DrawnCard, index: number, locale: Locale = 'en') {
  const meaning = meaningFor(draw, locale);
  const keyword = meaning.keywords[0];
  const explanations = [
    local(locale, `In the present position, ${keyword.toLowerCase()} describes a pattern to notice in your current experience. Look for a concrete example before deciding how well it fits.`, `在当下的位置，「${keyword}」描述了值得留意的现状模式。先寻找一个具体例子，再判断它是否贴合你的经历。`),
    local(locale, `As a challenge, ${keyword.toLowerCase()} may be hard to access, overused, or asking for a different response. This position describes something to work with, rather than labeling the card as bad.`, `作为挑战，「${keyword}」可能难以发挥、被过度使用，或需要不同的回应。这个位置描述的是需要处理的课题，并不代表这张牌不好。`),
    local(locale, `As an underlying influence, ${keyword.toLowerCase()} invites you to examine a habit, assumption, or unmet need beneath the visible situation. Check it against your own experience.`, `作为潜在影响，「${keyword}」邀请你审视现象背后的习惯、假设或未被照顾的需要，并用自己的经历来核对。`),
    local(locale, `In the advice position, ${keyword.toLowerCase()} highlights what your next response needs to address. Use this card’s practical guidance as a small experiment, adjusting it to what is within your control.`, `在建议的位置，「${keyword}」提示下一步回应需要关注什么。把这张牌的实际建议当作一个小实验，按自己能够掌握的范围调整。`),
    local(locale, `As a possible outcome, ${keyword.toLowerCase()} is a direction to explore alongside the guidance card. Your choices and changing circumstances can reshape it.`, `作为可能的发展，「${keyword}」是可以结合指引牌来探索的方向。你的选择与环境变化，都可能改变它。`),
  ];
  if (!explanations[index]) throw new Error('Unknown spread position');
  return {
    draw,
    position: getPositions(locale)[index],
    meaning,
    explanation: explanations[index],
    orientation: draw.reversed
      ? local(locale, 'Read through this card’s reversed meaning: its energy may be inward, blocked, excessive, or in the process of release. Its specific meaning matters more than a blanket negative interpretation.', '按这张牌的逆位含义来理解：能量可能转向内在、受阻、过度，或正在释放。它的具体含义比一概负面的判断更重要。')
      : local(locale, 'Read through this card’s upright meaning, then use its position to understand the role it plays in this spread.', '先理解这张牌的正位含义，再结合它在牌阵中的位置，理解它扮演的角色。'),
  };
}

export function buildReading(draws: DrawnCard[], question = '', locale: Locale = 'en') {
  if (draws.length !== 5) throw new Error('A reading requires five cards');
  const context = topicContext(question, locale);
  return {
    context,
    summary: `${summarizeReading(draws, locale)} ${context.lens}`,
    cards: draws.map((draw, index) => {
      const card = interpretPosition(draw, index, locale);
      return {
        ...card,
        application: local(locale,
          `Through the lens of ${context.name.toLowerCase()}, consider ${card.meaning.keywords[0].toLowerCase()}: ${card.position.prompt} ${context.lens}`,
          `从「${context.name}」的视角思考「${card.meaning.keywords[0]}」：${card.position.prompt}${context.lens}`),
      };
    }),
    connections: connectReading(draws, locale),
    nextStep: meaningFor(draws[3], locale).advice,
    reflection: `${getCard(draws[3].id, locale).name} · ${meaningFor(draws[3], locale).keywords.join(' / ')}: ${context.prompt}`,
  };
}
