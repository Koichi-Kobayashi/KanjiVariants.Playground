# Lindera開発元への確認事項（未送信）

対象は公式npm `lindera-wasm@6.2.0`。この文書は問い合わせ案であり、Issue・メール・その他の送信は行っていない。

## 確認目的

kanariaを含む限定した固定ソース依存範囲の必要通知は補完済み。残る問いは公式npm WASMに実際に組み込まれたコードとその範囲の対応。完全SBOMの作成をMITの義務として要求する趣旨ではなく、追加・相違依存に必要な通知の漏れを防ぐための照合である。

## 送信案

We are auditing redistribution of the official npm package `lindera-wasm@6.2.0` in a browser application. We do not modify its WASM or generated JavaScript.

- npm tarball SHA-256: `ed82e271e54a4bddaeeeddcbe8f69037c5d7dbbd6f273bd516cdb7325c866cdf`
- `lindera_wasm_bg.wasm` SHA-256: `52f4b492f9dd0edf876b90d3432ae2284b2d996bf8e697327d1fc3b0277e6431`
- `lindera_wasm.js` SHA-256: `a9e082fca426d6d225a439bac39c9d690aa5176598d7c902ca71e1fe4ba8d03a`
- npm gitHead / v6.2.0 commit: `0482efcc46b5ec518b7238efae55e9fed9bba0c0`
- Tagged Cargo.lock SHA-256: `6b30d175d6234ad39b8b969101af13834b28545f3eb9801e454002832db18d75`
- WASM producers: rustc `1.98.1 (48a229cea 2026-09-01)`, wasm-bindgen `0.2.126 (21ac804a9)`, walrus `0.26.4`.

We reproduced dependency resolution for `lindera-wasm`, target `wasm32-unknown-unknown`, without extra root features or embedded dictionary features, using the tagged lock file. This gives 84 normal target candidates, 21 proc-macro host-subtree candidates, and one build-only candidate (`rustversion 1.0.22`). We preserve upstream transitive defaults. This is a source dependency inventory, not proof of the final linked contents.

Could you confirm:

1. Was the tagged Cargo.lock used unchanged for the Build WASM job that produced this npm artifact? The workflow runs `wasm-pack build --release --target web` without `--locked`; we understand that omission alone does not imply a changed lock file.
2. Were extra Cargo features, patches, environment configuration, injected/generated source, or embedded dictionaries used beyond the tagged workflow? Please identify any differences.
3. Is the resolved dependency list, Cargo.lock from that build, or build provenance available? We cannot access the job-log download API (403). An existing record or maintainer confirmation is useful; a new attested SBOM is not assumed to be a license obligation.
4. Are there additional copyright/license/NOTICE texts required for the shipped binary or generated JS beyond the tagged dependency notices and the Rust 1.98.1 standard-library notices? Please identify them or point to a published complete notice bundle.
5. If a byte-identical rebuild is a suitable way to resolve the provenance question, what exact wasm-pack version, target toolchain, wasm-bindgen/optimization versions, and build flags were used?

The remaining uncertainty concerns correspondence and notice coverage for any unidentified dependencies, not a finding that the supplied licenses prohibit redistribution. We have separately verified kanaria 0.2.0 against the original source commit and added its upstream MIT text/copyright notice.

## 回答の評価

**2026-10-13:** 現行構成は[自前WASMへ移行](FURIGANA-SELF-BUILD.md)した。上記は公式npm配布版の未解決事項・履歴であり、自前版の実コンパイル記録とは区別する。公式版へ戻す判断や公式版の監査を完了する場合には引き続き有用。問い合わせは送信していない。今回の公開承認はfalse。

2026-10-12の後続検証で、固定lock/ソースをRust 1.98.1・wasm-bindgen 0.2.126により`--locked --offline`でビルドし、別targetでも自前WASMのハッシュ一致を確認した。生成JSは公式版と同一だが、自前WASMは公式版と異なる。したがって、上記の公式実buildへの問い合わせ事項は未解消。[検証記録](../experiments/furigana-self-build/REPORT.md)を参照。通知の既知未充足0件と、公式版の全対応未証明を引き続き分ける。問い合わせは送信していない。

- 実buildのlock/feature記録が固定ソースと一致すれば、その根拠を監査結果へ保存する。
- 追加・相違依存が判明したら、その原許諾・著作権・通知を追加する。ソースで見つからないものをMITと推定しない。
- 固定ソース候補と実リンク内容は分ける。build tool全体をWASM内コードとして数えない。
- 回答・SBOMがない場合は、未証明の範囲を維持する。通知の既知未充足0件と、公式バイナリ通知網羅性の未確定を混同しない。
- 監査状態の更新とプロジェクトの公開承認は別工程。今回は公開承認を解除しない。
