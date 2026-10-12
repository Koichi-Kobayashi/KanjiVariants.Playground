# Lindera 6.2.0＋IPADIC 公開前ライセンス・再配布監査

監査日: 2026-10-12。対象コミット: `1ecebed`。開始時の作業ツリーはclean。P2bの実配布物を対象に、固定公式ソース・公式配布アーカイブ・原典を照合した。機能、判定、解析・表示コード、NuGet参照、辞書・WASM・JavaScriptの実行バイト列は変更していない。コミット・Push・デプロイなし。

## 結論

**同日の後続検証:** 固定ソースの`--locked --offline`自前WASMビルドと別targetでの再ビルドに成功。最新Release publishに全27通知・証跡が同梱され、全SHA-256一致を確認した。詳細は[自前ビルド・同梱検証](../experiments/furigana-self-build/REPORT.md)。過去の未実施記録は当時の事実として残すが、27件のpublish同梱の未検証状態は解消した。本番は公式版のままで、その実build対応未証明による公開停止は維持。

**確認した固定ソース依存範囲の通知不足は解消。公式npm WASMとの完全対応は未証明のため、公開承認は保留を維持する。** IPADIC版表記に加え、kanaria 0.2.0を開発元の同一コミットと照合してMIT全文・著作権通知を補った。限定スコープは106件（normal target候補84、proc-macro host subtree候補21、build-only候補1）。既知の通知未充足は0件。

残る問題は**公式npm WASMの実ビルド構成と固定ソース依存範囲の完全対応**。npm gitHeadは固定タグと一致するが、実ビルド時のCargo.lock・全依存版・featureの記録は未取得。公式コマンドに`--locked`がないことは、Cargo.lockが変わった証拠ではない。既存lockがそのまま使われた可能性もあり、一部版文字列も一致するが、全件一致の証明にはならない。ログ取得は403、完全なSBOM・同一バイナリの再現証明も未取得。

**評価を分ける:**

| 問題 | 現在の判断 |
|---|---|
| 特定した固定ソース範囲の必要通知の未充足 | 解消。原許諾・著作権・追加条件を保持 |
| 公式npm WASMのSBOM完全性 | 未証明。未特定の追加・相違依存に必要な通知の網羅性も未確定 |
| ライセンス条項としての完全SBOM提出義務 | 確認したライセンスから、この一律義務は確認していない。再現ビルド必須とも解釈しない |
| このプロジェクトの公開判断 | 未確認を推測で補わない公開前監査方針により保留。再配布禁止条項の発見とは区別 |

manifestは`publicationApproved:false`。公開前チェックは「固定ソース範囲の必要通知: 充足」を表示した後、SBOM・実バイナリ対応が未確認という別分類で非ゼロ終了する。[開発元への問い合わせ事項](FURIGANA-UPSTREAM-QUESTIONS.md)を作成したが、送信していない。

## kanaria 0.2.0 の通知不足の解消（継続監査）

