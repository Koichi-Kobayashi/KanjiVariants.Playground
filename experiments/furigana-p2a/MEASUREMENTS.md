# 実ブラウザ測定表

この表はresults/の最終測定からsummarize.mjsで生成。採用判断と測定の限界はREPORT.md参照。

## 初期化・解析（ms）

| エンジン | 場所 | cache | n | 初期化中央値 | 今日の初回 | 今日の2回目 | 20単位 | 500単位 | 2,000単位 | 実転送bytes |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| lindera | main | cold | 5 | 294.1 | 2.5 | 0.3 | 0.3 | 5.4 | 20 | 12232376 |
| lindera | main | warm | 3 | 248.9 | 0.3 | 0.2 | 0.3 | 5 | 19.5 | 0 |
| lindera | worker | cold | 5 | 278.4 | 2.6 | 0.1 | 0.3 | 5.4 | 20.6 | 12232376 |
| kuromoji | main | cold | 5 | 1572.4 | 1.5 | 0.3 | 0.2 | 2.7 | 10 | 17863188 |
| kuromoji | main | warm | 3 | 1453.3 | 0.5 | 0.2 | 0.2 | 2.7 | 9.7 | 0 |
| kuromoji | worker | cold | 5 | 1600.6 | 1.6 | 0.3 | 0.2 | 2.9 | 10.8 | 17863188 |

## 実際のトークンと読み

「∅」は読み未取得。「?」は未知語。*はエンジンが返した未定義値。位置はUTF-16、半開区間。空白等の省略は原文の再構成に使わない。

### lindera

| 入力 | トークン［読み］ | 評価 | 位置不一致数（raw / adapter） |
|---|---|---|---|
| 今日 | 今日[きょう] | expected | 0 / 0 |
| 明日 | 明日[あした] | expected | 0 / 0 |
| 大人 | 大人[おとな] | expected | 0 / 0 |
| 図書館 | 図書館[としょかん] | expected | 0 / 0 |
| 宇宙 | 宇宙[うちゅう] | expected | 0 / 0 |
| 生きる | 生きる[いきる] | expected | 0 / 0 |
| 人気がある | 人気[にんき] / が[が] / ある[ある] | expected | 0 / 0 |
| 人気がない場所 | 人気[にんき] / が[が] / ない[ない] / 場所[ばしょ] | expected | 0 / 0 |
| 一日中 | 一[いち] / 日[にち] / 中[ちゅう] | wrong-reading | 0 / 0 |
| 五月一日 | 五月[ごがつ] / 一[いち] / 日[にち] | wrong-reading | 0 / 0 |
| 五月雨 | 五月雨[さみだれ] | expected | 0 / 0 |
| 今日は図書館で大人と宇宙の本を読みます。 | 今日[きょう] / は[は] / 図書館[としょかん] / で[で] / 大人[おとな] / と[と] / 宇宙[うちゅう] / の[の] / 本[ほん] / を[を] / 読み[よみ] / ます[ます] / 。[。] | expected | 0 / 0 |
| 高橋さんと髙橋さん | 高橋[たかはし] / さん[さん] / と[と] / 髙橋[*]? / さん[さん] | missing-or-unknown | 0 / 0 |
| 𠮷野さん | 𠮷[*]? / 野[の] / さん[さん] | missing-or-unknown | 0 / 0 |
| 読みました | 読み[よみ] / まし[まし] / た[た] | expected | 0 / 0 |
| 行った | 行っ[いっ] / た[た] | expected | 0 / 0 |
| 食べました | 食べ[たべ] / まし[まし] / た[た] | expected | 0 / 0 |
| 今日、大人は図書館へ行った。明日は宇宙の本を読みました。 | 今日[きょう] / 、[、] / 大人[おとな] / は[は] / 図書館[としょかん] / へ[へ] / 行っ[いっ] / た[た] / 。[。] / 明日[あした] / は[は] / 宇宙[うちゅう] / の[の] / 本[ほん] / を[を] / 読み[よみ] / まし[まし] / た[た] / 。[。] | expected | 0 / 0 |
| 五月一日に五月雨が降った。一日中雨だった。 | 五月[ごがつ] / 一[いち] / 日[にち] / に[に] / 五月雨[さみだれ] / が[が] / 降っ[ふっ] / た[た] / 。[。] / 一日中[いちにちじゅう] / 雨[う] / だっ[だっ] / た[た] / 。[。] | wrong-reading | 0 / 0 |
| 今日。今日、今日。図書館。図書館。 | 今日[きょう] / 。[。] / 今日[きょう] / 、[、] / 今日[きょう] / 。[。] / 図書館[としょかん] / 。[。] / 図書館[としょかん] / 。[。] | expected | 0 / 0 |
| 😀今日\r\n 今日 辻󠄀不︀𠮷野さん。今日。 | 😀[*]? / 今日[きょう] / \r[*]? / 今日[きょう] / 辻[つじ] / 󠄀[*]? / 不[ふ] / ︀𠮷[*]? / 野[の] / さん[さん] / 。[。] / 今日[きょう] / 。[。] | diagnostic-only | 0 / 0 |
|   今日\t図書館\n\n今日　宇宙。 | 今日[きょう] / 図書館[としょかん] / 今日[きょう] / 　[*]? / 宇宙[うちゅう] / 。[。] | diagnostic-only | 0 / 0 |
| ヌポラ漢𠮷ヌポラ | ヌポラ[*]? / 漢[かん] / 𠮷[*]? / ヌポラ[*]? | diagnostic-only | 0 / 0 |
| 今日�図書館 | Error: Invalid UTF-16: reject before encoding | invalid-utf16-rejected | — / — |
| �今日 | Error: Invalid UTF-16: reject before encoding | invalid-utf16-rejected | — / — |

