import { tierOf } from '../rarity';
import type { FacetCounts } from '../search';
import { STRINGS } from '../strings';
import { pickText } from '../text';
import type { FilterState, Game, Lang } from '../types';

interface Props {
  game: Game;
  lang: Lang;
  filter: FilterState;
  counts: FacetCounts;
  removedCount: number;
  onChange: (patch: Partial<FilterState>) => void;
}

const toggle = (list: string[], id: string) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

export function FilterPanel({ game, lang, filter, counts, removedCount, onChange }: Props) {
  const t = STRINGS[lang];

  return (
    <aside className="filters" aria-label={t.filters}>
      <section className="filter-group" aria-labelledby="filter-rarity">
        <h2 id="filter-rarity">{t.rarity}</h2>
        <div className="chips">
          {game.rarities.map((r, i) => {
            const selected = filter.rarities.includes(r.id);
            const count = counts.rarity[r.id] ?? 0;
            return (
              <button
                key={r.id}
                type="button"
                className="chip"
                data-tier={tierOf(i, game.rarities.length)}
                data-empty={count === 0 && !selected}
                aria-pressed={selected}
                onClick={() => onChange({ rarities: toggle(filter.rarities, r.id) })}
              >
                <span className="rarity-dot" aria-hidden="true" />
                {pickText(r.label, lang) ?? r.id}
                <span className="chip-count">{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="filter-group" aria-labelledby="filter-category">
        <h2 id="filter-category">{t.category}</h2>
        <div className="chips">
          {game.categories.map((c) => {
            const selected = filter.categories.includes(c.id);
            const count = counts.category[c.id] ?? 0;
            return (
              <button
                key={c.id}
                type="button"
                className="chip"
                data-empty={count === 0 && !selected}
                aria-pressed={selected}
                onClick={() => onChange({ categories: toggle(filter.categories, c.id) })}
              >
                {pickText(c.label, lang) ?? c.id}
                <span className="chip-count">{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      {filter.tags.length > 0 && (
        <section className="filter-group" aria-labelledby="filter-tag">
          <h2 id="filter-tag">{t.tag}</h2>
          <div className="chips">
            {filter.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                className="chip"
                aria-pressed="true"
                aria-label={t.removeTag(tag)}
                onClick={() => onChange({ tags: filter.tags.filter((x) => x !== tag) })}
              >
                {tag}
                <span aria-hidden="true">×</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {removedCount > 0 && (
        <label className="check">
          <input
            type="checkbox"
            checked={filter.showRemoved}
            onChange={(e) => onChange({ showRemoved: e.target.checked })}
          />
          <span>{t.showRemoved(removedCount)}</span>
        </label>
      )}
    </aside>
  );
}
