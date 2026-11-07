import { applyMeaning } from './guidance';
import { spreadPositions, spreadCount, currentMonth, spreadIds, type SpreadContext, type SpreadId, type PositionRole } from './spreads';
import { getCard, local, suitNames, themeName, type Locale } from './locale';
import { cards, type Meaning } from '../data/cards';
import { topicContext, type ReadingTopic } from './topics';

export type DrawnCard = { id: string; reversed: boolean };
export type ReadingState = {
  version: 2; spreadId: SpreadId; startMonth?: string; topic?: ReadingTopic | 'auto'; question: string; reversals: boolean;
  deck: DrawnCard[]; selected: number[]; revealed: string[];
};
export const positions = spreadPositions('en');
export const getPositions = (locale: Locale = 'en', context: SpreadContext = {}) => spreadPositions(locale, context);
export const emptyReading: ReadingState = { version: 2, spreadId: 'five', question: '', reversals: true, deck: [], selected: [], revealed: [] };
export const cardById = new Map(cards.map(card => [card.id, card]));
export function meaningFor(draw: DrawnCard, locale: Locale = 'en'): Meaning {
  const card = getCard(draw.id, locale);
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
  | { type: 'topic'; value: ReadingTopic | 'auto' }
  | { type: 'spread'; value: SpreadId }
  | { type: 'reset' };
export function readingReducer(state: ReadingState, action: ReadingAction): ReadingState {
  switch (action.type) {
    case 'topic': return state.deck.length ? state : { ...state, topic: action.value };
    case 'spread': {
      if (state.deck.length) return state;
      const { startMonth: previousMonth, ...rest } = state;
      return { ...rest, spreadId: action.value, ...(action.value === 'annual' ? { startMonth: currentMonth() } : {}) };
    }
    case 'restore': return action.state;
    case 'question': return state.deck.length ? state : { ...state, question: action.value.slice(0, 300) };
    case 'reversals': return state.deck.length ? state : { ...state, reversals: action.value };
    case 'start': return state.selected.length ? state : { ...state, deck: action.deck, selected: [], revealed: [] };
    case 'select':
      if (state.selected.length >= spreadCount(state.spreadId) || !Number.isInteger(action.index) || !state.deck[action.index] || state.selected.includes(action.index)) return state;
      return { ...state, selected: [...state.selected, action.index] };
    case 'reveal':
      if (state.selected.length !== spreadCount(state.spreadId) || !state.selected.some(i => state.deck[i].id === action.id) || state.revealed.includes(action.id)) return state;
      return { ...state, revealed: [...state.revealed, action.id] };
    case 'reset': return { ...emptyReading, reversals: state.reversals };
  }
}
export function restoreReading(raw: string | null): ReadingState | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    if (v.version === 1) { v.version = 2; v.spreadId = 'five'; }
    if (!spreadIds.includes(v.spreadId)) return null;
    if (v.spreadId === 'annual' && (typeof v.startMonth !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(v.startMonth))) return null;
    const count = spreadCount(v.spreadId);
    if (v.topic !== undefined && !['auto', 'general', 'relationships', 'work', 'finances', 'growth'].includes(v.topic)) return null;
    if (v.version !== 2 || typeof v.question !== 'string' || v.question.length > 300 || typeof v.reversals !== 'boolean') return null;
    if (!Array.isArray(v.deck) || ![0, 78].includes(v.deck.length) || !v.deck.every((d: DrawnCard) => d && cardById.has(d.id) && typeof d.reversed === 'boolean' && (v.reversals || !d.reversed)) || new Set(v.deck.map((d: DrawnCard) => d.id)).size !== v.deck.length) return null;
    if (!Array.isArray(v.selected) || v.selected.length > count || new Set(v.selected).size !== v.selected.length || !v.selected.every((i: number) => Number.isInteger(i) && i >= 0 && i < v.deck.length)) return null;
    if (!Array.isArray(v.revealed) || new Set(v.revealed).size !== v.revealed.length || !v.revealed.every((id: string) => v.selected.some((i: number) => v.deck[i].id === id)) || (v.revealed.length && v.selected.length !== count)) return null;
    return { version: 2, spreadId: v.spreadId, ...(v.startMonth ? { startMonth: v.startMonth } : {}), ...(v.topic ? { topic: v.topic } : {}), question: v.question, reversals: v.reversals, deck: v.deck, selected: v.selected, revealed: v.revealed };
  } catch { return null; }
}