### kuromoji

| 入力 | トークン［読み］ | 評価 | 位置不一致数（raw / adapter） |
|---|---|---|---|
| 今日 | 今日[きょう] | expected | 0 / 0 |
| 明日 | 明日[あした] | expected | 0 / 0 |
| 大人 | 大人[おとな] | expected | 0 / 0 |
| 図書館 | 図書館[としょかん] | expected | 0 / 0 |
| 宇宙 | 宇宙[うちゅう] | expected | 0 / 0 |
| 生きる | 生きる[いきる] | expected | 0 / 0 |
| 人気がある | 人気[にんき] / が[が] / ある[ある] | expected | 0 / 0 |
| 人気がない場所 | 人気[にんき] / が[が] / ない[ない] / 場所[ばしょ] | expected | 0 / 0 |
| 一日中 | 一[いち] / 日[にち] / 中[ちゅう] | wrong-reading | 0 / 0 |
| 五月一日 | 五月[ごがつ] / 一[いち] / 日[にち] | wrong-reading | 0 / 0 |
| 五月雨 | 五月雨[さみだれ] | expected | 0 / 0 |
| 今日は図書館で大人と宇宙の本を読みます。 | 今日[きょう] / は[は] / 図書館[としょかん] / で[で] / 大人[おとな] / と[と] / 宇宙[うちゅう] / の[の] / 本[ほん] / を[を] / 読み[よみ] / ます[ます] / 。[。] | expected | 0 / 0 |
| 高橋さんと髙橋さん | 高橋[たかはし] / さん[さん] / と[と] / 髙[∅]? / 橋[きょう] / さん[さん] | missing-or-unknown | 0 / 0 |
| 𠮷野さん | 𠮷[∅]? / 野[の] / さん[さん] | missing-or-unknown | 0 / 0 |
| 読みました | 読み[よみ] / まし[まし] / た[た] | expected | 0 / 0 |
| 行った | 行っ[いっ] / た[た] | expected | 0 / 0 |
| 食べました | 食べ[たべ] / まし[まし] / た[た] | expected | 0 / 0 |
| 今日、大人は図書館へ行った。明日は宇宙の本を読みました。 | 今日[きょう] / 、[、] / 大人[おとな] / は[は] / 図書館[としょかん] / へ[へ] / 行っ[いっ] / た[た] / 。[。] / 明日[あした] / は[は] / 宇宙[うちゅう] / の[の] / 本[ほん] / を[を] / 読み[よみ] / まし[まし] / た[た] / 。[。] | expected | 0 / 0 |
| 五月一日に五月雨が降った。一日中雨だった。 | 五月[ごがつ] / 一[いち] / 日[にち] / に[に] / 五月雨[さみだれ] / が[が] / 降っ[ふっ] / た[た] / 。[。] / 一日中[いちにちじゅう] / 雨[う] / だっ[だっ] / た[た] / 。[。] | wrong-reading | 0 / 0 |
| 今日。今日、今日。図書館。図書館。 | 今日[きょう] / 。[。] / 今日[きょう] / 、[、] / 今日[きょう] / 。[。] / 図書館[としょかん] / 。[。] / 図書館[としょかん] / 。[。] | expected | 0 / 0 |
| 😀今日\r\n 今日 辻󠄀不︀𠮷野さん。今日。 | 😀[∅]? / 今日[きょう] / \r\n [∅]? / 今日[きょう] /  [∅]? / 辻[つじ] / 󠄀[∅]? / 不[ふ] / ︀[∅]? / 𠮷[∅]? / 野[の] / さん[さん] / 。[。] / 今日[きょう] / 。[。] | diagnostic-only | 0 / 0 |
|   今日\t図書館\n\n今日　宇宙。 |   [∅]? / 今日[きょ��] / \t[∅]? / 図書館[としょかん] / \n\n[∅]? / 今日[きょう] / 　[　] / 宇宙[うちゅう] / 。[。] | diagnostic-only | 0 / 0 |
| ヌポラ漢𠮷ヌポラ | ヌポラ[∅]? / 漢[かん] / 𠮷[∅]? / ヌポラ[∅]? | diagnostic-only | 0 / 0 |
| 今日�図書館 | Error: Invalid UTF-16: reject before encoding | invalid-utf16-rejected | — / — |
| �今日 | Error: Invalid UTF-16: reject before encoding | invalid-utf16-rejected | — / — |

