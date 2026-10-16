# 自動ふりがなの事後認証と公開ゲート（案B、v1）

2026-10-16。調査基準は `990ae7a022352e2a522f3d7d2272d27afda7084b`。所有者が案Bの保証範囲への変更を承認したことに基づく。**正式公開の承認ではない。** 以前の来歴・完全SBOM未証明の評価は維持する。

## 保証の意味

profile: `recorded-build-inputs-and-artifact-identity/v1`。

固定WASM/JS/辞書、固定Linderaソース・lock、保存された2回のコンパイル記録と106 packageのvariant、公式Rust標準ライブラリ54入力、記録されたwasm-bindgen処理前後、宣言範囲の通知・既知の未充足0件、同一PCの分離環境での再現記録を照合する。これは既存成果物への**事後のローカル審査**。ビルド時の署名や第三者による独立再現証明ではない。

| 以前の条件 | 案Bの条件 |
|---|---|
| `sbomCompleteness.status=verified` | 完全リンクSBOMを要求せず、定義したprofileの証跡を検証 |
| `licenseAudit.binaryAttested=true` | この曖昧なフラグはfalseのまま。別の `scopedAttestation` と独立検証器を使用 |
| `licenseAudit.status=approved` | `scoped-attestation-verified`。公開の承認を意味しない |
| blockers空、publicationApproved=true | 引き続き両方が必須。現在は未充足 |

除外した保証は、最終リンク構成要素の完全一覧、LTO後の全命令・データとソースの一意対応、全ビルド入力の完全閉包、第三者環境での独立再現、コンパイラ/PC非侵害の証明。これらは旧実装でも実証できていなかった。今回実証済みへ変更しない。元の `SELF-BUILD-PROVENANCE.json` の `completeness.binarySbom=false`、manifestの旧SBOM/binaryAttested値も維持する。

完全SBOM自体は、この範囲のMIT/Apache等の許諾が一律に要求する文書ではない。実際の通知・著作権表示・免責等は別の必要条件であり、欠落を許容する変更ではない。未知の残存コードがあれば未知の通知条件や脆弱性を見落とすリスクは残る。

## 証跡と信頼の起点

配布用証跡は `wwwroot/furigana/lindera-6.2.0/attestation-v1/` に置く。

- `ATTESTATION.json`: schema/profile、対象の全hash、元来歴、106依存とfeatures/platform/target kind、原ログhash、標準入力、通知、方法、審査日、残余リスク、保証対象外。
- `COMPILER-BUILD-1.json` / `COMPILER-BUILD-2.json`: 各122 compiler-artifactの公開用projection。package ID（workspace物理位置は固定ラベルへ置換）、source、features、platform、target kinds、crate types、profile、artifact名。artifact名だけで、そのファイルが最終WASMに残ったとは判断しない。
- `RUST-STANDARD-LIBRARY-REVIEW.json`: 49候補の分類・54入力への対応・106件との重複・通知hash・固定Rustソースの出典。
- `rust-source/`: Rust固定コミットのlibrary lockと調査用manifest、compiler-builtins許諾全文。原文を保存する。
- `supplement/` / `supplement-sources.json`: 既存Rust通知に個別項目が見つからなかった5 crateの原典許諾、取得元、Cargo.lock checksum、archive memberの記録。

元来歴とWASM等の起点は既存の `scripts/FuriganaSelfBuildPolicy.mjs`。新しい証跡とポリシーのバイト列hashは、別のレビュー対象コード `scripts/FuriganaAttestationRoots.mjs` へ固定する。`scripts/furigana-attestation-policy.json` の自己申告だけでは受け入れない。schema/profile/保証/除外の意味も検証器側で一致を要求する。

証跡＋manifest＋ポリシーを改変しても、レビュー済み起点が不変なら未知の成果物は拒否される。一方、**検証器や信頼起点自体を書き換える権限を持つ者への暗号的防御ではない**。署名も外部透明性ログもない。root変更は独立のレビュー・所有者の判断が必要で、自動生成器で更新しない。従来の採用/来歴再記録/アセット準備スクリプトは、認証がある状態での上書きを拒否する。

## 原ログとCIで確認できる範囲

原ログ4件は既存来歴が固定した次の保存版を使う。後から上書きされた作業用ログは使用しない。

