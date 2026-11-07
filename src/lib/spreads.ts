import { local, type Locale } from './locale';
export type SpreadId = 'five' | 'three' | 'celtic' | 'annual';
export type SpreadContext = { spreadId?: SpreadId; startMonth?: string };
export const spreadIds: SpreadId[] = ['five', 'three', 'celtic', 'annual'];
export const spreadCount = (id: SpreadId = 'five') => ({ five: 5, three: 3, celtic: 10, annual: 13 })[id];
export const currentMonth = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
export const spreadName = (id: SpreadId, locale: Locale) => local(
  locale,
  { five: 'Five-Card Reflection', three: 'Three-Card Spread', celtic: 'Celtic Cross', annual: 'The Next Twelve Months' }[id],
  { five: '五张牌：梳理当下', three: '三张牌：过去、现在与未来', celtic: '凯尔特十字牌阵', annual: '未来十二个月牌阵' }[id],
);
const roles = {
  present: ['Present situation', '当前处境', 'What needs your attention right now?', '此刻最需要你关注的是什么？'],
  challenge: ['Crossing challenge', '阻碍与挑战', 'What is getting in the way or asking you to adjust?', '什么正在带来阻碍，或提醒你做出调整？'],
  root: ['Foundation', '深层原因', 'What deeper habit, feeling, or need is shaping things beneath the surface?', '表面之下，哪种习惯、感受或需要正在影响现状？'],
  advice: ['Advice', '行动建议', 'What practical step can you take right now?', '你现在可以迈出哪一步实际行动？'],
  future: ['Possible future', '可能的发展', 'Where are things heading if you stay on this path?', '如果按目前的趋势走下去，事情可能如何发展？'],
  past: ['Past influences', '过去的影响', 'What happened earlier that still shapes today?', '过去的哪些经历仍在影响现在？'],
  aims: ['Conscious aims', '内心的目标', 'What are you consciously hoping or aiming for?', '你心里真正希望或追求的目标是什么？'],
  self: ['Your approach', '你的应对方式', 'How are you handling this right now, and how could you adjust?', '你目前是如何应对的？可以怎样调整？'],
  environment: ['Environment', '周围环境', 'What people, support, or limits around you are affecting this?', '周围的人、支持或限制正在怎样影响这件事？'],
  hopes: ['Hopes and fears', '希望与担忧', 'What wish or worry is shaping how you see things?', '哪种愿望或担心正在影响你的看法？'],
  guide: ['Overall guide', '全年指引', 'What steady habit or mindset can support you throughout the year?', '什么样的习惯或心态能在这一年里持续支持你？'],
  month: ['Monthly theme', '本月主题', 'What needs your focus and care during this month?', '这个月最需要你关注和照顾的是什么？'],
} as const;
export type PositionRole = keyof typeof roles;
export function spreadPositions(locale: Locale, { spreadId = 'five', startMonth }: SpreadContext = {}) {
  const order: PositionRole[] = spreadId === 'three'
    ? ['past', 'present', 'future']
    : spreadId === 'celtic'
      ? ['present', 'challenge', 'root', 'past', 'aims', 'future', 'self', 'environment', 'hopes', 'future']
      : spreadId === 'annual'
        ? [...Array<PositionRole>(12).fill('month'), 'guide']
        : ['present', 'challenge', 'root', 'advice', 'future'];
  return order.map((role, i) => {
    const [en, zh, ep, zp] = roles[role];
    let label = local(locale, en, zh);
    let prompt = local(locale, ep, zp);
    if (spreadId === 'annual' && i < 12) {
      const [y, m] = (startMonth ?? currentMonth()).split('-').map(Number);
      label = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(y, m - 1 + i, 1));
    }
    if (spreadId === 'celtic' && i === 5) {
      label = local(locale, 'Near future', '近期发展');
      prompt = local(locale, 'What is likely to come up next in the short term?', '接下来短期内可能会出现什么变化？');
    }
    return { id: `${role}-${i}`, role, name: label, label, prompt, context: label };
  });
}
