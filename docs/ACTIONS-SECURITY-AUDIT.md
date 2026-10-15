# GitHub Actions B2/B3監査（2026-10-15）

開始HEAD: `1723e55490d322ff3032d71007b3f6187927791b`、main、clean。公式GitHub Release/APIと固定コミットのaction.yml・lock・実distを今回再取得した。取得証跡はGit管理外の`artifacts/actions-security/`。過去監査のSHAを最新版の根拠に流用していない。

## 採用と根拠

| Action | 修正前 | 採用Release（UTC公開日） | 固定SHA | runtime |
|---|---|---|---|---|
| actions/checkout | v7 | [v7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1) / 2026-07-20T15:10:05Z | `3d3c42e5aac5ba805825da76410c181273ba90b1` | node24 |
| actions/setup-dotnet | v6 | [v6.0.0](https://github.com/actions/setup-dotnet/releases/tag/v6.0.0) / 2026-07-16T02:56:10Z | `a98b56852c35b8e3190ac28c8c2271da59106c68` | node24 |
| actions/upload-pages-artifact | v5 | [v5.0.0](https://github.com/actions/upload-pages-artifact/releases/tag/v5.0.0) / 2026-04-10T18:22:59Z | `fc324d3547104276b827a68afc52ff2a11cc49c9` | composite |
| actions/deploy-pages | v4 | [v5.0.1](https://github.com/actions/deploy-pages/releases/tag/v5.0.1) / 2026-09-01T21:31:19Z | `368f82528645a54fb793d4d04e342629a3f51346` | node24 |
| actions/upload-artifact | composite内 v7.0.0 | [v7.0.0](https://github.com/actions/upload-artifact/releases/tag/v7.0.0) / 2026-02-26T18:21:17Z | `bbbca2ddaa5d8feaa63e36b76fdaad77386f024f` | node24 |

checkout/setup-dotnet/upload-pages-artifactは取得時点の最新安定Releaseに既に対応しており、版を変えず参照だけ固定。deploy-pagesはv4（Node20）から公式v5.0.1（Node24）へ更新する。v5.0.0はNode24移行と依存更新、v5.0.1はpollingのbackoff/jitter等。既存inputs/outputs.page_urlとpages:write/id-token:writeを維持し、GitHub.comを対象にする。GHES互換性を主張しない。npm警告減少を理由とする更新ではない。

Node24の公式runner下限は2.327.1（checkoutで認証gitをDockerから使う場合は2.329.0）。ubuntu-latest GitHub-hosted runnerを使用。ローカルのNodeは22.19.0であり、Node24上のAction実行・OIDC・Pagesバックエンド互換性は実CI未検証。READMEの例/互換表には旧版表記が残るため、実runtimeは固定action.ymlを根拠とした。

内部Action: upload-pages-artifact v5.0.0はupload-artifact v7.0.0を既に上記SHAへ固定している。今回v7.0.2が最新であることも確認したが、compositeの内部参照を消費側から上書きできない。独自fork/Actionの書換え/別tar実装への変更は行わず、upstream更新待ちとして残す。v7.0.2の安全性は今回監査・採用していない。実行対象はdist/upload/index.jsのみで、dist/merge/index.jsは使用しない。

固定ソースURLは `https://github.com/<action>/blob/<SHA>/<file>`。ファイル毎SHA-256は [actions-policy.json](../scripts/actions-policy.json)に記録し、`node scripts/Verify-ActionsPolicy.mjs --upstream`がRelease→commit・action.yml・lock・main/postの実dist・README・SDKインストーラー・監査対象ソース・内部参照を再取得して照合する。これはupstreamのソースとdistの再現ビルド一致や完全なバイナリSBOMを証明する検査ではない。

## lock照会の前後比較

OSV npm照会日時: 2026-10-15T05:20:05.106Z。lockのpackagesからdev=trueを除き、package/versionを重複排除。devフラグの付け方はupstream lockに依存し、dist同梱を意味しない。以下は脆弱性を悪用できる件数ではない。

| 範囲 | 照会package/version | 該当package/version | 固有GHSA |
|---|---:|---:|---:|
| 従来4 Actionの更新前（composite内を除外） | 205 | 22 | 46 |
| 同じ範囲の更新後 | 238 | 25 | 48 |
| 内部upload-artifactも含む更新前 | 295 | 29 | 52 |
| 内部upload-artifactも含む更新後 | 293 | 32 | 54 |

| Action | 前: 該当版/固有GHSA | 後: 該当版/固有GHSA |
|---|---:|---:|
| checkout | 1/6 | 1/6 |
| setup-dotnet | 4/13 | 4/13 |
| deploy-pages | 18/43 | 21/45 |
| upload-artifact | 7/28 | 7/28 |

この更新で解消した固有GHSAは0。追加はGHSA-5j98-mcp5-4vw2（glob CLI）とGHSA-3xgq-45jj-v275（cross-spawn）。これらのCLI/実行経路は本workflowから確認できず、警告増加を実行可能な脆弱性増加と同一視しない。旧範囲46件は今回の再照会でも再現した。

## 実distと到達性

lockの版とdistの版が完全一致すると推定しない。取得したdistのモジュール/実装マーカーと、deploy-pagesのdist/index.js.map（旧612/new721 sources）を別途調べた。source mapとlock上のパスを関連付けられる場合も、公式distの完全なビルド依存関係を証明するものではない。以下の版はlockの版。マーカーだけの結果は**版の同梱未確定**。

### checkout

| lock package/version | distでの証拠 |
|---|---|
| undici@6.27.0 | 実装/名称マーカーあり。版の同梱未確定 |
### setup-dotnet

| lock package/version | distでの証拠 |
|---|---|
| brace-expansion@5.0.6 | 実装/名称マーカーあり。版の同梱未確定 |
| fast-xml-parser@5.9.3 | 実装/名称マーカーあり。版の同梱未確定 |
| brace-expansion@1.1.15 | 実装/名称マーカーあり。版の同梱未確定 |
| undici@6.27.0 | 実装/名称マーカーあり。版の同梱未確定 |
### deploy-pages

| lock package/version | distでの証拠 |
|---|---|
| @octokit/request-error@2.1.0 | source map: 1文書（固定コミットのlock位置に対応） |
| @octokit/plugin-paginate-rest@2.21.3 | source map: 1文書（固定コミットのlock位置に対応） |
| @octokit/request@5.6.3 | source map: 1文書（固定コミットのlock位置に対応） |
| undici@5.28.2 | source map: 79文書（固定コミットのlock位置に対応） |
| @fastify/busboy@2.1.0 | source map: 12文書（固定コミットのlock位置に対応） |
| @octokit/plugin-paginate-rest@9.1.5 | source map: 1文書（固定コミットのlock位置に対応） |
| @octokit/request@8.1.6 | source map: 1文書（固定コミットのlock位置に対応） |
| @octokit/request-error@5.0.1 | source map: 1文書（固定コミットのlock位置に対応） |
| brace-expansion@2.0.1 | source map: 2文書（固定コミットのlock位置に対応） |
| glob@10.3.12 | source map: 7文書（固定コミットのlock位置に対応） |
| minimatch@9.0.4 | source map: 6文書（固定コミットのlock位置に対応） |
| brace-expansion@1.1.11 | 名称検索で未検出。非同梱の完全証明ではない |
| cross-spawn@7.0.3 | 名称検索で未検出。非同梱の完全証明ではない |
| form-data@4.0.0 | source map: 2文書（固定コミットのlock位置に対応） |
| lodash@4.17.21 | source map: 95文書（固定コミットのlock位置に対応） |
| minimatch@3.1.2 | 実装/名称マーカーあり。版の同梱未確定 |
| path-to-regexp@6.2.1 | 名称検索で未検出。非同梱の完全証明ではない |
| minimatch@5.1.6 | source map: 2文書（固定コミットのlock位置に対応） |
| unzip-stream@0.3.1 | source map: 6文書（固定コミットのlock位置に対応） |
| uuid@8.3.2 | source map: 15文書（固定コミットのlock位置に対応） |
| yaml@1.10.2 | 実装/名称マーカーあり。版の同梱未確定 |
### upload-artifact

| lock package/version | distでの証拠 |
|---|---|
| brace-expansion@1.1.12 | 名称検索で未検出。非同梱の完全証明ではない |
| brace-expansion@5.0.3 | 名称検索で未検出。非同梱の完全証明ではない |
| fast-xml-builder@1.0.0 | 実装/名称マーカーあり。版の同梱未確定 |
| fast-xml-parser@5.4.1 | 実装/名称マーカーあり。版の同梱未確定 |
| lodash@4.17.23 | 実装/名称マーカーあり。版の同梱未確定 |
| brace-expansion@2.0.2 | 名称検索で未検出。非同梱の完全証明ではない |
| undici@6.23.0 | 実装/名称マーカーあり。版の同梱未確定 |

- **checkout:** 自リポジトリ/固定イベントref、persist-credentials:false。gitとGitHub REST/アーカイブfallbackを使うためネットワーク応答処理は到達し得る。undiciのWebSocket/cookie/retry interceptor/blob入力をworkflowから明示利用していないが、Action間接経路の全否定はしない。資格情報はGit操作時には必要で、persist=falseだけで「トークン不使用」とはしない。
- **setup-dotnet:** SDK取得のHTTPS・インストール処理は実行される。入力は固定global.json。source-url未指定でdist/setup/index.js:105797–105804のconfigAuthentication/XMLParser分岐を実行しない。cache:falseを明記し、NuGetキャッシュrestore/saveと依存glob経路を使わない。fast-xml-parserはAzure依存も含むため、すべてのXML解析が非到達とは断言しない。外部SDK配信の応答・Azure XMLのDoS経路は残余調査対象。
- **upload-pages-artifact / upload-artifact:** 入力は自ジョブのpublish/wwwroot、実際にuploadするのはrunner.temp/artifact.tar。compositeはtar --dereference/--hard-dereferenceするため、新検査でシンボリックリンク/Windows junction/複数リンクのファイルを拒否する。include-hidden-files:trueは既存の.nojekyll等を保持するため維持し、リポジトリ全体や任意のPR artifactを送らない。globの入力は固定tarファイルで外部から任意パターンを渡せない。アップロードのHTTP応答/認証処理は実行され得る。merge/download Actionは起動しないがbundleにdownload用コードがあるため非同梱としない。
- **deploy-pages:** 固定src/internal/api-client.jsのgetArtifactMetadataはDefaultArtifactClient.listArtifactsで**同じworkflow run**のgithub-pages artifact metadataを取得し、createPagesDeployment/getPagesDeploymentStatusがGitHub Pages RESTを呼ぶ。unzip-streamのコード自体はsource mapに存在するが、このsrc経路ではartifact内容をローカルdownload/extractせず、任意アーカイブを展開する経路は確認されない。Octokit request/error処理のReDoSはネットワーク応答を処理する到達可能な周辺経路であり、悪意あるレスポンスでの成立可否は未検証。HTTP smuggling/response poisoning/decompressionの警告も、信頼するGitHub endpointだから不可能とはしない。

WebSocket/RetryAgent/cookie/multipart/_.template/_.unset等を使うすべての呼出しを網羅した動的悪用試験は未実施。form-dataはdistにあり、multipart処理の有無・版・入力条件の完全な証明は未完了。HIGH/CRITICALを含む警告の実悪用可能性を全解除しない。npmの脆弱性はCI Actionの依存であり、Playgroundのブラウザ配布npm依存ではない。

## アドバイザリごとの記録

各リンクは取得したOSVの原典（GitHub reviewed advisory）。修正版欄はOSVの該当npm rangeのfixed境界を列記し、最新版の全Actionにその版が同梱されるという意味ではない。表のActionは更新後lockへの該当。到達性は上のAction別評価を適用し、細かな成立条件は各原典を参照する。

| GHSA / severity / 概要 | 該当Action: package/version | upstream fixed境界 |
|---|---|---|
| [GHSA-23c5-xmqv-rm74](https://github.com/advisories/GHSA-23c5-xmqv-rm74) / HIGH / minimatch ReDoS: nested *() extglobs generate catastrophically backtracking regular expressions | deploy-pages: minimatch@9.0.4<br>deploy-pages: minimatch@3.1.2<br>deploy-pages: minimatch@5.1.6 | 10.2.3, 9.0.7, 8.0.6, 7.4.8, 6.2.2, 5.1.8, 4.2.5, 3.1.4 |
| [GHSA-2mjp-6q6p-2qxm](https://github.com/advisories/GHSA-2mjp-6q6p-2qxm) / MODERATE / Undici has an HTTP Request/Response Smuggling issue | deploy-pages: undici@5.28.2<br>upload-artifact: undici@6.23.0 | 6.24.0, 7.24.0 |
| [GHSA-35p6-xmwp-9g52](https://github.com/advisories/GHSA-35p6-xmwp-9g52) / LOW / undici vulnerable to HTTP response queue poisoning via keep-alive socket reuse | deploy-pages: undici@5.28.2<br>upload-artifact: undici@6.23.0 | 6.27.0, 7.28.0, 8.5.0 |
| [GHSA-3787-6prv-h9w3](https://github.com/advisories/GHSA-3787-6prv-h9w3) / LOW / Undici proxy-authorization header not cleared on cross-origin redirect in fetch | deploy-pages: undici@5.28.2 | 5.28.3, 6.6.1 |
| [GHSA-3jxr-9vmj-r5cp](https://github.com/advisories/GHSA-3jxr-9vmj-r5cp) / HIGH / brace-expansion: DoS via exponential-time expansion of consecutive non-expanding {} groups | setup-dotnet: brace-expansion@5.0.6<br>setup-dotnet: brace-expansion@1.1.15<br>deploy-pages: brace-expansion@2.0.1<br>deploy-pages: brace-expansion@1.1.11<br>upload-artifact: brace-expansion@1.1.12<br>upload-artifact: brace-expansion@5.0.3<br>upload-artifact: brace-expansion@2.0.2 | 5.0.7, 1.1.16, 2.1.2 |
| [GHSA-3ppc-4f35-3m26](https://github.com/advisories/GHSA-3ppc-4f35-3m26) / HIGH / minimatch has a ReDoS via repeated wildcards with non-matching literal in pattern | deploy-pages: minimatch@9.0.4<br>deploy-pages: minimatch@3.1.2<br>deploy-pages: minimatch@5.1.6 | 10.2.1, 9.0.6, 8.0.5, 7.4.7, 6.2.1, 5.1.7, 4.2.4, 3.1.3 |
| [GHSA-3wwx-pv8p-q78v](https://github.com/advisories/GHSA-3wwx-pv8p-q78v) / MODERATE / undici vulnerable to Denial of Service via unhandled error in WebSocket permessage-deflate decompression | checkout: undici@6.27.0<br>setup-dotnet: undici@6.27.0 | 6.28.1, 7.29.1, 8.10.2 |
| [GHSA-3xgq-45jj-v275](https://github.com/advisories/GHSA-3xgq-45jj-v275) / HIGH / Regular Expression Denial of Service (ReDoS) in cross-spawn | deploy-pages: cross-spawn@7.0.3 | 7.0.5, 6.0.6 |
| [GHSA-48c2-rrv3-qjmp](https://github.com/advisories/GHSA-48c2-rrv3-qjmp) / MODERATE / yaml is vulnerable to Stack Overflow via deeply nested YAML collections | deploy-pages: yaml@1.10.2 | 2.8.3, 1.10.3 |
| [GHSA-4992-7rv2-5pvq](https://github.com/advisories/GHSA-4992-7rv2-5pvq) / MODERATE / Undici has CRLF Injection in undici via `upgrade` option | deploy-pages: undici@5.28.2<br>upload-artifact: undici@6.23.0 | 6.24.0, 7.24.0 |
| [GHSA-5j98-mcp5-4vw2](https://github.com/advisories/GHSA-5j98-mcp5-4vw2) / HIGH / glob CLI: Command injection via -c/--cmd executes matches with shell:true | deploy-pages: glob@10.3.12 | 11.1.0, 10.5.0 |
| [GHSA-5wm8-gmm8-39j9](https://github.com/advisories/GHSA-5wm8-gmm8-39j9) / HIGH / fast-xml-builder allows attribute values with unwanted quotes to bypass malicious or unwanted attributes | upload-artifact: fast-xml-builder@1.0.0 | 1.1.7 |
| [GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p) / HIGH / brace-expansion: DoS via uncontrolled recursion in parseCommaParts causing stack exhaustion | setup-dotnet: brace-expansion@5.0.6<br>setup-dotnet: brace-expansion@1.1.15<br>deploy-pages: brace-expansion@2.0.1<br>deploy-pages: brace-expansion@1.1.11<br>upload-artifact: brace-expansion@1.1.12<br>upload-artifact: brace-expansion@5.0.3<br>upload-artifact: brace-expansion@2.0.2 | 5.0.10, 3.0.7, 2.1.5, 1.1.19 |
| [GHSA-6jrj-vc65-c983](https://github.com/advisories/GHSA-6jrj-vc65-c983) / HIGH / unzip-stream allows Arbitrary File Write via artifact extraction | deploy-pages: unzip-stream@0.3.1 | 0.3.2 |
| [GHSA-7r86-cg39-jmmj](https://github.com/advisories/GHSA-7r86-cg39-jmmj) / HIGH / minimatch has ReDoS: matchOne() combinatorial backtracking via multiple non-adjacent GLOBSTAR segments | deploy-pages: minimatch@9.0.4<br>deploy-pages: minimatch@3.1.2<br>deploy-pages: minimatch@5.1.6 | 10.2.3, 9.0.7, 8.0.6, 7.4.8, 6.2.2, 5.1.8, 4.2.5, 3.1.3 |
| [GHSA-8gc5-j5rx-235r](https://github.com/advisories/GHSA-8gc5-j5rx-235r) / HIGH / fast-xml-parser affected by numeric entity expansion bypassing all entity expansion limits (incomplete fix for CVE-2026-26278) | upload-artifact: fast-xml-parser@5.4.1 | 5.5.6, 4.5.5 |
| [GHSA-8r6m-32jq-jx6q](https://github.com/advisories/GHSA-8r6m-32jq-jx6q) / HIGH / fast-xml-parser: Repeated DOCTYPE declarations reset entity expansion limits | setup-dotnet: fast-xml-parser@5.9.3 | 5.10.1 |
| [GHSA-8xcm-r25x-g524](https://github.com/advisories/GHSA-8xcm-r25x-g524) / MODERATE / undici vulnerable to downstream response desynchronization via retry interceptor | checkout: undici@6.27.0<br>setup-dotnet: undici@6.27.0<br>deploy-pages: undici@5.28.2<br>upload-artifact: undici@6.23.0 | 6.28.0, 7.29.0, 8.9.0 |
| [GHSA-9qxr-qj54-h672](https://github.com/advisories/GHSA-9qxr-qj54-h672) / LOW / Undici's fetch with integrity option is too lax when algorithm is specified but hash value is in incorrect | deploy-pages: undici@5.28.2 | 5.28.4, 6.11.1 |
| [GHSA-9wv6-86v2-598j](https://github.com/advisories/GHSA-9wv6-86v2-598j) / HIGH / path-to-regexp outputs backtracking regular expressions | deploy-pages: path-to-regexp@6.2.1 | 1.9.0, 0.1.10, 8.0.0, 3.3.0, 6.3.0 |
| [GHSA-c76h-2ccp-4975](https://github.com/advisories/GHSA-c76h-2ccp-4975) / MODERATE / Use of Insufficiently Random Values in undici | deploy-pages: undici@5.28.2 | 5.28.5, 6.21.1, 7.2.3 |
| [GHSA-cxrh-j4jr-qwg3](https://github.com/advisories/GHSA-cxrh-j4jr-qwg3) / LOW / undici Denial of Service attack via bad certificate data | deploy-pages: undici@5.28.2 | 5.29.0, 6.21.2, 7.5.0 |
| [GHSA-f23m-r3pf-42rh](https://github.com/advisories/GHSA-f23m-r3pf-42rh) / MODERATE / lodash vulnerable to Prototype Pollution via array path bypass in `_.unset` and `_.omit` | deploy-pages: lodash@4.17.21<br>upload-artifact: lodash@4.17.23 | 4.18.0 |
| [GHSA-f269-vfmq-vjvj](https://github.com/advisories/GHSA-f269-vfmq-vjvj) / HIGH / Undici: Malicious WebSocket 64-bit length overflows parser and crashes the client | upload-artifact: undici@6.23.0 | 6.24.0, 7.24.0 |
| [GHSA-f886-m6hf-6m8v](https://github.com/advisories/GHSA-f886-m6hf-6m8v) / MODERATE / brace-expansion: Zero-step sequence causes process hang and memory exhaustion | deploy-pages: brace-expansion@2.0.1<br>deploy-pages: brace-expansion@1.1.11<br>upload-artifact: brace-expansion@1.1.12<br>upload-artifact: brace-expansion@5.0.3<br>upload-artifact: brace-expansion@2.0.2 | 5.0.5, 3.0.2, 2.0.3, 1.1.13 |
| [GHSA-fjxv-7rqg-78g4](https://github.com/advisories/GHSA-fjxv-7rqg-78g4) / CRITICAL / form-data uses unsafe random function in form-data for choosing boundary | deploy-pages: form-data@4.0.0 | 2.5.4, 3.0.4, 4.0.4 |
| [GHSA-g8m3-5g58-fq7m](https://github.com/advisories/GHSA-g8m3-5g58-fq7m) / LOW / undici vulnerable to Set-Cookie SameSite attribute downgrade via permissive substring matching | deploy-pages: undici@5.28.2<br>upload-artifact: undici@6.23.0 | 6.27.0, 7.28.0, 8.5.0 |
| [GHSA-g9mf-h72j-4rw9](https://github.com/advisories/GHSA-g9mf-h72j-4rw9) / MODERATE / Undici has an unbounded decompression chain in HTTP responses on Node.js Fetch API via Content-Encoding leads to resource exhaustion | deploy-pages: undici@5.28.2 | 7.18.2, 6.23.0 |
| [GHSA-gh4j-gqv2-49f6](https://github.com/advisories/GHSA-gh4j-gqv2-49f6) / MODERATE / fast-xml-parser XMLBuilder: XML Comment and CDATA Injection via Unescaped Delimiters | upload-artifact: fast-xml-parser@5.4.1 | 5.7.0 |
| [GHSA-gxm5-99cw-xjw9](https://github.com/advisories/GHSA-gxm5-99cw-xjw9) / MODERATE / @fastify/busboy vulnerable to CRLF injection via multipart Content-Disposition filename and name | deploy-pages: @fastify/busboy@2.1.0 | 3.2.2 |
| [GHSA-h5c3-5r3r-rr8q](https://github.com/advisories/GHSA-h5c3-5r3r-rr8q) / MODERATE / @octokit/plugin-paginate-rest has a Regular Expression in iterator Leads to ReDoS Vulnerability Due to Catastrophic Backtracking | deploy-pages: @octokit/plugin-paginate-rest@2.21.3<br>deploy-pages: @octokit/plugin-paginate-rest@9.1.5 | 11.4.1, 9.2.2 |
| [GHSA-hmw2-7cc7-3qxx](https://github.com/advisories/GHSA-hmw2-7cc7-3qxx) / HIGH / form-data: CRLF injection in form-data via unescaped multipart field names and filenames | deploy-pages: form-data@4.0.0 | 2.5.6, 3.0.5, 4.0.6 |
| [GHSA-jp2q-39xq-3w4g](https://github.com/advisories/GHSA-jp2q-39xq-3w4g) / MODERATE / Entity Expansion Limits Bypassed When Set to Zero Due to JavaScript Falsy Evaluation in fast-xml-parser | upload-artifact: fast-xml-parser@5.4.1 | 4.5.5, 5.5.7 |
| [GHSA-jxxr-4gwj-5jf2](https://github.com/advisories/GHSA-jxxr-4gwj-5jf2) / MODERATE / brace-expansion: Large numeric range defeats documented `max` DoS protection | upload-artifact: brace-expansion@5.0.3 | 5.0.6 |
| [GHSA-m4v8-wqvr-p9f7](https://github.com/advisories/GHSA-m4v8-wqvr-p9f7) / LOW / Undici's Proxy-Authorization header not cleared on cross-origin redirect for dispatch, request, stream, pipeline | deploy-pages: undici@5.28.2 | 5.28.4, 6.11.1 |
| [GHSA-m8rv-5g2x-5cg5](https://github.com/advisories/GHSA-m8rv-5g2x-5cg5) / MODERATE / undici vulnerable to CRLF Injection via blob-like body 'type' property | checkout: undici@6.27.0<br>setup-dotnet: undici@6.27.0<br>deploy-pages: undici@5.28.2<br>upload-artifact: undici@6.23.0 | 6.28.0, 7.29.0, 8.9.0 |
| [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg) / HIGH / brace-expansion: DoS via unbounded expansion length causing an out-of-memory process crash | setup-dotnet: brace-expansion@5.0.6<br>setup-dotnet: brace-expansion@1.1.15<br>deploy-pages: brace-expansion@2.0.1<br>deploy-pages: brace-expansion@1.1.11<br>upload-artifact: brace-expansion@1.1.12<br>upload-artifact: brace-expansion@5.0.3<br>upload-artifact: brace-expansion@2.0.2 | 5.0.8, 3.0.3, 2.1.3, 1.1.17 |
| [GHSA-p88m-4jfj-68fv](https://github.com/advisories/GHSA-p88m-4jfj-68fv) / MODERATE / undici vulnerable to HTTP header injection via Set-Cookie percent-decoding | deploy-pages: undici@5.28.2<br>upload-artifact: undici@6.23.0 | 6.27.0, 7.28.0, 8.5.0 |
| [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr) / MODERATE / brace-expansion: Quadratic-time expansion of the `{a},b}` rewrite causes CPU denial of service | setup-dotnet: brace-expansion@5.0.6<br>setup-dotnet: brace-expansion@1.1.15<br>deploy-pages: brace-expansion@2.0.1<br>deploy-pages: brace-expansion@1.1.11<br>upload-artifact: brace-expansion@1.1.12<br>upload-artifact: brace-expansion@5.0.3<br>upload-artifact: brace-expansion@2.0.2 | 5.0.12, 3.0.9, 2.1.7, 1.1.21 |
| [GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7) / HIGH / brace-expansion: DoS via uncontrolled recursion on nested brace groups causing stack exhaustion | setup-dotnet: brace-expansion@5.0.6<br>setup-dotnet: brace-expansion@1.1.15<br>deploy-pages: brace-expansion@2.0.1<br>deploy-pages: brace-expansion@1.1.11<br>upload-artifact: brace-expansion@1.1.12<br>upload-artifact: brace-expansion@5.0.3<br>upload-artifact: brace-expansion@2.0.2 | 5.0.11, 3.0.8, 2.1.6, 1.1.20 |
| [GHSA-r53p-7pc4-xj5r](https://github.com/advisories/GHSA-r53p-7pc4-xj5r) / LOW / undici vulnerable to downstream response splitting via retry interceptor | checkout: undici@6.27.0<br>setup-dotnet: undici@6.27.0<br>deploy-pages: undici@5.28.2<br>upload-artifact: undici@6.23.0 | 6.28.1, 7.29.1, 8.10.2 |
| [GHSA-r5fr-rjxr-66jc](https://github.com/advisories/GHSA-r5fr-rjxr-66jc) / HIGH / lodash vulnerable to Code Injection via `_.template` imports key names | deploy-pages: lodash@4.17.21<br>upload-artifact: lodash@4.17.23 | 4.18.0 |
| [GHSA-rfgv-xxqx-mfg5](https://github.com/advisories/GHSA-rfgv-xxqx-mfg5) / HIGH / undici vulnerable to Denial of Service via unrequested WebSocket subprotocol | checkout: undici@6.27.0<br>setup-dotnet: undici@6.27.0<br>upload-artifact: undici@6.23.0 | 6.28.1, 7.29.1, 8.10.2 |
| [GHSA-rgw5-rvv9-x895](https://github.com/advisories/GHSA-rgw5-rvv9-x895) / HIGH / brace-expansion: DoS via unbounded intermediate arrays, bypassing the CVE-2026-14257 mitigation | setup-dotnet: brace-expansion@5.0.6<br>setup-dotnet: brace-expansion@1.1.15<br>deploy-pages: brace-expansion@2.0.1<br>deploy-pages: brace-expansion@1.1.11<br>upload-artifact: brace-expansion@1.1.12<br>upload-artifact: brace-expansion@5.0.3<br>upload-artifact: brace-expansion@2.0.2 | 1.1.18, 2.1.4, 3.0.6, 5.0.9 |
| [GHSA-rmvr-2pp2-xj38](https://github.com/advisories/GHSA-rmvr-2pp2-xj38) / MODERATE / @octokit/request has a Regular Expression in fetchWrapper that Leads to ReDoS Vulnerability Due to Catastrophic Backtracking | deploy-pages: @octokit/request@5.6.3<br>deploy-pages: @octokit/request@8.1.6 | 9.2.1, 8.4.1 |
| [GHSA-v3r7-h72x-cjcm](https://github.com/advisories/GHSA-v3r7-h72x-cjcm) / MODERATE / undici vulnerable to cookie attribute injection via unsanitized domain and unparsed setCookie fields | checkout: undici@6.27.0<br>setup-dotnet: undici@6.27.0<br>deploy-pages: undici@5.28.2<br>upload-artifact: undici@6.23.0 | 6.28.0, 7.29.0, 8.9.0 |
| [GHSA-v6h2-p8h4-qcjw](https://github.com/advisories/GHSA-v6h2-p8h4-qcjw) / LOW / brace-expansion Regular Expression Denial of Service vulnerability | deploy-pages: brace-expansion@2.0.1<br>deploy-pages: brace-expansion@1.1.11 | 2.0.2, 1.1.12, 3.0.1, 4.0.1 |
| [GHSA-v9p9-hfj2-hcw8](https://github.com/advisories/GHSA-v9p9-hfj2-hcw8) / HIGH / Undici has Unhandled Exception in WebSocket Client Due to Invalid server_max_window_bits Validation | deploy-pages: undici@5.28.2<br>upload-artifact: undici@6.23.0 | 6.24.0, 7.24.0 |
| [GHSA-vrm6-8vpv-qv8q](https://github.com/advisories/GHSA-vrm6-8vpv-qv8q) / HIGH / Undici has Unbounded Memory Consumption in WebSocket permessage-deflate Decompression | deploy-pages: undici@5.28.2<br>upload-artifact: undici@6.23.0 | 6.24.0, 7.24.0 |
| [GHSA-vxpw-j846-p89q](https://github.com/advisories/GHSA-vxpw-j846-p89q) / HIGH / undici WebSocket client vulnerable to denial of service via fragment count bypass | deploy-pages: undici@5.28.2<br>upload-artifact: undici@6.23.0 | 6.27.0, 7.28.0, 8.5.0 |
| [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) / MODERATE / uuid: Missing buffer bounds check in v3/v5/v6 when buf is provided | deploy-pages: uuid@8.3.2 | 11.1.1, 12.0.1, 13.0.1 |
| [GHSA-x8mw-p69m-v3mx](https://github.com/advisories/GHSA-x8mw-p69m-v3mx) / HIGH / @fastify/busboy vulnerable to Denial of Service via prototype-named multipart part header | deploy-pages: @fastify/busboy@2.1.0 | 3.2.1 |
| [GHSA-xx4v-prfh-6cgc](https://github.com/advisories/GHSA-xx4v-prfh-6cgc) / MODERATE / @octokit/request-error has a Regular Expression in index that Leads to ReDoS Vulnerability Due to Catastrophic Backtracking | deploy-pages: @octokit/request-error@2.1.0<br>deploy-pages: @octokit/request-error@5.0.1 | 5.1.1, 6.1.7 |
| [GHSA-xxjr-mmjv-4gpg](https://github.com/advisories/GHSA-xxjr-mmjv-4gpg) / MODERATE / Lodash has Prototype Pollution Vulnerability in `_.unset` and `_.omit` functions | deploy-pages: lodash@4.17.21 | 4.17.23 |

## workflowの信頼境界とB2/B3判定

- push(main)とworkflow_dispatchのみ。PR・Issue・workflow_run・pull_request_targetなし。dispatchに外部文字列inputsなし。リポジトリへコードを書ける利用者は信頼境界内であり、悪意あるmain変更を防ぐbranch/environment保護はB5で別評価。
- buildのcontents:read、deployのみpages:write/id-token:writeを保持。checkout persist-credentials:false、不要なsecrets/env受渡しなし。setup-dotnet cache:false明記。deployにmain ref条件追加。GitHub提供のAPI/Artifact runtime token/OIDCはActionが内部利用する。
- upload前に全チェックとVerify-FuriganaRedistribution.ps1を同期実行。continue-on-error/always()による迂回なし。needs:buildでdeployへ依存。publicationApproved=falseの停止は正常な保留であり、CI成功とは数えない。Pages以外のpublish・package push経路なし。
- **B3: 解消（ローカル静的検証）**。直接4 Actionと内部Actionが40桁SHA固定。SHA固定は将来tag移動による実行内容の無断変化を抑えるが、固定commit自体の侵害/脆弱性を修復しない。実CIは未実行。
- **B2: 評価済み・残余リスクあり、公開判断の保留を維持**。HIGH/CRITICALやネットワーク応答経路の完全な悪用否定はできない。公開承認やB2の全解除は行わない。今回は公式固定版への切替・Node24移行・権限制限の維持をコミット対象とし、安全性の完全証明/公開許可と切り離す。
- B1/A1/B4は既存解消状態の回帰検査、B5/環境保護・完全SBOM・実機性能は今回解除しない。

## 再評価手順

1. 公式Release/tag/commitを再取得し、main/post・内部Actionを監査。policyを新値へ変える前にlockとdistを別々に確認する。
2. OSV querybatchへnpm package/versionを照会し、各GHSAのfixed境界・処理・入力条件を再確認。lockだけの件数を実行脆弱性数と呼ばない。
3. 公式upstream更新を優先。内部upload-artifactはupload-pages-artifact側の更新が必要。独自dist修正をしない。
4. `node scripts/Verify-ActionsPolicy.mjs --upstream`、actionlint、異常系、既存回帰を実行。公開ゲート/承認の変更は別工程。
5. 許可されたPush後に実CIのNode24・runner版・Artifact API・Pagesの環境保護を検証する。承認falseではupload/deployを実行しない。

## ローカル検証

検証結果は公開前総合監査の最新節と最終報告に記録する。actionlint v1.7.12を公式Releaseから取得し、同Releaseのchecksums.txtとWindows amd64 ZIPのSHA-256（6e7241b51e6817ea6a047693d8e6fed13b31819c9a0dd6c5a726e1592d22f6e9）を照合した。`actionlint -shellcheck=`成功。shellcheckは未使用でありshellスクリプトの完全検証とはしない。署名付きRelease attestationの検証は未実施。

実行済み: SDK401 locked restore、Debug/Release各0警告0エラー、2333 Checks、Worker/配布改変/118パスChecks、policy11ケース、publish/サブパス27参照、両Webcil raw/br/gz/パス0、PDB identity/SourceLink/ソースchecksum、Lindera29証跡/106候補。公開ゲートはfalseによる期待された停止。詳細は[公開前監査の最新節](PREPUBLICATION-AUDIT.md)を参照。Node24実CI・公開/環境保護は未検証。