## 品詞・未知語・UTF-16位置・辞書形

### lindera

| 例ID | 表層 | 読み | 品詞 | 未知語 | UTF-16範囲 | 辞書形 |
|---|---|---|---|---|---|---|
| today | 今日 | キョウ | 名詞,副詞可能,*,* | false | [0,2) | 今日 |
| tomorrow | 明日 | アシタ | 名詞,副詞可能,*,* | false | [0,2) | 明日 |
| adult | 大人 | オトナ | 名詞,一般,*,* | false | [0,2) | 大人 |
| library | 図書館 | トショカン | 名詞,一般,*,* | false | [0,3) | 図書館 |
| space | 宇宙 | ウチュウ | 名詞,一般,*,* | false | [0,2) | 宇宙 |
| live | 生きる | イキル | 動詞,自立,*,* | false | [0,3) | 生きる |
| popular | 人気 | ニンキ | 名詞,一般,*,* | false | [0,2) | 人気 |
| popular | が | ガ | 助詞,格助詞,一般,* | false | [2,3) | が |
| popular | ある | アル | 動詞,自立,*,* | false | [3,5) | ある |
| ambiguous | 人気 | ニンキ | 名詞,一般,*,* | false | [0,2) | 人気 |
| ambiguous | が | ガ | 助詞,格助詞,一般,* | false | [2,3) | が |
| ambiguous | ない | ナイ | 形容詞,自立,*,* | false | [3,5) | ない |
| ambiguous | 場所 | バショ | 名詞,一般,*,* | false | [5,7) | 場所 |
| all-day | 一 | イチ | 名詞,数,*,* | false | [0,1) | 一 |
| all-day | 日 | ニチ | 名詞,接尾,助数詞,* | false | [1,2) | 日 |
| all-day | 中 | チュウ | 名詞,接尾,副詞可能,* | false | [2,3) | 中 |
| date | 五月 | ゴガツ | 名詞,副詞可能,*,* | false | [0,2) | 五月 |
| date | 一 | イチ | 名詞,数,*,* | false | [2,3) | 一 |
| date | 日 | ニチ | 名詞,接尾,助数詞,* | false | [3,4) | 日 |
| rain | 五月雨 | サミダレ | 名詞,一般,*,* | false | [0,3) | 五月雨 |
| sentence | 今日 | キョウ | 名詞,副詞可能,*,* | false | [0,2) | 今日 |
| sentence | は | ハ | 助詞,係助詞,*,* | false | [2,3) | は |
| sentence | 図書館 | トショカン | 名詞,一般,*,* | false | [3,6) | 図書館 |
| sentence | で | デ | 助詞,格助詞,一般,* | false | [6,7) | で |
| sentence | 大人 | オトナ | 名詞,一般,*,* | false | [7,9) | 大人 |
| sentence | と | ト | 助詞,並立助詞,*,* | false | [9,10) | と |
| sentence | 宇宙 | ウチュウ | 名詞,一般,*,* | false | [10,12) | 宇宙 |
| sentence | の | ノ | 助詞,連体化,*,* | false | [12,13) | の |
| sentence | 本 | ホン | 名詞,一般,*,* | false | [13,14) | 本 |
| sentence | を | ヲ | 助詞,格助詞,一般,* | false | [14,15) | を |
| sentence | 読み | ヨミ | 動詞,自立,*,* | false | [15,17) | 読む |
| sentence | ます | マス | 助動詞,*,*,* | false | [17,19) | ます |
| sentence | 。 | 。 | 記号,句点,*,* | false | [19,20) | 。 |
| names | 高橋 | タカハシ | 名詞,固有名詞,人名,姓 | false | [0,2) | 高橋 |
| names | さん | サン | 名詞,接尾,人名,* | false | [2,4) | さん |
| names | と | ト | 助詞,格助詞,一般,* | false | [4,5) | と |
| names | 髙橋 | * | 名詞,一般,*,* | true | [5,7) | * |
| names | さん | サン | 名詞,接尾,人名,* | false | [7,9) | さん |
| supplementary | 𠮷 | * | 記号,一般,*,* | true | [0,2) | * |
| supplementary | 野 | ノ | 名詞,一般,*,* | false | [2,3) | 野 |
| supplementary | さん | サン | 名詞,接尾,人名,* | false | [3,5) | さん |
| read-past | 読み | ヨミ | 動詞,自立,*,* | false | [0,2) | 読む |
| read-past | まし | マシ | 助動詞,*,*,* | false | [2,4) | ます |
| read-past | た | タ | 助動詞,*,*,* | false | [4,5) | た |
| went | 行っ | イッ | 動詞,自立,*,* | false | [0,2) | 行く |
| went | た | タ | 助動詞,*,*,* | false | [2,3) | た |
| ate | 食べ | タベ | 動詞,自立,*,* | false | [0,2) | 食べる |
| ate | まし | マシ | 助動詞,*,*,* | false | [2,4) | ます |
| ate | た | タ | 助動詞,*,*,* | false | [4,5) | た |
| context-words | 今日 | キョウ | 名詞,副詞可能,*,* | false | [0,2) | 今日 |
| context-words | 、 | 、 | 記号,読点,*,* | false | [2,3) | 、 |
| context-words | 大人 | オトナ | 名詞,一般,*,* | false | [3,5) | 大人 |
| context-words | は | ハ | 助詞,係助詞,*,* | false | [5,6) | は |
| context-words | 図書館 | トショカン | 名詞,一般,*,* | false | [6,9) | 図書館 |
| context-words | へ | ヘ | 助詞,格助詞,一般,* | false | [9,10) | へ |
| context-words | 行っ | イッ | 動詞,自立,*,* | false | [10,12) | 行く |
| context-words | た | タ | 助動詞,*,*,* | false | [12,13) | た |
| context-words | 。 | 。 | 記号,句点,*,* | false | [13,14) | 。 |
| context-words | 明日 | アシタ | 名詞,副詞可能,*,* | false | [14,16) | 明日 |
| context-words | は | ハ | 助詞,係助詞,*,* | false | [16,17) | は |
| context-words | 宇宙 | ウチュウ | 名詞,一般,*,* | false | [17,19) | 宇宙 |
| context-words | の | ノ | 助詞,連体化,*,* | false | [19,20) | の |
| context-words | 本 | ホン | 名詞,一般,*,* | false | [20,21) | 本 |
| context-words | を | ヲ | 助詞,格助詞,一般,* | false | [21,22) | を |
| context-words | 読み | ヨミ | 動詞,自立,*,* | false | [22,24) | 読む |
| context-words | まし | マシ | 助動詞,*,*,* | false | [24,26) | ます |
| context-words | た | タ | 助動詞,*,*,* | false | [26,27) | た |
| context-words | 。 | 。 | 記号,句点,*,* | false | [27,28) | 。 |
| context-rain | 五月 | ゴガツ | 名詞,副詞可能,*,* | false | [0,2) | 五月 |
| context-rain | 一 | イチ | 名詞,数,*,* | false | [2,3) | 一 |
| context-rain | 日 | ニチ | 名詞,接尾,助数詞,* | false | [3,4) | 日 |
| context-rain | に | ニ | 助詞,格助詞,一般,* | false | [4,5) | に |
| context-rain | 五月雨 | サミダレ | 名詞,一般,*,* | false | [5,8) | 五月雨 |
| context-rain | が | ガ | 助詞,格助詞,一般,* | false | [8,9) | が |
| context-rain | 降っ | フッ | 動詞,自立,*,* | false | [9,11) | 降る |
| context-rain | た | タ | 助動詞,*,*,* | false | [11,12) | た |
| context-rain | 。 | 。 | 記号,句点,*,* | false | [12,13) | 。 |
| context-rain | 一日中 | イチニチジュウ | 名詞,一般,*,* | false | [13,16) | 一日中 |
| context-rain | 雨 | ウ | 名詞,接尾,一般,* | false | [16,17) | 雨 |
| context-rain | だっ | ダッ | 助動詞,*,*,* | false | [17,19) | だ |
| context-rain | た | タ | 助動詞,*,*,* | false | [19,20) | た |
| context-rain | 。 | 。 | 記号,句点,*,* | false | [20,21) | 。 |
| repeated | 今日 | キョウ | 名詞,副詞可能,*,* | false | [0,2) | 今日 |
| repeated | 。 | 。 | 記号,句点,*,* | false | [2,3) | 。 |
| repeated | 今日 | キョウ | 名詞,副詞可能,*,* | false | [3,5) | 今日 |
| repeated | 、 | 、 | 記号,読点,*,* | false | [5,6) | 、 |
| repeated | 今日 | キョウ | 名詞,副詞可能,*,* | false | [6,8) | 今日 |
| repeated | 。 | 。 | 記号,句点,*,* | false | [8,9) | 。 |
| repeated | 図書館 | トショカン | 名詞,一般,*,* | false | [9,12) | 図書館 |
| repeated | 。 | 。 | 記号,句点,*,* | false | [12,13) | 。 |
| repeated | 図書館 | トショカン | 名詞,一般,*,* | false | [13,16) | 図書館 |
| repeated | 。 | 。 | 記号,句点,*,* | false | [16,17) | 。 |
| unicode | 😀 | * | 記号,一般,*,* | true | [0,2) | * |
| unicode | 今日 | キョウ | 名詞,副詞可能,*,* | false | [2,4) | 今日 |
| unicode | \r | * | 記号,一般,*,* | true | [4,5) | * |
| unicode | 今日 | キョウ | 名詞,副詞可能,*,* | false | [7,9) | 今日 |
| unicode | 辻 | ツジ | 名詞,固有名詞,人名,姓 | false | [10,11) | 辻 |
| unicode | 󠄀 | * | 記号,一般,*,* | true | [11,13) | * |
| unicode | 不 | フ | 接頭詞,名詞接続,*,* | false | [13,14) | 不 |
| unicode | ︀𠮷 | * | 記号,一般,*,* | true | [14,17) | * |
| unicode | 野 | ノ | 名詞,一般,*,* | false | [17,18) | 野 |
| unicode | さん | サン | 名詞,接尾,人名,* | false | [18,20) | さん |
| unicode | 。 | 。 | 記号,句点,*,* | false | [20,21) | 。 |
| unicode | 今日 | キョウ | 名詞,副詞可能,*,* | false | [21,23) | 今日 |
| unicode | 。 | 。 | 記号,句点,*,* | false | [23,24) | 。 |
| whitespace | 今日 | キョウ | 名詞,副詞可能,*,* | false | [2,4) | 今日 |
| whitespace | 図書館 | トショカン | 名詞,一般,*,* | false | [5,8) | 図書館 |
| whitespace | 今日 | キョウ | 名詞,副詞可能,*,* | false | [10,12) | 今日 |
| whitespace | 　 | * | 名詞,サ変接続,*,* | true | [12,13) | * |
| whitespace | 宇宙 | ウチュウ | 名詞,一般,*,* | false | [13,15) | 宇宙 |
| whitespace | 。 | 。 | 記号,句点,*,* | false | [15,16) | 。 |
| unknown | ヌポラ | * | 名詞,固有名詞,一般,* | true | [0,3) | * |
| unknown | 漢 | カン | 名詞,固有名詞,地域,国 | false | [3,4) | 漢 |
| unknown | 𠮷 | * | 記号,一般,*,* | true | [4,6) | * |
| unknown | ヌポラ | * | 名詞,固有名詞,組織,* | true | [6,9) | * |
### kuromoji

