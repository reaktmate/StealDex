export type Lang = 'ja' | 'en';

export interface Localized {
  ja?: string;
  en?: string;
}

export type ItemStatus = 'active' | 'limited' | 'removed';

export interface LabelDef {
  id: string;
  label: Localized;
}

export interface Game {
  id: string;
  name: Localized;
  gameUrl?: string;
  version: string;
  updatedAt: string;
  /** 低い順(先頭が一番出やすい)に並んでいる */
  rarities: LabelDef[];
  categories: LabelDef[];
}

export interface Item {
  id: string;
  game: string;
  name: Localized;
  rarity: string;
  category: string;
  status: ItemStatus;
  obtain?: Localized;
  description?: Localized;
  aliases?: string[];
  tags?: string[];
  /** public/ からの相対パス */
  image?: string;
  addedInVersion?: string;
  updatedAt: string;
  sources?: string[];
}

export interface GameCatalog {
  game: Game;
  items: Item[];
}

export type Catalog = GameCatalog[];

export type SortKey = 'auto' | 'rarity' | 'name' | 'updated';

export interface FilterState {
  q: string;
  rarities: string[];
  categories: string[];
  tags: string[];
  showRemoved: boolean;
  sort: SortKey;
}

export const DEFAULT_FILTER: FilterState = {
  q: '',
  rarities: [],
  categories: [],
  tags: [],
  showRemoved: false,
  sort: 'auto',
};
