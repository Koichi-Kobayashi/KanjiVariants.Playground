# Lindera 自前WASMの正式採用・検証記録

**2026-10-16更新:** 現行の認証・公開条件は[案Bの事後認証と公開ゲート](FURIGANA-ATTESTATION.md)を参照。以下は従来の採用・再ビルド記録として保持する。認証済みの現在構成ではPrepare-FuriganaAssets/Adopt/Recordの上書きを拒否するため、以下の旧コマンドをそのまま再採用に使わない。新しい成果物は別途レビューが必要。公開承認はfalseのまま。

2026-10-13。開始時`main` / `3045315`、作業ツリーclean、ステージ済み変更なし。公式npm WASMから検証済み自前版へローカル本番構成を移行した。公開承認、コミット、Push、デプロイは実施しない。旧公式版の監査・測定は削除せず履歴として保持する。

## 採用物と固定条件

**現行更新:** [ローカルパス除去・再現性改善](FURIGANA-PATH-NORMALIZATION.md)により、下記hashを正規化版へ更新。以下の当初採用・測定・再現性の記録は履歴として保持する。公開承認はfalseのまま。

| 項目 | 値 |
|---|---|
| Lindera/source commit | 6.2.0 / `0482efcc46b5ec518b7238efae55e9fed9bba0c0` |
| source archive | `https://github.com/lindera/lindera/archive/refs/tags/v6.2.0.zip` |
| archive SHA-256 | `f8aa68d5714f0fa17c793a8686d2fb7abef284e336c78c1895837e52c26613c4` |
| Cargo.lock SHA-256 | `6b30d175d6234ad39b8b969101af13834b28545f3eb9801e454002832db18d75` |
| Rust/Cargo | 1.98.1、Rust commit `48a229ceaefd4985c50990b14116b6d856af0985`、host x86_64-pc-windows-msvc |
| wasm-bindgen CLI | 0.2.126、Windows MSVC archive SHA-256 `5a3773c7e69cfb2d865e235e9210de184c8c3af1787720646ec1a8bbe09c6179` |
| target / features | wasm32-unknown-unknown / root追加なし、`--no-default-features`、transitive defaults維持 |
| Cargo options | `--release --locked --offline --message-format=json-render-diagnostics`、固定ソースのLTO、opt-level s、build-override opt-level 3 |
| 後処理 | wasm-bindgen `--target web --out-name lindera_wasm`、wasm-optなし |
| 配布WASM SHA-256 | `fbe6bf9a280f10f7e897fb88d997838c6c1bf1df20bf288ea3df23962a1897ba` |
| 配布JS SHA-256 | `a9e082fca426d6d225a439bac39c9d690aa5176598d7c902ca71e1fe4ba8d03a`（公式版と同一） |
| 来歴JSON SHA-256 | `e1fa48d4a5685f401a353281712d74619fd0231712ebce934fc3476c6374b686` |

実際の配布先は既存`wwwroot/furigana/lindera-6.2.0/`。JS interopとWorkerの公開API、サブパス相対URLは維持。manifestのbuildOrigin/self-build来歴とエンジンSHAを更新した。Workerは旧公式版のmanifest・未採用hashを初期化前に拒否する。公式npmへフォールバックしない。初回遅延ロード、再利用、失敗後再試行、UTF-8位置変換、キャンセル/旧結果破棄は既存処理を維持した。

IPADICの圧縮9ファイル・展開内容、KanjiVariants本体/1.2.0参照、既存漢字データ、学年判定・手動範囲・編集・コピー仕様は変更していない。アセット準備は辞書のraw/圧縮hashが基準から変わる場合にも停止する。

## 成果物管理と再ビルド

配信が必要なWASM/JS/辞書/通知/来歴JSON/固定lockをソース管理する。Pages CIでRustを毎回ビルドせず、チェックアウトされた採用済みバイト列を独立したpolicyのSHA-256と照合する。Rustのビルド成果物、CLI、archive、crate cache、compiler-artifact生ログ、検証サイト、スクリーンショットはignoredな`artifacts/`へ出力する。

Windows MSVCでの再ビルド手順:

```powershell
rustup toolchain install 1.98.1 --profile minimal --target wasm32-unknown-unknown
./scripts/Prepare-FuriganaBuildInputs.ps1 -FetchCrates
./experiments/furigana-self-build/Build.ps1
node scripts/Prepare-FuriganaAssets.mjs
node scripts/Verify-FuriganaLicenseEvidence.mjs
```

