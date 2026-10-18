import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_FILTER, type Catalog, type FilterState, type Lang } from './types';
import { parseUrl, toSearch, type UrlState } from './urlState';

function normalize(state: UrlState, catalog: Catalog): UrlState {
  const known = catalog.some((c) => c.game.id === state.gameId);
  return { ...state, gameId: known ? state.gameId : catalog[0]?.game.id };
}

const urlFor = (state: UrlState) => `${window.location.pathname}${toSearch(state)}`;

/**
 * 図鑑の状態(ゲーム・検索語・絞り込み・開いているアイテム・言語)を URL と同期する。
 * アイテムを開くと履歴が1つ増えるので、戻るボタンで詳細を閉じられる。
 */
export function useCatalogUrlState(catalog: Catalog) {
  const [state, setState] = useState<UrlState>(() =>
    normalize(parseUrl(window.location.search), catalog),
  );

  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  }, [state]);

  // 状態 → URL
  useEffect(() => {
    const next = toSearch(state);
    if (next === window.location.search) return;
    const keep = state.itemId ? (window.history.state as unknown) : null;
    window.history.replaceState(keep, '', urlFor(state));
  }, [state]);

  // 戻る・進む → 状態
  useEffect(() => {
    const onPop = () => setState(normalize(parseUrl(window.location.search), catalog));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [catalog]);

  const setFilter = useCallback((patch: Partial<FilterState>) => {
    setState((s) => ({ ...s, filter: { ...s.filter, ...patch } }));
  }, []);

  const resetFilter = useCallback(() => {
    setState((s) => ({ ...s, filter: { ...DEFAULT_FILTER, sort: s.filter.sort } }));
  }, []);

  const setGameId = useCallback((gameId: string) => {
    setState((s) => ({ ...s, gameId, itemId: undefined, filter: { ...DEFAULT_FILTER } }));
  }, []);

  const setLang = useCallback((lang: Lang) => {
    setState((s) => ({ ...s, lang }));
  }, []);

  const openItem = useCallback((itemId: string) => {
    const next: UrlState = { ...latest.current, itemId };
    window.history.pushState({ dialog: true }, '', urlFor(next));
    setState(next);
  }, []);

  const closeItem = useCallback(() => {
    const entry = window.history.state as { dialog?: boolean } | null;
    if (entry?.dialog) {
      window.history.back();
    } else {
      setState((s) => (s.itemId ? { ...s, itemId: undefined } : s));
    }
  }, []);

  /** 詳細のタグを押したとき: 詳細を閉じて、そのタグで絞り込む */
  const filterByTag = useCallback((tag: string) => {
    setState((s) => ({
      ...s,
      itemId: undefined,
      filter: {
        ...s.filter,
        tags: s.filter.tags.includes(tag) ? s.filter.tags : [...s.filter.tags, tag],
      },
    }));
  }, []);

  return { state, setFilter, resetFilter, setGameId, setLang, openItem, closeItem, filterByTag };
}
