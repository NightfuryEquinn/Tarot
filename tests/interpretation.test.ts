import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReading, connectReading, getPositions, interpretPosition, meaningFor, type DrawnCard } from '../src/lib/reading';
import { detectTopic, topicContext } from '../src/lib/topics';
import { getCard } from '../src/lib/locale';

const draws: DrawnCard[] = ['major-00', 'cups-10', 'cups-02', 'pentacles-08', 'swords-01'].map(id => ({ id, reversed: false }));

test('topic recognition handles English, Chinese, word boundaries, and ambiguous questions', () => {
  for (const [question, expected] of [
    ['How can I support my partner?', 'relationships'], ['我的感情会如何发展？', 'relationships'],
    ['What next in my career?', 'work'], ['我的学业怎么样？', 'work'],
    ['How should I approach my budget?', 'finances'], ['怎样管理我的财务？', 'finances'],
    ['How can I build confidence?', 'growth'], ['如何改变习惯？', 'growth'],
    ['', 'general'], ['   ', 'general'], ['What comes next?', 'general'],
    ['I am a glove maker', 'general'], ['How do work and family fit together?', 'general'],
    ['工作还是感情更重要？', 'general'],
  ]) assert.equal(detectTopic(question), expected, question);
  assert.equal(topicContext('我的事业', 'en').topic, 'work');
  assert.equal(topicContext('My career', 'zh-CN').topic, 'work');
  assert.equal(detectTopic('ＭＹ ＣＡＲＥＥＲ'), 'work');
});

test('the report explains every position and remains stable across repeat evaluations', () => {
  for (const locale of ['en', 'zh-CN'] as const) {
    const report = buildReading(draws, 'My career', locale);
    assert.deepEqual(report, buildReading(draws, 'My career', locale));
    assert.equal(report.cards.length, 5);
    for (const [index, card] of report.cards.entries()) {
      assert.equal(card.position, getPositions(locale)[index]);
      assert.equal(card.meaning, meaningFor(draws[index], locale));
      assert.ok(report.summary.includes(getCard(draws[index].id, locale).name));
      assert.ok(card.explanation.includes(card.meaning.keywords[0].toLowerCase()));
    }
    assert.equal(new Set(report.cards.map(card => card.explanation)).size, 5);
    assert.ok(report.reflection.includes(getCard(draws[3].id, locale).name));
    assert.equal(report.nextStep, meaningFor(draws[3], locale).advice);
    assert.ok(!JSON.stringify(report).includes('undefined'));
    assert.notEqual(report.summary, buildReading(draws, 'My partner', locale).summary);
    assert.notEqual(report.reflection, buildReading(draws, 'My partner', locale).reflection);
  }
  assert.throws(() => buildReading(draws.slice(0, 4)));
  assert.deepEqual(connectReading(draws.slice(0, 4)), []);
});

test('orientation changes meanings, explanations, advice, and the possible direction without changing cards', () => {
  const reversed = draws.map(draw => ({ ...draw, reversed: true }));
  for (const locale of ['en', 'zh-CN'] as const) {
    const upright = buildReading(draws, '', locale);
    const turned = buildReading(reversed, '', locale);
    assert.notEqual(upright.summary, turned.summary);
    assert.notEqual(upright.nextStep, turned.nextStep);
    assert.notEqual(upright.reflection, turned.reflection);
    for (let i = 0; i < 5; i++) {
      assert.equal(turned.cards[i].draw.id, upright.cards[i].draw.id);
      assert.notEqual(turned.cards[i].explanation, upright.cards[i].explanation);
      assert.notEqual(turned.cards[i].orientation, upright.cards[i].orientation);
    }
  }
  assert.throws(() => interpretPosition(draws[0], 5));
});

test('connections preserve shared themes and tensions across arcana and cover the whole spread', () => {
  for (const locale of ['en', 'zh-CN'] as const) {
    const connections = connectReading(draws, locale);
    const bridge = connections.find(c => c.ids.includes('major-00') && c.ids.includes('cups-10'));
    assert.ok(bridge);
    assert.ok(bridge.relations.includes('resonance'));
    assert.ok(bridge.relations.includes('tension'));
    assert.ok(bridge.relations.includes('bridge'));
    assert.ok(bridge.text.includes(locale === 'en' ? 'change' : '改变'));
    assert.ok(bridge.text.includes(locale === 'en' ? 'stability' : '稳定'));
    assert.equal(new Set(connections.flatMap(c => c.ids)).size, 5);
    assert.equal(new Set(connections.map(c => c.ids.join('/'))).size, 3);
  }
});
