// StealDex データ検証スクリプト
// 使い方: npm run validate
// data/games/*.json と data/items/<game>/*.json をチェックします。
// エラーがあれば終了コード 1、警告だけなら 0 で終了します。

import { readdir, readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GAMES_DIR = path.join(ROOT, 'data', 'games');
const ITEMS_DIR = path.join(ROOT, 'data', 'items');
const PUBLIC_DIR = path.join(ROOT, 'public');

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES = ['active', 'limited', 'removed'];
const IMAGE_EXTS = ['.webp', '.png'];
const MAX_ALIASES = 10;
const MAX_TAGS = 10;

const ITEM_KEYS = new Set([
  'id', 'game', 'name', 'rarity', 'category', 'status',
  'obtain', 'description', 'aliases', 'tags', 'image',
  'addedInVersion', 'updatedAt', 'sources',
]);
const GAME_KEYS = new Set([
  'id', 'name', 'gameUrl', 'version', 'updatedAt', 'rarities', 'categories',
]);

const errors = [];
const warnings = [];
const err = (file, msg) => errors.push(`${rel(file)}: ${msg}`);
const warn = (file, msg) => warnings.push(`${rel(file)}: ${msg}`);
const rel = (file) => path.relative(ROOT, file).split(path.sep).join('/');

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.trim() !== '';

// 重複判定用の正規化(全角半角・大文字小文字・空白と記号を無視)
function normalize(s) {
  return s.normalize('NFKC').toLowerCase().replace(/[\s\-_・.,'’"“”!?]/g, '');
}

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function readJson(file) {
  let text;
  try { text = await readFile(file, 'utf8'); } catch (e) {
    err(file, `読み込めません (${e.message})`);
    return null;
  }
  try { return JSON.parse(text); } catch (e) {
    err(file, `JSON として不正です (${e.message})`);
    return null;
  }
}

function checkLocalized(file, label, v, { requireEn = false, requireAny = true } = {}) {
  if (!isObj(v)) { err(file, `${label} は { "ja": "...", "en": "..." } の形式にしてください`); return; }
  for (const k of Object.keys(v)) {
    if (k !== 'ja' && k !== 'en') err(file, `${label} に未対応のキー "${k}" があります(ja / en のみ)`);
    else if (!isStr(v[k])) err(file, `${label}.${k} は空でない文字列にしてください`);
  }
  if (requireEn && !isStr(v.en)) err(file, `${label}.en は必須です`);
  if (requireAny && !isStr(v.ja) && !isStr(v.en)) err(file, `${label} には ja か en のどちらかが必要です`);
}

function checkIdLabelList(file, label, list) {
  const ids = new Set();
  if (!Array.isArray(list) || list.length === 0) {
    err(file, `${label} は1件以上の配列にしてください`);
    return ids;
  }
  for (const [i, entry] of list.entries()) {
    if (!isObj(entry)) { err(file, `${label}[${i}] はオブジェクトにしてください`); continue; }
    if (!isStr(entry.id) || !SLUG_RE.test(entry.id)) {
      err(file, `${label}[${i}].id は小文字英数字とハイフンのみにしてください`);
      continue;
    }
    if (ids.has(entry.id)) err(file, `${label} に id "${entry.id}" が重複しています`);
    ids.add(entry.id);
    checkLocalized(file, `${label}[${i}].label`, entry.label, { requireEn: true });
  }
  return ids;
}

async function loadGames() {
  const games = new Map();
  let files = [];
  try { files = (await readdir(GAMES_DIR)).filter((f) => f.endsWith('.json')); } catch {
    err(GAMES_DIR, 'data/games フォルダがありません');
    return games;
  }
  for (const f of files) {
    const file = path.join(GAMES_DIR, f);
    const g = await readJson(file);
    if (!g) continue;
    if (!isObj(g)) { err(file, 'ルートはオブジェクトにしてください'); continue; }
    for (const k of Object.keys(g)) if (!GAME_KEYS.has(k)) err(file, `未対応のキー "${k}" があります`);

    const expectedId = path.basename(f, '.json');
    if (!isStr(g.id) || !SLUG_RE.test(g.id)) err(file, 'id は小文字英数字とハイフンのみにしてください');
    else if (g.id !== expectedId) err(file, `id "${g.id}" がファイル名 "${expectedId}" と一致しません`);

    checkLocalized(file, 'name', g.name, { requireEn: true });
    if (!isStr(g.version)) err(file, 'version は必須です');
    if (!isStr(g.updatedAt) || !DATE_RE.test(g.updatedAt)) err(file, 'updatedAt は YYYY-MM-DD 形式にしてください');
    if (g.gameUrl !== undefined && !(isStr(g.gameUrl) && /^https:\/\//.test(g.gameUrl))) {
      err(file, 'gameUrl は https:// で始まる URL にしてください');
    }
    const rarityIds = checkIdLabelList(file, 'rarities', g.rarities);
    const categoryIds = checkIdLabelList(file, 'categories', g.categories);
    games.set(expectedId, { file, rarityIds, categoryIds });
  }
  return games;
}

async function checkItems(games) {
  let dirs = [];
  try {
    dirs = (await readdir(ITEMS_DIR, { withFileTypes: true })).filter((d) => d.isDirectory());
  } catch {
    err(ITEMS_DIR, 'data/items フォルダがありません');
    return 0;
  }

  let count = 0;
  for (const dir of dirs) {
    const gameId = dir.name;
    const game = games.get(gameId);
    if (!game) {
      err(path.join(ITEMS_DIR, gameId), `data/games/${gameId}.json が存在しません`);
      continue;
    }

    const files = (await readdir(path.join(ITEMS_DIR, gameId))).filter((f) => f.endsWith('.json'));
    const nameIndex = new Map();   // 正規化した名前 -> item id
    const aliasIndex = new Map();  // 正規化したエイリアス -> item id

    for (const f of files) {
      const file = path.join(ITEMS_DIR, gameId, f);
      const item = await readJson(file);
      if (!item) continue;
      count++;
      if (!isObj(item)) { err(file, 'ルートはオブジェクトにしてください'); continue; }

      for (const k of Object.keys(item)) if (!ITEM_KEYS.has(k)) err(file, `未対応のキー "${k}" があります(typo ではありませんか?)`);

      // id / game
      const expectedId = path.basename(f, '.json');
      if (!isStr(item.id) || !SLUG_RE.test(item.id)) err(file, 'id は小文字英数字とハイフンのみにしてください(例: golden-dragon)');
      else if (item.id !== expectedId) err(file, `id "${item.id}" がファイル名 "${expectedId}" と一致しません`);
      if (item.game !== gameId) err(file, `game は "${gameId}"(フォルダ名)にしてください`);

      // name
      checkLocalized(file, 'name', item.name, { requireEn: true });

      // rarity / category
      if (!isStr(item.rarity)) err(file, 'rarity は必須です');
      else if (!game.rarityIds.has(item.rarity)) {
        err(file, `rarity "${item.rarity}" は ${gameId} に定義がありません(使えるもの: ${[...game.rarityIds].join(', ')})`);
      }
      if (!isStr(item.category)) err(file, 'category は必須です');
      else if (!game.categoryIds.has(item.category)) {
        err(file, `category "${item.category}" は ${gameId} に定義がありません(使えるもの: ${[...game.categoryIds].join(', ')})`);
      }

      // status
      if (!STATUSES.includes(item.status)) err(file, `status は ${STATUSES.join(' / ')} のいずれかにしてください`);

      // updatedAt
      if (!isStr(item.updatedAt) || !DATE_RE.test(item.updatedAt)) err(file, 'updatedAt は YYYY-MM-DD 形式にしてください');

      // obtain / description(任意だが、あるなら形式チェック)
      if (item.obtain === undefined) warn(file, 'obtain(入手方法)が未入力です。分かる方は追記してください');
      else checkLocalized(file, 'obtain', item.obtain);
      if (item.description !== undefined) checkLocalized(file, 'description', item.description);

      // aliases
      const myAliases = [];
      if (item.aliases !== undefined) {
        if (!Array.isArray(item.aliases) || !item.aliases.every(isStr)) err(file, 'aliases は文字列の配列にしてください');
        else {
          if (item.aliases.length > MAX_ALIASES) err(file, `aliases は最大 ${MAX_ALIASES} 件までです`);
          myAliases.push(...item.aliases);
        }
      }

      // tags
      if (item.tags !== undefined) {
        if (!Array.isArray(item.tags) || !item.tags.every((t) => isStr(t) && SLUG_RE.test(t))) {
          err(file, 'tags は小文字英数字とハイフンの文字列配列にしてください(例: "boss-drop")');
        } else {
          if (item.tags.length > MAX_TAGS) err(file, `tags は最大 ${MAX_TAGS} 件までです`);
          if (new Set(item.tags).size !== item.tags.length) err(file, 'tags に重複があります');
        }
      }

      // image
      if (item.image !== undefined) {
        if (!isStr(item.image)) err(file, 'image は文字列にしてください');
        else {
          const ext = path.extname(item.image).toLowerCase();
          if (!IMAGE_EXTS.includes(ext)) err(file, `image の拡張子は ${IMAGE_EXTS.join(' / ')} にしてください`);
          else if (item.image.includes('..') || path.isAbsolute(item.image)) err(file, 'image に .. や絶対パスは使えません');
          else if (!(await exists(path.join(PUBLIC_DIR, item.image)))) err(file, `image "${item.image}" が public/ 内に見つかりません`);
        }
      } else {
        warn(file, 'image が未設定です(画像は任意ですが ASSETS.md の条件を満たすものがあれば追加してください)');
      }

      // sources
      if (item.sources !== undefined) {
        if (!Array.isArray(item.sources) || !item.sources.every((s) => isStr(s) && /^https:\/\//.test(s))) {
          err(file, 'sources は https:// で始まる URL の配列にしてください');
        }
      }

      // 重複検出(名前)
      if (isObj(item.name)) {
        for (const n of [item.name.ja, item.name.en].filter(isStr)) {
          const key = normalize(n);
          const prev = nameIndex.get(key);
          if (prev && prev !== item.id) err(file, `名前 "${n}" が "${prev}" と重複しています(同じアイテムではありませんか?)`);
          else nameIndex.set(key, item.id);
        }
      }
      // エイリアスは後でまとめて確認
      for (const a of myAliases.filter(isStr)) {
        const key = normalize(a);
        const prev = aliasIndex.get(key);
        if (prev && prev !== item.id) warn(file, `別名 "${a}" が "${prev}" の別名とも重なっています(検索で両方ヒットします)`);
        else aliasIndex.set(key, item.id);
      }
    }

    // エイリアスと他アイテム名の衝突
    for (const [key, owner] of aliasIndex) {
      const nameOwner = nameIndex.get(key);
      if (nameOwner && nameOwner !== owner) {
        warn(path.join(ITEMS_DIR, gameId), `"${owner}" の別名が "${nameOwner}" の名前と同じです(${key})`);
      }
    }
  }
  return count;
}

const games = await loadGames();
const itemCount = await checkItems(games);

for (const w of warnings) console.warn(`⚠ ${w}`);
for (const e of errors) console.error(`✖ ${e}`);

console.log(`\nゲーム ${games.size} 件 / アイテム ${itemCount} 件を検証しました。エラー ${errors.length} 件、警告 ${warnings.length} 件。`);
process.exit(errors.length > 0 ? 1 : 0);
