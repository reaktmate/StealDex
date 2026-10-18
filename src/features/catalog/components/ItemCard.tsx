import { memo } from 'react';
import { ItemArt } from '../../../components/ItemArt';
import { RarityBadge } from '../../../components/RarityBadge';
import { StatusBadge } from '../../../components/StatusBadge';
import { rarityInfo } from '../rarity';
import { STRINGS } from '../strings';
import { labelOf, primaryName, secondaryName } from '../text';
import type { Game, Item, Lang } from '../types';

interface Props {
  item: Item;
  game: Game;
  lang: Lang;
  onOpen: (id: string) => void;
}

export const ItemCard = memo(function ItemCard({ item, game, lang, onOpen }: Props) {
  const t = STRINGS[lang];
  const info = rarityInfo(game, item.rarity);
  const name = primaryName(item, lang);
  const sub = secondaryName(item, lang);

  return (
    <li className="slot">
      <button type="button" className="card" data-tier={info.tier} onClick={() => onOpen(item.id)}>
        <ItemArt image={item.image} name={name} tier={info.tier} />
        <span className="card-name">{name}</span>
        {sub && (
          <span className="card-sub" lang={lang === 'ja' ? 'en' : 'ja'}>
            {sub}
          </span>
        )}
        <span className="card-tags">
          <RarityBadge label={labelOf(game.rarities, item.rarity, lang)} tier={info.tier} />
          <StatusBadge status={item.status} label={t.status[item.status]} />
        </span>
      </button>
    </li>
  );
});