| 保存版 | SHA-256 |
|---|---|
| compiler JSONL 1 | `2f0c4ba8281994e878bd76924f96ed8263c9f2e72914bbe9d256b23df9e67246` |
| compiler JSONL 2 | `9df0a7f73f56c08f3e4e0ae673d024a05903ab357d2b6b68dff125ea6e46d2c2` |
| commands 1 | `b12f00d0bba51c516b571b39f2fe13bc87c9247856a08ebd4c98a2b0c6da1664` |
| commands 2 | `a12daf75ea5e6ff7eea2a9dc483d2a52199cf29ae9bf5dd436e3eb38dd16f3c8` |

保存先はGit管理外 `artifacts/furigana-self-build/normalized-evidence/<hash>.jsonl` / `.log`。物理パスを含むので公開しない。ローカルrawモードは4hash、fresh=falseの各122行、106 packageとvariant、実rustcのremap指定を再照合する。保持した処理前WASM、bindgen exe/配布archive、2組の最終WASM/JSのhashも照合する。ソースarchiveは固定hashと照合する。

CIには原ログがない。**CIはprojectionを原ログから再導出したとは主張しない。** ローカル審査で照合したprojectionのレビュー済みhash、改変していない元来歴、106依存/variant、公式標準入力、配布物/通知の実バイト列を再検証する。この原ログとの対応はレビュー起点への信頼を含む。原ログhashだけからprojectionの正しさを数学的に証明できるわけではない。

wasm-bindgen 0.2.126のexeと配布archive、処理前hash、固定処理コマンド、処理後と繰り返し出力の対応は保存証拠で確認する。今回は変換器を再実行しない。元ビルド時のコンパイラ実行ファイルhashや全環境変数を後から記録したものではない。

## Rust標準ライブラリ