type ConnectionKind = 'bridge' | 'resonance' | 'tension' | 'position';
export type Connection = { ids: [string, string]; title: string; text: string; kind: ConnectionKind; relations: ConnectionKind[]; score: number };
const contrasts: [string, string, string][] = [
  ['action', 'patience', 'Moving forward takes both action and patience. Take one small step where you can, and give the rest time to grow.'],
  ['connection', 'independence', 'Closeness and personal space both matter here. Clear boundaries will help you stay connected without losing yourself.'],
  ['stability', 'change', 'Part of your life wants to change while another part needs steady ground. Keep one reliable routine while you try something new.'],
  ['clarity', 'uncertainty', 'Some facts are clear while others are still unfolding. Act on what you know today without forcing every answer right now.'],
  ['release', 'responsibility', 'Separate what is truly yours to carry from what you can set down. Being responsible does not mean holding everything alone.'],
  ['conflict', 'balance', 'Tension can point to what feels unfair or out of balance. Aim for a fair adjustment rather than trying to win an argument.'],
];
const chineseContrasts = [
  '前进既需要行动，也需要耐心。在能着力处迈出一小步，其余的留给时间慢慢成熟。',
  '亲近与个人空间同样重要。清晰的界限能让你在保持联结的同时，也不迷失自己。',
  '生活的一部分渴望改变，另一部分则需要稳固的依靠。尝试新方向时，保留一个稳定的日常支点。',
  '有些事实已经清楚，另一些仍在慢慢浮现。先按已知的部分行动，不必强求立刻得到所有答案。',
  '分清哪些责任真正属于你，哪些负担可以放下。负责任并不意味着独自扛起所有事。',
  '分歧往往提醒你哪里失去了平衡。先寻找公平的调整方式，而不必执着于争出输赢。',
];
const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
const cardLabel = (draw: DrawnCard, locale: Locale = 'en') => `${getCard(draw.id, locale).name}${draw.reversed ? local(locale, ' reversed', '（逆位）') : ''}`;