| 例ID | 表層 | 読み | 品詞 | 未知語 | UTF-16範囲 | 辞書形 |
|---|---|---|---|---|---|---|
| today | 今日 | キョウ | 名詞,副詞可能,*,* | false | [0,2) | 今日 |
| tomorrow | 明日 | アシタ | 名詞,副詞可能,*,* | false | [0,2) | 明日 |
| adult | 大人 | オトナ | 名詞,一般,*,* | false | [0,2) | 大人 |
| library | 図書館 | トショカン | 名詞,一般,*,* | false | [0,3) | 図書館 |
| space | 宇宙 | ウチュウ | 名詞,一般,*,* | false | [0,2) | 宇宙 |
| live | 生きる | イキル | 動詞,自立,*,* | false | [0,3) | 生きる |
| popular | 人気 | ニンキ | 名詞,一般,*,* | false | [0,2) | 人気 |
| popular | が | ガ | 助詞,格助詞,一般,* | false | [2,3) | が |
| popular | ある | アル | 動詞,自立,*,* | false | [3,5) | ある |
| ambiguous | 人気 | ニンキ | 名詞,一般,*,* | false | [0,2) | 人気 |
| ambiguous | が | ガ | 助詞,格助詞,一般,* | false | [2,3) | が |
| ambiguous | ない | ナイ | 形容詞,自立,*,* | false | [3,5) | ない |
| ambiguous | 場所 | バショ | 名詞,一般,*,* | false | [5,7) | 場所 |
| all-day | 一 | イチ | 名詞,数,*,* | false | [0,1) | 一 |
| all-day | 日 | ニチ | 名詞,接尾,助数詞,* | false | [1,2) | 日 |
| all-day | 中 | チュウ | 名詞,接尾,副詞可能,* | false | [2,3) | 中 |
| date | 五月 | ゴガツ | 名詞,副詞可能,*,* | false | [0,2) | 五月 |
| date | 一 | イチ | 名詞,数,*,* | false | [2,3) | 一 |
| date | 日 | ニチ | 名詞,接尾,助数詞,* | false | [3,4) | 日 |
| rain | 五月雨 | サミダレ | 名詞,一般,*,* | false | [0,3) | 五月雨 |
| sentence | 今日 | キョウ | 名詞,副詞可能,*,* | false | [0,2) | 今日 |
| sentence | は | ハ | 助詞,係助詞,*,* | false | [2,3) | は |
| sentence | 図書館 | トショカン | 名詞,一般,*,* | false | [3,6) | 図書館 |
| sentence | で | デ | 助詞,格助詞,一般,* | false | [6,7) | で |
| sentence | 大人 | オトナ | 名詞,一般,*,* | false | [7,9) | 大人 |
| sentence | と | ト | 助詞,並立助詞,*,* | false | [9,10) | と |
| sentence | 宇宙 | ウチュウ | 名詞,一般,*,* | false | [10,12) | 宇宙 |
| sentence | の | ノ | 助詞,連体化,*,* | false | [12,13) | の |
| sentence | 本 | ホン | 名詞,一般,*,* | false | [13,14) | 本 |
| sentence | を | ヲ | 助詞,格助詞,一般,* | false | [14,15) | を |
| sentence | 読み | ヨミ | 動詞,自立,*,* | false | [15,17) | 読む |
| sentence | ます | マス | 助動詞,*,*,* | false | [17,19) | ます |
| sentence | 。 | 。 | 記号,句点,*,* | false | [19,20) | 。 |
| names | 高橋 | タカハシ | 名詞,固有名詞,人名,姓 | false | [0,2) | 高橋 |
| names | さん | サン | 名詞,接尾,人名,* | false | [2,4) | さん |
| names | と | ト | 助詞,格助詞,一般,* | false | [4,5) | と |
| names | 髙 | ∅ | 名詞,一般,*,* | true | [5,6) | * |
| names | 橋 | キョウ | 名詞,接尾,一般,* | false | [6,7) | 橋 |
| names | さん | サン | 名詞,接尾,人名,* | false | [7,9) | さん |
| supplementary | 𠮷 | ∅ | 記号,一般,*,* | true | [0,2) | * |
| supplementary | 野 | ノ | 名詞,一般,*,* | false | [2,3) | 野 |
| supplementary | さん | サン | 名詞,接尾,人名,* | false | [3,5) | さん |
| read-past | 読み | ヨミ | 動詞,自立,*,* | false | [0,2) | 読む |
| read-past | まし | マシ | 助動詞,*,*,* | false | [2,4) | ます |
| read-past | た | タ | 助動詞,*,*,* | false | [4,5) | た |
| went | 行っ | イッ | 動詞,自立,*,* | false | [0,2) | 行く |
| went | た | タ | 助動詞,*,*,* | false | [2,3) | た |
| ate | 食べ | タベ | 動詞,自立,*,* | false | [0,2) | 食べる |
| ate | まし | マシ | 助動詞,*,*,* | false | [2,4) | ます |
| ate | た | タ | 助動詞,*,*,* | false | [4,5) | た |
| context-words | 今日 | キョウ | 名詞,副詞可能,*,* | false | [0,2) | 今日 |
| context-words | 、 | 、 | 記号,読点,*,* | false | [2,3) | 、 |
| context-words | 大人 | オトナ | 名詞,一般,*,* | false | [3,5) | 大人 |
| context-words | は | ハ | 助詞,係助詞,*,* | false | [5,6) | は |
| context-words | 図書館 | トショカン | 名詞,一般,*,* | false | [6,9) | 図書館 |
| context-words | へ | ヘ | 助詞,格助詞,一般,* | false | [9,10) | へ |
| context-words | 行っ | イッ | 動詞,自立,*,* | false | [10,12) | 行く |
| context-words | た | タ | 助動詞,*,*,* | false | [12,13) | た |
| context-words | 。 | 。 | 記号,句点,*,* | false | [13,14) | 。 |
| context-words | 明日 | アシタ | 名詞,副詞可能,*,* | false | [14,16) | 明日 |
| context-words | は | ハ | 助詞,係助詞,*,* | false | [16,17) | は |
| context-words | 宇宙 | ウチュウ | 名詞,一般,*,* | false | [17,19) | 宇宙 |
| context-words | の | ノ | 助詞,連体化,*,* | false | [19,20) | の |
| context-words | 本 | ホン | 名詞,一般,*,* | false | [20,21) | 本 |
| context-words | を | ヲ | 助詞,格助詞,一般,* | false | [21,22) | を |
| context-words | 読み | ヨミ | 動詞,自立,*,* | false | [22,24) | 読む |
| context-words | まし | マシ | 助動詞,*,*,* | false | [24,26) | ます |
| context-words | た | タ | 助動詞,*,*,* | false | [26,27) | た |
| context-words | 。 | 。 | 記号,句点,*,* | false | [27,28) | 。 |
| context-rain | 五月 | ゴガツ | 名詞,副詞可能,*,* | false | [0,2) | 五月 |
| context-rain | 一 | イチ | 名詞,数,*,* | false | [2,3) | 一 |
| context-rain | 日 | ニチ | 名詞,接尾,助数詞,* | false | [3,4) | 日 |
| context-rain | に | ニ | 助詞,格助詞,一般,* | false | [4,5) | に |
| context-rain | 五月雨 | サミダレ | 名詞,一般,*,* | false | [5,8) | 五月雨 |
| context-rain | が | ガ | 助詞,格助詞,一般,* | false | [8,9) | が |
| context-rain | 降っ | フッ | 動詞,自立,*,* | false | [9,11) | 降る |
| context-rain | た | タ | 助動詞,*,*,* | false | [11,12) | た |
| context-rain | 。 | 。 | 記号,句点,*,* | false | [12,13) | 。 |
| context-rain | 一日中 | イチニチジュウ | 名詞,一般,*,* | false | [13,16) | 一日中 |
| context-rain | 雨 | ウ | 名詞,接尾,一般,* | false | [16,17) | 雨 |
| context-rain | だっ | ダッ | 助動詞,*,*,* | false | [17,19) | だ |
| context-rain | た | タ | 助動詞,*,*,* | false | [19,20) | た |
| context-rain | 。 | 。 | 記号,句点,*,* | false | [20,21) | 。 |
| repeated | 今日 | キョウ | 名詞,副詞可能,*,* | false | [0,2) | 今日 |
| repeated | 。 | 。 | 記号,句点,*,* | false | [2,3) | 。 |
| repeated | 今日 | キョウ | 名詞,副詞可能,*,* | false | [3,5) | 今日 |
| repeated | 、 | 、 | 記号,読点,*,* | false | [5,6) | 、 |
| repeated | 今日 | キョウ | 名詞,副詞可能,*,* | false | [6,8) | 今日 |
| repeated | 。 | 。 | 記号,句点,*,* | false | [8,9) | 。 |
| repeated | 図書館 | トショカン | 名詞,一般,*,* | false | [9,12) | 図書館 |
| repeated | 。 | 。 | 記号,句点,*,* | false | [12,13) | 。 |
| repeated | 図書館 | トショカン | 名詞,一般,*,* | false | [13,16) | 図書館 |
| repeated | 。 | 。 | 記号,句点,*,* | false | [16,17) | 。 |
| unicode | 😀 | ∅ | 記号,一般,*,* | true | [0,2) | * |
| unicode | 今日 | キョウ | 名詞,副詞可能,*,* | false | [2,4) | 今日 |
| unicode | \r\n  | ∅ | 記号,空白,*,* | true | [4,7) | * |
| unicode | 今日 | キョウ | 名詞,副詞可能,*,* | false | [7,9) | 今日 |
| unicode |   | ∅ | 記号,空白,*,* | true | [9,10) | * |
| unicode | 辻 | ツジ | 名詞,固有名詞,人名,姓 | false | [10,11) | 辻 |
| unicode | 󠄀 | ∅ | 記号,一般,*,* | true | [11,13) | * |
| unicode | 不 | フ | 接頭詞,名詞接続,*,* | false | [13,14) | 不 |
| unicode | ︀ | ∅ | 記号,空白,*,* | true | [14,15) | * |
| unicode | 𠮷 | ∅ | 記号,一般,*,* | true | [15,17) | * |
| unicode | 野 | ノ | 名詞,一般,*,* | false | [17,18) | 野 |
| unicode | さん | サン | 名詞,接尾,人名,* | false | [18,20) | さん |
| unicode | 。 | 。 | 記号,句点,*,* | false | [20,21) | 。 |
| unicode | 今日 | キョウ | 名詞,副詞可能,*,* | false | [21,23) | 今日 |
| unicode | 。 | 。 | 記号,句点,*,* | false | [23,24) | 。 |
| whitespace |    | ∅ | 記号,空白,*,* | true | [0,2) | * |
| whitespace | 今日 | キョ�� | 名詞,副詞可能,*,* | false | [2,4) | 今日 |
| whitespace | \t | ∅ | 記号,空白,*,* | true | [4,5) | * |
| whitespace | 図書館 | トショカン | 名詞,一般,*,* | false | [5,8) | 図書館 |
| whitespace | \n\n | ∅ | 記号,空白,*,* | true | [8,10) | * |
| whitespace | 今日 | キョウ | 名詞,副詞可能,*,* | false | [10,12) | 今日 |
| whitespace | 　 | 　 | 記号,空白,*,* | false | [12,13) | 　 |
| whitespace | 宇宙 | ウチュウ | 名詞,一般,*,* | false | [13,15) | 宇宙 |
| whitespace | 。 | 。 | 記号,句点,*,* | false | [15,16) | 。 |
| unknown | ヌポラ | ∅ | 名詞,固有名詞,一般,* | true | [0,3) | * |
| unknown | 漢 | カン | 名詞,固有名詞,地域,国 | false | [3,4) | 漢 |
| unknown | 𠮷 | ∅ | 記号,一般,*,* | true | [4,6) | * |
| unknown | ヌポラ | ∅ | 名詞,固有名詞,組織,* | true | [6,9) | * |

