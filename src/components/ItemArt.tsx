import { useState } from 'react';
import { glyphOf } from '../features/catalog/text';

interface Props {
  image?: string;
  name: string;
  tier: number;
}

/**
 * アイテム画像。画像がない(または読み込めない)ときは、
 * レア度の色を使った縞模様に名前の頭文字を置いた図柄を出す。
 */
export function ItemArt({ image, name, tier }: Props) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="art" data-tier={tier}>
      {image && !failed ? (
        <img
          src={`${import.meta.env.BASE_URL}${image}`}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="art-glyph" aria-hidden="true">
          {glyphOf(name)}
        </span>
      )}
    </span>
  );
}
