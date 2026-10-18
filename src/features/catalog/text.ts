import type { Item, LabelDef, Lang, Localized } from './types';

/** レア度・カテゴリなどの表示名。定義が見つからなければ id をそのまま返す */
export function labelOf(defs: LabelDef[], id: string, lang: Lang): string {
  return pickText(defs.find((d) => d.id === id)?.label, lang) ?? id;
}

/** 表示言語を優先し、なければもう一方の言語を返す */
export function pickText(value: Localized | undefined, lang: Lang): string | undefined {
  if (!value) return undefined;
  const other: Lang = lang === 'ja' ? 'en' : 'ja';
  return value[lang] || value[other] || undefined;
}

/** カードに大きく出す名前 */
export function primaryName(item: Item, lang: Lang): string {
  return pickText(item.name, lang) ?? item.id;
}

/** 名前の下に小さく出す、もう一方の言語の名前(なければ undefined) */
export function secondaryName(item: Item, lang: Lang): string | undefined {
  const other: Lang = lang === 'ja' ? 'en' : 'ja';
  const main = primaryName(item, lang);
  const sub = item.name[other];
  return sub && sub !== main ? sub : undefined;
}

/** 画像がないときの飾り文字として使う、名前の最初の1文字 */
export function glyphOf(name: string): string {
  return Array.from(name.trim())[0] ?? '?';
}