## 実行配布物のSHA-256

| ファイル | bytes | SHA-256 |
|---|---:|---|
| vendor/kuromoji/package/dict/base.dat.gz | 3956825 | 0803327762e1c93ca731e4319ab8343340f2806bb84941207782cde9d2d5a8eb |
| vendor/kuromoji/package/dict/check.dat.gz | 3111633 | 193ae0035fff6fe812b58d9ee730e7a7d7ee601d918481ce51075c58114f6cc9 |
| vendor/kuromoji/package/dict/cc.dat.gz | 1692067 | 02b7631be0d4de3a1a75cd9f9cc51536e4f94c9e6b389b813e06ba0f6e7de765 |
| vendor/kuromoji/package/dict/tid.dat.gz | 1605820 | d43d831cb6fb0f0a411739cd287a6d5e998e121a8daca614df14a81a0dcac586 |
| vendor/kuromoji/package/dict/tid_map.dat.gz | 1485576 | 33efd5ffd87a70f669add093fa39dee44341d58f940844ef107c8fd98bb795b2 |
| vendor/kuromoji/package/dict/tid_pos.dat.gz | 5916009 | 60dbfc99a6ab993f30c5dab648bec6ad7f9aaefa5c14e1843837d95e509f8895 |
| vendor/kuromoji/package/dict/unk.dat.gz | 10512 | f7f991cdeb9bfd3e9c0e4577cc50ee0815a11c508cccd444a9d3ab3c81521100 |
| vendor/kuromoji/package/dict/unk_char.dat.gz | 306 | 9a8e86fd9aff32d323fbb59f5a7006f05927a11f8173c90712cc56293aeb3225 |
| vendor/kuromoji/package/dict/unk_compat.dat.gz | 338 | 50f60aa29bc2e86c2903ab8c825bb6fa604d2b294d96941c1d3924259791899d |
| vendor/kuromoji/package/dict/unk_invoke.dat.gz | 1140 | 6b210889548457c3006913afd12c8b525562255f2709e404604be9614a25e94c |
| vendor/kuromoji/package/dict/unk_map.dat.gz | 1190 | 6df12460e5477230bb6fd9641def918b699fc0a8868016b6c9f794488630509b |
| vendor/kuromoji/package/dict/unk_pos.dat.gz | 10540 | 5b183a29f281acc7e0542beca47b83f7985047c0a2d27e78a66f32276be5ad11 |
| vendor/kuromoji/package/build/kuromoji.js | 307967 | ab0ac10f1c4a9b5e246e63e57b04ba14d3a6148cd7e8d62cb97a960d4f85a3e6 |
| vendor/ipadic/lindera-ipadic/metadata.json | 779 | 305addfbf05e41d985a1541035c79a7b6f8ae254e4bc94f1721be21adf31068f |
| vendor/ipadic/lindera-ipadic/dict.trie | 4587532 | b176188057bbd78fa73c2161db1f00fbabf9afbc3471732c4b549bf707413dfb |
| vendor/ipadic/lindera-ipadic/dict.valsidx | 1303480 | f1b17f1c4682a5bd42dabe95ab7cefb461c888b839a18d213dd5c7133d3a1a76 |
| vendor/ipadic/lindera-ipadic/dict.vals | 3921250 | 62af946542a17c4f16cf1122cb069b5d26f7cf652066b3b846cc4c230b6a8aa1 |
| vendor/ipadic/lindera-ipadic/dict.wordsidx | 1568504 | a38e0b55d6e0fa67555078f8beb6f634f264b2a6b2ea2c9a7aa111f085ada721 |
| vendor/ipadic/lindera-ipadic/dict.words | 32674733 | fc1d924e12af84a352feccce35b772383322760ee2b3da4be0e173ad82953938 |
| vendor/ipadic/lindera-ipadic/matrix.mtx | 3463718 | 915733be6589bee90b8f2af5cd314c384a1f9a2fc3af498384555986447b168b |
| vendor/ipadic/lindera-ipadic/char_def.bin | 2360 | ef37cf70d7e72ec023bec8e632783a6fe255b2d5fd1bce22600b595fccae48b1 |
| vendor/ipadic/lindera-ipadic/unk.bin | 2492 | 3eeebe0ef3f8907be325aa3acb0ccbd4ccb6f5ac20ff3dd0742ff1af1c468da6 |
| vendor/lindera/package/lindera_wasm.js | 66542 | a9e082fca426d6d225a439bac39c9d690aa5176598d7c902ca71e1fe4ba8d03a |
| vendor/lindera/package/lindera_wasm_bg.wasm | 1784285 | 52f4b492f9dd0edf876b90d3432ae2284b2d996bf8e697327d1fc3b0277e6431 |
| vendor/lindera-wasm-6.2.0.tgz | 729848 | ed82e271e54a4bddaeeeddcbe8f69037c5d7dbbd6f273bd516cdb7325c866cdf |
| vendor/kuromoji-0.1.2.tgz | 21834991 | ccf8778839df92ae3a3d64a93998ac92d1e92c7f73fe6193295a5258c98308b4 |
| vendor/lindera-ipadic-6.2.0.zip | 10519550 | 5ed4bba6b429030b0387df67d40d5751d35dedef0306f4bac6d957cad5f04b72 |
