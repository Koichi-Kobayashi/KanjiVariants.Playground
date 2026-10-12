# 学年別ふりがな P2b（ローカル実装）

2026-10-12。P1の画面にLindera 6.2.0＋IPADICの自動読み推定を接続した。コミット・Push・デプロイは実施していない。開始時の作業ツリーは変更なし。本体・KanjiVariants 1.2.0参照・既存文字データ・P2a検証成果は変更していない。

## 利用方法と読みの扱い

Homeの「学年別ふりがな」で文章と小学1〜6年生までの学年を選び、「自動でふりがなを付ける」を押す。2,000 UTF-16単位上限、不正UTF-16の生成停止はP1と共通。入力文章は外部へ送信しない。

- `EducationKanjiDiagnostics.AnalyzeText`の累積配当と原表記判定をそのまま使う。表示・コピーのルビ範囲には必ず未習漢字が含まれる。全て既習の語の読みは保存し、学年変更時に再利用する。
- 「今日」「大人」「図書館」「宇宙」は単語の読みを保持する。「大人」は小学1年までで両字が既習なので、読みを取得してもルビを表示しない。
- 「読み」「生きる」などは漢字の連続した接頭部＋かなの接尾部で、推定読みの末尾が原文のかなと完全に一致する場合のみ送り仮名を除く。漢字数による読み分割はしない。内部にかなを含む場合など、安全に分離できない語は単語全体を候補とする。
- 未知語・読みなし・VSで論理単位の境界が合わない場合は推測せず要確認。未知の「髙」「𠮷」の隣の既知字だけに誤った読みを付けないよう、同じ漢字連続範囲全体を保留する。
- UTF-8バイト位置をUnicodeスカラーの境界表でUTF-16へ変換し、原文部分文字列・単調性・非重複を検証する。位置不正の解析は手動設定以外の自動採用を全体で止める。同じ表記の検索による位置の補完はしない。
- 自動推定は「自動推定・未確認」、利用者の編集・確認は「手動確認済み」と区別する。固有名詞には個別の確認メッセージも付ける。辞書に載る誤解析は検出できないので、全自動結果を確定読みとして扱わない。
- 枠の文字を選んで既存の欄で修正できる。一操作で一字ずつ分割、隣接漢字を結合できる。分割・結合後の空読みも手動設定として自動再実行で保護するが、表示上は「要確認・読み未入力」とする。
- 手動設定は原文版・開始位置・長さ・対象表記に保持し、別出現へコピーしない。変更した原文に旧設定を無条件適用しない。旧版は別の折りたたみ欄に隔離し、編集・コピー不可。同じ版の再生成と画面切り替えでは保持する。
- 自動解析中の原文変更はリクエスト番号・原文版・原文一致によって旧応答を破棄する。学年だけの変更は現在学年の診断に結果を適用する。処理中の手動編集も上書きしない。
- Razorで構造化範囲から`ruby/rt`を生成する。`MarkupString`は使用しない。空白・改行・補助文字・VS・HTML特殊文字を原文通り保つ。表示OFF・全て既習・未入力の範囲はコピーに読みを加えない。

## 責務と配信

| 部分 | 責務 |
|---|---|
| FuriganaService / Document | 既存API診断、範囲・手動編集、入力検証 |
| FuriganaSession | 原文版、学年、表示状態、解析応答の採用条件 |
| IReadingAnalyzer / LinderaReadingAnalyzer | 交換可能なUTF-16トークン契約、遅延JS interop |
| furigana-client.js | 単一Worker・初期化共有・依頼番号・タイムアウト・失敗時再試行 |
| furigana-worker.js | 固定WASMと辞書取得、gzip展開、SHA-256確認、位置変換、解析 |
| FuriganaAutomaticPlan | 手動優先、送り仮名の安全な切り分け、未知語・境界保留 |
| FuriganaPresentation / Preview / Panel | 共通表示・コピー規則、Razor描画、編集UI |

