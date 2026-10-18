import type { Catalog, Game, Item } from './types';

// data/ 内の JSON をビルド時にまとめて読み込みます。
// ファイルを足すだけで図鑑に反映されるので、コードの変更は要りません。
const gameModules = import.meta.glob<Game>('/data/games/*.json', {
  eager: true,
  import: 'default',
});
const itemModules = import.meta.glob<Item>('/data/items/*/*.json', {
  eager: true,
  import: 'default',
});

export function buildCatalog(games: Game[], items: Item[]): Catalog {
  return [...games]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((game) => ({
      game,
      items: items.filter((item) => item.game === game.id),
    }));
}

export const catalog: Catalog = buildCatalog(
  Object.values(gameModules),
  Object.values(itemModules),
);
