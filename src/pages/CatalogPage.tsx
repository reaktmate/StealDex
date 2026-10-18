import { useDeferredValue, useEffect, useMemo } from 'react';
import { Dialog } from '../components/Dialog';
import { CONTRIBUTING_URL, dataIssueUrl } from '../config';
import { FilterPanel } from '../features/catalog/components/FilterPanel';
import { ItemCard } from '../features/catalog/components/ItemCard';
import { ItemDetail } from '../features/catalog/components/ItemDetail';
import { catalog } from '../features/catalog/data';
import { buildIndex, facetCounts, queryItems } from '../features/catalog/search';
import { STRINGS } from '../features/catalog/strings';
import { pickText, primaryName } from '../features/catalog/text';
import type { SortKey } from '../features/catalog/types';
import { useCatalogUrlState } from '../features/catalog/useCatalogUrlState';

const SORT_KEYS: SortKey[] = ['auto', 'rarity', 'name', 'updated'];

function SearchIcon() {
  return (
    <svg className="search-icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="2.4" fill="none" />
      <path d="M15.5 15.5L21 21" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function CatalogPage() {
  const { state, setFilter, resetFilter, setGameId, setLang, openItem, closeItem, filterByTag } =
    useCatalogUrlState(catalog);
  const { lang, filter: stateFilter } = state;
  const t = STRINGS[lang];

  const entry = catalog.find((c) => c.game.id === state.gameId);
  const index = useMemo(() => (entry ? buildIndex(entry.items, entry.game) : []), [entry]);

  // 入力中の文字は即座に表示し、検索の計算は少し後回しにする
  const deferredQ = useDeferredValue(stateFilter.q);
  const filter = useMemo(() => ({ ...stateFilter, q: deferredQ }), [stateFilter, deferredQ]);

  const results = useMemo(
    () => (entry ? queryItems(index, entry.game, filter, lang) : []),
    [entry, index, filter, lang],
  );
  const counts = useMemo(() => facetCounts(index, filter), [index, filter]);

  const selected = entry && state.itemId ? entry.items.find((i) => i.id === state.itemId) : undefined;

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    document.title = selected
      ? `${primaryName(selected, lang)} | StealDex`
      : lang === 'ja'
        ? 'StealDex | Steal a ○○ アイテム図鑑'
        : 'StealDex | Item encyclopedia for "Steal a ..." games';
  }, [selected, lang]);

  if (!entry) {
    return (
      <div className="app">
        <main className="page">
          <p className="empty-note">{t.noGames}</p>
        </main>
      </div>
    );
  }

  const { game, items } = entry;
  const gameName = pickText(game.name, lang) ?? game.id;
  const removedCount = items.filter((i) => i.status === 'removed').length;
  const hasFilter =
    stateFilter.q !== '' ||
    stateFilter.rarities.length > 0 ||
    stateFilter.categories.length > 0 ||
    stateFilter.tags.length > 0;
  const suggestUrl = dataIssueUrl({
    title: stateFilter.q || gameName,
    game: game.name.en ?? game.id,
    item: stateFilter.q,
  });

  return (
    <div className="app">
      <header className="cover">
        <div className="cover-bar">
          <a className="brand" href={window.location.pathname}>
            StealDex
          </a>
          <div className="cover-tools">
            {catalog.length > 1 && (
              <label className="game-select">
                <span className="visually-hidden">{t.gameLabel}</span>
                <select value={game.id} onChange={(e) => setGameId(e.target.value)}>
                  {catalog.map((c) => (
                    <option key={c.game.id} value={c.game.id}>
                      {pickText(c.game.name, lang) ?? c.game.id}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button
              type="button"
              className="lang-toggle"
              lang={lang === 'ja' ? 'en' : 'ja'}
              onClick={() => setLang(lang === 'ja' ? 'en' : 'ja')}
            >
              {t.otherLang}
            </button>
          </div>
        </div>
        <div className="cover-title">
          <h1>{gameName}</h1>
          <p className="cover-meta">
            <span>{t.totalItems(items.length)}</span>
            <span>{t.dataVersion(game.version, game.updatedAt)}</span>
          </p>
        </div>
      </header>

      <div className="searchbar">
        <div className="searchbar-inner">
          <label className="visually-hidden" htmlFor="search">
            {t.searchLabel}
          </label>
          <SearchIcon />
          <input
            id="search"
            className="search-input"
            type="text"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder={t.searchPlaceholder}
            value={stateFilter.q}
            onChange={(e) => setFilter({ q: e.target.value })}
          />
          {stateFilter.q && (
            <button
              type="button"
              className="search-clear"
              aria-label={t.searchClear}
              onClick={() => setFilter({ q: '' })}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <main className="page">
        <FilterPanel
          game={game}
          lang={lang}
          filter={stateFilter}
          counts={counts}
          removedCount={removedCount}
          onChange={setFilter}
        />

        <section className="results" aria-label={t.resultCount(results.length)}>
          <div className="results-bar">
            <p className="results-count" aria-live="polite">
              {t.resultCount(results.length)}
            </p>
            <label className="sort">
              <span>{t.sort}</span>
              <select
                value={stateFilter.sort}
                onChange={(e) => setFilter({ sort: e.target.value as SortKey })}
              >
                {SORT_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {t.sortOptions[key]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {results.length > 0 ? (
            <ul className="binder">
              {results.map((item) => (
                <ItemCard key={item.id} item={item} game={game} lang={lang} onOpen={openItem} />
              ))}
            </ul>
          ) : (
            <div className="empty">
              <h2>{t.emptyTitle}</h2>
              <p>
                {t.emptyBody}
                {suggestUrl ? t.emptySuggest : ''}
              </p>
              <div className="empty-actions">
                {hasFilter && (
                  <button type="button" className="btn" onClick={resetFilter}>
                    {t.clearFilters}
                  </button>
                )}
                {suggestUrl && (
                  <a className="btn btn-quiet" href={suggestUrl} target="_blank" rel="noopener noreferrer">
                    {t.suggestItem}
                  </a>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <p>{t.footerNotice}</p>
          {CONTRIBUTING_URL && (
            <a href={CONTRIBUTING_URL} target="_blank" rel="noopener noreferrer">
              {t.footerContribute}
            </a>
          )}
        </div>
      </footer>

      <Dialog open={Boolean(selected)} onClose={closeItem} labelledBy="detail-title">
        {selected && (
          <ItemDetail item={selected} game={game} lang={lang} onClose={closeItem} onTagClick={filterByTag} />
        )}
      </Dialog>
    </div>
  );
}
