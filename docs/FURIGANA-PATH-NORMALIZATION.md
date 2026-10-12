# Lindera WASMのローカルパス除去・再現性改善

2026-10-13。開始時main / `c7cbcf67803b1520091e3538c81ce8ffd97d1aa9`、作業ツリーclean。コンパイラのパス正規化によって再生成し、検証済みWASMを本番アセットへ反映した。バイナリの文字列置換・パッチは行っていない。既存コミットは変更せず、変更は未コミット。公開承認false、コミット/amend/Push/デプロイなし。

## 検出した種類と原因

旧WASMをUTF-8・UTF-16LE/BE（境界0/1）、WASMセクション境界を使って検査した。

| 種類 | 旧WASM | 新WASM |
|---|---:|---:|
| Windowsユーザー名 kobayashi | 100 | 0 |
| Windows絶対パス | 100 | 0 |
| Cargo home / registry source位置 | 100（上記と同じ文字列） | 0（開発環境のパス） |
| ワークスペースの絶対パス | 0 | 0 |
| ローカルRustインストール先・その他PC固有パス | 0 | 0 |
| `/cargo/registry`の仮想ソース位置 | 0 | 100 |
| upstream標準ライブラリ `/rustc/<固定commit>/library` | 38 | 38 |
| upstream標準ライブラリ依存 `/rust/deps/...` | 5 | 5 |
| 認識する秘密鍵・token・JWT・資格情報付きURL・email等 | 検出なし | 検出なし |

件数は文字列の検出・分類であり、独立した情報漏洩件数を合算しない。元の100件はすべてRustの依存ソース`.rs`位置。全143ソース位置文字列はWASMのdata section（id 11）にあり、name/producersなどのcustom sectionでは見つからなかった。

panic/Locationや`file!()`由来のソース位置が、通常のrelease/LTOでも静的文字列として残る。Cargoから渡される依存ソースが絶対パスだったため、ユーザー名・Cargo homeも含まれていた。ユーザー名だけを削る問題ではない。今回、環境変数値の直接埋込みや、linker/wasm-bindgenの別機構によるPC固有パスは検出していない。

## コンパイラへ適用した正規化

固定Lindera 6.2.0・Rust/Cargo 1.98.1・wasm-bindgen 0.2.126・lock・target・release profileは維持。`--locked --offline --no-default-features --target wasm32-unknown-unknown`、wasm-optなし。

Build.ps1がその実行環境からprefixを導出し、`CARGO_ENCODED_RUSTFLAGS`（U+001F区切り）で`--remap-path-prefix=FROM=TO`を渡す。空白を含むdirectoryでもflagを空白で分解しない。任意のRUSTFLAGS・compiler wrapperの混入は拒否し、処理後は元の環境変数を復元する。

| 実prefixの対象 | 固定TO |
|---|---|
| Playground root | `/src/playground` |
| target directory | `/build/target` |
| 固定Lindera source root | `/src/lindera` |
| Cargo home | `/cargo` |
| Rust sysroot | `/rust/toolchain` |
| 個々のregistry source root（index directoryまで） | `/cargo/registry` |

native Windows表記と`/`表記の両方を渡す。広いprefixを先、より具体的なprefixを後にする。実際の`rustc --crate-name lindera_wasm`コマンドを`cargo -vv`ログから確認し、全6種の仮想prefixが渡っていることを照合した。12個のremap引数が有効になっている。