export function connectReading(draws: DrawnCard[], locale: Locale = 'en', spread: SpreadContext = {}): Connection[] {
  if (draws.length !== spreadCount(spread.spreadId)) return [];
  const positions = getPositions(locale, spread);
  const label = (draw: DrawnCard) => cardLabel(draw, locale);
  const posName = (i: number) => locale === 'en' && positions[i].role !== 'month' ? positions[i].label.toLowerCase() : positions[i].label;
  const domain = (suit: string) => locale === 'en' ? suitDomains[suit] : chineseSuitDomains[suit];
  const candidates: Connection[] = [];
  for (let i = 0; i < draws.length; i++) for (let j = i + 1; j < draws.length; j++) {
    const a = draws[i], b = draws[j], ca = getCard(a.id, locale), cb = getCard(b.id, locale);
    const ma = meaningFor(a, locale), mb = meaningFor(b, locale);
    const shared = ma.themes.filter(theme => mb.themes.includes(theme));
    const tension = contrasts.find(([x, y]) => (ma.themes.includes(x) && mb.themes.includes(y)) || (ma.themes.includes(y) && mb.themes.includes(x)));
    const bridge = ca.arcana !== cb.arcana;
    const sameSuit = !!ca.suit && ca.suit === cb.suit;
    let title = local(locale, `${positions[i].name} meets ${posName(j)}`, `${positions[i].name}与${positions[j].name}的呼应`);
    let text = local(
      locale,
      `${label(a)} brings ${ma.keywords[0].toLowerCase()} to ${posName(i)}, while ${label(b)} brings ${mb.keywords[0].toLowerCase()} to ${posName(j)}. Read the second card as a response to the first: ${mb.advice}`,
      `${label(a)}为「${positions[i].label}」带来${ma.keywords[0]}，而${label(b)}以${mb.keywords[0]}回应「${positions[j].label}」。把后一张牌看作对前一张的回应：${mb.advice}`,
    );
    let kind: Connection['kind'] = 'position';
    const relations: ConnectionKind[] = [];
    let score = 1 + (j === i + 1 ? 2 : 0) + (spread.spreadId === 'annual' && j === 12 ? 3 : 0);
    if (shared.length) {
      title = local(locale, `${titleCase(shared[0])}, seen twice`, `${themeName(shared[0], locale)}，在两张牌中呼应`);
      text = local(
        locale,
        `${label(a)} and ${label(b)} both point to ${shared[0]}. In ${posName(i)}, it shows up as ${ma.keywords[0].toLowerCase()}; in ${posName(j)}, it appears as ${mb.keywords[0].toLowerCase()}. ${mb.advice}`,
        `${label(a)}与${label(b)}共同指向「${themeName(shared[0], locale)}」。在「${positions[i].label}」中，它体现为${ma.keywords[0]}；在「${positions[j].label}」中，它表现为${mb.keywords[0]}。${mb.advice}`,
      );
      kind = 'resonance'; score += 5 + shared.length;
      relations.push('resonance');
    }
    if (tension) {
      if (!shared.length) title = local(locale, `${titleCase(tension[0])} & ${tension[1]}`, `${themeName(tension[0], locale)}与${themeName(tension[1], locale)}`);
      const aTheme = ma.themes.includes(tension[0]) && mb.themes.includes(tension[1]) ? tension[0] : tension[1];
      const bTheme = aTheme === tension[0] ? tension[1] : tension[0];
      const tensionText = local(
        locale,
        `${label(a)} highlights ${aTheme} in ${posName(i)}, while ${label(b)} highlights ${bTheme} in ${posName(j)}. ${tension[2]}`,
        `${label(a)}在「${positions[i].label}」中强调${themeName(aTheme, locale)}，而${label(b)}在「${positions[j].label}」中强调${themeName(bTheme, locale)}。${chineseContrasts[contrasts.indexOf(tension)]}`,
      );
      text = shared.length ? `${text} ${tensionText}` : tensionText;
      kind = 'tension'; score += 5;
      relations.push('tension');
    }
    if (sameSuit) {
      score += 2;
      text += local(
        locale,
        ` Both belong to the suit of ${titleCase(ca.suit!)}, grounding this connection in ${domain(ca.suit!)}.`,
        ` 两张牌同属${suitNames[ca.suit!]}牌组，让这份联系落在${domain(ca.suit!)}之中。`,
      );
    }
    if (ca.arcana === 'minor' && cb.arcana === 'minor' && ca.number === cb.number) {
      score += 2;
      text += local(
        locale,
        ' Their matching card numbers point to a similar stage of growth across different parts of life.',
        ' 相同的牌面数字也提示：生活的不同方面，正经历相似的成长阶段。',
      );
    }
    if (bridge) {
      const major = ca.arcana === 'major' ? a : b, minor = ca.arcana === 'minor' ? a : b;
      const majorMeaning = meaningFor(major, locale), minorMeaning = meaningFor(minor, locale), minorCard = getCard(minor.id, locale);
      text += local(
        locale,
        ` Major Arcana card ${label(major)} brings the larger life theme of ${majorMeaning.keywords[0].toLowerCase()}, while Minor Arcana card ${label(minor)} brings it into everyday ${domain(minorCard.suit!)} through ${minorMeaning.keywords[0].toLowerCase()}.`,
        ` 大阿尔卡那的${label(major)}点出关于${majorMeaning.keywords[0]}的人生课题；小阿尔卡那的${label(minor)}则通过${minorMeaning.keywords[0]}，把它落实到日常的${domain(minorCard.suit!)}中。`,
      );
      kind = 'bridge'; score += 3;
      relations.push('bridge');
      if (!shared.length && !tension) title = local(locale, 'The larger theme in everyday life', '将整体课题带入日常');
    }
    candidates.push({ ids: [a.id, b.id], title, text, kind, relations: relations.length ? relations : ['position'], score });
  }
  candidates.sort((a, b) => b.score - a.score);
  const bridge = candidates.find(c => c.kind === 'bridge');
  const result: Connection[] = bridge ? [bridge] : [];
  while (result.length < (spread.spreadId === 'annual' ? 6 : spread.spreadId === 'celtic' ? 5 : 3)) {
    const usedIds = new Set(result.flatMap(c => c.ids));
    const usedRelations = new Set(result.flatMap(c => c.relations));
    const value = (c: Connection) => c.score
      + c.ids.filter(id => !usedIds.has(id)).length * 8
      + c.relations.filter(relation => !usedRelations.has(relation)).length * 4;
    const next = candidates.filter(c => !result.includes(c)).sort((a, b) => value(b) - value(a))[0];
    if (!next) break;
    result.push(next);
  }
  return result;
}
export const suitDomains: Record<string, string> = {
  wands: 'creative energy and action',
  cups: 'feelings and relationships',
  swords: 'thoughts, decisions, and communication',
  pentacles: 'work, money, and daily care',
};
const chineseSuitDomains: Record<string, string> = {
  wands: '创造力与实际行动',
  cups: '情感与人际关系',
  swords: '思考、决定与沟通',
  pentacles: '工作、财务与日常照顾',
};

