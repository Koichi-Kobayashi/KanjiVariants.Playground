# Lindera 6.2.0 WASM自前ビルド・publish同梱検証

検証日: 2026-10-12。基準: `983c77c`。実験スクリプトと監査記録のみ追加・更新。本番エンジン、JS、辞書、アプリ機能、NuGet、公開前チェック条件は変更していない。コミット・Push・デプロイなし。

## 結論

固定v6.2.0ソースとCargo.lockから、`--locked --offline`でWASMを実際にビルドできた。別targetディレクトリでの2回のビルドはWASM/JSとも同一バイト列。公式版とJSは完全一致し、WASM import/export descriptorも一致。23文章の生token・UTF-8位置・読み・未知語情報も一致した。自前版を使ったローカルBlazor画面で自動ふりがな・手動編集の動作を確認した。

追加27通知・証跡のRelease publish同梱・SHA-256一致を確認した。前回、承認処理の利用上限で実行できなかった同梱検証は、今回の成功により解消。今回はその上限による停止は発生していない。

**現在の公式npm WASMの完全なビルド来歴は未証明のまま。自前ビルド成功や106packageのコンパイル記録を完全なバイナリSBOMの証明とは扱わない。公開前チェックはexit 1、承認falseを維持する。** 自前ビルドは来歴を管理する有効な候補だが、正式採用・公開承認は別工程。

## 固定入力・コマンド

