// 新しいアイテムの雛形を作成するスクリプト
// 使い方: npm run new-item -- --game sample-game --id golden-dragon --name-en "Golden Dragon"
// 作成後、中身を編集して npm run validate を実行してください。

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    const key = argv[i].slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) out[key] = true;
    else { out[key] = next; i++; }
  }
  return out;
}

function fail(msg) {
  console.error(`✖ ${msg}`);
  console.error('使い方: npm run new-item -- --game <ゲームID> --id <アイテムID> --name-en "<英語名>" [--name-ja "<日本語名>"]');
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));
const { game, id } = args;
const nameEn = args['name-en'];
const nameJa = args['name-ja'];

if (typeof game !== 'string' || typeof id !== 'string' || typeof nameEn !== 'string') {
  fail('--game, --id, --name-en は必須です。');
}
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) fail('--id は小文字英数字とハイフンのみにしてください(例: golden-dragon)。');

const gameFile = path.join(ROOT, 'data', 'games', `${game}.json`);
let gameData;
try {
  gameData = JSON.parse(await readFile(gameFile, 'utf8'));
} catch {
  fail(`data/games/${game}.json が見つかりません。先にゲーム定義を作成してください。`);
}

const itemFile = path.join(ROOT, 'data', 'items', game, `${id}.json`);
try {
  await access(itemFile);
  fail(`data/items/${game}/${id}.json はすでに存在します。修正する場合はそのファイルを直接編集してください。`);
} catch (e) {
  if (e.code !== 'ENOENT') throw e;
}

const today = new Date().toISOString().slice(0, 10);
const item = {
  id,
  game,
  name: nameJa ? { ja: nameJa, en: nameEn } : { en: nameEn },
  rarity: gameData.rarities[0].id,
  category: gameData.categories[0].id,
  status: 'active',
  obtain: { ja: '', en: '' },
  description: { ja: '', en: '' },
  aliases: [],
  tags: [],
  addedInVersion: gameData.version,
  updatedAt: today,
};

// 空文字は検証でエラーになるため、未記入の欄は雛形から外す
delete item.obtain;
delete item.description;

await mkdir(path.dirname(itemFile), { recursive: true });
await writeFile(itemFile, JSON.stringify(item, null, 2) + '\n', 'utf8');

console.log(`✔ 作成しました: data/items/${game}/${id}.json`);
console.log(`  rarity / category は仮の値です。正しい値に直してください。`);
console.log(`  使える rarity:   ${gameData.rarities.map((r) => r.id).join(', ')}`);
console.log(`  使える category: ${gameData.categories.map((c) => c.id).join(', ')}`);
console.log('  obtain(入手方法)と description(説明)は分かる範囲で追記してください。');
console.log('  編集後に npm run validate を実行してください。');