export function summarizeReading(draws: DrawnCard[], locale: Locale = 'en', spread: SpreadContext = {}): string {
  if (draws.length !== spreadCount(spread.spreadId)) return '';
  const pos = getPositions(locale, spread);
  const majorCount = draws.filter(d => cardById.get(d.id)!.arcana === 'major').length;
  const majorThreshold = draws.length === 3 ? 2 : draws.length === 5 ? 3 : draws.length === 10 ? 4 : 5;
  const opening = majorCount >= majorThreshold
    ? local(locale, 'Several Major Arcana cards show that a bigger life chapter is shifting.', '多张大阿尔卡那牌出现，说明你正处在人生阶段的重要转折期。')
    : majorCount === 0
      ? local(locale, 'This reading focuses on everyday choices, relationships, and daily habits.', '这次解读聚焦在日常的选择、人际相处与生活习惯。')
      : local(locale, 'A larger life theme is playing out through your day-to-day experiences.', '一个重要的人生主题，正在你的日常经历与选择中展开。');

  if (spread.spreadId === 'annual') {
    const guide = draws[12];
    return local(
      locale,
      `${opening} Your overall guide for the year is ${cardLabel(guide, locale)}, centering the next twelve months on ${meaningFor(guide, locale).keywords[0].toLowerCase()}. The year opens in ${pos[0].label} with ${cardLabel(draws[0], locale)} (${meaningFor(draws[0], locale).keywords[0].toLowerCase()}), reaches a mid-year turning point in ${pos[6].label} with ${cardLabel(draws[6], locale)} (${meaningFor(draws[6], locale).keywords[0].toLowerCase()}), and wraps up in ${pos[11].label} with ${cardLabel(draws[11], locale)} (${meaningFor(draws[11], locale).keywords[0].toLowerCase()}). Throughout these months, keep this steady practice in mind: ${meaningFor(guide, locale).advice}`,
      `${opening}这一年的全年指引是${cardLabel(guide, locale)}，将「${meaningFor(guide, locale).keywords[0]}」作为未来十二个月的核心主线。旅程从${pos[0].label}的${cardLabel(draws[0], locale)}（${meaningFor(draws[0], locale).keywords[0]}）开启，在年中${pos[6].label}迎来${cardLabel(draws[6], locale)}（${meaningFor(draws[6], locale).keywords[0]}）的转折，并在${pos[11].label}以${cardLabel(draws[11], locale)}（${meaningFor(draws[11], locale).keywords[0]}）收束。在这一年里，不妨把这句话当作日常的支点：${meaningFor(guide, locale).advice}`,
    );
  }
  if (spread.spreadId === 'three') {
    return local(
      locale,
      `${opening} Looking back, ${cardLabel(draws[0], locale)} shows how ${meaningFor(draws[0], locale).keywords[0].toLowerCase()} shaped where you stand today. In the present, ${cardLabel(draws[1], locale)} brings ${meaningFor(draws[1], locale).keywords[0].toLowerCase()} to the center and suggests: ${meaningFor(draws[1], locale).advice} Ahead, ${cardLabel(draws[2], locale)} points toward ${meaningFor(draws[2], locale).keywords[0].toLowerCase()} as a direction you can shape with your next choice.`,
      `${opening}回顾过去，${cardLabel(draws[0], locale)}显示${meaningFor(draws[0], locale).keywords[0]}如何影响了你今天的处境。来到当下，${cardLabel(draws[1], locale)}将${meaningFor(draws[1], locale).keywords[0]}放在中心位置，并建议你：${meaningFor(draws[1], locale).advice}展望未来，${cardLabel(draws[2], locale)}指向${meaningFor(draws[2], locale).keywords[0]}的趋势，而你当下的选择依然可以改变它的走向。`,
    );
  }
  if (spread.spreadId === 'celtic') {
    return local(
      locale,
      `${opening} At the center of the cross, ${cardLabel(draws[0], locale)} highlights ${meaningFor(draws[0], locale).keywords[0].toLowerCase()}, crossed by the challenge of ${cardLabel(draws[1], locale)} (${meaningFor(draws[1], locale).keywords[0].toLowerCase()}). Deeper down, ${cardLabel(draws[2], locale)} (${meaningFor(draws[2], locale).keywords[0].toLowerCase()}) and past influence ${cardLabel(draws[3], locale)} show how this situation took shape, while ${cardLabel(draws[4], locale)} reflects your aim for ${meaningFor(draws[4], locale).keywords[0].toLowerCase()} and ${cardLabel(draws[5], locale)} brings ${meaningFor(draws[5], locale).keywords[0].toLowerCase()} into the near future. Along the staff, your approach in ${cardLabel(draws[6], locale)} meets ${meaningFor(draws[7], locale).keywords[0].toLowerCase()} from ${cardLabel(draws[7], locale)} around you and ${meaningFor(draws[8], locale).keywords[0].toLowerCase()} in ${cardLabel(draws[8], locale)}. Together, they point toward ${cardLabel(draws[9], locale)} and ${meaningFor(draws[9], locale).keywords[0].toLowerCase()} as a path you can actively shape: ${meaningFor(draws[6], locale).advice}`,
      `${opening}在牌阵中心，${cardLabel(draws[0], locale)}点出当下的${meaningFor(draws[0], locale).keywords[0]}，并与代表挑战的${cardLabel(draws[1], locale)}（${meaningFor(draws[1], locale).keywords[0]}）交汇。往深处看，深层原因${cardLabel(draws[2], locale)}（${meaningFor(draws[2], locale).keywords[0]}）与过去的影响${cardLabel(draws[3], locale)}说明了局面的由来；同时，${cardLabel(draws[4], locale)}映照出你对${meaningFor(draws[4], locale).keywords[0]}的目标，而${cardLabel(draws[5], locale)}则把${meaningFor(draws[5], locale).keywords[0]}带入近期发展。在右侧牌列中，代表你应对方式的${cardLabel(draws[6], locale)}，回应着周围环境中的${cardLabel(draws[7], locale)}（${meaningFor(draws[7], locale).keywords[0]}）与希望和担忧中的${cardLabel(draws[8], locale)}（${meaningFor(draws[8], locale).keywords[0]}）。整体而言，牌阵指向${cardLabel(draws[9], locale)}所代表的${meaningFor(draws[9], locale).keywords[0]}，而你可以通过行动去调整方向：${meaningFor(draws[6], locale).advice}`,
    );
  }
  return local(
    locale,
    `${opening} ${cardLabel(draws[0], locale)} puts ${meaningFor(draws[0], locale).keywords[0].toLowerCase()} at the center right now. The challenge, ${cardLabel(draws[1], locale)}, asks how you handle ${meaningFor(draws[1], locale).keywords[0].toLowerCase()}. Underneath, ${cardLabel(draws[2], locale)} points to ${meaningFor(draws[2], locale).keywords[0].toLowerCase()} as a deeper influence worth noticing. Your guidance, ${cardLabel(draws[3], locale)}, suggests: ${meaningFor(draws[3], locale).advice} With this guidance in mind, ${cardLabel(draws[4], locale)} offers ${meaningFor(draws[4], locale).keywords[0].toLowerCase()} as a possible direction, not a fixed outcome.`,
    `${opening}${cardLabel(draws[0], locale)}将${meaningFor(draws[0], locale).keywords[0]}放在当下的中心。作为挑战，${cardLabel(draws[1], locale)}提醒你留意如何应对${meaningFor(draws[1], locale).keywords[0]}。在深层，${cardLabel(draws[2], locale)}指出${meaningFor(draws[2], locale).keywords[0]}是值得关注的潜在原因。作为建议，${cardLabel(draws[3], locale)}提示：${meaningFor(draws[3], locale).advice}结合这份建议，${cardLabel(draws[4], locale)}带来的${meaningFor(draws[4], locale).keywords[0]}是一种可能的发展方向，而非注定的结果。`,
  );
}

