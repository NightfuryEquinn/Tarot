import { local, type Locale } from './locale';

export type ReadingTopic = 'general' | 'relationships' | 'work' | 'finances' | 'growth';

// Match whole English words and explicit Chinese phrases, regardless of UI language.
// A tie is intentionally general: a short prompt is not enough to infer intent.
const vocabulary: Record<Exclude<ReadingTopic, 'general'>, { en: string[]; zh: string[] }> = {
  relationships: {
    en: ['love', 'relationship', 'relationships', 'partner', 'dating', 'marriage', 'friendship', 'friends', 'family', 'breakup', 'romance'],
    zh: ['爱情', '恋爱', '感情', '伴侣', '婚姻', '结婚', '分手', '朋友', '友谊', '家人', '家庭', '人际'],
  },
  work: {
    en: ['career', 'job', 'jobs', 'work', 'workplace', 'promotion', 'business', 'study', 'studies', 'school', 'exam', 'exams', 'university'],
    zh: ['事业', '职业', '工作', '职场', '升职', '创业', '生意', '学业', '学习', '考试', '大学'],
  },
  finances: {
    en: ['money', 'finance', 'finances', 'financial', 'budget', 'debt', 'savings', 'investment', 'investments', 'income', 'rent'],
    zh: ['金钱', '财务', '财富', '理财', '预算', '债务', '存款', '投资', '收入', '房租', '钱'],
  },
  growth: {
    en: ['growth', 'purpose', 'confidence', 'identity', 'habits', 'habit', 'creativity', 'healing', 'self-esteem', 'self-discovery'],
    zh: ['成长', '自我', '自信', '人生方向', '习惯', '创造力', '疗愈', '内心', '自己'],
  },
};

export function detectTopic(question: string): ReadingTopic {
  const normalized = question.normalize('NFKC').toLowerCase();
  const words = new Set(normalized.match(/[a-z]+/g) ?? []);
  const phrases: Record<string, string[]> = {
    relationships: ['get back together', 'meet someone', 'fall in love', '复合', '脱单', '相处'],
    work: ['change jobs', 'job interview', 'career change', '找工作', '面试', '转行', '升学'],
    finances: ['make ends meet', 'pay off', 'save money', '收支', '还款', '储蓄'],
    growth: ['self esteem', 'self discovery', 'find my purpose', '认识自己', '自我接纳'],
  };
  const matches = Object.entries(vocabulary).map(([topic, terms]) => ({
    topic: topic as Exclude<ReadingTopic, 'general'>,
    // Count each topic once per language to avoid favoring repeated words or
    // overlapping Chinese terms (for example 金钱 and 钱).
    score: Math.max(Number(terms.en.some(word => words.has(word))), Number(terms.zh.some(word => normalized.includes(word))))
      + (phrases[topic].some(phrase => /[a-z]/.test(phrase) ? (` ${normalized.replace(/[^a-z]+/g, ' ')} `).includes(` ${phrase} `) : normalized.includes(phrase)) ? 2 : 0),
  })).sort((a, b) => b.score - a.score);
  return matches[0].score > 0 && matches[0].score > matches[1].score ? matches[0].topic : 'general';
}

const copy: Record<ReadingTopic, { name: [string, string]; lens: [string, string]; prompt: [string, string] }> = {
  general: {
    name: ['Your situation', '你的处境'],
    lens: ['Think about how this pattern shows up in your everyday life right now.', '想一想，这种状态在你眼前的日常生活中是如何体现的。'],
    prompt: ['What is one small step within your control today, and how will you tell if it helps?', '今天有哪些你能掌控的一小步？怎样看出它是否有帮助？'],
  },
  relationships: {
    name: ['Relationships', '情感与关系'],
    lens: ['Look at how this affects your needs, your shared expectations, and the space each person has to choose freely.', '看看这如何影响你的需要、双方的期待，以及彼此自主选择的空间。'],
    prompt: ['What honest conversation or clear boundary would help this relationship feel healthier for everyone involved?', '怎样的坦诚沟通或清晰界限，能让这段关系对双方都更健康？'],
  },
  work: {
    name: ['Work & study', '工作与学业'],
    lens: ['Connect this to your daily tasks, the skills you can practice, and the next goal you can realistically shape.', '把它联系到你的日常任务、可以练习的技能，以及下一个切实可控的目标。'],
    prompt: ['Which practical step can test your direction at work or in your studies before you make a bigger commitment?', '在做出更大投入前，哪一步实在的行动能先帮你检验工作或学业方向？'],
  },
  finances: {
    name: ['Money & resources', '金钱与资源'],
    lens: ['Connect this to how you manage your money, time, and energy, separating clear facts from guesswork.', '把它放在日常的金钱、时间与精力安排中，分清确定的事实与仍需核实的信息。'],
    prompt: ['What concrete number, cost, or detail do you need to check before making your next financial decision?', '在做下一个财务决定前，先核对哪一项具体的数字、开销或细节最有帮助？'],
  },
  growth: {
    name: ['Personal growth', '个人成长'],
    lens: ['Connect this to your daily habits, how you treat yourself, and the kind of person you want your next choice to support.', '把它联系到你的日常习惯、对待自己的方式，以及下一次选择所支持的成长方向。'],
    prompt: ['Which small daily habit would bring your actions closer to the values you want to live by?', '哪一个简单的日常习惯，能让你的行动更接近自己真正看重的生活方式？'],
  },
};

export function topicContext(question: string, locale: Locale = 'en', override?: ReadingTopic | 'auto') {
  const topic = override && override !== 'auto' ? override : detectTopic(question);
  const entry = copy[topic];
  return {
    topic,
    name: local(locale, ...entry.name),
    lens: local(locale, ...entry.lens),
    prompt: local(locale, ...entry.prompt),
  };
}
