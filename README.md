# TANUPON Season2 ルール一覧（Webルールブック）

Googleスプレッドシートの内容を、見やすいWebルールブックとして公開するページです。

- **公開ページ**: GitHub Pages（`index.html`）
- **データ元**: Googleスプレッドシート（`gviz` 経由でブラウザが直接読み込み）
- **自動反映**: スプレッドシートを更新 → ページを開く／「更新」ボタンで最新表示
- **デザイン**: tsukapyon仕様（黒 × ダークグリーン `#2e8b57`）

## 仕組み
`index.html` は、開いたときに各タブを
`https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:csv&gid=<gid>`
から読み込んで描画します。サーバー不要・静的ホスティングのみで動作します。

## 必要な共有設定
スプレッドシートを「**リンクを知っている全員 = 閲覧者**」にしてください（ブラウザが匿名で読み込むため）。

## 表示タブの変更
`index.html` 内の `TABS` 配列（`name` / `gid` / `type`）を編集します。
`type` は `rules`（No＋本文カード）または `table`（表）。

## Discord変更通知
変更があった際に旧→新をDiscordへ通知する仕組みは、スプレッドシート側の Google Apps Script（`onEdit` トリガー＋Webhook）で別途運用します。
