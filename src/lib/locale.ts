import { cards, type TarotCard } from '../data/cards';
import { chineseCardCopy } from '../data/cards.zh-CN';

export type Locale = 'en' | 'zh-CN';
export const localizedCards: Record<Locale, TarotCard[]> = {
  en: cards,
  'zh-CN': cards.map(card => {
    const copy = chineseCardCopy[card.id];
    if (!copy) throw new Error(`Missing Chinese card: ${card.id}`);
    return { ...card, name: copy.name, upright: { ...card.upright, ...copy.upright }, reversed: { ...card.reversed, ...copy.reversed } };
  }),
};
const maps = { en: new Map(localizedCards.en.map(c => [c.id, c])), 'zh-CN': new Map(localizedCards['zh-CN'].map(c => [c.id, c])) };
export const getCard = (id: string, locale: Locale = 'en') => maps[locale].get(id)!;
export const themeLabels: Record<string,string> = {
  action:'行动',balance:'平衡',boundaries:'界限',change:'改变',clarity:'清晰',conflict:'冲突',connection:'联结',courage:'勇气',creativity:'创造力',generosity:'慷慨',hope:'希望',independence:'独立',intuition:'直觉',learning:'学习',patience:'耐心',purpose:'方向',recovery:'恢复',reflection:'反思',release:'放下',responsibility:'责任',stability:'稳定',trust:'信任',uncertainty:'不确定',
};
export const themeName = (theme:string, locale:Locale) => locale==='en'?theme:themeLabels[theme]??theme;
export const suitNames: Record<string,string> = {wands:'权杖',cups:'圣杯',swords:'宝剑',pentacles:'星币'};
export const local = (locale:Locale,en:string,zh:string) => locale==='zh-CN'?zh:en;