| 入力 | 固定値・取得元 |
|---|---|
| Lindera | v6.2.0 / commit `0482efcc46b5ec518b7238efae55e9fed9bba0c0`、[公式固定ソース](https://github.com/lindera/lindera/tree/0482efcc46b5ec518b7238efae55e9fed9bba0c0) |
| 取得済みタグsource zip SHA-256 | `f8aa68d5714f0fa17c793a8686d2fb7abef284e336c78c1895837e52c26613c4`。展開先704ファイルをarchiveと全件照合、一致 |
| Cargo.lock SHA-256 | `6b30d175d6234ad39b8b969101af13834b28545f3eb9801e454002832db18d75`。前後不変 |
| Rust / Cargo | Rust 1.98.1 (`48a229ceaefd4985c50990b14116b6d856af0985`)、Cargo 1.98.1、host `x86_64-pc-windows-msvc`、LLVM 22.1.8。[Rustup公式配布](https://static.rust-lang.org/dist/channel-rust-1.98.1.toml) |
| wasm-bindgen CLI | 0.2.126、[公式release](https://github.com/wasm-bindgen/wasm-bindgen/releases/tag/0.2.126)、`wasm-bindgen-0.2.126-x86_64-pc-windows-msvc.tar.gz` |
| CLI archive / exe SHA-256 | archive `5a3773c7e69cfb2d865e235e9210de184c8c3af1787720646ec1a8bbe09c6179`（公式sha256sum一致）、exe `2d5de73be088f1b53764fb298fe24f9fd44f438fa02e5d208159780b20e858ed` |
| target / root features | `wasm32-unknown-unknown` / `[]` / `--no-default-features`。transitive defaultsは維持。辞書embed/train機能なし |
| release profile | 固定ソースのLTO有効、lindera-wasm opt-level `s`、build-override opt-level 3 |
| 後処理 | wasm-bindgen `--target web --out-name lindera_wasm`。wasm-pack / Binaryen wasm-optは使用しない |

```powershell
cargo +1.98.1 build --manifest-path artifacts/license-audit/source/lindera-6.2.0/lindera-wasm/Cargo.toml -p lindera-wasm --target wasm32-unknown-unknown --release --no-default-features --locked --offline --target-dir artifacts/furigana-self-build/target --message-format=json-render-diagnostics
```

実スクリプトはmanifest/target-dirを絶対パスで指定し、compiler-artifact JSONを保存する。ビルド時間は初回3分05秒、別targetで3分00秒。同じマシン・ソース・キャッシュ・toolchainによる再実行であり、独立した別環境の再現性は未検証。

Cargo直接出力WASM SHA-256: `d0774a5416cf317a92c6815b0f5781230442300be318907c80e5a69cdf47012d`。以下はwasm-bindgen処理後のブラウザ用WASM。

| 生成物 | SHA-256 |
|---|---|
| 自前WASM（2回とも） | `602b7f57f805ef3321ddebe6be1fb8f212afa3d9e67846a9d049ad755d37fe2e` |
| 公式npm WASM | `52f4b492f9dd0edf876b90d3432ae2284b2d996bf8e697327d1fc3b0277e6431` |
| JS（公式・自前・再ビルド共通） | `a9e082fca426d6d225a439bac39c9d690aa5176598d7c902ca71e1fe4ba8d03a` |

## 依存・通知と証明範囲

compiler-artifactの実コンパイルpackageを106件特定し、各name/versionを既存LICENSE-INVENTORYへ照合した。全件に通知あり。版、crate archive SHA-256、実feature variant、host/target区別、通知ファイル対応を[MEASUREMENTS.json](MEASUREMENTS.json)へ保存。固定ソース監査の84 normal target / 21 proc-macro host subtree / 1 build-onlyという分類とも対応する。kanaria 0.2.0は既に原開発元とcrateを照合済みのMIT全文・著作権通知を使用。今回新たに不足を確認した通知は0件。

コンパイルされたpackageは、全コードが最終WASMへリンクされたことを意味しない。host proc-macro/build scriptをそのままブラウザ内コードと数えない。また、Cargo記録には配布済みRust標準ライブラリの内部依存解決が含まれない。インストールされたtarget標準ライブラリ入力の全ファイルSHA-256も保存したが、これも個々の最終リンク成分・内部crateの版まで証明する完全SBOMではない。Rust 1.98.1のCOPYRIGHT/MIT/Apache通知は既存27通知に含まれる。

公式npmの公開workflowはwasm-pack `--release --target web`だが、その実行時lock・環境・全後処理は未取得。今回のWASMは公式版と異なる。サイズ差を「wasm-optだけが原因」と断定しない。JS・API・token一致から公式の全依存版一致を推論しない。公式ビルドへの問い合わせ案は維持し、問い合わせは送信していない。

## 公式版と自前版の比較

| 観点 | 公式npm維持 | 今回の自前版 |
|---|---|---|
| 監査追跡 | 配布物ハッシュ・固定候補の通知確認済み。実buildとの全対応は未証明 | ソース全704ファイル・lock・実コンパイル106package・toolchain・後処理・出力を記録可能。標準ライブラリ内部/最終リンク成分の完全SBOMは未証明 |
| 再現性 | 今回byte-identicalな公式再現はできていない | 同一Windows環境、別targetで2回一致。他マシン・OS・CIでは未検証 |
| JS連携 | 既存の本番版 | JSバイト完全一致、公開JS API・WASM import/export同一、実Blazor Workerで動作 |
| WASM raw | 1,784,285 B | 2,219,656 B（+435,371 B） |
| WASM gzip / Brotli試算 | 707,439 / 499,621 B | 748,926 / 520,822 B |
| JS raw | 66,542 B | 同じ |
| 辞書 | 圧縮計11,510,702 B、展開計47,524,848 B | 同じ原配布IPADICを利用、変更なし |
| Worker初期化中央値 | 367.5 ms | 371.8 ms |
| 2,000 UTF-16単位解析中央値 | 21.1 ms | 20.8 ms |
| WASM linear memory | 97,124,352 B | 同じ |
| 読み結果 | 基準 | 23ケース全raw token一致。誤読・文脈依存の限界も同じ |
| 更新負担 | npm artifact更新と来歴確認を配布元に依存 | Rust/CLI/lock/ソース・通知を自分で固定し、ビルド・ハッシュ・互換性を毎回検証する負担 |

測定はPCのCodex in-app browser、localhost・HTTP圧縮なし・no-store配信。3回ずつ新しいWorkerを作り、順序を交互にした。初期化はJS import/WASM取得・instantiate/辞書取得・gzip展開/Tokenizer生成。実験Workerは本番のSHA検査・Blazor JSInteropを含まないため、アプリの初回ボタン操作から表示までの遅延値ではない。no-storeでもエンジンのコンパイルキャッシュが完全初期化されたとは保証しない。解析は各Workerでwarm-up後11回の中央値。小標本の近い値から速度優位を結論しない。

gzip/BrotliはNodeで算出したローカル圧縮サイズであり、GitHub Pages実配信の圧縮方式・転送量を確認した値ではない。linear memoryはブラウザ全体のメモリやピークではない。モバイル実機の性能・ピークメモリは未検証。

## 動作・publish検証

| 検証 | 結果 |
|---|---|
| 既存コンソールChecks | Release、2,333件成功 |
| JavaScript Worker Checks | 成功 |
| 固定ソースarchiveとの対応 | 704ファイル一致、Cargo.lock前後不変 |
| 自前buildと別targetでの再build | 成功、最終WASM/JS同一SHA-256 |
| 公式・自前APIと23文章 | NodeとブラウザWorkerの双方で一致（UTF-8位置・details・未知語フラグを含む） |
| Blazor実画面、自前エンジン | 自動生成、今日（きょう）、図書館（としょかん）、宇宙（うちゅう）、読（よ）みますを確認。1年では大人は既習でルビなし |
| 手動修正・再自動生成 | 今日を「こんにち」へ修正、再生成で保持。学年6でルビなし、1へ戻すと手動/自動読みを再利用 |
| 原文変更・未知語・Unicode | 旧版が隔離されること、新原文の今日だけ自動推定、髙𠮷葛＋IVSは要確認、改行・`<>&😀`の原表記保持を実画面で確認 |
| コピー | ボタンの完了表示を確認。実クリップボード文字列の再貼り付けは操作ツールのvirtual clipboardが空のため未確認。出力ロジックの自動・手動・OFF・学年変更・未知語・Unicode検証は上記2,333 Checksで成功 |
| 最新Release publish | 成功、`artifacts/furigana-notices-final-publish/`。wasm-tools未導入の既存SDK最適化案内あり、publishエラーなし |
| Prepare-Pages / Verify-Pages | 成功、`/KanjiVariants.Playground/`、24静的参照。ローカル検証用self/officialのサブパスでもWorker・辞書取得と自動生成成功 |
| publish通知同梱 | 全27件が実在、全SHA-256一致。manifest掲載の全通知・証跡を実publishから読み直して検査 |
| Verify-FuriganaLicenseEvidence | 27通知・証跡、106候補、エンジン・辞書ハッシュ成功 |
| Verify-FuriganaRedistribution | 通知充足を表示後、公式binary対応未証明でexit 1。公開承認false維持 |

スクリーンショットと詳細ログ・バイナリはignoredな`artifacts/furigana-self-build/`へ保存。テスト用selfコピーのmanifestはエンジンハッシュだけ変更したもので、公式版inventoryとの対応を承認した配布物ではない。本番ルートには書き戻していない。

## 公開可否と正式採用への提案

1. **通知の実不足:** 確認した106件について0件。27通知のpublish同梱も解消した。未特定依存がある可能性を、確認済み通知の不足と混同しない。
2. **公式のビルド来歴:** 未解消。本番は公式版を維持しているため、今回の自前記録ではこの問題を解消できない。固定lock/features/後処理を示す上流の記録・回答か、正式な自前版採用が必要。
3. **技術検証:** PCのAPI/生token/実画面/同梱検証は成功。モバイル実機、Safari/Firefox、低速通信・中断・キャッシュ破損、別環境のビルド再現性・ピークメモリは残る。

自前ビルドを正式採用する場合は、別の明示された実装工程で次を行う:

- CIのソースcommit・lock・Rust/target配布物・wasm-bindgen・設定を固定し、compiler-artifactとツール/標準ライブラリ入力ハッシュを保存する。Cargo外の生成・link・後処理入力と標準ライブラリ原典/通知対応も記録して監査範囲を確定する。完全SBOMと主張するなら、その範囲を別途証明する。
- 独立runnerで再ビルドを比較する。wasm-opt導入で容量削減するなら、別工程として版・取得元・ハッシュ・実flagsを固定し、互換性・読み・測定を再検証する。
- 自前版の配布物へWASM/JSを置換し、Prepare-FuriganaAssetsの取得経路・manifest・LICENSE-INVENTORY・来歴資料を自前版の実hashへ対応させる。公式用inventoryをそのまま流用してエンジン対応済みとしない。
- 全27通知、crateの変更差分、Rust/生成JS通知を再照合し、Release publish・サブパス・ライセンスリンク・既存Checks・実画面のコピーを再確認。モバイル実機のメモリ/初期化・主要ブラウザで検証する。
- その根拠をレビューした後にのみ公開阻害要因を更新する。今回の成功を理由にbinaryAttestedやpublicationApprovedをtrueにしない。ライセンス本文の完全SBOM義務を推定して追加もしない。

公式版維持も有効な選択肢だが、上流の証跡が得られるまでは現行の公開保留を維持する。自前版はJS互換性と読みの一致、追加容量約0.44 MBから技術的には実用候補。保守を引き受けることと監査範囲の確定が採用条件となる。