[Rust公式説明](https://doc.rust-lang.org/rustc/remap-source-paths.html)のとおり、照合は区切り文字を考慮しない文字列置換で、複数一致時は最後が使われる。scopeを指定せずdefault allを使用する。Windowsでは仮想prefixの後に`\`のsuffixが残る場合がある。検査時は仮想パスの区切り文字を比較用に正規化するが、WASMを書き換えない。Cargoが渡す相対ソース位置にはPC固有情報がなく、相対パスとして許容する。

既成のRust target標準ライブラリにある`/rustc/48a229ceaefd4985c50990b14116b6d856af0985/library/...`と`/rust/deps/{rustc-demangle-0.1.27,hashbrown-0.17.1,dlmalloc-0.2.13}/src/...`はupstreamの固定仮想位置で、PCのsysrootではない。現在のコンパイルflagsでは既成rlib内の位置文字列を再生成しない。これらは新たな依存の追加ではなく、以前から存在した同一標準ライブラリ由来。input hashと既存Rust COPYRIGHT通知の対応を確認して、commit/3 package版を限定して許容した。未知の`/rust/deps`を一律に許容しない。

## 新しい採用値と来歴

| 生成物 | SHA-256 | bytes |
|---|---|---:|
| WASM | `fbe6bf9a280f10f7e897fb88d997838c6c1bf1df20bf288ea3df23962a1897ba` | 2,214,024 |
| JS（従来と同一） | `a9e082fca426d6d225a439bac39c9d690aa5176598d7c902ca71e1fe4ba8d03a` | 66,542 |
| SELF-BUILD-PROVENANCE.json | `e1fa48d4a5685f401a353281712d74619fd0231712ebce934fc3476c6374b686` | 来歴・path audit・依存・実commandログhashを同梱 |

旧WASM 2,219,656 Bから5,632 B減少。旧hashは履歴に残すが、現行worker/policy/manifest/inventory/output検証では新hashだけを受け入れる。JSはバイト一致のためhashを変更しない。

通常入力で3分42秒、異なるsource directory/Cargo home/target directoryで3分36秒のコンパイルに成功。両WASM・JSがバイト一致した。2回目は分離cacheのcrate sourceを使い、両sourceはarchive全704ファイル一致。Cargo.lock不変。106packageの版・全feature/target kind/host-target variant、Rust標準ライブラリinput hashも前回と一致。正常ビルドのpinned output確認も再実行成功。

[NORMALIZED-BUILD.json](../experiments/furigana-self-build/NORMALIZED-BUILD.json)と配布SELF-BUILD-PROVENANCE.jsonに結果を記録。生ログのローカルパスは配布しない。初回/反復ビルドのcompiler-artifact・実commandログをSHA-256名のignored evidence directoryへ保存してから、cached手順の再実行を行った。

比較は同一Windows/Rust toolchain。異なるOS・別CI runnerでの一致は未検証。WindowsとLinuxのsuffix区切り文字やhost toolchain差まで同一と保証しない。

## 今後の混入防止と手順

Verify-FuriganaPaths.mjsはUTF-8/UTF-16LE/BEの両byte境界、全バイトおよびWASM section内のソース位置を検査。Windows drive/UNC、ローカルPOSIX root、`.cargo/.rustup`、指定開発者名、非仮想の絶対ソース位置、認識するcredential形式等を拒否する。virtual rootの下にhome/tmpという通常のdirectoryがある場合も誤検出しない。一般の暗号化・独自encoded秘密情報を完全に認識する保証ではなく、今回の固定ソースと生成物に対する文字列検査である。

検査をBuild、候補採用、アセット準備、source/publishのライセンス証跡検証に組み込んだ。通常buildは独立policyのhashも検証する。Candidateは新hashを調査するための明示的な出力モードで、privacy検査を無効化せず、policy/本番/公開承認を変更しない。118 fixturesで仮想/相対パス、別ユーザーの絶対パス、UTF-16、token等を検証。CIにも追加した。

```powershell
./scripts/Prepare-FuriganaBuildInputs.ps1 -FetchCrates
./experiments/furigana-self-build/Build.ps1
node scripts/Prepare-FuriganaAssets.mjs
node scripts/Verify-FuriganaLicenseEvidence.mjs
node tests/KanjiVariants.Playground.Checks/FuriganaPathChecks.mjs
```

新recipeを検討するときの流れ:

```powershell
./experiments/furigana-self-build/Build.ps1 -Candidate
./experiments/furigana-self-build/Build.ps1 -Candidate -Repeat -CargoHome <別cache> -SourceDirectory <固定archiveと一致する別source>
node scripts/Record-FuriganaNormalizedBuild.mjs
```

一致・依存・privacyをレビューした後にのみ、policyのoutput/provenance値を明示更新してAdoptを実行する。自動的に新しいhashを正当としない。新しいログからRecordを再実行すると来歴のhashも変わり得るため、既存receiptをblind overwriteしない。

## ライセンスと検証結果

依存版・features・source・lock・std inputが変わらず、許諾本文の追加/削除は不要。既存29通知・証跡のうちinventoryのengine hashと来歴JSON/hashだけを更新した。kanaria/IPADIC/Rust/CLIの許諾本文、IPADIC内容は保持。コンパイル一覧を完全SBOMとは呼ばず、binaryAttested=false、sbomCompleteness=unprovenは維持する。

| 検証 | 結果 |
|---|---|
| 既存コンソールChecks | 2,333件成功 |
| JS Worker Checks | 新hash/旧manifest拒否、位置変換、再利用/再試行成功 |
| distribution負のテスト | 成功 |
| path/private string fixtures | 118ケース成功、実WASM/JSの検査成功 |
| 23文章 | 公式版と新WASMの全raw token・UTF-8位置・読み・未知語フラグ一致、JS/WASM API一致 |
| Debug / Release build | 各成功、0警告・0エラー |
| Release publish | 成功。既存SDKのwasm-tools推奨案内あり、エラーなし |
| Pages準備 / 静的参照 | `/KanjiVariants.Playground/`、25参照成功 |
| publish 29通知・証跡 / エンジン・辞書hash | 全件一致、privacy検査も成功 |
| 実ブラウザ | 新WASMの自動生成、今日/図書館/宇宙/読の読み、手動「こんにち」保持、別出現「きょう」、1→6→1でhide/再利用成功 |
| 既存変換 / 診断 / 詳細 | 髙橋𠮷野→高橋吉野、髙橋診断、髙の詳細表示を確認 |
| 公開前check | 来歴/通知/privacy成功後、publicationApproved=falseでexit 1。条件緩和なし |

最初のprivacy判定は、固定標準ライブラリの仮想`/rust/deps`を未分類として停止した。分類・通知対応を確認して限定許容し、通常検証を再実行した。virtual build/targetに対する初期fixtureの誤検出もroot境界を修正し、118 fixturesで再検証した。初期の失敗を成功扱いしていない。

ブラウザの証跡はignoredな`artifacts/furigana-self-build/normalized-app.png`。モバイル実機、Safari/Firefox、別OS/実CI、全種の秘密情報検出、今回の実クリップボード全文は未検証。copy出力・VS/補助漢字/不正UTF-16/HTML特殊文字・取消/旧結果破棄は既存2,333 Checksで検証し、仕様は変更していない。

## 変更範囲とGit

Build/Inspect-Inputs、Prepare-BuildInputs、Record-NormalizedBuild、Adopt/Prepare/Verifyスクリプト、独立policy、Worker/JS Checksのhash、path Checks、CI、manifest/inventory/provenance/WASM、NORMALIZED-BUILD記録、Self-build/P2b/監査/実験READMEを更新。JS実バイト列、Cargo.lock、辞書、C#判定・表示コード、CSS、NuGet、本体データは不変。

main、HEADは`c7cbcf67803b1520091e3538c81ce8ffd97d1aa9`のまま。変更は未コミット、ステージなし。公開承認false、公開前checkは停止状態。コミット/amend/Push/デプロイなし。

最終状態は既存19ファイル変更、新規6ファイル（計25）。対象一覧:

```text
.github/workflows/pages.yml
docs/FURIGANA-LICENSE-AUDIT.md
docs/FURIGANA-P2B.md
docs/FURIGANA-SELF-BUILD.md
docs/FURIGANA-PATH-NORMALIZATION.md
experiments/furigana-self-build/Build.ps1
experiments/furigana-self-build/Inspect-Inputs.ps1
experiments/furigana-self-build/README.md
experiments/furigana-self-build/verify.mjs
experiments/furigana-self-build/NORMALIZED-BUILD.json
scripts/Adopt-FuriganaSelfBuild.mjs
scripts/FuriganaSelfBuildPolicy.mjs
scripts/Prepare-FuriganaAssets.mjs
scripts/Prepare-FuriganaBuildInputs.ps1
scripts/Verify-FuriganaLicenseEvidence.mjs
scripts/Record-FuriganaNormalizedBuild.mjs
scripts/Verify-FuriganaBuildOutput.mjs
scripts/Verify-FuriganaPaths.mjs
src/KanjiVariants.Playground/wwwroot/furigana/lindera-6.2.0/LICENSE-INVENTORY.json
src/KanjiVariants.Playground/wwwroot/furigana/lindera-6.2.0/SELF-BUILD-PROVENANCE.json
src/KanjiVariants.Playground/wwwroot/furigana/lindera-6.2.0/lindera_wasm_bg.wasm
src/KanjiVariants.Playground/wwwroot/furigana/lindera-6.2.0/manifest.json
src/KanjiVariants.Playground/wwwroot/js/furigana-worker.js
tests/KanjiVariants.Playground.Checks/FuriganaWorkerChecks.mjs
tests/KanjiVariants.Playground.Checks/FuriganaPathChecks.mjs
```