JSモジュール・Worker・辞書は自動生成の初回にだけ取得する。辞書を要しない変換・診断・詳細表示やP1手動編集では読み込まない。漢字のない文章もエンジンを起動しない。初期化済みTokenizerをWorker内で再利用。失敗・120秒タイムアウトではWorkerを破棄して次の要求で再試行できる。URLsは`NavigationManager.BaseUri`と`import.meta.url`を基準にする。

固定配布物は`wwwroot/furigana/lindera-6.2.0`に同梱。追加NuGet、形態素解析用.NET DLL、サーバー解析APIはない。`scripts/Prepare-FuriganaAssets.mjs`はP2aの固定vendorから配布物を作成する保守用スクリプト。通常ビルドは同梱済みファイルを使用するため、ignoredな実験vendorに依存しない。zip・WASM・glueの固定SHA-256、圧縮辞書と展開後のSHA-256はmanifestとJS Checksで確認する。

| サイズ | bytes（10進） |
|---|---:|
| WASM（HTTP圧縮なし） | 1,784,285 |
| WASM glue JS | 66,542 |
| gzip辞書9ファイル | 11,510,702 |
| 辞書の展開後 | 47,524,848 |
| エンジン＋辞書のbody合計、圧縮交渉なし | 13,361,529 |
| 通知とmanifestを含む同梱14ファイル | 13,369,875 |

HTTP `Content-Encoding`に依存せず、`.gz`辞書をWorker内で明示展開する。ブラウザの`DecompressionStream`・Web Worker・WebAssembly・WebCryptoが必要。HTTPキャッシュは配信元の方針に従う。同じページの再実行では辞書を再取得しない。Service Worker・永続辞書キャッシュ・完全オフライン起動は今回追加していない。P2aのgzip全資産12.23MB測定はWASM/JSもHTTP圧縮した別条件であり、今回の13.36MBと混同しない。

## 検証

- Release build：警告0・エラー0。Release publish成功。環境に`wasm-tools`がないため、追加WASM最適化なしとのSDK通知あり。
- 既存コンソールChecks＋追加Checks：2,333件成功。学年境界・表示OFFコピー・全既習・手動優先・空読み保護・処理中編集・旧リクエスト破棄・送り仮名・未知語近傍・VS/補助漢字・HTML特殊文字など。P2a実トークン23文章を全学年で再利用し、原文・範囲・未習字条件を検証。
- JS Checks成功：UTF-8→UTF-16境界、誤位置・重複・不正UTF-16、遅延起動・初期化共有・再利用・失敗後再試行、配布ファイルのSHA-256とgzip展開後の整合、通知同梱。
- 実際のPlaygroundでボタンだけの生成を確認。「今日→きょう」「図書館→としょかん」「宇宙→うちゅう」「読みます→読（よ）みます」。既習「大人」「生」はルビなし。
- 実画面で「今日→こんにち」へ手動修正し、再生成・画面切り替え後にも保持。同じ文章の別の「今日」は「きょう」のまま。
- 実画面で初回解析開始直後に原文を「宇宙」へ変更し、旧版が隔離され「旧結果を破棄しました」となることを確認。再実行で「宇宙→うちゅう」を表示。その読みを手動で空にして再生成しても補充されず、「要確認・読み未入力」となることを確認。
- 実コピーを文章入力欄へ貼り付けて確認：手動修正＋自動読みの括弧付き出力、小学6年では原文のみ、表示OFFは原文のみ、未知語・VSは読みを加えず、改行・`<>&😀`を保持。貼り付けによる原文変更では旧版の隔離も確認。
- Release publishの`/KanjiVariants.Playground/`静的配信で起動・Worker取得・辞書取得・自動生成を確認。ローカル配信ログで、変換・診断・詳細表示の段階では辞書要求なし、初回自動生成でのみ取得、再生成で追加要求なし。
- 既存画面：髙橋𠮷野→高橋吉野の変換、髙橋の診断、髙の詳細展開を確認。
- 1100pxと390pxでライト・ダークを確認。画面全体の証跡はignoredな`artifacts/furigana-p2b-{desktop,mobile}-{light,dark}.png`。モバイル幅はPCブラウザの表示幅検証であり、実機性能ではない。
- `Verify-Pages.ps1`の静的参照検証成功。`Verify-FuriganaRedistribution.ps1`は未解決条件を示して公開停止することを確認。

