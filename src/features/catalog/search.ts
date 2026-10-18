import { primaryName } from './text';
import type { FilterState, Game, Item, Lang } from './types';

// NFKC のあとに消すので、全角の記号は半角の形で書いておけば足りる
const PUNCTUATION = /[\s\-_・.,'’"“”!?、。「」『』()]/g;

/**
 * 検索用にゆらぎを消す。
 * 全角/半角、大文字/小文字、ひらがな/カタカナ、空白や記号の違いを無視できる。
 */
export function fold(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(PUNCTUATION, '');
}

/** 空白区切りで複数語に分ける。すべての語に当てはまるアイテムだけが残る(AND検索) */
export function parseTerms(query: string): string[] {
  return query
    .normalize('NFKC')
    .split(/\s+/)
    .map(fold)
    .filter(Boolean);
}

export interface IndexEntry {
  item: Item;
  names: string[];
  aliases: string[];
  /** タグ・レア度・カテゴリの表示名 */
  meta: string[];
  /** 入手方法・説明文 */
  text: string[];
}

const nonEmpty = (v: string | undefined): v is string => typeof v === 'string' && v !== '';

export function buildIndex(items: Item[], game: Game): IndexEntry[] {
  const rarityLabels = new Map(game.rarities.map((r) => [r.id, r.label]));
  const categoryLabels = new Map(game.categories.map((c) => [c.id, c.label]));

  return items.map((item) => {
    const rarity = rarityLabels.get(item.rarity);
    const category = categoryLabels.get(item.category);
    return {
      item,
      names: [item.name.ja, item.name.en].filter(nonEmpty).map(fold),
      aliases: (item.aliases ?? []).map(fold),
      meta: [
        ...(item.tags ?? []),
        rarity?.ja,
        rarity?.en,
        category?.ja,
        category?.en,
      ]
        .filter(nonEmpty)
        .map(fold),
      text: [item.obtain?.ja, item.obtain?.en, item.description?.ja, item.description?.en]
        .filter(nonEmpty)
        .map(fold),
    };
  });
}

function scoreField(values: string[], term: string, exact: number, prefix: number, contains: number): number {
  let best = 0;
  for (const v of values) {
    if (v === term) best = Math.max(best, exact);
    else if (v.startsWith(term)) best = Math.max(best, prefix);
    else if (v.includes(term)) best = Math.max(best, contains);
  }
  return best;
}

/** 0 なら一致しない。名前 > 別名 > タグなど > 入手方法・説明 の順に高くなる */
export function scoreEntry(entry: IndexEntry, terms: string[]): number {
  let total = 0;
  for (const term of terms) {
    const s = Math.max(
      scoreField(entry.names, term, 100, 80, 60),
      scoreField(entry.aliases, term, 50, 40, 30),
      scoreField(entry.meta, term, 25, 20, 20),
      scoreField(entry.text, term, 10, 10, 10),
    );
    if (s === 0) return 0;
    total += s;
  }
  return total;
}

type Facet = 'rarity' | 'category';

function matches(
  entry: IndexEntry,
  filter: FilterState,
  terms: string[],
  skip?: Facet,
): number | null {
  const item = entry.item;
  if (!filter.showRemoved && item.status === 'removed') return null;
  if (skip !== 'rarity' && filter.rarities.length > 0 && !filter.rarities.includes(item.rarity)) return null;
  if (skip !== 'category' && filter.categories.length > 0 && !filter.categories.includes(item.category)) return null;
  if (filter.tags.length > 0 && !filter.tags.every((t) => item.tags?.includes(t))) return null;
  if (terms.length === 0) return 0;
  const score = scoreEntry(entry, terms);
  return score > 0 ? score : null;
}

export function queryItems(index: IndexEntry[], game: Game, filter: FilterState, lang: Lang): Item[] {
  const terms = parseTerms(filter.q);
  const rank = new Map(game.rarities.map((r, i) => [r.id, i]));
  const rankOf = (item: Item) => rank.get(item.rarity) ?? -1;
  const byName = (a: Item, b: Item) => primaryName(a, lang).localeCompare(primaryName(b, lang), 'ja');

  const hits: { item: Item; score: number }[] = [];
  for (const entry of index) {
    const score = matches(entry, filter, terms);
    if (score !== null) hits.push({ item: entry.item, score });
  }

  const sort = filter.sort === 'auto' ? (terms.length > 0 ? 'relevance' : 'rarity') : filter.sort;
  hits.sort((a, b) => {
    switch (sort) {
      case 'relevance':
        return b.score - a.score || rankOf(b.item) - rankOf(a.item) || byName(a.item, b.item);
      case 'name':
        return byName(a.item, b.item);
      case 'updated':
        return b.item.updatedAt.localeCompare(a.item.updatedAt) || byName(a.item, b.item);
      default:
        return rankOf(b.item) - rankOf(a.item) || byName(a.item, b.item);
    }
  });
  return hits.map((h) => h.item);
}

export interface FacetCounts {
  rarity: Record<string, number>;
  category: Record<string, number>;
}

/**
 * 絞り込みチップに出す件数。
 * 「そのチップを押したら何件になるか」が分かるよう、自分自身の絞り込みだけ外して数える。
 */
export function facetCounts(index: IndexEntry[], filter: FilterState): FacetCounts {
  const terms = parseTerms(filter.q);
  const counts: FacetCounts = { rarity: {}, category: {} };
  for (const entry of index) {
    if (matches(entry, filter, terms, 'rarity') !== null) {
      counts.rarity[entry.item.rarity] = (counts.rarity[entry.item.rarity] ?? 0) + 1;
    }
    if (matches(entry, filter, terms, 'category') !== null) {
      counts.category[entry.item.category] = (counts.category[entry.item.category] ?? 0) + 1;
    }
  }
  return counts;
}
