/**
 * TANUPON Season2 ルール — Discord 変更通知(通知専用・軽量版)
 *
 * スプレッドシートを編集した瞬間に、旧→新の差分をDiscordへ投稿します。
 * Webルールブックの表示は GitHub Pages 側(index.html)が担当するため、
 * このスクリプトは「通知」だけを行います。
 *
 * セットアップ:
 *   1) 対象スプレッドシートで 拡張機能 → Apps Script を開き、このコードを貼り付け
 *   2) プロジェクトの設定 → スクリプト プロパティ に
 *        キー: DISCORD_WEBHOOK_URL   値: Discordで作成したWebhook URL
 *      を登録(コードやチャットには貼らない)
 *   3) 関数 testDiscord を実行して疎通確認(初回は権限承認)
 *   4) 関数 setupTrigger を実行して「編集時トリガー」を登録
 *   以降、監視対象タブのセルを編集するたびにDiscordへ通知されます。
 */

// 監視対象タブ(この名前のタブの編集だけ通知)
var WATCH_TABS = [
  '全体ルール','請求金額 / 最低金額','犯罪補足','職業ルール','PDルール','犯罪者ルール',
  '犯罪禁止車両','EMSルール','闇医者ルール','メカニックルール','飲食店ルール','ディーラールール',
  '不動産ルール','ギャングルール','武器屋ルール','素材屋ルール','バイトルール','薬物採取について','犯罪開始位置①'
];

function getWebhookUrl_() {
  return PropertiesService.getScriptProperties().getProperty('DISCORD_WEBHOOK_URL') || '';
}

/** 編集時トリガーから呼ばれる */
function onEditInstallable(e) {
  try {
    var url = getWebhookUrl_();
    if (!url || !e || !e.range) return;

    var range = e.range;
    var sheet = range.getSheet();
    var sheetName = sheet.getName();
    if (WATCH_TABS.indexOf(sheetName) === -1) return; // 対象外タブは無視

    var row = range.getRow();
    if (row <= 1) return; // ヘッダー行は無視

    var label = '';
    try { label = sheet.getRange(row, 2).getDisplayValue() || ''; } catch (err) {}

    var oldVal, newVal;
    if (e.hasOwnProperty('oldValue') || e.hasOwnProperty('value')) {
      oldVal = (e.oldValue == null || e.oldValue === '') ? '（空欄）' : e.oldValue;
      newVal = (e.value == null || e.value === '') ? '（空欄）' : e.value;
    } else {
      oldVal = '（複数セル編集のため旧値は取得できません）';
      newVal = range.getDisplayValues().map(function (r) { return r.join(' | '); }).join('\n');
    }

    var editor = '';
    try { if (e.user && e.user.getEmail) editor = e.user.getEmail() || ''; } catch (err) {}

    postToDiscord_(url, {
      sheetName: sheetName, label: label, cellA1: range.getA1Notation(),
      oldVal: oldVal, newVal: newVal, editor: editor
    });
  } catch (err) {
    console.error('onEditInstallable error: ' + err);
  }
}

function postToDiscord_(url, d) {
  var trunc = function (s) { s = String(s); return s.length > 1000 ? s.slice(0, 1000) + '…(省略)' : s; };
  var fields = [];
  if (d.label) fields.push({ name: '対象', value: '`' + d.label + '`', inline: true });
  fields.push({ name: 'タブ', value: d.sheetName, inline: true });
  fields.push({ name: 'セル', value: d.cellA1, inline: true });
  fields.push({ name: '🔴 変更前（旧）', value: trunc(d.oldVal), inline: false });
  fields.push({ name: '🟢 変更後（新）', value: trunc(d.newVal), inline: false });
  if (d.editor) fields.push({ name: '編集者', value: d.editor, inline: false });

  var payload = {
    username: 'ルール変更通知',
    embeds: [{
      title: '📖 ルールが更新されました',
      description: '最新はルールブックで確認: https://bartsukasa.github.io/tanupon-rulebook/',
      color: 3050327, // #2e8b57
      fields: fields,
      timestamp: new Date().toISOString(),
      footer: { text: 'TANUPON Season2 ルール一覧' }
    }]
  };
  UrlFetchApp.fetch(url, {
    method: 'post', contentType: 'application/json',
    payload: JSON.stringify(payload), muteHttpExceptions: true
  });
}

/** 編集時トリガーを登録(1回だけ実行) */
function setupTrigger() {
  var ss = SpreadsheetApp.getActive();
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'onEditInstallable') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onEditInstallable').forSpreadsheet(ss).onEdit().create();
  return 'onEditInstallable トリガーを登録しました。';
}

/** Webhook 疎通確認(1回実行してDiscordにテスト投稿が来ればOK) */
function testDiscord() {
  var url = getWebhookUrl_();
  if (!url) throw new Error('スクリプトプロパティ DISCORD_WEBHOOK_URL が未設定です。');
  postToDiscord_(url, { sheetName: '全体ルール', label: 'TEST-1', cellA1: 'C2',
    oldVal: '旧テキストの例', newVal: '新テキストの例', editor: '' });
  return 'テスト投稿を送信しました。Discordを確認してください。';
}
