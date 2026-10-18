import type { ItemStatus, Lang, SortKey } from './types';

export interface Strings {
  gameLabel: string;
  totalItems: (n: number) => string;
  dataVersion: (version: string, date: string) => string;
  searchLabel: string;
  searchPlaceholder: string;
  searchClear: string;
  filters: string;
  rarity: string;
  category: string;
  tag: string;
  removeTag: (tag: string) => string;
  showRemoved: (n: number) => string;
  sort: string;
  sortOptions: Record<SortKey, string>;
  resultCount: (n: number) => string;
  clearFilters: string;
  emptyTitle: string;
  emptyBody: string;
  emptySuggest: string;
  suggestItem: string;
  status: Record<ItemStatus, string>;
  detail: {
    obtain: string;
    obtainEmpty: string;
    description: string;
    aliases: string;
    tags: string;
    category: string;
    updated: (date: string) => string;
    added: (version: string) => string;
    sources: string;
  };
  improve: string;
  copyLink: string;
  copied: string;
  close: string;
  otherLang: string;
  noGames: string;
  footerNotice: string;
  footerContribute: string;
}

const ja: Strings = {
  gameLabel: 'ゲーム',
  totalItems: (n) => `全${n}件のアイテム`,
  dataVersion: (v, d) => `データ v${v}(${d} 更新)`,
  searchLabel: 'アイテムを検索',
  searchPlaceholder: '名前・別名・入手方法で探す',
  searchClear: '入力を消す',
  filters: '絞り込み',
  rarity: 'レア度',
  category: 'カテゴリ',
  tag: 'タグ',
  removeTag: (tag) => `タグ「${tag}」の絞り込みを外す`,
  showRemoved: (n) => `入手不可も表示(${n}件)`,
  sort: '並び順',
  sortOptions: {
    auto: 'おすすめ',
    rarity: 'レア度が高い順',
    name: '名前順',
    updated: '更新が新しい順',
  },
  resultCount: (n) => `${n}件`,
  clearFilters: '絞り込みを解除',
  emptyTitle: '見つかりませんでした',
  emptyBody: '別の言葉で試すか、絞り込みを解除してください。',
  emptySuggest: '載っていないアイテムは、登録を提案できます。',
  suggestItem: 'このアイテムの登録を提案する',
  status: { active: '', limited: '期間限定', removed: '入手不可' },
  detail: {
    obtain: '入手方法',
    obtainEmpty: '入手方法はまだ登録されていません。知っていたら教えてください。',
    description: '説明',
    aliases: '別名',
    tags: 'タグ(押すと同じタグで絞り込み)',
    category: 'カテゴリ',
    updated: (d) => `${d} 更新`,
    added: (v) => `v${v} で追加`,
    sources: '参考リンク',
  },
  improve: '情報を直す・追加する',
  copyLink: 'リンクをコピー',
  copied: 'コピーしました',
  close: '閉じる',
  otherLang: 'English',
  noGames: 'ゲームのデータがありません。data/games に JSON を追加してください。',
  footerNotice:
    'StealDex は非公式のファンプロジェクトです。Roblox Corporation や各ゲームの開発者とは関係ありません。',
  footerContribute: 'データは誰でも直せます',
};

const en: Strings = {
  gameLabel: 'Game',
  totalItems: (n) => `${n} ${n === 1 ? 'item' : 'items'}`,
  dataVersion: (v, d) => `Data v${v}, updated ${d}`,
  searchLabel: 'Search items',
  searchPlaceholder: 'Search by name, alias or how to get it',
  searchClear: 'Clear search',
  filters: 'Filters',
  rarity: 'Rarity',
  category: 'Category',
  tag: 'Tags',
  removeTag: (tag) => `Remove tag filter "${tag}"`,
  showRemoved: (n) => `Show unobtainable (${n})`,
  sort: 'Sort',
  sortOptions: {
    auto: 'Best match',
    rarity: 'Rarest first',
    name: 'Name',
    updated: 'Recently updated',
  },
  resultCount: (n) => `${n} ${n === 1 ? 'result' : 'results'}`,
  clearFilters: 'Clear filters',
  emptyTitle: 'No items found',
  emptyBody: 'Try another word or clear the filters.',
  emptySuggest: ' If the item is missing, you can suggest adding it.',
  suggestItem: 'Suggest adding this item',
  status: { active: '', limited: 'Limited time', removed: 'Unobtainable' },
  detail: {
    obtain: 'How to get it',
    obtainEmpty: 'How to get this item has not been added yet. If you know, please tell us.',
    description: 'About',
    aliases: 'Also known as',
    tags: 'Tags (press to filter by tag)',
    category: 'Category',
    updated: (d) => `Updated ${d}`,
    added: (v) => `Added in v${v}`,
    sources: 'Sources',
  },
  improve: 'Fix or add info',
  copyLink: 'Copy link',
  copied: 'Copied',
  close: 'Close',
  otherLang: '日本語',
  noGames: 'No game data found. Add a JSON file to data/games.',
  footerNotice:
    'StealDex is an unofficial fan project. It is not affiliated with Roblox Corporation or any game developer.',
  footerContribute: 'Anyone can fix the data',
};

export const STRINGS: Record<Lang, Strings> = { ja, en };