Prepare-BuildInputsは固定source/CLI archiveを必要時に取得し、SHA-256を検証する。source全704ファイルとarchiveを照合。オンラインの`cargo fetch --locked --target wasm32-unknown-unknown`を、実ビルドの`--locked --offline`から分離する。取得済みcrate archiveをCargo.lockのchecksumと照合する。workspace解決には実コンパイル106件以外のcrate sourceも必要になるため、106件だけを取得する方式にしない。不足はoffline buildでエラーとする。今回のキャッシュ検査は351 archive一致。

今回の入力準備スクリプトは既存取得物を利用して実行した。`-FetchCrates`による空の環境からのオンライン全取得は未実行。CLI/sourceの再ダウンロードと、GitHub runnerでのcold-start手順の検証は今後の項目として区別する。

現行Build.ps1はCLI/lockのSHA、独自に生成したCARGO_ENCODED_RUSTFLAGSによるremap、追加flags/wrapperの不使用、出力privacyと新WASM/JSの基準hashを検証する。異なる出力を自動承認しない。環境差によりhashが異なる場合は、原因を確認して新しい採用値を別レビューする。

現行Adopt-FuriganaSelfBuild.mjsは、Record-FuriganaNormalizedBuild.mjsが2回のビルド・依存・privacy検証から構築したschema 2来歴をpolicyのhashと照合する明示的な移行処理。既存通知も変更前にhash照合し、改変を新しい正当な通知として自動承認しない。Prepare-FuriganaAssetsは来歴を保持し、pkg-normalizedからだけ読み込む。アプリ通常ビルドとPages CIはignoredなpkg/vendorを必要としない。

## 当初採用時の再現性と差分の調査（正規化前の履歴）

前回の同一環境・別targetでの2回一致に加え、今回はCargo homeとtargetを分離してクリーンビルドを実行した。既存キャッシュからCargo.lockとSHA-256が一致した351 archiveとregistry indexを準備し、展開済みcrate sourceを再利用しない形でビルドした。

- 初回の106 archiveだけの準備では`bytes 1.11.1`不足でoffline build失敗。成功と扱っていない。workspace解決用のarchiveを追加準備して再実行した。
- 分離キャッシュで3分59秒のbuild成功。WASMは`3c19df8ddc9aa6f1273a468af1f640a466690e1430bcba30aed3af2d23ccb6c3`となり基準と相違。JSは基準と同一。異なるWASMは採用していない。
- 同一106packageの版、features、target kindを確認。WASM内のpanic等のソース位置文字列にCargo homeの違いが存在し、code/data/nameセクションに差分が出た。
- 診断用にそのCargo homeだけを元表記へ`--remap-path-prefix`で対応させて再ビルド（3分40秒）すると、最終WASM/JSが基準値と完全一致した。APIと23文章の生tokenも基準・分離・remap版で全件一致。比較は[REBUILD-COMPARISON.json](../experiments/furigana-self-build/REBUILD-COMPARISON.json)に記録。
- remapは原因切り分けの実験であり、今回採用したビルドrecipeへ追加していない。新しい標準パスへ正規化すると基準hashが変わるため、別途固定条件・来歴・hashのレビューが必要。現行WASMには診断用ビルドパス文字列が残る。アプリJS/Razorには実験パス・絶対ローカル取得URLを追加しておらず、それらのディレクトリを実行時に参照しない。
- WSL環境の存在を確認したが、Ubuntu側でRust/C compilerを検出できず別OSビルドは実施していない。今回の分離cacheは同じWindows/toolchainであり、独立OS/CI runnerでの再現証明とは呼ばない。GitHub Actionsを実際に起動してはいない。

## 通知・監査と公開停止

既存27通知・証跡を保持し、SELF-BUILD-PROVENANCE.json（97,769 B）とSELF-BUILD-CARGO.lock（99,803 B）を追加。全29ファイルをsourceとRelease publishの両方でhash検証した。既存inventoryは配布self-WASMのhashへ更新し、原Lindera/IPADIC/kanaria/106件/Rustの許諾本文を削除していない。

106件のコンパイルpackageはnormal target候補84、proc-macro host subtree21、build-only1の分類と対応する。実feature variantと通知対応を来歴JSONへ保持する。hostで動くmacro/build scriptをそのままブラウザ内コードとは扱わない。標準ライブラリ入力ファイルのhashを保持しているが、内部の全依存版と最終link内容の完全SBOMは未証明。binaryAttested=false / sbomCompleteness=unprovenを維持する。

