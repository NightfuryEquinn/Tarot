import { local, themeName, type Locale } from './locale';
import type { Meaning } from '../data/cards';
import type { ReadingTopic } from './topics';
import type { PositionRole } from './spreads';

/** Authored applications use canonical themes, never translated keyword matching. */
export function applyMeaning(meaning: Meaning, role: PositionRole, topic: ReadingTopic, locale: Locale) {
  const active = meaning.themes.some(t => ['action', 'courage', 'creativity', 'purpose', 'independence'].includes(t));
  const boundaries = meaning.themes.some(t => ['boundaries', 'conflict', 'responsibility', 'balance', 'stability'].includes(t));
  const changing = meaning.themes.some(t => ['change', 'release', 'uncertainty', 'recovery'].includes(t));
  const connecting = meaning.themes.some(t => ['connection', 'generosity', 'trust', 'hope'].includes(t));

  const applications: Record<ReadingTopic, [string, string]> = {
    general: active
      ? ['Try one small, doable step and see what changes before committing more.', '先迈出一小步力所能及的行动，看看效果，再决定是否继续投入。']
      : boundaries
        ? ['Separate what is yours to handle from obligations that belong to others.', '分清哪些事属于自己负责，哪些本应由他人承担。']
        : changing
          ? ['Notice what is shifting and keep one steady daily routine while you adjust.', '看清正在变化的部分，在适应期里保留一项让你安心的日常习惯。']
          : connecting
            ? ['Stay open to support around you and share what you need in plain words.', '对身边的支持保持开放，用平实的话说出自己的需要。']
            : ['Give yourself a moment to notice the pattern before deciding how to respond.', '先给自己一点时间看清眼前的规律，再决定怎样回应。'],
    relationships: boundaries
      ? ['State your need or boundary clearly, then listen to the other person without guessing their motives.', '清楚表达自己的需要或界限，也认真倾听对方，不急着猜测对方的用意。']
      : active
        ? ['Start one honest conversation or shared activity that shows your care in action.', '通过一次坦诚的对话或共同参与的小事，用行动表达你的心意。']
        : changing
          ? ['Let go of old expectations that no longer fit, and talk about what both of you truly want now.', '放下已经不再适合这段关系的旧期待，聊聊双方现在真正想要什么。']
          : connecting
            ? ['Build trust through small, warm gestures and give each other room to respond naturally.', '通过日常温暖的小举动积累信任，也给彼此自然回应的空间。']
            : ['Watch whether care, trust, and effort go both ways over time instead of judging by a single moment.', '拉长时间看看关心、信任和付出是否双向流动，不必凭某一个瞬间下定论。'],
    work: boundaries
      ? ['Make sure roles, deadlines, and support are clear before taking on extra work.', '在接下更多任务前，先确认清楚职责、期限和能获得的支持。']
      : active
        ? ['Test your idea or skill on a small task where you can quickly see the result.', '在一项能快速看到结果的小任务上，先试试你的想法或能力。']
        : changing
          ? ['Update the part of your routine that is slowing you down while keeping what already works.', '调整工作或学习中拖慢节奏的做法，同时保留已经有效的习惯。']
          : connecting
            ? ['Share credit, ask for practical feedback, and lean on people whose skills complement yours.', '主动交流想法、寻求实在的反馈，并与能力互补的人合作。']
            : ['Check recent feedback and your own energy before deciding whether to push ahead or change course.', '先回顾近期的反馈和自己的精力状态，再决定是继续坚持还是调整方向。'],
    finances: boundaries
      ? ['List what you already owe or spend, and check what you can comfortably afford before adding more.', '先列出现有的开销与责任，确认自己能稳妥承受后，再考虑新的支出。']
      : active
        ? ['Take one simple step to see your numbers clearly, such as comparing real income and spending.', '先做一件能看清账目的小事，比如核对一下实际的收入和支出。']
        : changing
          ? ['Leave a buffer for unexpected costs instead of assuming everything will stay the same.', '为意料之外的开销留出余地，不要假设所有情况都会一成不变。']
          : connecting
            ? ['Keep money agreements fair and clear so generosity never turns into hidden pressure.', '让涉及金钱或资源的约定公开透明，别让好意变成隐形的压力。']
            : ['Check the real numbers and terms first, and let clear facts guide any money decision.', '先核实清楚数字和条款，用确凿的事实来指导每一次财务决定。'],
    growth: boundaries
      ? ['Notice where high standards turn into harsh self-pressure, and set a kinder, realistic goal.', '留意高标准何时变成了对自己的苛责，换成一个温和且能做到的目标。']
      : active
        ? ['Practice one small daily habit that matches your values and see how it feels in real life.', '在日常里练习一个符合自己心意的小习惯，感受它给生活带来的变化。']
        : changing
          ? ['Allow yourself to outgrow an old label; trying something new does not lock in your whole future.', '允许自己走出过去的标签；一次新的尝试并不需要决定一辈子。']
          : connecting
            ? ['Treat yourself with the same patience and encouragement you would offer a close friend.', '像对待好朋友那样，给自己多一点耐心、鼓励与接纳。']
            : ['Make room for quiet rest and reflection, and pay attention to what helps you feel grounded.', '给休息和独处留出空间，留意哪些事能让自己真正踏实下来。'],
  };

  const roleFrames: Record<PositionRole, [string, string]> = {
    present: ['Focus on what you can directly see and work with right now.', '把注意力放在眼前看得见、摸得着的实际上。'],
    challenge: ['Notice whether this quality is missing, pushed too hard, or getting in your way.', '留意这种状态是目前缺乏的、用力过猛的，还是正在造成阻碍。'],
    root: ['Look beneath the surface for the habit or deeper need shaping the situation.', '往深处看一看，找出背后正在影响局面的习惯或未满足的需要。'],
    advice: ['Keep your next step simple and within what you can directly control.', '把下一步保持在简单、自己能直接掌握的范围内。'],
    future: ['Treat this as a direction to prepare for; your choices can still change the outcome.', '把这看作一种可以提前准备的趋势；你的选择依然能够改变走向。'],
    past: ['Use this as a lesson from what already happened rather than dwelling on the past.', '把它当作从过往经历中总结出的经验，用来照亮现在，而不必困在过去。'],
    aims: ['Check whether this goal truly matches what matters most to you now.', '核对一下，这个目标是否真的符合你现在最看重的事。'],
    self: ['You cannot control everything around you, but you can adjust how you show up and respond.', '你无法左右所有外在情况，但可以调整自己面对它的态度与做法。'],
    environment: ['Compare this with what you can actually observe around you instead of guessing what others think.', '结合身边实际看到的情况来理解，不必去猜测别人心里怎么想。'],
    hopes: ['Separate what you wish for or fear from the facts you can actually verify.', '把心里的愿望或担忧，与能够核实的客观事实区分开来。'],
    guide: ['Return to this steady practice throughout the months ahead whenever you need an anchor.', '在接下来的几个月里，每当需要找回重心，都可以回到这个稳定的做法。'],
    month: ['Use this as a helpful focus for the month ahead, knowing your choices shape how it unfolds.', '把它当作这个月的重点提醒提前准备，你的行动依然决定着事情如何展开。'],
  };

  const lens = local(locale, ...applications[topic]);
  const theme = themeName(meaning.themes[0], locale);
  const frame = local(locale, ...roleFrames[role]);
  return local(locale, `A helpful focus here is ${theme}. ${lens} ${frame}`, `这里可以从「${theme}」切入。${lens}${frame}`);
}
