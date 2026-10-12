# 自動ふりがな P2a 技術検証結果

2026-10-12。P2aのみ。本番画面・本番依存・配信物は変更していない。コミット・Push・デプロイなし。

## 判断

**P2bの第一候補はLindera WASM 6.2.0＋同版IPADIC。条件付きの選定であり、採用確定ではない。**

両エンジンを同じ実ブラウザで動かし、一般語の読みと原文位置は同程度だった。kuromoji.jsは解析単体で速いが、Linderaは転送量が約31.5%少なく、初期化は約5.3倍速かった。2,000 UTF-16単位の解析差は約10msで、今回の入力上限では初期化と配信の差を重視する。Linderaの「髙橋」は語全体を未知語にし、kuromojiの「髙」＋「橋→キョウ」の誤部分読みより要確認に誘導しやすい。

P2b前の条件は、モバイル実機のメモリ・安定性、Lindera辞書の原典版とNOTICE表記の照合、WASM内依存コードの第三者通知の最終確認。自動読みを正解として固定せず、手動修正と要確認を残す。

## A. 実験環境・固定版

| 項目 | 確認値 |
| --- | --- |
| OS | Windows 11 Pro、10.0.28000、64bit |
| CPU | AMD Ryzen 7 5700U with Radeon Graphics |
| ブラウザ | Codex In-app BrowserのChromium、UAにChrome/155.0.0.0。内部の完全なビルド番号は未取得 |
| ブラウザ申告 | hardwareConcurrency 16、deviceMemory 32。後者は実RAM測定ではない |
| .NET SDK | 10.0.401 |
| 独立Blazorアプリ | net10.0、Microsoft.AspNetCore.Components.WebAssembly 10.0.12 |
| 学年診断 | 既存NuGetキャッシュのKanjiVariants 1.2.0 DLLを直接参照した独立CLI |
| Lindera | npm lindera-wasm 6.2.0、gitHead 0482efcc46b5ec518b7238efae55e9fed9bba0c0 |
| Lindera辞書 | 公式v6.2.0 Releaseのlindera-ipadic-6.2.0.zip、metadata format_version=2 |
| kuromoji | npm kuromoji 0.1.2、gitHead d0357c1427acb912815fc8ab59f284dd08bad0fa |
| kuromoji辞書 | パッケージ同梱IPADIC、NOTICEにmecab-ipadic-2.7.0-20070801 |
| 配信 | ローカルlocalhost:5175、/KanjiVariants.Playground/experiments/furigana-p2a/ |

Lindera v6.2.0の固定README・Cargo.toml・build.rsとnpm artifactを確認。mainブランチは使用していない。npmのSHA-512 integrityを照合した。Lindera辞書のSHA-256は公式Release掲載値と一致。配布物すべての実サイズ・SHA-256は[MEASUREMENTS.md](MEASUREMENTS.md)に記載。

| 配布物 | SHA-256 |
| --- | --- |
| lindera-wasm-6.2.0.tgz | ed82e271e54a4bddaeeeddcbe8f69037c5d7dbbd6f273bd516cdb7325c866cdf |
| lindera-ipadic-6.2.0.zip | 5ed4bba6b429030b0387df67d40d5751d35dedef0306f4bac6d957cad5f04b72 |
| kuromoji-0.1.2.tgz | ccf8778839df92ae3a3d64a93998ac92d1e92c7f73fe6193295a5258c98308b4 |