再実行：

```powershell
dotnet build -c Release
dotnet run --project tests/KanjiVariants.Playground.Checks -c Release
node --experimental-default-type=module tests/KanjiVariants.Playground.Checks/FuriganaWorkerChecks.mjs
dotnet publish src/KanjiVariants.Playground -c Release -o artifacts/furigana-p2b-publish
./scripts/Prepare-Pages.ps1 -PublishRoot artifacts/furigana-p2b-publish/wwwroot
./scripts/Verify-Pages.ps1 -PublishRoot artifacts/furigana-p2b-publish/wwwroot
node scripts/Serve-Pages.mjs artifacts/furigana-p2b-publish/wwwroot
```

## 残課題と公開条件

**同日の後続検証更新:** [自前WASMビルド検証](../experiments/furigana-self-build/REPORT.md)で、固定v6.2.0/lockの`--locked`ビルド・別targetでの出力一致・公式JS/API/23文章tokenの一致・自前版の実画面動作を確認した。最新Release publishへの27通知同梱・全ハッシュ一致も確認済み。本番の公式WASMは維持し、来歴未証明による公開停止条件は変更していない。自前ビルド成功を完全SBOMの証明として扱わない。

**2026-10-12の後続監査:** 以下はP2b実装時点の課題記録です。[公開前ライセンス監査](FURIGANA-LICENSE-AUDIT.md)でIPADIC版表記とkanaria 0.2.0の配布ソース対応を照合し、MIT全文を含む必要通知を補いました。限定した固定ソース依存範囲では既知の通知不足は解消しました。npm WASM実ビルドとの全依存対応・SBOM完全性は未証明で、追加・相違依存の通知網羅性が未確定のため、公開承認は引き続きfalseです。完全SBOMをライセンス本文の義務とする判断とは区別しています。同梱サイズ表の14ファイルは監査前の測定値で、追加通知は初期画面や解析時には読み込みません。

LinderaのMIT全文と配布辞書のIPADIC NOTICE（NAIST・ICOT条件）を同梱し、ライセンス画面から参照できる。**公開可能とは判断していない**。P2aから残る以下2点を解決し、必要な通知を揃えるまでmanifestの承認はfalseとし、Pages workflowはpublish前に停止する。

1. v6.2.0の辞書build.rsが参照する原典20250920と、配布辞書NOTICE内20070801の表記の照合・配布元確認。
2. WASMに含まれるRust第三者crateの通知の最終確認。

根拠と取得経緯は[P2a REPORT](../experiments/furigana-p2a/REPORT.md)・[MEASUREMENTS](../experiments/furigana-p2a/MEASUREMENTS.md)・[README](../experiments/furigana-p2a/README.md)。今回これらの結論を公開承認へ変更していない。

モバイル実機の初期化時間・ピークメモリ・入力上限での操作応答、Safari/Firefoxの実動作、低速通信・キャッシュ破損・通信中断の実ブラウザ試験は未実施。P2aのWorker初期化中央値278.4ms、2,000単位解析20.6ms、WASM linear memory約97MBは別の検証プログラムの測定で、今回のBlazor統合画面の性能保証ではない。辞書展開中には圧縮・展開バッファが並存する。

IPADICの文脈読み誤り（一日・人名・人気等）は残る。読みの確信度は提供されないため、未知語以外の誤りを自動で保留する保証はない。全自動読みを未確認として表示し、利用者が修正・確認できるようにした。範囲を細かく分割した後の読み直しは操作が増えるため、初期生成を語単位にしてこの操作を必要時だけにした。将来は範囲選択と読み確認の一括操作、可視範囲への編集欄の誘導などを検討できる。P3の永続保存・HTMLリッチコピー・個人既習漢字は追加していない。