wasm-bindgen CLI同梱MIT全文（著作権2014 Alex Crichton）とApache全文は、既存wasm-bindgen 0.2.126の通知とhash一致を確認。生成JS/変換処理の原典としても同じ通知を保持する。[公式MIT](https://github.com/wasm-bindgen/wasm-bindgen/blob/0.2.126/LICENSE-MIT)・[cli-supportの0.2.126/許諾](https://github.com/wasm-bindgen/wasm-bindgen/blob/0.2.126/crates/cli-support/Cargo.toml)も確認した。CLI本体・そのhost依存全体を配信物へ同梱せず、CLIの全依存が出力WASMに入ったとも推定しない。今回発見した通知の既知未充足は0。

Verify-FuriganaLicenseEvidenceはmanifestだけを信頼せず、独立policyのWASM/JS/provenance hash、source/lock/toolchain/feature/106件/通知対応、辞書hashを検証する。publish root引数にも対応。公式hashを設定したmanifest、WASM改変、通知/lock/来歴/origin改変を拒否する負のテストを追加した。

Pages CIは既存Checks → self資産・改変拒否確認 → Release publish → Pages準備/静的参照 → publish内の29通知/来歴/WASM確認 → 公開承認checkの順に変更した。承認checkは来歴/通知が成功したことを表示した後、**publicationApproved=falseでexit 1**。それより後のartifact upload/deployへ進まない。公開承認フラグだけを変えても、監査状態・blockers・binary対応の未確認を通過できない。完全SBOMをライセンス本文の一律義務とする判断ではなく、公開前監査条件を保留している。

公式版の来歴未証明は履歴・上流問い合わせ事項として残し、現行self版の来歴不足の理由として流用しない。歴史的公式版collectorが現行self証跡を上書きしないよう停止条件を追加した。公開可能とは判断していない。

## 当初採用時の性能・配布サイズ（正規化前の履歴）

測定はPC/Codex in-app browser、localhost、no-store、HTTP圧縮なし。新規Worker3回。SHA検証を含む実験Workerのステージ別時間と、実際のproduction client/Workerの時間を計測。CPUでのRust build終了後に実行した。値は[ADOPTION-PERFORMANCE.json](../experiments/furigana-self-build/ADOPTION-PERFORMANCE.json)。

| 項目 | 今回 |
|---|---:|
| WASM取得＋SHA検証中央値 | 26.6 ms |
| WASM instantiate中央値 | 5.1 ms |
| 辞書取得＋SHA検証＋展開中央値（9並列） | 289.3 ms |
| dictionary/Tokenizer生成中央値 | 36.5 ms |
| Worker初期化中央値 | 385.0 ms |
| 2,000単位初回解析中央値 | 39.6 ms |
| 同2回目以降解析中央値 | 20.3 ms |
| 実production client/Worker初回解析 | 495.1 ms |
| 同2回目（同じWorkerを再利用） | 44.0 ms |
| WASM linear memory | 97,124,352 B |
| WASM / JS raw | 2,219,656 / 66,542 B |
| WASM gzip / Brotliローカル試算 | 748,926 / 520,822 B |
| 辞書圧縮 / 展開 | 11,510,702 / 47,524,848 B |
| furiganaディレクトリ全41ファイル | 16,578,096 B（通知等含む、初回転送量ではない） |
| .NET framework raw / Brotli計 | 15,321,155 / 3,433,861 B（全ICU variant含む、初回転送量ではない） |

前回self版371.8msの初期化はSHA検査なしの別実験で、385.0msと同一条件の性能差ではない。反復解析は前回20.8ms、今回20.3ms。少数標本で速度優位を主張しない。公式WASM1,784,285 Bから+435,371 B、gzip試算+41,487 B、Brotli試算+21,201 B。来歴/lock197,572 Bは通常初期化で読まない。GitHub Pagesの実圧縮交渉は未測定。メモリはlinear bufferのみでピーク/ブラウザ全体ではない。ボタンからBlazor描画完了までの時間は未計測。モバイル実機も未検証。

## 実行結果・再実行

- 既存ReleaseコンソールChecks: 2,333件成功。学年境界、全既習/一部未習、手動修正、原文/学年変更、熟字訓、VS/補助文字、不正UTF-16、HTML文字、ON/OFF/学年/未知語のコピーを含む。
- JavaScript Worker Checks成功。位置不正、旧公式/未採用manifest拒否、初期化再利用・失敗後復旧を確認。追加distribution負のテスト成功。
- Debug / Release build: 成功、各0警告・0エラー。Release publish成功（SDKの既存wasm-tools推奨案内あり、エラーなし）。Pages静的参照25件成功。29通知・証跡のpublish hash一致、dictionary raw/gzip hash一致。
- 前回23文章の生token・位置・読み・未知語フラグ、JS API/WASM import/exportは公式と採用selfで一致。分離cache/remap版も一致。
- Release publishを`/KanjiVariants.Playground/`で起動。自動生成、今日/図書館/宇宙/読の読み、1〜6年変更と再利用、手動今日（こんにち）の再生成後保持、別出現の今日（きょう）の独立、表示OFF、コピー完了表示を実画面で確認。
- 新原文への旧結果隔離、髙/𠮷/IVS/SVSの要確認、改行・空白・HTML特殊文字・絵文字保持を実画面で確認。大人/生は1年で既習なのでルビなし、raw tokenの読みは一致。
- 既存変換（髙橋𠮷野→高橋吉野）、髙橋診断、髙の詳細表示を実画面で確認。変換/診断/詳細の段階ではdictionary要求なし、初回自動生成で取得、再生成時に再取得なし。
- コピーの実クリップボード全文の読出し/再貼付は今回未確認。ボタンの完了表示と既存コピー出力Checksは成功。実機・Safari/Firefox、キャッシュ破損/中断の実ブラウザ試験は未実施。失敗後再試行はJSのWorker stubで検証したものと区別する。
- git diff --check成功。今回もコミット・Push・デプロイなし。

```powershell
dotnet build -c Debug --no-restore
dotnet build -c Release --no-restore
dotnet run --project tests/KanjiVariants.Playground.Checks -c Release --no-build
node --experimental-default-type=module tests/KanjiVariants.Playground.Checks/FuriganaWorkerChecks.mjs
node tests/KanjiVariants.Playground.Checks/FuriganaDistributionChecks.mjs
node experiments/furigana-self-build/verify.mjs
dotnet publish src/KanjiVariants.Playground -c Release --no-restore -o artifacts/furigana-adopted-publish
./scripts/Prepare-Pages.ps1 -PublishRoot artifacts/furigana-adopted-publish/wwwroot
./scripts/Verify-Pages.ps1 -PublishRoot artifacts/furigana-adopted-publish/wwwroot
node scripts/Verify-FuriganaLicenseEvidence.mjs artifacts/furigana-adopted-publish/wwwroot
./scripts/Verify-FuriganaRedistribution.ps1
node scripts/Serve-Pages.mjs artifacts/furigana-adopted-publish/wwwroot 5178
```

承認checkのexit 1は正常な公開停止。その他の失敗を成功に読み替えない。

## 変更範囲

- 配布: `wwwroot/furigana/lindera-6.2.0/{lindera_wasm_bg.wasm,manifest.json,LICENSE-INVENTORY.json,SELF-BUILD-PROVENANCE.json,SELF-BUILD-CARGO.lock}`、Worker、licenses.html。
- 準備/監査: `scripts/{FuriganaSelfBuildPolicy.mjs,Adopt-FuriganaSelfBuild.mjs,Prepare-FuriganaBuildInputs.ps1,Prepare-FuriganaAssets.mjs,Collect-FuriganaLicenseEvidence.mjs,Verify-FuriganaLicenseEvidence.mjs,Verify-FuriganaRedistribution.ps1,Serve-Pages.mjs}`、Pages workflow。
- テスト/再現: Worker/Distribution Checks、実験Build/verify、adoption-bench、差分比較スクリプトと2つの測定JSON。生バイナリ/キャッシュ/ログは追加ソース管理しない。
- 文書: README、LICENSE-NOTICES、P2b/監査/問い合わせ/自前ビルド文書、実験README。前回のREPORT/MEASUREMENTSは履歴として保持。

最終Git状態はこれらの変更・新規ファイルを未コミットで保持。既存の機能実装・テーマ/CSS・本体データ・NuGet版に差分なし。公開前承認はfalse。

最終確認時の内訳は既存20ファイル変更、新規12ファイル、ステージ済み変更0。tracked diffは137行追加・31行削除、WASMは1,784,285→2,219,656 B（この集計には新規ファイルの行数を含まない）。ブランチはmain、HEADは3045315のまま。
