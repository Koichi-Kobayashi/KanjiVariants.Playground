# 初期構築の検証記録（2026-10-12）

この文書は初期構築時の記録です。その後の文章一括変換の1,117件の仕様照合は[CONVERSION.md](CONVERSION.md)、IVS/SVS候補改善後の合計1,547件の検証は[VARIATIONS.md](VARIATIONS.md)を参照してください。

## 実行環境とビルド

Windows x64 / .NET SDK 10.0.401 / runtime 10.0.12。NuGet KanjiVariants 1.2.0を使用しました。

| 検証 | 結果 |
| --- | --- |
| `dotnet restore` / `dotnet restore --locked-mode` | 成功。アプリ・検証プロジェクトのlock fileを保存 |
| `dotnet build` / `dotnet build -c Release --no-restore` | 成功。警告0・エラー0 |
| `dotnet run --project tests/KanjiVariants.Playground.Checks -c Release --no-build` | 364項目成功 |
| `dotnet publish src/KanjiVariants.Playground -c Release --no-restore` | 成功。既定トリミングでILLink警告なし |
| `Prepare-Pages.ps1` / `Verify-Pages.ps1` | 成功。base、.nojekyll、12個の静的参照、通知本文一致を検証 |
| ローカル静的配信のRelease版 | Codex内ブラウザでWebAssembly実行を確認 |

サンドボックス内の`dotnet --info`はService Control Managerへのアクセス、最初のbuildはMSBuildタスクホスト起動が制限されました。通常の権限環境で再実行したrestore/build/publishは成功しています。ライブラリの互換性不具合として扱っていません。

publishには`wasm-tools`による追加最適化を推奨する案内が出ます。今回workloadを追加せず、AOT・ネイティブランタイム再リンクは実施していません。

## 仕様照合

固定コミットのREADME、`KanjiTextDiagnosticsTests.cs`、`JisX0212Tests.cs`を確認し、推測ではなく公開された例を使いました。本体テストの全実行はしていません。

- 髙の高候補、𠮷の吉候補、髙橋𠮷野の正式なReplace例
- 丑の0213第1面true・第2面false・全体true
- 丂の0212true・0208false、非漢字Äを含む丂丄Äの文字列判定
- ASCII・かな・絵文字、登録IVS/SVS、未登録VS、連続／単独VS、不正UTF-16、CR/LF、空文字
- 5集合すべてで文字列IsSupportedとの一致、元入力の維持、単位の位置、候補APIとの一致
- 入力上限超過の拒否

不正UTF-16は.NETの検証プログラムから直接渡しました。Web入力・ブラウザ間の不正サロゲート転送を保証するものではありません。

## ブラウザ確認

`http://localhost:5175/KanjiVariants.Playground/`で実際のpublish出力を配信しました。静的サーバーは圧縮交渉をしません。

| 対象 | 確認内容 |
| --- | --- |
| 髙橋 / 0208 | 髙だけ対象外、候補高、橋は使用可能 |
| 髙橋𠮷野 / 0208 | 4論理単位。𠮷は位置2・長さ2、吉候補 |
| 丂丄Ä / 0212 | 全3単位が使用可能。Äは漢字候補検索対象外 |
| 丑 / 0213各面・全体 | 第1面と全体は使用可能、第2面は対象外 |
| 辻＋U+E0100、不＋U+FE00、😀 | 3論理単位、長さ3・2・2。全体が対象外。VSを分割・除去しない |
| 2,001単位・空入力 | 長すぎる入力のエラー、空の使用可能判定を表示 |
| コピー | ブラウザClipboard API呼び出しの成功表示を確認。別アプリでのOSクリップボード内容照合は未実施 |
| テーマ | システム・ライト・ダークの表示 |
| レイアウト | 390px幅・1280px幅。モバイルでは文字ごとの縦配置で候補を表示 |
| サブパス | 起動、リソース参照、ルートの再読み込み、静的ライセンス画面 |

