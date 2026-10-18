import type { Game } from './types';

/** 見た目の段階数(slate / sky / violet / gold / rose / foil) */
export const TIER_COUNT = 6;

/**
 * ゲームごとにレア度の数が違うので、並び順の位置から見た目の段階(0〜5)を決める。
 * 一番低いものは必ず 0、一番高いものは必ず 5(ホイル枠)になる。
 */
export function tierOf(index: number, count: number): number {
  if (count <= 1 || index < 0) return 0;
  return Math.round((index * (TIER_COUNT - 1)) / (count - 1));
}

export interface RarityInfo {
  id: string;
  /** 0 が一番出やすい。大きいほど珍しい */
  rank: number;
  tier: number;
}

export function rarityInfo(game: Game, rarityId: string): RarityInfo {
  const rank = game.rarities.findIndex((r) => r.id === rarityId);
  return { id: rarityId, rank, tier: tierOf(rank, game.rarities.length) };
}