前回はcrate内にLICENSEがなく、Cargo.tomlに記された旧URL `sam-osamu/com.kanaria`が404だったため未充足とした。利用者指定の開発元[samunohito/kanaria](https://github.com/samunohito/kanaria)にて、crateの`.cargo_vcs_info.json`が記すコミット`c994ccf06d179851a1c7c3285c3a408ccb6279ec`を取得できた。

- 同コミットの`kanaria_core/src`とcrates.io 0.2.0のRustソース**全13ファイルがバイト一致**。
- 同コミットの`kanaria_core/Cargo.toml`とcrateの`Cargo.toml.orig`もバイト一致（SHA-256 `247f9e62125ff0193947882b57c480884ba5c32b701b768e89b02bd521dc9104`）。publish時に生成されたCargo.tomlと混同しない。
- 同コミットの[root LICENSE.txt](https://github.com/samunohito/kanaria/blob/c994ccf06d179851a1c7c3285c3a408ccb6279ec/LICENSE.txt)を取得。MIT全文と`Copyright (c) 2019 samu no hito`を原文通り保持。
- LICENSE.txt SHA-256: `f44d765862a602a68553b3614e63b0ea4646d7698d2c34fc8d60f7998c9a8e7b`。今回取得したraw LICENSEと固定ソースzip内のLICENSEもバイト一致。
- `KANARIA-LICENSE.txt`を同梱し、第三者通知のkanaria項目にも全文を追加。各ソースSHA-256・VCS情報・元manifest・ライセンス取得先は`KANARIA-PROVENANCE.json`に記録。

現在ブランチのMIT表示だけから過去版を推定したのではなく、**crateが指定する同じコミットと実ソース内容**で適用範囲を確認した。著作権者・年を独自に補わず、kanaria通知不足の阻害要因を解消した。

## 実配布物と取得元

同梱先: `src/KanjiVariants.Playground/wwwroot/furigana/lindera-6.2.0/`。

| 対象 | 固定版・取得元 | SHA-256 |
|---|---|---|
| npm原パッケージ | [lindera-wasm-6.2.0.tgz](https://registry.npmjs.org/lindera-wasm/-/lindera-wasm-6.2.0.tgz) | `ed82e271e54a4bddaeeeddcbe8f69037c5d7dbbd6f273bd516cdb7325c866cdf` |
| 実WASM | 上記tgzの`package/lindera_wasm_bg.wasm`、1,784,285 bytes | `52f4b492f9dd0edf876b90d3432ae2284b2d996bf8e697327d1fc3b0277e6431` |
| 実JavaScript glue | 上記tgzの`package/lindera_wasm.js`、66,542 bytes | `a9e082fca426d6d225a439bac39c9d690aa5176598d7c902ca71e1fe4ba8d03a` |
| コンパイル済みIPADIC原zip | [lindera-ipadic-6.2.0.zip](https://github.com/lindera/lindera/releases/download/v6.2.0/lindera-ipadic-6.2.0.zip)、format 2 | `5ed4bba6b429030b0387df67d40d5751d35dedef0306f4bac6d957cad5f04b72` |
| 固定ソースCargo.lock | [v6.2.0のCargo.lock](https://github.com/lindera/lindera/blob/0482efcc46b5ec518b7238efae55e9fed9bba0c0/Cargo.lock) | `6b30d175d6234ad39b8b969101af13834b28545f3eb9801e454002832db18d75` |

公式配布物を今回再取得し、P2aで記録されたtgz/zipのSHA-256と一致した。実同梱WASM/JSは再取得tgzの展開物とバイト一致。辞書9ファイルはgzipを展開した内容が再取得zipの各ファイルとバイト一致。gzip圧縮以外に変更していない。npmの[版メタデータ](https://registry.npmjs.org/lindera-wasm/6.2.0)のgitHeadと[公式v6.2.0タグ](https://github.com/lindera/lindera/tree/v6.2.0)はともに`0482efcc46b5ec518b7238efae55e9fed9bba0c0`。

WASMの`producers`セクションは実バイト列から取得: Rust、rustc `1.98.1 (48a229cea 2026-09-01)`、walrus `0.26.4`、wasm-bindgen `0.2.126 (21ac804a9)`。walrusは加工ツールの記録であり、そのコードが実行時リンクされたと断定しない。バイナリ中のパス文字列から27種の版文字列を確認し、25種は固定ソースの依存候補と一致、`dlmalloc 0.2.13`と`rustc-demangle 0.1.27`はRust標準ライブラリ通知と一致。ただし文字列のない依存コードを除外できる方法ではなく、完全SBOMにはならない。

## IPADIC原典とNOTICEの照合

固定[build.rs](https://github.com/lindera/lindera/blob/0482efcc46b5ec518b7238efae55e9fed9bba0c0/lindera-ipadic/build.rs)は`https://Lindera.dev/mecab-ipadic-2.7.0-20250920.tar.gz`を指定し、MD5は`a95c409f12f1023fce8ef91f991ef042`。今回取得した原典と一致。SHA-256は`a7ba9f645ffe7094e56ae1c4a81d100df8fbb1e28bbe1792622e9728e162db3d`。

公式辞書ソースには2コミットがあり、[79f5146f…](https://github.com/lindera/mecab-ipadic/commit/79f5146f8615277ca2c1817f04af9b932c9c6423)は`Convert to UTF-8 (#1)`。配布READMEも[Lindera用のMeCab原典fork](https://github.com/lindera/mecab-ipadic/tree/2.7.0-20250920)と説明する。

比較した2007原典: [Linderaで保持するmecab-ipadic-2.7.0-20070801.tar.gz](https://Lindera.dev/mecab-ipadic-2.7.0-20070801.tar.gz)、SHA-256 `099e46e80d55e7c0d6906783aff713748e1ae90f46c5ef96ec153bbf09bf5550`。アーカイブ内19ファイルはバイト一致。24ファイルはWHATWG EUC-JPデコード後にUTF-8版と一致。残る9ファイルは長さ・文字位置が一致し、相違はU+FF5E→U+301C、U+FF0D→U+2212、U+FFE1→U+00A3、U+2225→U+2016の4組だけ。追加は変換スクリプト1本、削除なし。「全辞書のUnicode表記が同一」とは主張しない。

**COPYINGは両原典でバイト一致**し、[原MeCabリポジトリのCOPYING](https://github.com/taku910/mecab/blob/master/mecab-ipadic/COPYING)とも一致。SHA-256 `fca02d9adb601d101eccdf3131119abfff2d9c825ef5c759d7a89ebbaa972099`。20250920版のCOPYINGに追加の権利者・異なる再配布条件はない。

従来同梱のNOTICEは20070801を記す配布元の原文として保持する。その冒頭にはNAISTの著作権表示（2000–2003）と、原形・改変形の各コピーに著作権と後続段落の保持を求める許諾段落がなかった。原典の全文を`IPADIC-COPYING`として追加し、日付関係は`IPADIC-PROVENANCE.md`で補足した。旧NOTICEを20250920へ書き換えたり、権利者・許諾を推測で追加したりはしていない。ICOTの再配布時のNO WARRANTY添付条件も全文を保持。

## WASMの第三者コードと必要通知

[固定lindera-wasm/Cargo.toml](https://github.com/lindera/lindera/blob/0482efcc46b5ec518b7238efae55e9fed9bba0c0/lindera-wasm/Cargo.toml)と変更なしのCargo.lockから、root `lindera-wasm`・target `wasm32-unknown-unknown`・root default feature無効・追加root featureなしへ限定して解決した。upstreamのroot `default=[]`なので、ここを無効にしてもrootの実効featureは空。**依存crateが宣言するdefault featureは維持**し、全依存に`no-default-features`を適用したと扱わない。

| 解決した範囲 | 件数・例 |
|---|---|
| normal target候補（proc-macro subtreeを除く） | 84件。kanaria 0.2.0、lindera系、js-sys等 |
| normal treeのproc-macro host subtree候補 | 21件。通常の105件へ含まれるが、全てをWASM内コードとはみなさない |
| build-only候補 | 1件: rustversion 1.0.22。通知を保守的に同梱するがWASM実行コードとは断定しない |
| 通知・依存一覧の合計 | 106件。101 registry crate＋5 workspace crate |

rootのfeatureは空、lindera/lindera-dictionaryのtransitive featureは`default,mmap`、lindera-analysisは`default`、lindera-binding-coreは空。`embed-*`・`train`・dev依存・他bindingを追加していない。optionalなIPADIC等の辞書crateは当該graphに含まれない。アプリで外部辞書を読む方式とは区別して、公式バイナリに何が埋め込まれたかは独立した未確認事項とする。

`cargo metadata`はpackage定義とchecksumの取得に使い、workspace全体のresolve node featureをroot単独のfeatureとして流用しない。root選択が可能な`cargo tree -p lindera-wasm`の`{f}`とrole別treeから限定スコープを作成した。normal/normal＋build/features/no-proc-macroのtree、実行条件・証跡SHA-256は`WASM-SOURCE-DEPENDENCIES.json`に記録。これはソースから再現した**依存解決**で、公式WASMを同一バイト列へ再コンパイルした証明ではない。

root defaultを有効にした公式web recipe相当のソース解決とも比較し、106件のpackage IDとroot以外のfeature variantは同一だった。差はrootで空の`default`feature名が有効になることだけ。ソースのlindera-wasm内に`cfg(feature="default")`による分岐は見つからなかった。これは追加のソース照合であり、公式npmの実buildに同じ入力が使われた証明にはしない。各packageの`features`は観測variantの和集合、`featureVariants`はhost/target等の解決差を保持する。

監査環境のCargoは`1.93.1 (083ac5135 2025-12-15)`。WASMに記録されたrustc版とは区別する。再実行した主要コマンド（固定ソース取得とregistry cacheがある状態）:

```powershell
$wasmManifest = 'artifacts/license-audit/source/lindera-6.2.0/lindera-wasm/Cargo.toml'
cargo metadata --manifest-path $wasmManifest --locked --offline --no-default-features --filter-platform wasm32-unknown-unknown --format-version 1
cargo tree --manifest-path $wasmManifest -p lindera-wasm --locked --offline --target wasm32-unknown-unknown --no-default-features -e normal --prefix none --format '{p}|{l}'
cargo tree --manifest-path $wasmManifest -p lindera-wasm --locked --offline --target wasm32-unknown-unknown --no-default-features -e normal,build --prefix none --format '{p}|{f}'
cargo tree --manifest-path $wasmManifest -p lindera-wasm --locked --offline --target wasm32-unknown-unknown --no-default-features -e normal,no-proc-macro --prefix none --format '{p}|{l}'
cargo tree --manifest-path $wasmManifest -p lindera-wasm --locked --offline --target wasm32-unknown-unknown --no-default-features -e normal,build,features
```

出力の機械照合は`scripts/Resolve-FuriganaLicenseScope.mjs`。registry/.cargo_vcs情報が対応するソースを確認し、ソース比較とscope JSONを作成する。`--locked`実行前後で固定Cargo.lockのSHA-256は変わっていない。

101 registry crateはCargo.lockのarchive checksumと取得した`.crate`のSHA-256を照合。各ライセンス・COPYRIGHT・NOTICEファイルは省略せず収集。5件のworkspace crateは固定公式ソースを使用。個別の版・原crate URL・archive SHA-256・role・解決feature・ライセンス宣言・通知SHA-256は`LICENSE-INVENTORY.json`に全件記載。これは**ソース依存候補の棚卸しで、実WASMの完全SBOMではない**。

| 対象・条件 | 確認と対応 |
|---|---|
| lindera-wasm MIT | npm LICENSEは著作権2024。従来のLICENSEをそのまま保持 |
| lindera/core MIT | workspace LICENSEは著作権2019。WASMの2024通知だけでは代替せず、LINDERA-CORE-LICENSEを追加 |
| MIT OR Apache-2.0等の選択式 | 選択肢をANDと読まない。上流が配布する両全文・著作権・NOTICEを保持し、今回独自に再ライセンスしない |
| encoding_rs 0.8.41 | `(Apache-2.0 OR MIT) AND BSD-3-Clause`。COPYRIGHTとLICENSE-WHATWGを保持。MITを選べばWHATWG通知が不要になるという扱いはしない |
| unicode-ident 1.0.24 | `(MIT OR Apache-2.0) AND Unicode-3.0`。LICENSE-UNICODEを追加条件として保持 |
| ICU4X系・zerovec/yoke等 | Unicode-3.0全文・著作権を保持 |
| ryu 1.0.23 | Apache-2.0 OR BSL-1.0。両全文を保存し、Boost選択肢をMITと表示しない |
| unsafe-libyaml 0.2.11 | crateにMIT本文はあるが、原libyaml著作権を補足。[当該crate README](https://docs.rs/crate/unsafe-libyaml/0.2.11/source/README.md)が指す[libyaml原典コミットのLicense](https://github.com/yaml/libyaml/blob/2c891fc7a770e8ba2fec34fc6b545c672beb37e6/License)をLIBYAML-LICENSEと第三者通知へ追加 |
| kanaria 0.2.0 | 配布srcと同一コミットのMIT全文・著作権を照合し、KANARIA-LICENSE.txtと第三者通知へ保存。未充足解消 |
| Rust 1.98.1 std | 公式配布物からCOPYRIGHT-library.htmlと付属license本文を保持。標準ライブラリ由来コードをnpm MITだけで扱わない |

Rust通知は[公式rustc-1.98.1 Linux配布物](https://static.rust-lang.org/dist/rustc-1.98.1-x86_64-unknown-linux-gnu.tar.xz)から取得。SHA-256 `e974f036b28565f37c0f3bd92ddefa809bee16c04f9dcf07b9ed96e05aaaf7c4`は[公式SHA-256](https://static.rust-lang.org/dist/rustc-1.98.1-x86_64-unknown-linux-gnu.tar.xz.sha256)と一致。コンパイラは実行・インストールしていない。標準ライブラリ全体のソース・複数platformに対する通知であり、WASMに全記載コードが含まれるという一覧ではない。付属license一覧にGPL等の文書があることだけでアプリ全体のライセンスを決めない。root LICENSE-MIT/APACHE/COPYRIGHTも[同じRust固定版](https://github.com/rust-lang/rust/tree/1.98.1)から補足した。

公式[Release workflow](https://github.com/lindera/lindera/blob/0482efcc46b5ec518b7238efae55e9fed9bba0c0/.github/workflows/release.yml)のBuild WASMは追加featureなしのwebビルドを記す。[成功したBuild WASMジョブ](https://github.com/lindera/lindera/actions/runs/36222777852/job/108353500651)を特定したが、管理権限が必要なログは取得できなかった。ソースのfeature定義や一部版文字列の一致だけでは、最適化・実リンク範囲を含む全依存の確定には不足する。

## 修正・検証と非変更範囲

- 原COPYING、元NOTICE、core/WASMの別MIT、106候補の通知・一覧、libyaml原典、Rust std通知を同梱。kanariaは確認した同一コミットの原MITを保持し、代替通知は作成していない。
- ライセンス画面から通知を参照可能にし、版照合済み事項と未解決事項の説明を更新。
- manifestに監査状態・通知SHA-256・公開阻害要因を記録。`noticeFulfillment`と`sbomCompleteness`で評価を分離。全27通知・証跡ファイルのハッシュを公開前チェックで検証。
- Prepare-FuriganaAssetsは再生成時に監査状態を保持し、公開承認を自動でtrueにしない。
- バイト保持の.gitattributesを通知サブディレクトリにも適用。
- 読み生成・Worker・学年判定・画面操作・コピー・既存機能のコード、NuGet、既存文字データは変更なし。WASM/JS/圧縮辞書/展開後辞書はP2b時点のハッシュを維持。
- 通知は別静的ファイルであり、初期化・解析時に読み込まない。監査メタデータでmanifestの転送は少量増えるが、解析・辞書バッファ・アルゴリズムは不変。

公開前チェックの再実行結果と配布通知のハッシュは、後述の検証記録およびmanifestを参照。

### 検証記録（2026-10-12）

| 実行・確認 | 結果 |
|---|---|
| 原公式tgz/zip、npm SHA-512 integrity、実WASM/JS、gzip展開後辞書 | 全件一致 |
| Verify-FuriganaLicenseEvidence.mjs | 27通知・証跡のハッシュ、106候補のrole/限定scope、kanariaライセンス対応、エンジン・辞書ハッシュ確認成功 |
| Verify-FuriganaRedistribution.ps1 | 固定ソース範囲の通知充足を表示後、SBOM・実バイナリ対応未証明としてexit 1。kanaria通知不足の旧理由は削除。公開承認は解除していない |
| 既存コンソールChecks | 初回監査で2,333件成功。継続監査では機能コードの変更なし、追加の.NET実行は未実施 |
| FuriganaWorkerChecks.mjs | 位置変換・初期化・再利用・リトライ・原配布物ハッシュ確認成功 |
| Release publish（ローカル検証用） | 初回監査では成功。継続監査の追加publishは自動承認レビューの利用上限で実行されず、27件のpublish同梱は未検証 |
| Prepare-Pages / Verify-Pages | 初回監査で`/KanjiVariants.Playground/`配信設定と21静的参照を確認。継続監査ではsourceの自動ふりがな通知リンク12件を検証（既存の他ライセンスはcsprojで静的資産へマップされるためsource wwwrootの実ファイルだけでは判定しない） |
| Release publishへの通知同梱 | 初回監査では24件の存在・SHA-256を確認。継続監査の27件は末尾の更新記録を参照 |
| git diff --check | 成功 |

ローカルpublishは通知同梱の検証目的で、公開gateを通過したという意味ではない。公開・Push・コミットなし。アプリの読み生成やパフォーマンスの再測定は実施せず、実行コードとエンジン・辞書バイト列が不変であることを確認した。

## 再現・証跡

`artifacts/license-audit/`（ignored）に公式アーカイブ、registryメタデータ、固定ソース、Cargo metadata/tree、IPADIC比較、公開ジョブメタデータを保存。監査収集用スクリプトは`scripts/Collect-FuriganaLicenseEvidence.mjs`。ネットワーク取得済みの固定証跡を必要とし、`publicationApproved`はfalseに維持する。原典アーカイブ、crateアーカイブ、実同梱バイト列を照合する。

公開前実行:

```powershell
node --experimental-default-type=module tests/KanjiVariants.Playground.Checks/FuriganaWorkerChecks.mjs
node scripts/Verify-FuriganaLicenseEvidence.mjs
./scripts/Verify-FuriganaRedistribution.ps1
```

3番目は今回の未解決事項により失敗するのが正しい結果。通知の整合性成功と、法的・技術的な公開承認の成立は分ける。

## 実配信辞書のSHA-256

以下は実同梱の圧縮ファイルと、公式zipの内容に一致した展開後データ。圧縮は転送用であり辞書内容の改変ではない。

| ファイル | 圧縮配信SHA-256 | 展開後SHA-256 |
|---|---|---|
| metadata.json.gz | `266156314e4cdd67473456289972429c1f868b5d272eef876aaaf380a61212e8` | `305addfbf05e41d985a1541035c79a7b6f8ae254e4bc94f1721be21adf31068f` |
| dict.trie.gz | `765abf86395adab3a833c278aadf48bff03fd2e20af1901487b97118e0644745` | `b176188057bbd78fa73c2161db1f00fbabf9afbc3471732c4b549bf707413dfb` |
| dict.valsidx.gz | `bf7de84162948566e0c5d7eed5933da68a11cf5a87a7793de98192ad5491f55e` | `f1b17f1c4682a5bd42dabe95ab7cefb461c888b839a18d213dd5c7133d3a1a76` |
| dict.vals.gz | `79e0ba1dcf0c3f814da38e593584e8c8cfad57b5186980722b9208701dbb2209` | `62af946542a17c4f16cf1122cb069b5d26f7cf652066b3b846cc4c230b6a8aa1` |
| dict.wordsidx.gz | `d911ecaec523f792bc5bc3a227cf9a30ce1657a99f506bfc52198e401af5e9e4` | `a38e0b55d6e0fa67555078f8beb6f634f264b2a6b2ea2c9a7aa111f085ada721` |
| dict.words.gz | `c51b9752f49d91e0e12158d3f42b828220ff7d18cc14ff8f649b51cfc22cce38` | `fc1d924e12af84a352feccce35b772383322760ee2b3da4be0e173ad82953938` |
| matrix.mtx.gz | `221c42265c124a5d5970f38d7ff10be3e57fadf4159314fe77945f817bc23fa8` | `915733be6589bee90b8f2af5cd314c384a1f9a2fc3af498384555986447b168b` |
| char_def.bin.gz | `34c49af9557c5243c0b522c94abc32794fff6ae36a24279351bf307bb958be13` | `ef37cf70d7e72ec023bec8e632783a6fe255b2d5fd1bce22600b595fccae48b1` |
| unk.bin.gz | `3458d4c295f3bd8e762f4314163bad512e5f99c2228ba6f6b47aba899efd4f90` | `3eeebe0ef3f8907be325aa3acb0ccbd4ccb6f5ac20ff3dd0742ff1af1c468da6` |

## 継続監査の最終記録（2026-10-12）

- kanaria: 指定された開発元の固定コミットとcrateの全13 Rustソース・元manifestを照合。同コミットのMIT許諾全文・著作権表示を追加。通知不足の旧阻害要因は解消。
- 依存範囲: root/target/featureを限定したmetadata/treeの解決を実施。normal target 84、proc-macro host subtree 21、build-only 1。root default有効時との比較ではroot以外のfeature variantとpackage IDは一致。Cargo.lockは不変。
- 配布物・通知: Verify-FuriganaLicenseEvidence成功。27通知・証跡のSHA-256、106候補のrole、kanariaライセンス対応を確認。固定ソース範囲の既知未充足は0。
- Worker Checksと監査スクリプトの構文チェック成功。git diff --check成功。既存の機能コード・辞書・WASM・glueは変更なし。
- 公開前チェック: 通知充足を表示した後、公式npmバイナリとの完全対応未証明という別分類でexit 1。publicationApprovedはfalseを維持。ライセンス本文が完全SBOMを要求するという判断はしていない。
- 開発元への問い合わせ事項を別文書へ整理。問い合わせは送信していない。
- 自動ふりがな通知へのsourceライセンスページの12リンク先の存在を確認。
- **追加Release publishは未実施:** 自動承認レビューが利用上限のため完了できず、要求は実行されなかった。安全性を理由とする拒否ではないが、承認経路を回避せず停止した。したがって、今回追加した27通知・証跡を含むpublish配布物の同梱確認は未検証。初回監査の24通知のpublish同梱成功とは区別する。
- 機能変更・コミット・Push・デプロイなし。前回の未コミット監査変更は保持した。

## 後続: 自前ビルドと最新publish同梱（2026-10-12）

- 監査開始時点`983c77c`、clean。固定公式archive全704ファイルとの一致とlock前後不変を確認。Rust 1.98.1、wasm-bindgen 0.2.126、wasm32-unknown-unknown、root featuresなし/default無効、transitive defaults維持、release/LTO、`--locked --offline`で実ビルド成功。
- 別targetディレクトリでも最終WASM/JSのSHA-256が一致。自前WASMは`602b7f57f805ef3321ddebe6be1fb8f212afa3d9e67846a9d049ad755d37fe2e`。JSは公式版と完全一致。本番配布WASMは置換していない。
- 106件の実コンパイルpackageの版・feature variant・host/target区別を記録し、既存通知へ全件対応。今回発見した通知不足は0件。compiler-artifactは標準ライブラリ内部や最終link成分の完全SBOMではない。標準ライブラリ入力ファイルのハッシュも記録したが、その限界は維持。
- Node・ブラウザWorkerで23文章の生token、位置、読み、未知語情報が公式版と一致。実Blazor画面でも自前版の自動生成・手動修正保持・学年変更・原文変更の旧版隔離・未知語/VS/補助文字保持を確認。
- 最新ローカルRelease publish成功。Prepare-Pages / Verify-Pages成功、24静的参照。`artifacts/furigana-notices-final-publish/wwwroot`の全27通知・証跡を実際に読み、SHA-256一致を確認。今回は承認利用上限で停止していない。
- 既存Release Checks 2,333件・JavaScript Worker Checks成功。Verify-FuriganaLicenseEvidence成功。公開前チェックは通知充足の表示後、公式npm実build対応未証明でexit 1、publicationApproved falseを維持。
- 比較・測定条件・未検証範囲・正式採用手順は[REPORT](../experiments/furigana-self-build/REPORT.md)、106件の版と生成物/同梱ハッシュは[MEASUREMENTS](../experiments/furigana-self-build/MEASUREMENTS.json)。正式採用と公開承認を今回の検証成功に含めない。
- モバイル実機・Safari/Firefox・独立環境での再現性は未検証。機能・本番アセット・gate条件変更、コミット・Push・デプロイなし。
