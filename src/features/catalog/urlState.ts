import { DEFAULT_FILTER, type FilterState, type Lang, type SortKey } from './types';

/** URL に残す状態。検索結果や開いているアイテムを、リンクで友だちに送れるようにする */
export interface UrlState {
  gameId?: string;
  filter: FilterState;
  lang: Lang;
  itemId?: string;
}

const SORTS: SortKey[] = ['auto', 'rarity', 'name', 'updated'];

const csv = (value: string | null): string[] => (value ? value.split(',').filter(Boolean) : []);

export function parseUrl(search: string): UrlState {
  const p = new URLSearchParams(search);
  const sort = p.get('sort') as SortKey | null;
  return {
    gameId: p.get('game') || undefined,
    lang: p.get('lang') === 'en' ? 'en' : 'ja',
    itemId: p.get('item') || undefined,
    filter: {
      q: p.get('q') ?? '',
      rarities: csv(p.get('rarity')),
      categories: csv(p.get('category')),
      tags: csv(p.get('tag')),
      showRemoved: p.get('removed') === '1',
      sort: sort && SORTS.includes(sort) ? sort : DEFAULT_FILTER.sort,
    },
  };
}

/** 先頭の ? 付きで返す。何も残すものがなければ空文字 */
export function toSearch(state: UrlState): string {
  const p = new URLSearchParams();
  const f = state.filter;
  if (state.gameId) p.set('game', state.gameId);
  if (f.q) p.set('q', f.q);
  if (f.rarities.length) p.set('rarity', f.rarities.join(','));
  if (f.categories.length) p.set('category', f.categories.join(','));
  if (f.tags.length) p.set('tag', f.tags.join(','));
  if (f.showRemoved) p.set('removed', '1');
  if (f.sort !== DEFAULT_FILTER.sort) p.set('sort', f.sort);
  if (state.lang !== 'ja') p.set('lang', state.lang);
  if (state.itemId) p.set('item', state.itemId);
  const s = p.toString();
  return s ? `?${s}` : '';
}
