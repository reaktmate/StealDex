import { describe, expect, it } from 'vitest';
import { tierOf } from './rarity';
import { buildIndex, facetCounts, fold, parseTerms, queryItems } from './search';
import { DEFAULT_FILTER, type FilterState, type Game, type Item } from './types';
import { parseUrl, toSearch } from './urlState';

const game: Game = {
  id: 'g',
  name: { ja: 'テスト', en: 'Test' },
  version: '1.0.0',
  updatedAt: '2026-01-01',
  rarities: [
    { id: 'common', label: { ja: 'コモン', en: 'Common' } },
    { id: 'rare', label: { ja: 'レア', en: 'Rare' } },
    { id: 'epic', label: { ja: 'エピック', en: 'Epic' } },
    { id: 'legendary', label: { ja: 'レジェンダリー', en: 'Legendary' } },
  ],
  categories: [
    { id: 'creature', label: { ja: 'クリーチャー', en: 'Creature' } },
    { id: 'tool', label: { ja: 'ツール', en: 'Tool' } },
  ],
};

const mk = (id: string, patch: Partial<Item>): Item => ({
  id,
  game: 'g',
  name: { en: id },
  rarity: 'common',
  category: 'creature',
  status: 'active',
  updatedAt: '2026-01-01',
  ...patch,
});

const items: Item[] = [
  mk('slime', { name: { ja: 'スライム', en: 'Slime' }, rarity: 'common', tags: ['starter', 'shop'] }),
  mk('dragon', {
    name: { ja: 'イベントドラゴン', en: 'Event Dragon' },
    rarity: 'legendary',
    aliases: ['イベドラ'],
    tags: ['boss-drop'],
    updatedAt: '2026-03-01',
  }),
  mk('pickaxe', {
    name: { ja: '金のツルハシ', en: 'Golden Pickaxe' },
    rarity: 'epic',
    category: 'tool',
    obtain: { ja: 'ボスからドロップ' },
  }),
  mk('lantern', {
    name: { ja: '古いランタン', en: 'Old Lantern' },
    rarity: 'epic',
    category: 'tool',
    status: 'removed',
  }),
  mk('shell', { name: { ja: 'ドラの貝', en: 'Dora Shell' }, rarity: 'rare', aliases: ['ドラゴンの貝殻'] }),
];

const index = buildIndex(items, game);
const run = (patch: Partial<FilterState>) =>
  queryItems(index, game, { ...DEFAULT_FILTER, ...patch }, 'ja').map((i) => i.id);

describe('fold', () => {
  it('カタカナとひらがなを同じに扱う', () => {
    expect(fold('スライム')).toBe(fold('すらいむ'));
  });
  it('全角・半角・大文字小文字・記号の違いを無視する', () => {
    expect(fold('ＡＢＣ')).toBe('abc');
    expect(fold('Boss-Drop')).toBe('bossdrop');
    expect(fold('ｽﾗｲﾑ')).toBe('すらいむ');
  });
});

describe('parseTerms', () => {
  it('全角スペースでも語を分ける', () => {
    expect(parseTerms('スライム　ドラゴン  x')).toEqual(['すらいむ', 'どらごん', 'x']);
  });
});

describe('queryItems', () => {
  it('ひらがなで入力してもカタカナの名前が見つかる', () => {
    expect(run({ q: 'すらいむ' })).toEqual(['slime']);
  });
  it('別名で見つかる', () => {
    expect(run({ q: 'イベドラ' })).toEqual(['dragon']);
  });
  it('タグを空白区切りで探せる', () => {
    expect(run({ q: 'boss drop' })).toEqual(['dragon']);
  });
  it('入手方法の文章からも探せる', () => {
    expect(run({ q: 'ボス' })).toEqual(['pickaxe']);
  });
  it('複数語はすべてに当てはまるものだけ残す', () => {
    expect(run({ q: 'スライム ドラゴン' })).toEqual([]);
  });
  it('レア度の表示名でも探せる', () => {
    expect(run({ q: 'レジェンダリー' })).toEqual(['dragon']);
  });
  it('入手不可は、指定しない限り出さない', () => {
    expect(run({})).not.toContain('lantern');
    expect(run({ showRemoved: true })).toContain('lantern');
  });
  it('レア度とカテゴリで絞り込める', () => {
    expect(run({ rarities: ['epic'] })).toEqual(['pickaxe']);
    expect(run({ rarities: ['epic'], showRemoved: true }).sort()).toEqual(['lantern', 'pickaxe']);
    expect(run({ categories: ['tool'] })).toEqual(['pickaxe']);
  });
  it('タグで絞り込める', () => {
    expect(run({ tags: ['starter'] })).toEqual(['slime']);
  });
  it('おすすめ順: 検索語がなければレア度が高い順', () => {
    expect(run({})).toEqual(['dragon', 'pickaxe', 'shell', 'slime']);
  });
  it('おすすめ順: 検索語があれば、名前の一致が別名の一致より上', () => {
    // 「ドラ」は dragon の名前(前方一致)と shell の名前(前方一致)、shell の別名にも当たる
    // 「どらご」は dragon の名前、shell の別名にだけ当たる
    expect(run({ q: 'どらご' })).toEqual(['dragon', 'shell']);
  });
  it('名前順・更新順', () => {
    expect(run({ sort: 'updated' })[0]).toBe('dragon');
    expect(run({ sort: 'name' })).toHaveLength(4);
  });
});

describe('facetCounts', () => {
  it('自分自身の絞り込みは外して数える', () => {
    const f = { ...DEFAULT_FILTER, rarities: ['epic'] };
    const counts = facetCounts(index, f);
    // レア度の件数は「epic を選んでいる」ことを無視して数える
    expect(counts.rarity).toEqual({ common: 1, rare: 1, epic: 1, legendary: 1 });
    // カテゴリの件数は epic に絞られた中で数える
    expect(counts.category).toEqual({ tool: 1 });
  });
});

describe('tierOf', () => {
  it('一番低いものは 0、一番高いものは 5', () => {
    expect([0, 1, 2, 3].map((i) => tierOf(i, 4))).toEqual([0, 2, 3, 5]);
    expect([0, 1].map((i) => tierOf(i, 2))).toEqual([0, 5]);
    expect([0, 1, 2, 3, 4, 5].map((i) => tierOf(i, 6))).toEqual([0, 1, 2, 3, 4, 5]);
  });
  it('レア度が1つだけ、または定義にないときは 0', () => {
    expect(tierOf(0, 1)).toBe(0);
    expect(tierOf(-1, 4)).toBe(0);
  });
});

describe('URL との往復', () => {
  it('状態を URL にして読み戻すと同じになる', () => {
    const state = {
      gameId: 'g',
      lang: 'en' as const,
      itemId: 'slime',
      filter: {
        q: 'スライム 金',
        rarities: ['rare', 'epic'],
        categories: ['tool'],
        tags: ['boss-drop'],
        showRemoved: true,
        sort: 'name' as const,
      },
    };
    expect(parseUrl(toSearch(state))).toEqual(state);
  });
  it('初期状態では何も付けない', () => {
    expect(toSearch({ gameId: undefined, lang: 'ja', filter: DEFAULT_FILTER })).toBe('');
  });
  it('不正な並び順は初期値に戻す', () => {
    expect(parseUrl('?sort=nonsense').filter.sort).toBe('auto');
  });
});
