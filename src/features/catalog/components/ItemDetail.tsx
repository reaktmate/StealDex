import { useEffect, useState } from 'react';
import { ItemArt } from '../../../components/ItemArt';
import { RarityBadge } from '../../../components/RarityBadge';
import { StatusBadge } from '../../../components/StatusBadge';
import { dataIssueUrl } from '../../../config';
import { rarityInfo } from '../rarity';
import { STRINGS } from '../strings';
import { labelOf, pickText, primaryName, secondaryName } from '../text';
import type { Game, Item, Lang } from '../types';

interface Props {
  item: Item;
  game: Game;
  lang: Lang;
  onClose: () => void;
  onTagClick: (tag: string) => void;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function ItemDetail({ item, game, lang, onClose, onTagClick }: Props) {
  const t = STRINGS[lang];
  const info = rarityInfo(game, item.rarity);
  const name = primaryName(item, lang);
  const sub = secondaryName(item, lang);
  const obtain = pickText(item.obtain, lang);
  const description = pickText(item.description, lang);
  const issue = dataIssueUrl({
    title: name,
    game: game.name.en ?? game.id,
    item: item.name.en ?? name,
  });

  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      // クリップボードが使えない環境では何もしない(アドレスバーからコピーできる)
    }
  }

  return (
    <article className="detail" data-tier={info.tier}>
      <button type="button" className="detail-close" onClick={onClose} aria-label={t.close}>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        </svg>
      </button>

      <div className="detail-head">
        <ItemArt image={item.image} name={name} tier={info.tier} />
        <div className="detail-title">
          <h2 id="detail-title">{name}</h2>
          {sub && (
            <p className="detail-sub" lang={lang === 'ja' ? 'en' : 'ja'}>
              {sub}
            </p>
          )}
          <p className="detail-badges">
            <RarityBadge label={labelOf(game.rarities, item.rarity, lang)} tier={info.tier} />
            <span className="pill pill-quiet">{labelOf(game.categories, item.category, lang)}</span>
            <StatusBadge status={item.status} label={t.status[item.status]} />
          </p>
        </div>
      </div>

      <section>
        <h3>{t.detail.obtain}</h3>
        {obtain ? <p>{obtain}</p> : <p className="empty-note">{t.detail.obtainEmpty}</p>}
      </section>

      {description && (
        <section>
          <h3>{t.detail.description}</h3>
          <p>{description}</p>
        </section>
      )}

      {item.aliases && item.aliases.length > 0 && (
        <section>
          <h3>{t.detail.aliases}</h3>
          <ul className="pill-list">
            {item.aliases.map((alias) => (
              <li key={alias} className="pill">
                {alias}
              </li>
            ))}
          </ul>
        </section>
      )}

      {item.tags && item.tags.length > 0 && (
        <section>
          <h3>{t.detail.tags}</h3>
          <ul className="pill-list">
            {item.tags.map((tag) => (
              <li key={tag}>
                <button type="button" className="pill" onClick={() => onTagClick(tag)}>
                  {tag}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {item.sources && item.sources.length > 0 && (
        <section>
          <h3>{t.detail.sources}</h3>
          <ul className="source-list">
            {item.sources.map((url) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {hostOf(url)}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="detail-meta">
        <span>{t.detail.updated(item.updatedAt)}</span>
        {item.addedInVersion && <span>{t.detail.added(item.addedInVersion)}</span>}
      </p>

      <div className="detail-actions">
        <button type="button" className="btn" onClick={copyLink}>
          {t.copyLink}
        </button>
        {issue && (
          <a className="btn btn-quiet" href={issue} target="_blank" rel="noopener noreferrer">
            {t.improve}
          </a>
        )}
        <span className="visually-hidden" role="status">
          {copied ? t.copied : ''}
        </span>
        {copied && (
          <span className="copied" aria-hidden="true">
            {t.copied}
          </span>
        )}
      </div>
    </article>
  );
}