日本語の入力例ボタン・文字入力欄への入力を確認しました。実際のIMEの変換中イベント、iOS/Androidのソフトキーボードは未検証です。ラベル、表の見出し、ライブ通知、キーボードフォーカス、本文スキップを実装していますが、スクリーンリーダー実機の監査はしていません。

.NET 10テンプレートの`blazor.webassembly#[.{fingerprint}].js`とimport mapを使用し、公開時に解決されたファイルを参照します。固定名`blazor.webassembly.js`では公開物のファイル名と一致しないことを検出・修正しました。

## 配信サイズ・初回性能

過去の公開ファイルを含まない出力で測定しました。MBは10進数です。

| 項目 | 実測 |
| --- | --- |
| 元NuGetのKanjiVariants.dll | 6,166,528 bytes |
| 公開KanjiVariants Webcil `.wasm` | 6,166,297 bytes（約6.17 MB） |
| 同 `.br` / `.gz` | 693,161 / 1,186,794 bytes |
| `_framework`非圧縮全ファイル合計 | 約15.38 MB（全ICUデータ版を含む） |
| `_framework`生成`.br`全ファイル合計 | 約3.46 MB |
| ローカル初回画面起動 | 約1.46秒（navigation開始から初回Blazor描画後JSまで）。別の再読み込みでは約0.93秒 |
| ブラウザ初回「髙橋」診断＋候補検索 | 約9.8 ms（画面描画・配信・20msの描画待ちを除く） |
| デスクトップRelease初回「髙橋」診断 | 約17～18 ms、割り当て増分1,796,320 bytes、GC後生存管理ヒープ増分1,794,136 bytes |

フレームワーク全ファイルは実際の初回ロード対象の合計とは異なります。`.br`ファイルがあるだけでGitHub Pagesからそのサイズで配信されるとは限りません。圧縮交渉や実回線での転送量・速度は未検証です。測定ブラウザ・PCの結果であり、利用者全員の速度を保証しません。初回時間は`#app`の`data-startup-milliseconds`に検証用として記録しています。

主データの11配列は要素だけで1,793,110 bytes。上記のデスクトップ管理ヒープ値はブラウザのWASMヒープ・JSメモリ・ランタイム全体のメモリを表しません。ブラウザの初回メモリは未計測です。

## 公開前の残作業と次の開発

1. 利用者がPagesのSourceをGitHub Actionsに設定し、変更をレビューして公開。GitHub Actions実行・実Pages配信は今回未実施。
2. 実PagesでMIME・圧縮・初回転送量を確認し、主要PCブラウザ・iOS Safari・Android Chromeで入力とメモリを測定。
3. 本体側にPython由来0208表の生成環境のライセンス通知を確認。
4. 既存APIで学年・常用漢字診断を追加。MJ詳細は遅延初期化コストを先に測定。
5. AOT・未利用データの配信最適化を比較し、必要なら本体側へ改善案を報告。独断で本体を修正しない。

コミット、Push、GitHub設定変更、公開操作は行っていません。既存.gitignoreとGit履歴を維持し、READMEの概要を残して拡充しました。

## Release起動プロファイルの追加確認

Visual StudioのRelease起動でSystem.Net.Security等のIOExceptionのスロー通知が報告されたため、起動設定とJSデバッガーログを確認しました。従来のhttp/httpsプロファイルはReleaseでもDevelopment環境・inspectUri付きです。デバッガーのスロー通知だけで未処理例外とは判断できず、報告にはメッセージ・スタックがないため発生箇所は未確定です。JSログではアプリ画面のタイトル更新まで進んでいます。

切り分け用にrelease-http（Production、HTTP、inspectUriなし）を追加し、`dotnet run --project src/KanjiVariants.Playground -c Release --no-build --launch-profile release-http`で起動しました。Production環境の起動、ブラウザで髙橋の判定と高候補の表示、ブラウザerror/warnログ0件を確認しました。検証後に自分が起動したサーバーを停止しています。Visual Studioの元のHTTPSデバッグ経路でIOExceptionが出なくなったことを検証したものではありません。