export function interpretPosition(draw: DrawnCard, index: number, locale: Locale = 'en', spread: SpreadContext = {}) {
  const meaning = meaningFor(draw, locale);
  const keyword = meaning.keywords[0];
  const position = getPositions(locale, spread)[index];
  if (!position) throw new Error('Unknown spread position');

  const roleExplanations: Record<PositionRole, [string, string]> = {
    present: [
      `In the present position, ${keyword.toLowerCase()} is a key theme in your current situation. Look for one real example in your day-to-day life before deciding what to do next.`,
      `在当前处境的位置，「${keyword}」点出了眼下最值得留意的主题。先在日常生活中找一个具体的例子，再决定下一步怎么做。`,
    ],
    challenge: [
      `As a challenge, ${keyword.toLowerCase()} may be hard to reach, pushed too far, or asking for a different approach. This position shows what to work with rather than labeling the card as bad.`,
      `作为阻碍与挑战，「${keyword}」可能正显得受阻、用力过猛，或需要换一种方式应对。这个位置指出需要调整的课题，并不代表这张牌不好。`,
    ],
    root: [
      `As a deeper influence, ${keyword.toLowerCase()} points to an older habit, belief, or unspoken need beneath the surface. Check how it matches your own experience.`,
      `作为深层原因，「${keyword}」提醒你看看表面之下的旧习惯、想法或尚未满足的需要，并结合自己的真实经历来核对。`,
    ],
    advice: [
      `In the advice position, ${keyword.toLowerCase()} shows what your next step should focus on. Try this card’s practical guidance as a small experiment within your control.`,
      `在行动建议的位置，「${keyword}」点出了下一步最该关注的方向。不妨把这张牌的建议当作一个在可控范围内的小尝试。`,
    ],
    future: spread.spreadId === 'celtic' && index === 5
      ? [
          `In the near future position, ${keyword.toLowerCase()} highlights what is likely to come up soon. Noticing it early helps you meet it with a calm, steady response.`,
          `在近期发展的位置，「${keyword}」提示接下来短期内可能出现的动向。提前留意它，能帮你更从容地应对。`,
        ]
      : [
          `As a possible outcome, ${keyword.toLowerCase()} shows where things are heading if current patterns continue. Your choices and changing circumstances can still reshape it.`,
          `作为可能的发展，「${keyword}」展现了按目前趋势延续下去的方向。你的选择与环境变化，随时可以改变这一走向。`,
        ],
    past: [
      `In the past position, ${keyword.toLowerCase()} points to an earlier experience or habit that helped shape where things stand today.`,
      `在过去的影响位置，「${keyword}」点出了促成今日局面的过往经历或习惯。`,
    ],
    aims: [
      `As your conscious aim, ${keyword.toLowerCase()} reflects what you are hoping to build or protect. Check whether this goal still matches what matters most to you.`,
      `在内心的目标位置，「${keyword}」映照出你希望实现或守护的方向。不妨确认这个目标是否依然符合你真正看重的事。`,
    ],
    self: [
      `In your approach position, ${keyword.toLowerCase()} describes the attitude and habits you are bringing to the situation, and how you might adjust your response.`,
      `在你的应对方式位置，「${keyword}」描述了你目前面对现状的态度与习惯，也提示你可以怎样调整回应。`,
    ],
    environment: [
      `In the environment position, ${keyword.toLowerCase()} points to the mood, support, or real limits coming from the people and conditions around you.`,
      `在周围环境的位置，「${keyword}」提示了身边的人际氛围、外部支持或现实限制带来的影响。`,
    ],
    hopes: [
      `In hopes and fears, ${keyword.toLowerCase()} highlights a strong wish or worry coloring how you see the situation. Separate this feeling from what you can verify.`,
      `在希望与担忧的位置，「${keyword}」点出了正在影响你判断的愿望或顾虑。试着把这份心情与能够核实的事实分开。`,
    ],
    guide: [
      `As your overall guide for the year, ${keyword.toLowerCase()} offers a steady anchor and mindset you can return to throughout the next twelve months.`,
      `作为全年指引，「${keyword}」为你提供了一年里稳定的重心与心态，随时可以在需要时回到这里。`,
    ],
    month: [
      `For ${position.label}, ${keyword.toLowerCase()} sets the main focus to watch for and work with during this month.`,
      `在${position.label}，「${keyword}」是这个月最值得留意和顺势调整的重点。`,
    ],
  };

  const explanation = local(locale, ...roleExplanations[position.role]);
  return {
    draw,
    position,
    meaning,
    explanation,
    orientation: draw.reversed
      ? local(
          locale,
          'Because this card is reversed, its energy may be turned inward, delayed, pushed too far, or ready to let go. Focus on its specific message rather than seeing it as bad luck.',
          '这张牌处于逆位，说明它的力量可能转向内心、暂时受阻、用力过猛，或正在慢慢放下。请看它的具体提醒，而不必当作坏运气。',
        )
      : local(
          locale,
          'This card is upright, so its theme is showing up openly. Read its meaning together with the question of this position.',
          '这张牌处于正位，说明它的主题正在自然展现。请结合当前牌位的问题来理解它的牌义。',
        ),
  };
}