公式根拠: [Lindera固定WASM](https://github.com/lindera/lindera/tree/v6.2.0/lindera-wasm)、[Release](https://github.com/lindera/lindera/releases/tag/v6.2.0)、[辞書build.rs](https://github.com/lindera/lindera/blob/v6.2.0/lindera-ipadic/build.rs)、[kuromoji 0.1.2](https://www.npmjs.com/package/kuromoji/v/0.1.2)、[kuromojiソース](https://github.com/takuyaa/kuromoji.js/tree/d0357c1427acb912815fc8ab59f284dd08bad0fa)。

## B. 動作検証

| 項目 | Lindera | kuromoji |
| --- | --- | --- |
| mainスレッドで起動・読み取得 | 成功 | 成功 |
| module Web Workerで起動・読み取得 | 成功 | 成功。bundleのselfとWorkerのXMLHttpRequestを使用 |
| 独立BlazorからIJSRuntimeで呼出 | 成功 | 成功 |
| 複数回の解析・初期化promise再利用 | 成功 | 成功 |
| 入力版変更後の旧結果破棄 | probe内の模擬版変更で成功 | 同左 |
| Worker終了によるキャンセル | 成功 | 成功 |
| Worker再作成・辞書再初期化 | 成功 | 成功 |
| Pagesと同じサブパスで静的配信 | ローカルで成功 | ローカルで成功 |
| GitHub Pagesの実CDN配信 | 未検証 | 未検証 |

独立BlazorアプリのReleaseビルドは警告0・エラー0。実際の返却token、同一結果、キャンセル、旧結果破棄、再試行はresults/interop-*.jsonに保存。これはP1の画面に統合した検証ではない。

実験ページはクリック前にエンジンや辞書を取得しない。クリックで動的importし、その後辞書を取得する。Worker版も同じ順序。外部解析API、CDN、外部フォントは使用しない。結果のJSONだけをローカル実験サーバーへ保存する。

初期のサーバー403は実験サーバーのWindowsパス比較を修正して解消。Linderaの初期probeのnull pointerは、Tokenizer constructorがDictionaryの所有権を消費した後にfreeを呼んだ二重解放を修正して解消。測定結果は修正後の成功系列を使用した。

## C. 読み精度

指定14例、送り仮名3例、文章内・反復3例の20評価例で、両者とも期待読み15、誤読3、読み欠落を含む未知語2。これは小さな固定例集合で、一般文章への正答率を意味しない。許容する別読みだけに一致した例は今回なかった。

| 入力 | 両者の実出力・差 | 評価 |
| --- | --- | --- |
| 今日、明日、大人、図書館、宇宙、生きる | きょう、あした、おとな、としょかん、うちゅう、いきる | 期待読み |
| 人気がある | にんきがある | 期待読み |
| 人気がない場所 | にんきがないばしょ | 許容。ひとけの意味を排除しない |
| 一日中 | 一/日/中 → いち/にち/ちゅう | 誤読・目的に不適切な分割 |
| 五月一日 | 五月/一/日 → ごがつ/いち/にち | 日付の読みとして誤り |
| 五月雨 | 一語でさみだれ | 期待読み |
| 指定の長文 | きょうはとしょかんでおとなとうちゅうのほんをよみます。 | 期待読み |
| 高橋さんと髙橋さん | 高橋はタカハシ。Linderaは髙橋全体が未知語。kuromojiは髙が未知語、橋をキョウ | 読み欠落。kuromojiは既知の部分も誤読 |
| 𠮷野さん | 𠮷が未知語、野がノ | 人名全体の読みは未取得 |
| 五月一日に五月雨が降った。一日中雨だった。 | 日付はイチニチのまま。一日中は一語でイチニチジュウに変化。ただし雨→ウ | 文章内で分割・読みが変わる。全体は誤読 |

**既知語でも「雨→ウ」「橋→キョウ」のような誤解析がある。KNOWN/isUnknown=falseを正解確率には使わない。** 文章内「一日中」の改善も、常に正しくなる保証ではない。

各入力の実トークン、読み、品詞、未知語、辞書形、位置を[MEASUREMENTS.md](MEASUREMENTS.md)に全件記録した。raw token JSONはignoredのresults/へ保存。invalid UTF-16は表示資料では置換表示になるが、入力JSONとraw結果では孤立サロゲートのエスケープと拒否を記録している。

送り仮名の実データは両者一致:

| 入力 | 表層token | 辞書形 | 読み | 保守的な部分ルビ候補 |
| --- | --- | --- | --- | --- |
| 生きる | 生きる | 生きる | イキル | 生→い、きるはそのまま |
| 読みました | 読み / まし / た | 読む / ます / た | ヨミ / マシ / タ | 読→よ、みましたはそのまま |
| 行った | 行っ / た | 行く / た | イッ / タ | 行→い、ったはそのまま |
| 食べました | 食べ / まし / た | 食べる / ます / た | タベ / マシ / タ | 食→た、べましたはそのまま |

alignment-checks.mjsで実tokenと本体の論理単位を照合し、末尾かなが読み末尾と一致する限定パターンを検証した。漢字だけの今日・大人・図書館・宇宙は語全体を維持し、一字読みを捏造しない。語内部のかな・複数の対応・連濁等の一般的なアラインメントは未実装。部分読みが取れても、推定読みそのものの正しさを証明したことにはならない。

## D. 位置情報・学年診断との連携

- LinderaのbyteStart/byteEndはUTF-8 bytes。原文のUnicode scalarを順に走査し、byte境界→UTF-16境界のMapを作る。
- kuromojiのword_positionは今回の実出力で1始まりのscalar位置。サロゲートペアを含む原文を順に走査してUTF-16へ変換する。
- 同一語の文字列検索、indexOfによる位置推測、原文の正規化は使用しない。
- 表層形と原文substringの一致、境界、順序、重複なしを検証する。改変した位置や表層形は拒否する。
- 句読点・同語反復・空白・改行・絵文字・補助漢字を含む23有効例で、原文substringの不一致は両者0。kuromojiの句読点越し加算については今回不具合を再現しなかったので、独自の句分割補正は採用しない。
- LinderaはASCII空白・LF等を省くことがある。tokenの連結で元文を作らず、原文に対してspanだけを適用する。省略された隙間も正しく保持するチェックが成功。
- 両者ともIVS/SVSを別tokenとして分ける場合がある。原文substringが一致していても、KanjiVariantsの「基底文字＋VS」の論理単位境界と一致しないtokenはルビ候補を拒否する。
- 不正UTF-16はUTF-8エンコード前に拒否。エンジンが不正入力を安全に扱うことは検証していない。

本体の実APIから23例×6学年の診断JSONを生成して、各tokenと未習位置を照合した。「今日」は学年1で一部未習の語全体候補、学年2以上はルビなし。「大人」「生」は学年1ですでに既習なので読みが得られてもルビを付けない。学年6では指定長文の候補がなくなる。VS付き表現と髙・𠮷は本体の原表記判定を維持する。

一日中・五月一日の字は今回の学年1で既習なので、この機能では誤推定しても自動ルビを付けない。ただし読み推定器の弱点として記録する。氏名の「橋→キョウ」は未習字にも影響するため、未知漢字を含む連続漢字範囲全体を要確認にする必要がある。未知tokenだけを拒否し、隣の既知tokenを無条件に採用してはいけない。

実browser出力に対するchecks.mjsは9,807チェック成功（系列反復を含む数で、独立した9,807種類の文章ではない）。人工的な位置破損、同語の重複位置、UTF-8非境界、manual優先も確認した。

## E. 配信・性能・メモリ

数値は10進MB。coldはno-store付きURLでbrowser cacheを使わない。固定vendorを圧縮前生成したローカルサーバーがgzipで配信。各main/Workerは5回、交互に順序を変える。warmは3回で最初をprimeとして含む。今回warm-0も既存browser cacheから取得し、3回ともvendor転送0になった。辞書インスタンスは各iframe/Workerで新しく作る。

| 対象 | Lindera | kuromoji |
| --- | ---: | ---: |
| JavaScript raw | 66,542 bytes | 307,967 bytes |
| WASM raw | 1,784,285 bytes | なし |
| 辞書raw / 展開後 | 47,524,848 bytes（9files） | 100,260,388 bytes（12files） |
| 辞書配布ファイル合計 | 同上 | gzip済み17,791,956 bytes |
| エンジン＋辞書raw換算 | 49.38 MB | 100.57 MB |
| gzip配信body合計 | 12.23 MB | 17.86 MB |
| Brotli生成物合計 | 8.23 MB | JSは54,202 bytes。gzip辞書への再圧縮は未採用 |
| 実browser転送（gzip、Resource Timing） | 12,232,376 bytes | 17,863,188 bytes |
| HTTP圧縮なしの実転送（各1回） | 49,378,975 bytes | 18,103,823 bytes（辞書は元々gzip） |
| browser cache使用時のvendor転送 | 0 bytes | 0 bytes |

転送値はResource TimingのtransferSizeで、header分も報告値に含む。TCP/TLSのパケット計測ではない。実験HTML、テストfixture、Worker橋渡しコード、Blazorランタイムは上表のvendor合計に含めない。初期画面のアプリサイズに辞書を足した値ではなく、操作時の追加負荷である。

| 時間・中央値ms | Lindera main | kuromoji main | Lindera Worker | kuromoji Worker |
| --- | ---: | ---: | ---: | ---: |
| cold初期化（Worker起動を除く） | 294.1 | 1572.4 | 278.4 | 1600.6 |
| cold呼び出し側からの初期化 | 294.4 | 1572.7 | 298.3 | 1620.6 |
| warm初期化（各3回） | 248.9 | 1453.3 | 未計測 | 未計測 |
| 最初の「今日」解析 | 2.5 | 1.5 | 2.6 | 1.6 |
| 次の「今日」解析 | 0.3 | 0.3 | 0.1 | 0.3 |
| 20 UTF-16単位の再解析 | 0.3 | 0.2 | 0.3 | 0.2 |
| 500 UTF-16単位の再解析 | 5.4 | 2.7 | 5.4 | 2.9 |
| 2,000 UTF-16単位の再解析 | 20.0 | 10.0 | 20.6 | 10.8 |

解析時間はreading/detailsを含むtokenizeの純処理。各長さ11回×5初期化の55サンプルをプールした中央値。UTF-16変換・妥当性確認を加えると2,000単位でmain 25.7 / 14.2ms、Worker 26.0 / 15.2ms。RPCと検証前処理を含む実験benchmark呼出全体ではWorker 33.0 / 20.8ms。ただしbenchmarkの返却はtoken数と時間が中心で、全文tokenをBlazorへ戻す転送コストはこの数字と異なる。

Lindera mainの内訳中央値はJS import 19.9、WASM取得24.3、WASM初期化6.3、辞書取得195.0、辞書構築32.4ms。各内訳の中央値の和は総中央値と一致しない。HTTP gzip展開はbrowser内で実施され、辞書取得から分離した直接時間は測れていない。

kuromoji mainはJS import 31.8、辞書取得＋展開＋構築1540.0ms。元bundleを変更しない測定を主系列とした。別の計測用コピーでdecompressの開始終了だけを計測し、3回の展開処理合計中央値は1400.1ms。非圧縮HTTP配信でも辞書gzipのJS展開は残る。個々のXHRのresource durationは、他のXHR callbackの同期展開に待たされるため、取得・展開・構築を独立した加算時間として扱わない。

Worker版kuromojiの初期化範囲は1551.7〜5475.0msで外れ値がある。中央値だけで安定性を保証しない。mainでは初期化・連続benchmarkによるLong Taskが両者で観測された（各run最大の中央値534 / 891ms）。これは測定ループの連続実行も含む。Worker系列の呼び出し側には当該Long Taskを観測せず、UIから重い処理を隔離できた。実際の一回の解析が534msかかるという意味ではない。

### メモリ

| mainのcold-0観測値 | Lindera | kuromoji |
| --- | ---: | ---: |
| 初期化前JS used heap | 154.92 MB | 67.23 MB |
| 初期化直後JS used heap | 59.51 MB | 197.39 MB |
| benchmark終了後JS used heap | 70.81 MB | 206.81 MB |
| 初期化後WASM linear memory | 97,124,352 bytes | なし |

JS値は非標準performance.memoryの観測値で、同originのiframe、親ページ、GCの影響を含む。初期化前より後が減っており、差分をエンジン単体の使用量とみなすことはできない。WorkerではJS heap APIがなかった。LinderaのWorker linear memoryは取得でき、解析後も97,124,352 bytesだった。linear memoryの予約領域を実際の生存オブジェクト量とは呼ばない。

measureUserAgentSpecificMemoryはこのbrowserでは利用不可、crossOriginIsolated=false。OSプロセスメモリと真のpeakは未測定。Linderaでは47.52MBの取得bufferとWASM領域の共存、kuromojiでは100.26MBの展開bufferと辞書構造があるため、スマートフォンでの実測を採用条件にする。デスクトップJS値だけで「Linderaは省メモリ」と断定しない。

## F. ライセンス・再配布

| 対象 | 確認と必要通知 |
| --- | --- |
| Linderaエンジン | npm package LICENSEはMIT。著作権と許諾全文を保持 |
| Lindera IPADIC | zip内NOTICE.txtにNAIST著作権・許諾・免責、ICOT由来条件。dictionaryと一緒に配布 |
| kuromojiエンジン | LICENSE-2.0.txtとNOTICE.md。Apache-2.0、著作権・NOTICEを保持 |
| kuromoji IPADIC | NOTICE.mdのNAIST・ICOT条件を保存。エンジンのApacheだけで扱わない |
| 計測用kuromojiコピー | 変更内容を先頭に明示。元LICENSE/NOTICEを保持し、mainの採用用artifactには使用しない |

GitHub Pagesは利用者への再配布になる。Webでライセンス一覧を読めるようにし、dictionaryとNOTICEを同じversionとして固定する。辞書をアプリのMITライセンスに置き換えない。

**確認事項:** Lindera v6.2.0 build.rsはmecab-ipadic-2.7.0-20250920を指定するが、配布NOTICEは20070801を記載する。公式ZIPの由来は固定できたが、原典の変更範囲・追加著作権・NOTICE更新の必要性を保守元に照合する必要がある。今回禁止条項や再配布禁止は見つかっていないが、最終配布通知の確定は未完了。WASMにリンクした第三者crateの完全な通知監査・SBOMも未実施。

固定版source READMEとnpm READMEの内容は一致した。再現ビルドをしてWASM bytesをソースから再生成した検証ではなく、公式公開artifactのintegrity・版・API・辞書formatを照合した検証である。

## G. 比較・推奨

| 観点 | Lindera | kuromoji |
| --- | --- | --- |
| 固定例での読み | 同程度。日付・氏名に弱い | 同程度。未知字の隣の橋を誤読 |
| 位置整合 | UTF-8変換が必要。実例で一致 | scalar変換が必要。実例で一致 |
| 原文の空白 | tokenにない隙間を保持する必要 | 空白tokenを含む場合が多い |
| VS | 本体論理単位と不一致なら拒否 | 同左 |
| cold初期化・転送 | 今回有利 | 解析単体は約2倍速いが初期負荷大 |
| メモリ | WASM約97MB、総使用量未確定 | 展開辞書100MB、Worker総使用量未確定 |
| 保守 | 2026年の固定Release、公式WASM | 固定版0.1.2は2018年。純JSは単純 |
| 配布管理 | 固定版sourceとNOTICE版表記の確認が必要 | 長く使われているNOTICEが同梱 |

読み・位置の重大問題を速度で相殺しない。未知漢字周辺を要確認にする安全規則を共通で導入する。条件が満たせなければ、Linderaを採用確定せずP2b着手前に追加検証する。

## H. P2b設計案（今回は未統合）

1. IReadingAnalyzerはInitializeAsyncとAnalyzeAsyncを持ち、共有DTOにUTF-16開始・長さ、表層読み、品詞、未知語、engine/dictionary版を返す。学年を渡さず、学年変更では解析を再実行しない。
2. Blazor scopedサービス→動的module import→Workerを一つ保持。初期化Promiseを共有し、失敗時だけ破棄・再試行。辞書bufferはJS/Worker側に保持しC#にコピーしない。
3. 生成ボタンを押した時だけ初期化。取得中・初期化中・解析中・失敗・再試行の状態を表示。初期化失敗でもP1手動編集は使える。
4. Workerはrequest IDと原文revisionを付ける。原文が変わった結果を破棄。軽いキャンセルは結果破棄、強い中断はWorker terminate＋辞書再初期化。同期tokenize中にAbortSignalだけで止められるとは扱わない。
5. 原文とEducationKanjiDiagnosticsのItemsを保持。UTF-16へ変換したtokenの表層一致・非重複・論理単位境界を検証。不一致のtokenは要確認、隙間は原文のまま。
6. 未習字のない語にはルビなし。末尾かなの一意対応だけ部分化し、漢字だけの熟語は語全体候補。読み不明、未知漢字を含む連続漢字範囲、固有名詞・曖昧語は確認を促す。UNKNOWNの隣のKNOWNにも注意する。
7. 手動読みをorigin=manualとして原文版・範囲・表記に紐づけ、自動更新で上書きしない。P1の範囲分割・結合、学年変更時の保持、旧版表示・コピーのガードを維持する。
8. 配布物は版とhashで固定し、辞書キャッシュキーにengine・format・dictionary版を含む。サブパスはmodule URL/Nav.BaseUriから解決。HTTP cacheだけではオフライン起動を保証しない。Service Worker/OPFSは今回未実装。

必要テスト: 今回の固定例、未知漢字周辺、VS・補助字・位置破損、全既習、学年変更、手動優先、同語の別出現、旧版・並行要求、初期化共有、失敗再試行・強制終了、copy ON/OFF、iOS/AndroidのIME・メモリ・ブラウザ互換、PagesのMIME・Content-Encoding・キャッシュ更新。

## I. Git状態・再現

開始時のGit状態はclean、HEADは278407a（P1コミット）。追加はexperiments/furigana-p2a/内だけ。既存trackedファイルのgit diffは空。KanjiVariants本体・NuGet版・P1・変換診断・CI・本番配信物に変更なし。新規ファイルは未追跡であり、commit/stageはしていない。

vendor、generated、results、bin、objは実験内.gitignoreで除外。辞書・パッケージ・raw測定JSON・一時ビルド出力をGit管理対象に含めない。説明・再現コード・測定表はexperiments内に残す。

再現手順はREADME.md。OS・回線・browser・cache状態で数値は変わる。今回のローカル転送速度をインターネット接続での初期化秒数に換算しない。実機モバイル、真のpeakメモリ、Pagesの圧縮配信、完全な通知監査、曖昧語の一般的な精度、一般送り仮名alignmentは未検証。
