# 自動ふりがな WASM自前ビルド検証

2026-10-12。実験専用。本番WASM・辞書・公開承認は変更しない。

- [REPORT.md](REPORT.md): 結論、比較、残課題、正式採用に必要な検証
- [MEASUREMENTS.json](MEASUREMENTS.json): 固定ソース、106コンパイルpackageの版・feature variant・通知対応、生成物ハッシュ、測定値、27通知のpublish同梱ハッシュ
- 元の監査: [FURIGANA-LICENSE-AUDIT.md](../../docs/FURIGANA-LICENSE-AUDIT.md)

## 前提

PowerShell 7、Node.js 22、既存の.NET 10環境を使用。監査で取得済みの公式v6.2.0ソースzipと展開先、固定Cargo.lock、crateキャッシュが必要。固定取得元・ハッシュはREPORT参照。キャッシュ不足で`--offline`が失敗した場合は成功と扱わず、固定lockを使用した取得・通知照合を別途実施する。

Rustup公式配布のRust 1.98.1を、`wasm32-unknown-unknown` target付きで追加する。既存default toolchainを変更する必要はない。

```powershell
rustup toolchain install 1.98.1 --profile minimal --target wasm32-unknown-unknown
```

公式wasm-bindgen 0.2.126のWindows x86_64 MSVC CLI archiveを取得し、公式`.sha256sum`とREPORTのSHA-256を照合してから、`artifacts/furigana-self-build/tools/wasm-bindgen-0.2.126-x86_64-pc-windows-msvc/`へ展開する。Build.ps1は実行ファイルのハッシュも検証する。CLIをアプリ配信物には含めない。

## ビルド・比較

```powershell
./experiments/furigana-self-build/Build.ps1
./experiments/furigana-self-build/Build.ps1 -Repeat
node experiments/furigana-self-build/verify.mjs
```

Buildは`--locked --offline`、root追加featuresなし、root default無効。固定ソースとarchive全704ファイルの一致も検査する。Repeatは別target/pkgへ出力する。wasm-pack・wasm-optは使わない。入力の追加・改変やCargo設定、Rust toolchainの変更を任意に許す配布用ビルドシステムではない。

## publish同梱・実画面・Worker測定

```powershell
dotnet publish src/KanjiVariants.Playground -c Release --no-restore -o artifacts/furigana-notices-final-publish
./scripts/Prepare-Pages.ps1 -PublishRoot artifacts/furigana-notices-final-publish/wwwroot
./scripts/Verify-Pages.ps1 -PublishRoot artifacts/furigana-notices-final-publish/wwwroot
node experiments/furigana-self-build/prepare-site.mjs
node experiments/furigana-self-build/server.mjs
```

`http://127.0.0.1:5177/KanjiVariants.Playground/self/`で自前版のBlazor画面を操作する。`official/`は公式版。`bench/`で比較を実行し、測定JSONを`artifacts/furigana-self-build/browser-comparison.json`に保存する。その後:

```powershell
node experiments/furigana-self-build/record-evidence.mjs
node scripts/Verify-FuriganaLicenseEvidence.mjs
./scripts/Verify-FuriganaRedistribution.ps1
```

最後の公開前チェックは、公式版の来歴が未証明であるためexit 1が正しい。publish同梱確認と公開承認は別。record-evidenceは実在するpublishの27通知を読み、ハッシュ不一致・欠落で停止する。

全生成物・配信用の検証コピー・スクリーンショットはignoredな`artifacts/`内。self検証コピーはエンジンのbytes/hashだけ更新して実Workerと接続する。ライセンスinventoryの公式エンジン対応や公開承認を変更しないので、公開用の配布物には使わない。ローカルサーバーは127.0.0.1だけで待ち受け、入力文章を外部へ送信しない。
