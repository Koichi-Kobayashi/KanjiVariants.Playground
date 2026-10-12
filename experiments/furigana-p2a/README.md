# 自動ふりがな P2a（隔離実験）

採用判断は[REPORT.md](REPORT.md)、全token・品詞・未知語・位置・配布物hashと性能表は[MEASUREMENTS.md](MEASUREMENTS.md)。既存アプリに統合せず、GitHub Pagesへ配信していない。

## 再現手順（PowerShell）

リポジトリルートで実行する。.NET SDK 10.0.401、Node.js、PowerShell、tarが必要。

```powershell
./experiments/furigana-p2a/Setup.ps1
dotnet build experiments/furigana-p2a/InteropProbe -c Release
node experiments/furigana-p2a/server.mjs
```

Setupは公式npmのlindera-wasm 6.2.0・kuromoji 0.1.2、Lindera公式v6.2.0 IPADICを取得。npm integrityを確認し、ignoredなvendorへ展開。固定版source資料を取得し、gzip/Brotliサイズ・SHA-256と、既存KanjiVariants 1.2.0 DLLによる学年診断fixtureを生成する。辞書ZIPの期待SHA-256はREPORT/MEASUREMENTS参照。

ブラウザで以下を開く。

```text
http://localhost:5175/KanjiVariants.Playground/experiments/furigana-p2a/
```

「5回の比較を実行」で両エンジンのmain・Workerを各5回、cache再利用各3回、HTTP圧縮なし各1回を測定する。coldはno-store。warmは固定URLなので以前の実験cacheが残っている場合もある。エンジン・辞書を取得するのはボタンを押した後だけ。

「kuromoji展開時間を測定」は元bundleのignoredな計測用コピーを使用し、3回実行する。通常系列は元bundleを使用する。辞書取得とHTTP展開は同時進行を含むので、phase中央値を単純加算しない。

同じbrowserで独立Blazorアプリも開き、二つの検証ボタンを押す。

```text
http://localhost:5175/KanjiVariants.Playground/experiments/furigana-p2a/probe/
```

結果はローカルresults/に保存する。このサーバーのPOSTは既知の検証結果保存専用で、外部解析サービスは使わない。serverはlocalhostのみにbindする。

計測が完了したら:

```powershell
node experiments/furigana-p2a/checks.mjs
node experiments/furigana-p2a/alignment-checks.mjs
node experiments/furigana-p2a/summarize.mjs
```

集計はresults/summary.jsonとMEASUREMENTS.mdへ出力。後者はreport用成果物で、再計測時は更新される。results/raw、vendor、generated、bin、objは実験内.gitignoreで除外。

計測概要をブラウザで見るURL:

```text
http://localhost:5175/KanjiVariants.Playground/experiments/furigana-p2a/overview.html
```

サーバー終了はCtrl+C。既存Playgroundの開発サーバーとポートが競合する場合は`node server.mjs 5186`等を使い、URLのポートも合わせる。本番のbase pathやlaunchSettingsは変更しない。

## 実験ファイル

- cases.json: 固定入力・許容読み。invalid UTF-16はJSON escapeで保持。
- engines.mjs: 固定版ロード、native解析、UTF-8/scalar→UTF-16変換、原文一致・順序検証。
- worker.mjs: 初期化再利用、request ID、エラー返却。
- bench.mjs / bench.html / index.html: 同一条件の反復計測・結果保存。
- EducationFixtures/: 実際の本体APIで23例×6学年を診断する独立CLI。
- InteropProbe/ / interop.mjs: 本番とは別のBlazor→module→Worker実動作検証。
- checks.mjs / alignment-checks.mjs: 実出力との照合、位置破損・原文保持・末尾かな分離を検証。
- prepare.mjs / Setup.ps1 / server.mjs / summarize.mjs: 配布物準備・サイズhash・静的配信・集計。

## 測定の限界

PC上のChromium一種類。実モバイル・他browser・PagesのCDNは未検証。JS heap値はiframe/GCの影響を受け、エンジン単体の必要メモリではない。真のpeak/WorkerのJS heapは未測定。WASM bytesは再現ビルドしておらず、公式artifactと固定sourceの版整合を確認した。

安全規則の実験でmanual優先を確認したが、P1の画面やセッションに自動結果を適用するコードは追加していない。
