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
    en: ['growth', 'purpose', 'confidence', 'identity', 'habits', 'habit', 'creativity', 'healing', 'self', 'myself'],
    zh: ['成长', '自我', '自信', '人生方向', '习惯', '创造力', '疗愈', '内心', '自己'],
  },
};

export function detectTopic(question: string): ReadingTopic {
  const normalized = question.normalize('NFKC').toLowerCase();
  const words = new Set(normalized.match(/[a-z]+/g) ?? []);
  const matches = Object.entries(vocabulary).map(([topic, terms]) => ({
    topic: topic as Exclude<ReadingTopic, 'general'>,
    // Count each topic once per language to avoid favoring repeated words or
    // overlapping Chinese terms (for example 金钱 and 钱).
    score: Number(terms.en.some(word => words.has(word))) + Number(terms.zh.some(word => normalized.includes(word))),
  })).sort((a, b) => b.score - a.score);
  return matches[0].score > 0 && matches[0].score > matches[1].score ? matches[0].topic : 'general';
}

const copy: Record<ReadingTopic, { name: [string, string]; lens: [string, string]; prompt: [string, string] }> = {
  general: {
    name: ['Your situation', '你的处境'],
    lens: ['Consider where this pattern appears in the situation you have in mind.', '想一想，这个模式如何出现在你正在思考的处境中。'],
    prompt: ['What is one small step within your control, and what would help you notice its effect?', '你能掌握的一小步是什么？怎样观察它带来的变化？'],
  },
  relationships: {
    name: ['Relationships', '情感与关系'],
    lens: ['Apply this to the balance between your needs, shared expectations, and the other person’s freedom to choose.', '把它放在你的需要、双方的期待，以及对方自主选择的空间之间思考。'],
    prompt: ['What honest conversation or clear boundary would make this connection healthier for everyone involved?', '什么坦诚的对话或清晰的界限，能让这段关系对双方都更健康？'],
  },
  work: {
    name: ['Work & study', '工作与学业'],
    lens: ['Apply this to your responsibilities, the skills you can practice, and the next milestone you can realistically influence.', '把它放在你的责任、可以练习的技能，以及能够实际影响的下一个目标中思考。'],
    prompt: ['Which practical step would test your direction at work or in your studies before a larger commitment?', '在做出更大承诺前，哪一步实际行动能检验你的工作或学业方向？'],
  },
  finances: {
    name: ['Money & resources', '金钱与资源'],
    lens: ['Apply this to your everyday resource choices, distinguishing what you know from what you still need to check.', '把它放在日常资源安排中，分清已经知道的事实与仍需核实的信息。'],
    prompt: ['What concrete fact about your resources or commitments would help you make the next decision?', '关于资源或责任，核实哪一项具体事实能帮助你做出下一步决定？'],
  },
  growth: {
    name: ['Personal growth', '个人成长'],
    lens: ['Apply this to your habits, inner expectations, and the kind of person you want your next choice to support.', '把它放在你的习惯、内在期待，以及下一次选择所支持的成长方向中思考。'],
    prompt: ['Which small habit would bring your daily actions closer to the values you want to live by?', '哪一个小习惯，能让日常行动更接近你希望实践的价值观？'],
  },
};

export function topicContext(question: string, locale: Locale = 'en') {
  const topic = detectTopic(question);
  const entry = copy[topic];
  return {
    topic,
    name: local(locale, ...entry.name),
    lens: local(locale, ...entry.lens),
    prompt: local(locale, ...entry.prompt),
  };
}
