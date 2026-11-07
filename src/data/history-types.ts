export type Story = {
  teaser: string;
  origin: string[];
  evolution: string[];
  symbols: { name: string; text: string }[];
  today: string[];
  detail: string;
  sources: string[];
};
export type BilingualStory = { en: Story; 'zh-CN': Story };
export type HistorySummary = { id: string; en: string; 'zh-CN': string };
