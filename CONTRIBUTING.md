# コントリビューションガイド

StealDex への貢献ありがとうございます。プログラミングができなくても、アイテム情報の追加や訂正で参加できます。

## 参加の方法

### A. Issue で提案する(GitHub に不慣れな方向け)

[Issues](../../issues) → 「データ提案」を選び、フォームに記入してください。登録・修正・アップデート反映・誤りや重複の報告のすべてに対応しています。

### B. Pull Request で直接直す

1. リポジトリを Fork して clone
2. `data/` 内の JSON を編集(下記の書き方を参照)
3. `npm run validate` でエラーがないことを確認
4. Pull Request を作成(テンプレートに沿って記入)

## データの書き方

### 1. 新しいアイテムを登録する

```bash
npm run new-item -- --game <ゲームID> --id <アイテムID> --name-en "<英語名>" --name-ja "<日本語名>"
```

`data/items/<ゲームID>/<アイテムID>.json` が作られます。`rarity` と `category` は仮の値なので、正しい値に直してください。

- **ファイル名と `id` は一致**させます(小文字英数字とハイフン。例: `golden-dragon`)。
- `name.en` は必須です。ゲーム内表示の英語名を使ってください。`name.ja` は分かれば追加します。

### 2. アイテム名・レア度を直す

該当 JSON の `name` / `rarity` を編集します。`rarity` は `data/games/<ゲームID>.json` の `rarities` に書かれた `id` から選びます。

**名前を変えても `id` とファイル名は変えないでください**(他からの参照が壊れるため)。名前を変えた場合、古い名前を `aliases` に残すと検索でヒットし続けます。

### 3. 入手方法・説明文を足す・直す

`obtain`(入手方法)と `description`(説明)は、日本語 `ja` と英語 `en` の両方、またはどちらか一方で書けます。分かる言語だけで構いません。

```json
"obtain": {
  "ja": "○○ボスを倒すと低確率でドロップ",
  "en": "Low-chance drop from the ○○ boss"
}
```

### 4. 分類・検索情報を改善する

- `category`: ゲーム定義にある分類から1つ
- `tags`: 小文字英数字とハイフン(例: `boss-drop`)。最大10件
- `aliases`: 通称・略称・旧名・表記ゆれ。最大10件

新しいカテゴリやレア度が必要なときは、`data/games/<ゲームID>.json` に追加してください(Issue で相談も歓迎です)。

### 5. ゲームのアップデートを反映する

- アイテムの追加・変更を反映
- 入手できなくなったアイテムは **削除せず** `status` を `removed`(期間限定で今は入手不可なら `limited`)に変更
- 変更したアイテムの `updatedAt` を更新
- `data/games/<ゲームID>.json` の `version` と `updatedAt` も更新

履歴や交換募集で過去のアイテムが必要になるため、アイテムは基本的に消さずに `status` で表します。

### 6. 誤り・重複を報告する

Issue の「データ提案」で、種類に「データの誤りの報告」または「重複アイテムの報告」を選んでください。

重複は `npm run validate` でも検出されます(名前が同じ、または表記ゆれで一致する場合)。重複を見つけたら、情報を片方にまとめて、もう片方は `aliases` に名前を移したうえで削除する形で直します。

## 情報の信頼性

- 実際にゲームで確認した情報、または公式のアップデート情報を根拠にしてください。
- 推測や噂は書かないでください。不確かな場合は Issue で相談してください。
- 根拠の URL は `sources` に https:// で書けます。

## 画像について

画像の追加は [ASSETS.md](./ASSETS.md) の条件を必ず確認してください。条件を満たさない画像は受け付けられません。

## JSON の項目一覧

| 項目 | 必須 | 内容 |
| --- | --- | --- |
| `id` | ✔ | ファイル名と同じ(小文字英数字とハイフン) |
| `game` | ✔ | ゲームID(フォルダ名と同じ) |
| `name` | ✔ | `{ "en": "...", "ja": "..." }`(`en` 必須) |
| `rarity` | ✔ | ゲーム定義の `rarities[].id` |
| `category` | ✔ | ゲーム定義の `categories[].id` |
| `status` | ✔ | `active` / `limited` / `removed` |
| `updatedAt` | ✔ | `YYYY-MM-DD` |
| `obtain` | | 入手方法(`ja` / `en`) |
| `description` | | 説明(`ja` / `en`) |
| `aliases` | | 別名の配列(最大10) |
| `tags` | | タグの配列(最大10) |
| `image` | | `public/` からの相対パス(`.webp` / `.png`) |
| `addedInVersion` | | 追加されたバージョン |
| `sources` | | 根拠 URL の配列(https のみ) |

## ライセンスへの同意

貢献した内容は、コードは [MIT License](./LICENSE)、データは [DATA-LICENSE.md](./DATA-LICENSE.md) の条件で公開されることに同意したものとみなします。

## 困ったとき

Issue で気軽に質問してください。行動規範は [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) です。