export function buildReading(draws: DrawnCard[], question = '', locale: Locale = 'en', spread: SpreadContext & { topic?: ReadingTopic | 'auto' } = {}) {
  if (draws.length !== spreadCount(spread.spreadId)) throw new Error('Wrong card count for spread');
  const guidance = spread.spreadId === 'three' ? 1 : spread.spreadId === 'celtic' ? 6 : spread.spreadId === 'annual' ? 12 : 3;
  const context = topicContext(question, locale, spread.topic);
  return {
    context,
    summary: `${summarizeReading(draws, locale, spread)} ${context.lens}`,
    cards: draws.map((draw, index) => {
      const card = interpretPosition(draw, index, locale, spread);
      return {
        ...card,
        application: applyMeaning(card.meaning, card.position.role, context.topic, locale),
      };
    }),
    quarters: spread.spreadId === 'annual' ? [0, 3, 6, 9].map(start => {
      const group = draws.slice(start, start + 3);
      const themes = new Map<string, number>();
      group.forEach(d => meaningFor(d, locale).themes.forEach(t => themes.set(t, (themes.get(t) ?? 0) + 1)));
      const repeated = [...themes].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]).map(([t]) => themeName(t, locale));
      return {
        title: `${getPositions(locale, spread)[start].label} – ${getPositions(locale, spread)[start + 2].label}`,
        text: group.map((d, i) => local(
          locale,
          `${getPositions(locale, spread)[start + i].label}: ${cardLabel(d, locale)} (${meaningFor(d, locale).keywords[0].toLowerCase()}). ${meaningFor(d, locale).advice}`,
          `${getPositions(locale, spread)[start + i].label}：${cardLabel(d, locale)}（${meaningFor(d, locale).keywords[0]}）。${meaningFor(d, locale).advice}`,
        )).join(' '),
        themes: repeated,
      };
    }) : [],
    connections: connectReading(draws, locale, spread),
    nextStep: meaningFor(draws[guidance], locale).advice,
    reflection: `${getCard(draws[guidance].id, locale).name} · ${meaningFor(draws[guidance], locale).keywords.join(' / ')}: ${context.prompt}`,
  };
}
