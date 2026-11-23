# データ出典・ライセンス

`dictionary-data.js` の日本語語釈と場面分類は、以下のオープンデータを基に作成しています。語釈は学習用に短く整えるため、文の省略・言い換え・結合を行っています。

## 1. 日本語版 Wiktionary

- サイト: https://ja.wiktionary.org/
- ライセンス: **CC BY-SA 4.0**（Creative Commons Attribution-ShareAlike 4.0 International）
- ライセンス全文: https://creativecommons.org/licenses/by-sa/4.0/legalcode.ja
- 用途: 語釈の本文（約 4,400 語）。記事の定義文を取得し、学習用に短く整えています。
- 変更: 長い説明の切り詰め、不要な語源・例文の除去、表記の統一、場面分類の付与。
- 帰属表示: フッターに「語釈：日本語版 Wiktionary（CC BY-SA 4.0）」と表示しています。

日本語版 Wiktionary の各記事の著作権は、それぞれの執筆者に帰属します。本データを再配布する場合も CC BY-SA 4.0 の条件（帰属表示・同一条件での共有）が適用されます。

## 2. 日本語 WordNet

- サイト: https://bond-lab.github.io/wnja/
- ライセンス: 日本語データは Princeton WordNet と同様の BSD ライクなライセンス
- ライセンス全文: https://bond-lab.github.io/wnja/license.txt
- 用途: Wiktionary で語釈が取れなかった一部の語（約 60 語）の補完。
- 帰属表示: フッターに「日本語WordNet」と表示しています。

## 3. JMdict

- サイト: https://www.edrdg.org/jmdict/j_jmdict.html
- ライセンス: **CC BY-SA 4.0**（Electronic Dictionary Research and Development Group）
- 用途: 漢字表記の語から読みへの対応表を作るためだけに使用。JMdict の英語語義はサイトに表示していません。
- 変更: 読みと漢字表記の対応だけを抽出し、`DICTIONARY_KANJI_READINGS` として保存。

## 4. JLPT 語彙リスト

- 元データ: プロジェクト内の `n5-data.js` / `n4-data.js` / `n3-data.js` / `n2-data.js`（JLPT 教材の語彙表を整理したもの）
- 用途: 見出し語、読み、中文の補助説明、例文。
- 注意: 語彙リストの出所・利用条件は、元になった教材・資料に従います。公開・再配布する場合は、元資料の権利を確認してください。

## 5. 本サイトのコード

`index.html` / `styles.css` / `app.js` は、このプロジェクト用に作成したものです。上記データ部分（`dictionary-data.js` の語釈・分類）には CC BY-SA 4.0 が適用されます。

## 帰属表示の例

> 語釈の一部は日本語版 Wiktionary（CC BY-SA 4.0）および日本語 WordNet を基に、学習用に編集して作成しました。

最終更新: 2026-11-22