Rust 1.98.1、commit `48a229ceaefd4985c50990b14116b6d856af0985`。
公式 [wasm32標準ライブラリ配布物](https://static.rust-lang.org/dist/2026-09-03/rust-std-1.98.1-wasm32-unknown-unknown.tar.xz) のSHA-256は `cf1fcf68880d8b2b90128cede7416cfb82ad3584357ce9fb668f2b6244c26e55`。27組のrlib/rmeta、54ファイルすべてが記録と一致。CIも22,423,420 bytesの公式archiveを取得・hash検証し、54入力を再照合する。既存キャッシュも毎回archive hashを検証する。

固定 [library/Cargo.lock](https://github.com/rust-lang/rust/blob/48a229ceaefd4985c50990b14116b6d856af0985/library/Cargo.lock) の49 packageブロックは追加runtime依存数ではない。[workspace](https://github.com/rust-lang/rust/blob/48a229ceaefd4985c50990b14116b6d856af0985/library/Cargo.toml) と [std manifest](https://github.com/rust-lang/rust/blob/48a229ceaefd4985c50990b14116b6d856af0985/library/std/Cargo.toml) を併用して分類した。lock SHA-256は `d1c5dbdf53bfebd7de60f26a171819db3b28ebfd75f3fa99c3286893a5a7b7a6`。

- 27候補: 公式入力に同名のrlib/rmetaがある。入力の存在を示し、全27成分が最終リンクされたという意味ではない。test/proc_macro/sysrootも含む。
- テスト候補: alloctests/coretests/rand/rand_core/rand_xorshift。
- 他target候補: SGX/Hermit/Motor/UEFI/VEX/WASI/Windows、unwindのXous依存など。cfg条件はJSONの理由へ記録。入力一覧に独立ファイルがないことを、WASM中に一切コードがない証明に使わない。
- optional build候補: cc/shlex。compiler_builtinsのC featureに関係する。今回のLindera106件へ加算しない。
- その他: foldhashはhashbrownへ内包され得る候補、profiler_builtinsはoptional。独立入力がないだけで不存在と断定しない。
- 106件との同名重複はcfg-if 1.0.4、hashbrown 0.17.1（版も一致）、memchr（標準候補2.7.6 / Lindera2.8.3で版違い）。重複を統合して通知を失わない。

Rust配布元の `COPYRIGHT-library.html` とMIT/Apache等の既存通知は一切変更しない。個別項目が見つからなかったaddr2line 0.25.1、adler2 2.0.1、memchr 2.7.6、miniz_oxide 0.8.9、object 0.37.3は、公式crateを固定lockのchecksumで照合してrootのLICENSE/COPYING等全文を追加。compiler_builtins 0.1.160は固定Rustソースの `library/compiler-builtins/compiler-builtins/Cargo.toml` と `library/compiler-builtins/LICENSE.txt`（MIT AND Apache-2.0 WITH LLVM-exception等）に対応付けた。従来29通知・証跡に15ファイルを補足して44。原文の削除・再許諾は行わない。

公式target配布物の同一性は検証するが、その上流ビルドを再現したわけではない。ソースlockの候補版と全バイナリ内コードの完全対応は未証明。今回の通知は候補を保守的に含めた宣言範囲に対する充足評価である。

## 実行方法と公開順序

```powershell
# CIと共通: 必要な場合だけ固定公式std archiveを取得する。Rustビルドなし。
node scripts/Verify-FuriganaAttestation.mjs --fetch-inputs
# 保存した原ログと処理前/後・ツールも再照合するローカル審査
node scripts/Verify-FuriganaAttestation.mjs --raw-evidence artifacts/furigana-self-build/normalized-evidence
# publish後の全証跡・通知・原典・対象asset bytesも比較
node scripts/Verify-FuriganaAttestation.mjs --publish-root artifacts/publish/wwwroot
node tests/KanjiVariants.Playground.Checks/FuriganaAttestationChecks.mjs
# 既存通知検証→新認証+publish照合→所有者承認+blockers空
./scripts/Verify-FuriganaRedistribution.ps1
```

新しい検証は、未知schema/profile、対象hash・辞書・原来歴・106依存/variant・原ログ・標準入力・通知・証跡欠落、除外事項を完全証明済みとする記録などで停止する。技術検証成功の後にも `publicationApproved=false` なら必ず失敗し、uploadは実行せず、needs:buildのdeployも実行しない。manifestのstatusだけを成功へ変更しても通らない。

GitHub workflowは新しい正常/異常系だけを追加。Action SHA、permissions、main条件、Environmentは変更しない。公開用tarにリンクを含めない検査も維持。実CIの今回の変更による実行は未実施（Push禁止）。

正式公開にはモバイル実機の最小確認、B2残余リスクの受入判断、所有者の独立した公開承認とblockersの根拠付き解消が残る。公開条件の承認だけで完全SBOM証明に書き換えない。将来バイナリやprofileを変える際は、別の証跡と信頼起点のレビューが必要。

## 今回の検証記録

コミット前のローカル検証（2026-10-16）:

| 検証 | 結果 |
|---|---|
| SDK / locked restore | 10.0.401 / 成功。global.json、lock、NuGet依存の変更なし |
| Debug / Release | ともに0警告・0エラー |
| 既存Checks / Worker | 2,333件 / 成功 |
| 新認証 | 公開projectionモード・ローカル原ログ4件モードとも成功。106依存、54標準入力、既知通知不足0 |
| 新認証の正常/異常系 | 30ケース成功（証跡+policy同時改変、asset+manifest+証跡同時改変、元ログ・公式archive不正、未承認要求、publish欠落を含む） |
| 既存の改変/パス/Actions policy | 成功 / 118ケース成功 / 11ケース成功 |
| fresh Release publish / サブパス | 成功。静的参照35件、正式KanjiVariants1.2.1の通知3件、Lindera通知・証跡44件と新証跡を照合 |
| 両Webcil raw/br/gz | linked PEとの一致、展開後一致、ローカル絶対パス0 |
| Debug/ReleaseのPDB/SourceLink | 各23 tracked + 16 generated文書のチェックサム、DLL-PDB識別子一致、local path0（コミット前working-tree検証） |
| immutable assets/evidence | 既存40ファイルをHEADのGit blobと比較して全バイト一致。新公開証跡31ファイルの開発環境固有パス0 |
| 公開ゲート | publish照合と技術認証成功の後、publicationApproved=falseで終了コード1。upload/deploy未実行 |

既存の再利用publishディレクトリに過去1.2.0通知が残ることを検証器が検出したため、削除せずGit管理外の新規出力 `artifacts/attestation-v1-validation/publish` で再検証した。補足通知へのリンクの拡張子誤りも検出・修正して再publish済み。最終判定に失敗した中間成果物を使わない。

コミット後にしか分からないHEAD/clean checkoutのSourceLink検証結果はGit管理外の記録と最終報告へ分離する。新コミットのGitHub公開URL確認、今回のworkflowの実CI、モバイル実機は未実施。Push、公開承認、デプロイは行わない。
