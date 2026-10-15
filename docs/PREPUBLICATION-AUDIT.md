# GitHub Actions B2/B3の再監査（2026-10-15）

開始HEAD=1723e55490d322ff3032d71007b3f6187927791b、main、clean。公式Release/tag/commit・action.yml・main/post dist・npm lock・内部Actionを今回再取得。詳細なAction別/54固有GHSA別の出典・修正版境界・dist証拠・到達性・制約は[Actions監査](ACTIONS-SECURITY-AUDIT.md)に記録。過去の履歴は下に保持する。

## B2: 評価済み・残余リスクあり（公開判断の保留を維持）

- 従来範囲を再照会: 205 package/version、22該当版、46固有GHSA。更新後は238/25/48。内部upload-artifactを含む同範囲比較では更新前295/29/52、更新後293/32/54。これはlockの照会結果であり、実行脆弱性数ではない。
- checkout v7.0.1/setup-dotnet v6.0.0/upload-pages-artifact v5.0.0は版を維持。deploy-pagesのみv4(Node20)→v5.0.1(Node24)。解消した固有GHSAは0。追加glob CLI/cross-spawnの2件はlock上で増加し、該当CLIの実行経路は確認されない。最新化を警告解消と説明しない。
- 実distを取得し、deploy-pagesはsource mapも照合。lockとdistのバージョンの完全対応は証明していない。undici/form-data/unzip等の実装同梱と、Actionが使う分岐を区別する。setup-dotnet cache:false/source-url未指定、deployは同runのartifact metadataを参照しローカル展開しない。HTTP/Octokit応答のDoS等の完全な悪用否定は未検証。
- PR/Issue等の外部コード起動なし、contents:read、persist-credentials:false、deployだけpages/id-token writeを維持。main以外のdeployを明示拒否し、公開前tarに含まれるsymlink/junction/複数リンクのファイルを拒否する検査を追加。
- 内部upload-artifact v7.0.0は上流compositeが固定済み。最新v7.0.2への差替えは消費側から行わず、upstream更新・ネットワーク応答経路の残余リスク再評価を残す。HIGH/CRITICALを含む警告の一括解除、公開承認は行わない。

## B3: 解消（固定参照のローカル検証）

直接4 Actionは全40桁SHAとReleaseコメントへ変更。固定値/取得コードのSHA-256はscripts/actions-policy.json、公式Releaseとの再照合はVerify-ActionsPolicy.mjs --upstream。内部ActionのSHAも確認。固定は既知脆弱性の修復ではない。実CIはPush禁止のため未実行で、Node24 runner/OIDC/Artifact API/Pages実行の確認を残す。

## 実行済み検証と公開制御

- SDK10.0.401、locked restore、Debug/Releaseとも0警告・0エラー、2,333 Checks成功。
- Worker Checks、配布物改変拒否、118パス/資格情報異常系成功。新Action policy検査は正常系・6workflow改変・正常配布・hard link・directory link・対象欠落の11ケース成功。
- 公式Release→commit/配布コードhash/内部Action再照合、actionlint v1.7.12のYAML/Action静的検証成功（shellcheckは無効で実施）。
- Release publish、Pagesサブパス/27静的参照、KanjiVariants1.2.1正式DLL/通知/Unicode原典、Playgroundと本体のWebcil raw/br/gz照合成功。両アセンブリのローカル絶対パス0。
- Debug/Release各23 tracked+16 generated文書のPDB checksum/identity/SourceLinkと現作業ツリーの照合成功（strictGit=false）。ビルドのSourceLink HEADは修正前1723e554...。今回はアプリソース変更なし。新コミットの公開URL取得や実CIの--git検査は未実施と区別する。
- Lindera WASM/JS/辞書/lock/29通知証跡/106ソース候補のhash検証成功。完全バイナリSBOM証明とはしない。
- Verify-FuriganaRedistribution.ps1は固定来歴/通知確認後にpublicationApproved=falseで意図どおり停止。upload/deployへ進めず、公開ゲートの安全条件は不変。
- global.json、Directory.Build.props/targets、両lock、KanjiVariants1.2.1、Lindera/IPADIC/106通知/manifestは変更しない。A1/B1/B4の既存解消状態は維持し、A2/B5/完全SBOM/モバイル実機の課題は解除しない。

証跡: artifacts/actions-security/（Git管理外）。このコミットはSHA固定・監査記録・防御の確定であり、B2の全解除/実CI成功/公開許可を意味しない。Push/デプロイなし。

---

# Playground PDB正規化の検証（2026-10-15）

開始HEAD=1493bb3636fbc2734e819a1f60595296ac9e5656、main、clean、SDK10.0.401。過去の監査履歴は以下へ保持する。本節の修正は独立コミット対象で、新コミットのhash・clean checkout再検証結果はGit管理外の証跡と作業報告へ記録する。公開URL取得はPush後の別工程であり、今回成功扱いにしない。

## B1の現在の評価

- KanjiVariants1.2.1: 解消済みの状態を維持。正式DLL/通知/原典hashとWebcil raw/br/gz検証成功。
- KanjiVariants.Playground: 今回の修正とコミット前の実検証で解消。Debug/Release各23 tracked文書+16 generated文書のchecksum、SourceLink、CodeView、DLL/PDB識別子一致、ローカル絶対パス0。PDB/Embedded Sourceを保持した。
- 修正後コミットからのclean checkoutでは--gitで再検証する。失敗すればこの解除判断を適用しない。実公開URLは未確認。
- A2（公開承認false）、B2/B3/B5・完全SBOM/実機などの課題は解除しない。

## 原因・採用方式

元のビルドはSDKのSourceRoot/PathMap正規化を明示せず、CodeViewに開発PCのobjパスを含んでいた。本体1.2.1のDeterministic/DeterministicSourcePaths/ContinuousIntegrationBuildを検証して採用し、既存MSBuildEnableWorkloadResolver=falseは保持する。SourceLinkはSDK内蔵のGitHub providerを利用し追加パッケージは不要。

Blazor固有の問題として、SDK10のRazor source generatorが埋め込みC#へ物理パスの#pragma checksum/#lineを生成する。この内容はコンパイラのPathMapだけでは書き換わらない。SDK標準のファイルベースRazor生成（UseRazorSourceGenerator=false）を使用し、Directory.Build.targetsがobj内の.razor.g.csの位置指定行だけを生成C#からの相対パスへ変換してからCscへ渡す。SDK PathMapが最終PDB文書を/_/へマッピングする。

仮想/_/を直接Razor指令へ書く方法はWindowsがC:\_へ補完するため不採用。相対位置指定でWindows/Unixのソースルートへ依存しないようにする。入力Razor/C#・チェックサム・プログラム本文は変更せず、PDB削除/デバッグ無効化/配布バイナリパッチは行わない。生成C#の実バイト列はコンパイラが改めてchecksumを生成し、PDB Embedded Sourceと照合する。

SDK/Razor生成方式により生成メタデータ・IL配置・MVID・ファイルhashは変わり得るが、既存画面/API仕様は維持する。2,333 Checksで回帰確認。開発時のRazor source generator固有機能への影響は従来の生成方式との差があるため、将来SDK更新時に再評価する。

## 再発検出

- tools/VerifyPlaygroundArtifacts: PEReader/MetadataReader、CodeView仮想パス、必須SourceLinkキー/HEAD/Repository、DLL-PDB GUID/stamp/age、全文書checksum、Embedded Source展開後のpath/checksum検査。
- working treeモードとclean checkout --gitモードを区別。SDK生成文書はGit blobと偽って照合せず、Embedded Source/生成ファイルで検査する。
- 構造を持つドライブ絶対パスを検出する。圧縮PDBの任意バイナリが偶然f:\等になる誤検出を避け、Document/CodeView/SourceLinkと展開Embedded Sourceを併用する。
- Verify-WebcilAssembly.mjsへSDK Webcil section比較処理を共通化し、KanjiVariants/Playground両方のraw/br/gz全バイト一致・仮想CodeView・local path0を検査。旧KanjiVariants1.2.0混入防止と全文通知hashは維持。
- ActionsはDebugビルド・PDB/Git検査・両Webcil検査を追加するだけで、Action依存/tag/SHA/permissions/公開ゲートを変更しない。実CIはPush禁止のため未実行。
- 異常系はGit管理外のfixtureで実検証し、絶対パス、PDB identity不一致、source checksum不一致、必須PDB欠落を拒否する。実成果物を改変して問題を隠す方法ではない。

## 回帰・制約

SDK401 locked restore、Debug/Release各0警告・0エラー、2,333 Checks、Worker、Release publish、Pagesサブパス、正式KanjiVariants配布/ライセンス原典、LinderaのWASM/辞書/29通知証跡成功。公開ゲートはfalseで停止を維持する。global.json、両lock、Lindera資産、IPADIC、KanjiVariants版は変更しない。

証跡: artifacts/pdb-normalization/（Git管理外）。本節のコミット前結果と、コミット後のclean checkout/SourceLink結果を分けて保存する。実ブラウザ/VSホットリロード、別OS、モバイル実機の追加検証は今回の証跡から成功を推定しない。

---

# 1.2.1移行の最終確認（2026-10-15）

再インストール済みの標準dotnet（SDK10.0.401）で検証し、global.jsonは変更していない。本節が現在の依存・検証状態で、10/14以下の内容は履歴として保持する。コミット自身のIDはコミット前に埋め込まず、最終作業報告で示す。公開承認false、Push/デプロイなし。

## 3件の10.0.13の評価と最終解決

開始時はInternal.Assets/ILLink.Tasks/WebAssembly.Packの3件が10.0.13だった。csprojで直接更新されたものではない。SDKのProcessFrameworkReferencesがIsImplicitlyDefined=trueのPackageReferenceを生成する開発用依存である。

| 状態 | Internal.Assets | ILLink.Tasks | WebAssembly.Pack | browser-wasm runtime download |
|---|---|---|---|---|
| 開始時lock | 10.0.13 | 10.0.13 | 10.0.13 | 開始時の実配布結果は今回の評価へ流用しない |
| 標準SDK401・VS追加manifest有効で新規lock生成 | 10.0.12 | 10.0.12 | 10.0.13 | ProcessFrameworkReferences評価: 10.0.13 |
| 公式SDK401独立配置・追加manifestなし | 10.0.12 | 10.0.12 | 10.0.12 | 10.0.12 |
| 最終設定・標準SDK401 | 10.0.12 | 10.0.12 | 10.0.12 | project.assetsの実download: 10.0.12 |

SDK401のMicrosoft.NETCoreSdk.BundledVersions.propsは3件すべて10.0.12を既定とする。同じSDKでもVS側のmicrosoft.net.workload.mono.toolchain.current/10.0.113/WorkloadManifest.targetsが_RuntimePackInWorkloadVersionCurrent=10.0.13を設定し、KnownWebAssemblySdkPackを上書きする。従ってSDK401だけの固定では、マシンの追加manifestがlockと配布runtimeを変えることがある。UsingBrowserRuntimeWorkload=falseという表示だけではruntime固定を保証せず、PackageDownloadまで検査する。

3件の10.0.13は最終lockに維持しなかった。Internal.Assets/ILLink.TasksはSDK401の通常再解決で12へ戻る。WebAssembly.Packだけはmanifestに依存するため、今回追加したDirectory.Build.propsでMSBuildEnableWorkloadResolver=falseを指定し、AOTなしの通常BlazorアプリをSDK単独の解決へ揃えた。global.json、TFM、PDB設定、公開条件は変更していない。これはライブラリ機能修正ではなく、CIとローカルの依存再現性の修正。任意のWASM workloadによるnative/AOT追加機能をこのアプリの標準ビルドで利用しない方針をREADMEへ明記した。AOTを採用するなら設定/lock/runtime/通知を別途再監査する。

lockを手書きせずdotnet restore --force-evaluateで生成し、標準SDKと公式SDK独立配置の新規lockが完全一致することを実測した。両SDKのsource revisionもe34a38d2ae1fc26406a317517196e55c68ff83abで一致する。10.0.12のSDK生成lockでlocked-mode restore成功。最終app/checks lockはHEADとの比較でKanjiVariants以外の差分0。

GitHub Actionsはglobal.jsonのSDK401で通常restoreを行い、Directory.Build.propsを自動importする。追加manifest有無に左右されない同一グラフをローカル2配置で確認した。ただし今回Push/Actions起動は禁止されているため、Ubuntu実runnerの成功は未確認で、実CI確認済みとは書かない。

3件は主にビルド用でブラウザへ丸ごと配布しないが、AssetsのJSやWebAssembly packの処理、linker処理は成果物へ影響し、workload manifestはruntime downloadも13へ変更する。今回は12に揃え、実project.assetsのMicrosoft.NETCore.App.Runtime.Mono.browser-wasm=10.0.12とpublishを確認したため、既存の.NET/Blazor10.0.12通知を維持する。13のruntimeを正式に配信する選択なら、その版の通知/配信物を別監査する必要がある。

## 検証スクリプトと全17パスのレビュー

以前の16パス（旧通知削除/新版追加を別々に数える）を未追跡ファイルも含めレビューし、再現性に必要なDirectory.Build.propsを追加して17パスとした。正式NuGet通知・JIS原典・Unicode許諾は原文のまま。gitattributesの-textで保護し、署名付き正式NuGetとbyte/hash照合した。global.jsonやLindera資産の差分なし。

Verify-KanjiVariantsDistribution.mjsを以下の点で修正:

- Linux/Windowsの既定NuGet cacheをos.homedir()で取得（USERPROFILEだけに依存しない）。
- 正式DLL・実Release入力の一致に加え、通知/Unicode許諾の独立した固定SHA-256を検証。
- raw/br/gzを展開して全バイト列が一致することを追加検証。
- 旧DLL/PDB等の余分なKanjiVariants資産を拒否。
- LEB128/data sectionの切断・Webcil minor version・debug directoryサイズを検査。
- Webcilの全sectionは実linked DLLに一致。比較時のdebug file pointer変換だけをメモリ上で正規化し、配布WASM/DLLをパッチしない。

実publishから作ったGit管理外の最小ハーネスで、正常系と5拒否ケース（旧通知、旧DLL、通知改変、gzip展開不一致、切断WASM）を検証した。すべて期待どおり。機能APIやLinderaを変更していない。

## SDK401での最終回帰結果

| 検証 | 結果 |
|---|---|
| SDK/固定設定 | 標準dotnet --version=10.0.401、global.json不変 |
| 通常/独立SDK401 restore | 同一lock、3件は10.0.12 |
| locked-mode restore | solution/app/checks成功 |
| Debug/Release clean build | 各0警告・0エラー |
| 既存Checks | 2,333成功 |
| JS Worker/Distribution/Path Checks | 成功 |
| Release publish | 成功、新規artifacts/kanjivariants-1.2.1-final/publish |
| Pagesサブパス・静的参照 | 成功 |
| KanjiVariants Webcil raw/br/gz | 正式1.2.1由来、全section/圧縮展開一致、仮想CodeView、local path0 |
| 正式NuGet署名・通知・原典 | 成功、Unicode原典SHA一致、全文保持 |
| Lindera source/publish | WASM/JS/辞書hash、106通知、29証跡検証成功 |
| 公開停止 | publicationApproved=falseによる期待どおりの停止 |
| 既知Playground PDB | 絶対パス1件を確認、今回修正しない |
| 配布検証器の拒否テスト | 5ケース成功 |
| Git差分 | global.json/Actions/Lindera/公開承認の変更なし、diff --check成功 |

A1/B4の今回1.2.1配布に関する解消評価を維持するが、A2/B1のPlayground側/B2/B3/B5/C分類の残課題は依存更新を理由に解除しない。必要な公開承認、Playground PDB修正、Actions警告・SHA固定、Pages設定、実機性能等は別工程。

証跡はGit管理外のartifacts/kanjivariants-1.2.1-final/へ保存。SDK評価・元13 lock・SDK生成lock・restore/build/Checks/publish/配布通知/署名/gateログ・拒否テストを含む。10/14の証跡と監査履歴も保持した。今回のコミット対象にはキャッシュ/SDK/出力/ログを含めない。

---

# KanjiVariants 1.2.1正式版への移行・公開前再監査

再監査日: 2026-10-14（日本時間）。本体依存の更新対象はPlayground main / `9be45b7c41b998a3d40b614da0ebe57a1495f9fc`。開始時は本書のみ未追跡で、その他の変更・ステージなし。本書の初回監査内容は下部へ履歴として保持した。今回の変更はすべて未コミット、Push・デプロイ・NuGet公開なし。

## 現在の結論

**今回検証した1.2.1のpublish成果物についてA1を解除する。Playground全体の公開承認は行わない。** 新版の固定原典・通知・配布バイナリを確認した結果であり、過去1.2.0のPython API出力データの権利評価を遡及解決するものではない。公開チェックはpublicationApproved=falseで停止する状態を維持した。

| ID | 今回の評価 | 根拠・残作業 |
|---|---|---|
| A1 JIS X 0208 | 今回の1.2.1配布について解除 | 正式署名付きNuGet採用、固定Unicode原典・許諾全文同梱、全区点/旧DLL所属差分0、Webcil新版一致、旧DLL/通知混入なし |
| A2 公開制御 | 保留を維持 | publicationApproved=false。監査成功を公開承認と扱わず、ゲートの安全条件も緩和していない |
| B1 KanjiVariants | 解消 | 正式DLLとWebcil（raw/br/gz）でCodeView仮想化、ローカル絶対パス0 |
| B1 Playground自身 | 残存 | Playground Webcilに開発PCのPDB絶対パス1件。今回の依存更新と分けて評価 |
| B2 Actions npm | 残存・変化なし | Action.yml/lockは前回とbyte一致。OSV再照会205組、22 package/version・46固有advisory。到達性/悪用成立は未認定 |
| B3 Action SHA固定 | 残存 | 外部Actionのmajor tagを維持。レビューしたcommit SHA固定を別工程で検討 |
| B4 MJ表示 | 今回の配布について解消 | 正式1.2.1通知全文がbyte一致で配信。CC BY-SA 2.1 JPの原典/加工者/加工内容/適用範囲を保持し、独自コードMITと分離 |
| B5/C1〜C4 | 個別の未確認事項を維持 | Pages設定・完全SBOM・実機性能等は依存更新だけで解決扱いにしない。JISに関する旧通知の現在形のみ新版に合わせて更新 |

## 正式パッケージの実取得と署名

取得元: [NuGet.org 1.2.1](https://www.nuget.org/packages/KanjiVariants/1.2.1)、[flatcontainerアーカイブ](https://api.nuget.org/v3-flatcontainer/kanjivariants/1.2.1/kanjivariants.1.2.1.nupkg)。PackageId=KanjiVariants、Version=1.2.1、TFM=net6.0、Repository commit=`b4bab26c457ab796c8b01ed02093034c24da3896`。

- 正式nupkg SHA-256: `8dd65910fbba56589d47524e943879da89017083ca71fc85f620781ab3411202`。
- 既存ローカル候補SHA-256: `4e889c553ca11475d43ed43d59e379cca96ce1e871a31ebca5bc51c23d16a829`。
- NuGet.org Repository signatureをdotnet nuget verify --allで検証成功。証明書SHA256: `1F4B311D9ACC115C8DC8018B5A49E00FCE6DA8E2855F9F014CA6F34570BC482D`。
- アーカイブSHAは異なるが、候補の全10内部ファイルはbyte一致、追加は.signature.p7sのみ。DLL SHA-256=`93868274916acb2741b75289bb2e594539c1baf186fb0f9565c670129bb1bb2c`。署名に伴う変更と判断し、アーカイブ差だけを改ざん根拠にしていない。
- 隔離NuGetキャッシュへNuGet.orgからrestoreした実nupkgも取得アーカイブとbyte一致。以前の候補/一時DLLを本番参照としていない。

## 依存更新と互換性

2026-10-14の独立SDK配置による検証では、app/checksのPackageReferenceと両lockを1.2.1へ更新し、当時の解決結果はKanjiVariants以外の差分0だった。2026-10-15の開始時にはSDK暗黙依存3件が10.0.13のlockを確認したため、この旧記録をそのまま現在の作業ツリーへ適用しない。下記の最終確認で原因・正常なSDK再解決結果を区別して記録した。TFM/global.jsonは維持。

固定SDK10.0.401がPCからなくなり10.0.402だけになっていたため、Microsoft公式releases.jsonのURL・SHA512で固定SDKをGit管理外へ取得し同じ10.0.401を利用した。署名検証だけは既存10.0.402 CLIで実行。SDK設定を緩和していない。

- 正式1.2.1 DLL対実1.2.0 DLL: 公開API469項目差分0、BmpCharacterSetFlags全65,536バイト差分0。
- 正式同梱JIS0208.TXTの全8,836区点を検証。割当6,879、未割当1,957。1区32点U+FF3C互換処理を適用し、旧euc_jp結果と実旧DLL所属集合の差分0。
- 正式版内部ファイルが公開前最終候補と完全一致することと、本体側の全生成C#本文比較記録を根拠に、データ変更なしを確認。
- 2,333 ChecksでJIS0208/0212/0213、MJ代替、IVS/SVS、常用/教育診断、詳細・ふりがなを検証。機能判定・画面仕様を変更していない。

## 通知とA1の解除根拠

正式nupkgのLICENSE-NOTICES.mdを原文のままTHIRD-PARTY-NOTICES/KanjiVariants-1.2.1.mdへ保存。旧1.2.0通知を置換しpublishから除外。固定原典とUnicode-LICENSE.txtも正式nupkgからコピーしcsproj Contentで配信。Git改行変換を防ぐ-text設定を追加した。

原典: Unicode JIS0208.TXT Table 2.0（2011-10-14、ヘッダー更新2015-12-02、© 2015 Unicode®, Inc.、Unicode 1.1 legacy mapping）。SHA-256 `1c571870457f19c97720631fa83ee491549a96ba1436da1296786a67d8632e87`。原ヘッダー・著作権、Unicode License V3全文を改変せず保存する。現行規格の唯一の正規対応表とは説明していない。本体生成器の版固定原典・hash検証と1区32点の加工は[公開ソース](https://github.com/Koichi-Kobayashi/KanjiVariants/blob/b4bab26c457ab796c8b01ed02093034c24da3896/tools/generate.py)と本体監査記録に記載される。

MJ文字情報一覧Ver.006.02、縮退マップVer.1.2.0のCC BY-SA 2.1 JP、IPA著作権、加工者Koichi Kobayashi、加工内容/再配布範囲は正式通知に保持。MJ由来加工データをMITへ再許諾せず、独立したPlaygroundコード全体も一律CCへ変更していない。

3同梱ファイルはsource/正式cache/publishのbyte一致を確認。新しい検証器scripts/Verify-KanjiVariantsDistribution.mjsで正式DLL hash、実Release入力DLLのbyte一致、リンク出力とWebcil全セクションの一致を検証（Webcil仕様で変換されるdebug file pointerだけ比較上のoffsetを調整）。ブラウザへ実配信される単一のKanjiVariants Webcilが1.2.1由来であり、旧DLL混入を認めない。

従って、今回の配布範囲でA1を保留していた生成経路・原典許諾・加工表示・新版実配布確認が充足し、未解決のJIS0208再配布条件は見つからなかった。個別の法的紛争についての判断や、旧1.2.0への遡及判断は行わない。

## WebcilとPDB

実publish: artifacts/kanjivariants-1.2.1-audit/publish/wwwroot。

- KanjiVariants.u1gdt7knl0.wasm: SHA-256 `824bf5160b10fa047b4b13ca2a3cbc76cd6729c23355c6bb8af818a74d083d0e`。
- raw/br/gzを展開し、3セクションがリンクDLLと一致。各CodeViewは `/_/KanjiVariants/obj/Release/net6.0/KanjiVariants.pdb`、各ローカル絶対パス0。
- Playground自身のKanjiVariants.Playground.dyrnk0s4h2.wasmにはPDB絶対パス1件が残る。br/gzは同じ内容の圧縮であり、依存更新では直らない。
- Playground修正方針: 本体で検証済みのDeterministicSourcePaths/ContinuousIntegrationBuildによるSDKのSourceRoot・PathMap・SourceLink同時正規化を別工程で適用し、全DLL/PDBとpublish Webcil/br/gzを検査。手作業バイナリ置換やPDB削除を優先しない。今回B1の修正は行っていない。

## 回帰・ブラウザ・公開制御の結果

| 検証 | 結果 |
|---|---|
| locked-mode restore app/checks | 10/14の独立SDK配置で成功。10/15の3件再評価は最終確認節参照 |
| Debug/Release build | 各0警告・0エラー |
| 既存Checks | 2,333成功 |
| JS Worker/Distribution/Path Checks | 成功 |
| Release publish | 成功。固定SDKの独立配置にwasm-toolsがなくoptional optimizationの案内あり。公開成功や性能同等性とは混同しない |
| Pagesサブパス/静的参照 | 成功、27参照、.nojekyll/base path確認 |
| Lindera WASM/JS/辞書・29証跡 | source/publish検証成功、106依存の未充足通知0 |
| 公開ゲート | publicationApproved=falseによる停止を確認、安全条件不変 |
| Git diff --check | 成功 |

実ブラウザはサブパスのローカル静的配信を使用。サンドボックス内サーバーは接続制限でタイムアウトしたため、許可されたローカルサーバーに切り替え、実画面を確認した。

- 髙橋𠮷野→高橋吉野の変換、髙橋のJIS0208診断・髙の詳細を確認。
- 今日→きょう、図書館→としょかん、宇宙→うちゅう、読みますの漢字部分→よを確認。大人などすべて既習の語に不要ルビを付けない。
- 今日を手動で「きょうです」へ変更し自動再生成後も保持。
- 6年生に変更すると未習0・ルビ非表示・コピーは原文。1年生へ戻すと保持した読みを再表示。
- 表示OFFのコピーは原文。読み未入力の「今日と大人」コピーは原文で、推測ルビなし。P1手動入力も確認。
- 原文変更時に現在のプレビューを消し旧版と区別、旧読みを新原文へ無条件適用しない。
- ブラウザ記録: artifacts/kanjivariants-1.2.1-audit/browser-furigana.png。今回のブラウザはPC相当の1環境。モバイル実機/Safari/Firefoxの性能・メモリ、ライト/モバイル幅を網羅した再試験は未実施。

Lindera WASM/JS/辞書/manifest/106依存通知を変更・再ビルドしていない。29証跡の検証成功は完全バイナリSBOMの証明ではない。

## Actions再調査と残課題

OSV再照会結果は22 package/version・46固有advisoryで前回と同じ。Action.yml/lockもbyte一致。HIGH/CRITICALを含む前回保留を維持する。workflow自体は未変更、今回GitHub Actionsを起動していない。

| 使用Action | 現tagの実commit（2026-10-14） | 公式最新Release（検討候補） |
|---|---|---|
| checkout v7 | `3d3c42e5aac5ba805825da76410c181273ba90b1` | [v7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1) |
| setup-dotnet v6 | `a98b56852c35b8e3190ac28c8c2271da59106c68` | [v6.0.0](https://github.com/actions/setup-dotnet/releases/tag/v6.0.0) |
| upload-pages-artifact v5 | `fc324d3547104276b827a68afc52ff2a11cc49c9` | [v5.0.0](https://github.com/actions/upload-pages-artifact/releases/tag/v5.0.0) |
| deploy-pages v4 | `d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e` | [v5.0.1](https://github.com/actions/deploy-pages/releases/tag/v5.0.1) |

推奨方針: レビュー済みcommit SHA固定と更新手順を別変更で整備する。deploy-pages v5.0.1を候補としてlock/実bundle/実行環境・Pages permissionsを再監査する。最新Releaseというだけで脆弱性が解消したとは扱わない。checkout/setup-dotnet/upload-pages-artifactは最新Release系でも現lock警告を引き継ぐため、upstream修正版・到達性確認が必要。Action変更を今回の依存更新へ混ぜない。

## 変更ファイルと次工程

app/checks csproj・両lock、Home版表示、README、LICENSE-NOTICES、licenses.html、旧通知の削除と新版通知/固定原典/許諾3ファイル、.gitattributes、Verify-Pages.ps1、新Verify-KanjiVariantsDistribution.mjs、本書。10/14時点は計16パス（旧通知の置換を削除/追加で数える）。10/15の再現性修正でDirectory.Build.propsを追加し計17パス。以下のGit状態は各検証時点の履歴であり、最終コミット結果は作業報告を参照する。キャッシュ/SDK/一時publish/生証跡はartifacts以下でGit管理外。

- `Directory.Build.props`（10/15再現性修正）
- `.gitattributes`
- `LICENSE-NOTICES.md`
- `README.md`
- `THIRD-PARTY-NOTICES/KanjiVariants-1.2.0.md（削除・新版へ置換）`
- `THIRD-PARTY-NOTICES/KanjiVariants-1.2.1.md`
- `THIRD-PARTY-NOTICES/KanjiVariants-1.2.1-JIS0208.TXT`
- `THIRD-PARTY-NOTICES/KanjiVariants-1.2.1-Unicode-LICENSE.txt`
- `scripts/Verify-Pages.ps1`
- `scripts/Verify-KanjiVariantsDistribution.mjs`
- `src/KanjiVariants.Playground/KanjiVariants.Playground.csproj`
- `src/KanjiVariants.Playground/Pages/Home.razor`
- `src/KanjiVariants.Playground/packages.lock.json`
- `src/KanjiVariants.Playground/wwwroot/licenses.html`
- `tests/KanjiVariants.Playground.Checks/KanjiVariants.Playground.Checks.csproj`
- `tests/KanjiVariants.Playground.Checks/packages.lock.json`
- `docs/PREPUBLICATION-AUDIT.md`

公開までの残作業: Playground自身のPDBパス（B1）対応、Action警告/commit固定（B2/B3）のレビュー、Pages設定・Environment保護確認（B5）、完全SBOM/モバイル実機等の未検証範囲の公開判断、独立した公開承認。publicationApproved=falseの停止条件を緩和しない。

生証跡: official-package.json、signature.log、lock-and-cache-verification.json、compatibility.json、kuten-comparison.json、webcil-check.json、playground-pdb-scan.json、build/restore/Checks/Worker/publish/Pages/Lindera/gateログ、actions-current.json、actions-osv-current.json。以前の監査証跡は上書きせず保持。

---

# 初回監査の記録（2026-10-13、依存1.2.0時点の履歴）

以下のA1/B1/B4およびGit状態は初回時点の評価であり、現在の結論は上部の再監査結果を参照する。

# Playground公開前の総合監査

監査日: 2026-10-13（日本時間）。対象は `main` / `9be45b7c41b998a3d40b614da0ebe57a1495f9fc`。開始時の作業ツリーはclean、ステージ済み変更なし。本報告書だけを追加し、機能・依存・通知・公開承認・チェック条件を変更していない。コミット/amend/Push/デプロイ/Issue投稿は実施していない。

## 結論と分類

**Playground全体を無条件に公開可能とは判断しない。** Linderaの確認済み106コンパイル依存について通知の未充足は見つからず、29通知・証跡は新しいpublishにも存在する。一方、漢字データの条件に未確認部分があり、Lindera以外の配布バイナリのローカルパスとCI依存の警告も発見した。これらを完全SBOMの未証明と混同しない。

| ID | 分類 | 発見事項と評価 | 公開前の具体的対応 |
|---|---|---|---|
| A1 | A・監査上の保留 | JIS X 0208表はPython `euc_jp`の出力を加工して再配布している。生成に使ったディストリビューション/版・対応表の来歴・必要通知の判断が未確定。明確な違反や、生成出力へのPSF条件の自動適用を認定したものではない | 本体側で生成環境と対応表の原典を特定し、保護対象の転用/単なる符号対応の事実の区別と通知要否を記録。必要なら原典通知をパッケージ・Playground配布物へ追加する。確認済みの根拠なしに保留を解除しない |
| A2 | A・公開制御 | 公開承認false。技術検証の成功だけで承認や公開チェックを通過させない | 独立した公開判断を別工程で行う。今回変更禁止 |
| B1 | B | 新publishのKanjiVariants/WebcilとPlayground/Webcilに、開発者名を含むPDB絶対パスが各1件残存。Linderaの残存0件とは別問題 | .NETのPathMap/CI用の固定ソース位置・PDB設定を検証。KanjiVariantsはNuGet 1.2.0自体に含むため本体の再ビルド/修正版パッケージまたは来歴を維持した適切なpublish時対策が必要。バイナリ置換で削らない |
| B2 | B | Actionsの版固定ソースlockのnpm依存に22 package/version、46固有advisoryが該当。HIGH/CRITICALを含む。ブラウザへの配信依存ではなく、悪用経路が成立したと認定していない | 公式Action更新候補のlock/実行bundleを再監査し、到達経路・修正版を確認して採用を判断。依存を直接無断更新しない |
| B3 | B | 外部Actionsは移動可能なmajor tag。upload-pages-artifact内部のupload-artifactだけはSHA固定 | レビューしたAction commit SHAへ固定し、更新手順を設ける。固定そのものは脆弱性修正ではない |
| B4 | B | MJ加工表のCC BY-SA継承は通知に記載されているが、一部生成ファイル先頭のMIT表記とデータ除外が離れており、コード/データの範囲を誤認しやすい | 本体生成ヘッダーと配布通知でMJ加工データのCC BY-SA 2.1 JP適用・加工者・加工内容を明確にする。アプリ全体のMITを変更する理由にはしない |
| B5 | B | Pagesの現在の公開元設定は未確認。公開API `/pages` は404だがサイトGETは200 | 権限を持つ所有者がSettings > Pagesの公開元・Environment保護を確認。404をPages無効の根拠にしない |
| C1 | C | 完全バイナリSBOM、別OS、実機Safari/Firefox、モバイル実機の性能・メモリ未検証 | 継続検証。完全SBOMがないこと自体をライセンス違反と扱わない |
| C2 | C | unsafe-libyaml 0.2.11の保守停止警告 | P2以降の更新時に安全なYAML実装へのupstream移行を追跡。利用者入力のYAML解析経路は現在使っていない |
| C3 | C | 一部の配布/監査文書に公式npm版時代の未解決通知表現、履歴時点のGit状態が残る | 現行と履歴を明示。IPADIC-PROVENANCE.md末尾などの現在形の記述を整理 |
| C4 | C | .NET JSにsourceMappingURLがあるが対応mapはpublishにない。個人の習得状況を判定しない旨もUIで一文明示するとよい | mapを不要に同梱せず説明を整理。学年配当の説明は現行UIに存在する |
| D1 | D | 新WASMのhash、106依存の確認済み通知、29証跡のpublish同梱、Linderaのローカルパス0件 | 本文と検証記録参照 |
| D2 | D | 入力の通常送信経路なし、Razorエスケープ、入力制限、旧結果隔離、Worker再利用/復旧 | 本文と再実行テスト参照 |

A1は「重要な配布データの条件を確定できない」という監査上の停止であり、Pythonのツールを使うだけで生成物へPythonのライセンスが波及する、という判断ではない。著作権の対象性についても本監査では断定しない。B1は秘密鍵流出ではなく開発環境情報の混入。B2も依存DBで該当することと、このworkflowから悪用できることを分ける。

## 方法・証拠の範囲

既存台帳を出発点の正解とはせず、csproj、packages.lock.json、project.assets.json、実NuGetキャッシュのnupkg/nuspec/通知、固定Linderaソース、Cargo.lock、crateソース、実コンパイル記録、公開Actionタグのsource/lock/bundle、今回生成したpublishを照合した。

追跡ファイル166件、HEADから到達可能な239 Git blobを検査。キャッシュ/中間成果物はGitに追加していない。調査コード・生結果はignoredな `artifacts/prepublication-audit/` に保存。本報告書には再利用可能な依存一覧と主要判断を記録し、生結果がない環境でも重要事項を読めるようにした。

本体ローカルHEADは `37e2aabe5313fd8fa4eaf0d86437967e0ee56449`。**これをNuGet版の根拠に代用していない。** NuGet 1.2.0のnuspecが示す公開ソースコミットは `983fa8e6b98b7af0c503c686560b62c0778c9738`。同コミットの `tools/generate.py` をGitから直接取得し、生成方法を確認した。周辺generatorの調査には現在の本体checkoutも使い、その場合は版一致を保証しない。

## 配布と開発依存の棚卸し

| コンポーネント | 固定版/原典・役割 | 条件と照合結果 |
|---|---|---|
| Playground | 本監査HEAD。Razor/C#/独自JS/CSS | MIT、Copyright (c) 2026 Koichi Kobayashi。LICENSE全文がpublishのlicenses/Playground-MIT.txtにある。外部データをMITへ再許諾しない |
| KanjiVariants | [NuGet 1.2.0](https://www.nuget.org/packages/KanjiVariants/1.2.0)、上記nuspec commit。ブラウザへWebcilで配信 | 独自コードMITとデータ条件を分離。実nupkgのLICENSE-NOTICES.mdとTHIRD-PARTY-NOTICES/KanjiVariants-1.2.0.mdはバイト一致。SHA-256 `f44f7db48acd15378b7648c7c6205f65fbec884f23479d1d31fcec78d719cf80` |
| .NET/Blazor | .NET SDK 10.0.401は開発のみ。配布ランタイム/ASP.NET関連は10.0.12。Runtime Mono browser-wasm packも実確認 | Microsoft MIT +原第三者通知。SDK/DevServer/ILLinkをブラウザランタイムと混同しない。詳細と32 NuGet一覧は後述 |
| Lindera | [v6.2.0](https://github.com/lindera/lindera/tree/0482efcc46b5ec518b7238efae55e9fed9bba0c0)、自前WASM/生成JSを配信 | workspace MIT Copyright (c) 2019 by the project authors、WASM側固有MITも保持。LICENSE/LINDERA-CORE-LICENSE/第三者全文を照合 |
| wasm-bindgen | 0.2.126、crateはエンジン側、CLIはビルドのみ | MIT OR Apache-2.0。生成JS/変換由来コードのため通知も保持。CLI実行ファイルは配信しない |
| Rust | 1.98.1、compiler/Cargoはビルドのみ、標準ライブラリはWASMへ含まれる | MIT OR Apache-2.0と個別通知。RUST-1.98.1-COPYRIGHT、標準ライブラリHTML、関連許諾全文を配信 |
| Cargo106件 | SELF-BUILD-PROVENANCE.json実コンパイル記録/固定lock。84 normal target、21 proc-macro host subtree、1 build-only | 106件の通知184参照を実ソース許諾ファイルのhashと集約通知全文に独立照合、失敗0。hostのproc-macroをブラウザコードと扱わない。全一覧は付録 |
| IPADIC | Lindera v6.2.0のformat2 binary、元入力mecab-ipadic-2.7.0-20250920 UTF-8 fork | NAIST/ICOT独自許諾。エンジンMITと別。COPYING全文/原NOTICE/来歴を配信 |
| kanaria | 0.2.0、[固定commit c994ccf](https://github.com/samunohito/kanaria/blob/c994ccf06d179851a1c7c3285c3a408ccb6279ec/LICENSE.txt) | MIT Copyright (c) 2019 samu no hito。原ソースLICENSEとKANARIA-LICENSE.txtが一致 |
| ブラウザnpm | アプリにpackage.json/package-lock.jsonなし。独自JSと固定生成Lindera JS | npmパッケージをブラウザで追加取得する経路なし。P2a実験の公式npm WASMは本番publishに含まれない |
| フォント・画像・アイコン | app.cssは端末のSegoe UI/Yu Gothic UI/Meiryoを指定。ブランド記号とCSSは独自。docs/imagesの2PNGはアプリ画面の記録 | フォントファイル・外部アイコン集・外部CSS/画像サービスの配信なし。フォント名を指定することとフォント再配布を区別。docs画像はwwwrootにpublishされない |
| GitHub Actions | checkout v7、setup-dotnet v6、upload-pages-artifact v5、deploy-pages v4 | CI専用。公式LICENSEはMIT、GitHub/貢献者の表示を確認。Action本体/そのnpm依存をPlayground配布物へコピーしていないので、アプリの通知同梱対象とは分ける |

### 許諾条件の評価

MITは著作権表示と許諾全文の保持、BSD-3-Clauseは著作権/条件/免責とendorsement制限、Apache-2.0は許諾全文・該当NOTICE・改変したファイルの表示などを確認する。Unlicense/MITやApache/MITの選択肢を、別途の追加条件を無視する根拠にしない。encoding_rsの `(Apache-2.0 OR MIT) AND BSD-3-Clause` とunicode-identの `(MIT OR Apache-2.0) AND Unicode-3.0` は追加条件も残す。BSL-1.0/Zlibを選べるcrateはMIT/Apache選択肢と区別して記録した。

106件の宣言にはGPL/LGPL/CC BY-SAはない。Rustの広いCOPYRIGHT資料にはGPLや例外、OFL/CC等の許諾本文もあるが、そのファイルの存在だけでは該当コードがブラウザへリンクされた証拠にはならない。stock target標準ライブラリ内部の完全リンク対応は未証明。仮にGPLコードが例外なく実際にリンクされる場合は対応ソース等の条件、LGPLなら該当版の改変/再リンク等の条件の追加評価が必要で、今回「全部MIT」としていない。完全SBOMの作成義務をMIT等から推測していない。

許諾原典: [Lindera v6.2.0 LICENSE](https://github.com/lindera/lindera/blob/v6.2.0/LICENSE)、[wasm-bindgen 0.2.126](https://github.com/wasm-bindgen/wasm-bindgen/tree/0.2.126)、[Rust 1.98.1 COPYRIGHT](https://github.com/rust-lang/rust/blob/1.98.1/COPYRIGHT)。crate別の版・source archive checksum・licenseファイルchecksum・featuresは配信SELF-BUILD-PROVENANCE.json/固定Cargo.lockに保持している。今回の独立照合結果は `independent-rust-notices.json`。

### IPADIC

IPADIC-COPYINGはNAIST 2000–2003の著作権、利用/複製/配布の許可、通知・段落保持、免責、ICOT Free Softwareの配布/無保証条件を含む。商用を禁止する文言は見つからないが、国の法令遵守等の独自条件を消していない。MIT全文だけでは代替不可。

配布NOTICEの20070801表記と20250920 UTF-8入力は異なる版の履歴として保持。COPYING SHA-256 `fca02d9adb601d101eccdf3131119abfff2d9c825ef5c759d7a89ebbaa972099`。原典/加工の照合は [IPADIC-PROVENANCE.md](../src/KanjiVariants.Playground/wwwroot/furigana/lindera-6.2.0/IPADIC-PROVENANCE.md)、[固定UTF-8 fork](https://github.com/lindera/mecab-ipadic/tree/79f5146f8615277ca2c1817f04af9b932c9c6423)、保存した両原典tar/COPYINGを参照。今回、実binary ZIPと9ファイルの展開hashは既存検証を再実行し一致。ただし全CSV→binary辞書再構築は今回実施していない。来歴文書末尾の「未解決通知」表現は現行106通知充足と整合しないためC3。

## 漢字データの条件

| データ | 実使用/加工・根拠 | 再利用条件と状態 |
|---|---|---|
| MJ文字情報一覧 | Ver.006.02、mji.00602.xlsx。MJ/JIS X 0213所属、人名用漢字、文字情報表の生成元 | [公式一覧](https://moji.or.jp/mojikiban/mjlist/)はIPA著作物表示とCC BY-SA 2.1 JPを指定。単なるリンク参照ではなく生成表をNuGet/Webcilへ再配布 |
| MJ縮退マップ | Ver.1.2.0、2018-01-26。[公式マップ](https://moji.or.jp/mojikiban/map/) | CC BY-SA 2.1 JP。候補・一意変換用検索表へ加工。加工データの継承、出典、加工内容の表示が必要 |
| IVS/SVS | Unicode IVD 2026-08-03、Standardized Variants Unicode18.0.0。MJ表も併用 | Unicode原典利用条件/Unicode License V3とMJ条件を別々に保持 |
| JIS X 0212 | ICU固定commit 61607c27732906d36c5bd4d23ecc092f89f53a2b、jisx-212.ucm、Table0.9 (2000-08-20)。Unihan18.0.0 kJis1と照合 | [版固定原典](https://github.com/unicode-org/icu/blob/61607c27732906d36c5bd4d23ecc092f89f53a2b/icu4c/source/data/mappings/jisx-212.ucm)のUnicode/ICU/IBMほか通知がパッケージ通知にある |
| JIS X 0208 | package対応commitのgenerate.py: 区点をbytes.decode('euc_jp')で走査 | Pythonコードの利用と出力対応データの再利用を区別。生成環境の版未記録、元mappingの適用条件未確定（A1）。規格書本文をコピーしたという証拠はない |
| 常用漢字・音訓・語例 | 文化庁「常用漢字表の音訓索引」を固定HTMLから抽出、続き行等を整理 | [原典](https://www.bunka.go.jp/kokugo_nihongo/sisaku/joho/joho/kijun/naikaku/kanji/joyokanjisakuin/index.html)・[文科省規約](https://www.mext.go.jp/b_menu/1351168.htm)の出典/加工表示。パッケージ通知に加工記載あり |
| 教育漢字 | 平成29年告示配当表、固定PDF→TXT転記→学年検索表 | [原典PDF](https://www.mext.go.jp/content/20230120-mxt_kyoiku02-100002604_01.pdf)、文科省規約。今回配当表を変更していない |
| 音訓学校段階・付表 | 平成29年3月割り振り表、固定PDFから再構成 | [原典](https://www.mext.go.jp/a_menu/shotou/new-cs/1385768.htm)、出典/加工表示を保持 |
| 送り仮名 | 文化庁公式通則1～7・付表を検索用に再構成 | [原典](https://www.bunka.go.jp/kokugo_nihongo/sisaku/joho/joho/kijun/naikaku/okurikana/index.html)、文科省規約、加工記載あり |
| 読み | 本体詳細の常用漢字読みは上記文化庁/MEXT由来。自動読みはIPADIC | MJ一覧の参考「読み」や辞書書籍そのものを現在のMjCharacter表に抽出した証拠はない。現generatorの列定義はMJ名/UCS/IVS/SVS/X0213/漢字施策/互換漢字。書籍全文の再配布と混同しない |

[CC BY-SA 2.1 JP legalcode](https://creativecommons.org/licenses/by-sa/2.1/jp/legalcode)第5条の原著作物/二次的著作物の許諾URI・表示維持・同一要素での利用と、組み込まれる編集著作物等の区別を確認。PlaygroundはMJ加工データを含むNuGetを配信するため条件は残るが、独立アプリコード全体をCC BY-SAにする根拠にはしない。LICENSE-NOTICES.md、パッケージ通知、licenses.htmlにはIPA/CC BY-SA/検索表への加工記載とURIがある。派生データの範囲を明示する改善はB4。原XLSX/JSON/フォント/字形画像をPagesへ配布していない。

文科省規約は2026-08-17改正を確認。商用利用可、出典と加工表示、第三者権利の除外条件がある。以前の条件で利用済みの場合の継続も規約にある。公式掲載だからすべて無条件自由と扱わない。[Unicode License V3](https://www.unicode.org/license.txt)の許諾/著作権通知全文はKanjiVariants通知と関連Rust通知にある。

Python原典は [版例3.13の許諾](https://docs.python.org/3.13/license.html)、[CPython v3.13.0 mapping](https://github.com/python/cpython/blob/v3.13.0/Modules/cjkcodecs/mappings_jp.h)とCJK READMEを参考確認した。これは実生成版を3.13と特定した証拠ではない。PSF表示/許諾と変更概要の義務はPythonまたはその派生物に対するもの。符号対応の事実を抽出した出力がそれに当たるかを、現在の通知の「要確認」だけで解決済みにしない。

## .NET/Blazor配布監査

実publishは34個の `.wasm`を含む（dotnet.native.wasm 1個とmanaged assemblyのWebcil 33個）。このほかdotnet/runtime/native JS、blazor.webassembly JS、ICUデータなどを配信。DevServer・SDK・MSBuild/ILLink DLLは配信しない。32 lock packageのうち15件で配布managed assemblyとの名前対応を確認、残りは付録で分けた。標準ライブラリはlockだけではなくimplicit runtime pack `Microsoft.NETCore.App.Runtime.Mono.browser-wasm 10.0.12`を調査した。

| 配布通知 | 原パッケージ/原典との結果 | SHA-256 |
|---|---|---|
| DotNet-10.0.12-LICENSE.txt | runtime pack LICENSE.TXTとバイト一致 | cfc21f5e8bd655ae997eec916138b707b1d290b83272c02a95c9f821b8c87310 |
| DotNet-10.0.12-NOTICES.txt | runtime pack THIRD-PARTY-NOTICES.TXTとバイト一致 | 66f1d4e44973185519bb4aa8a9718eb22fc7af2cc532e3ae9cfc4c127ee7fc54 |
| Blazor-10.0.12-LICENSE.txt | packageにLICENSE単体がないので[aspnetcore v10.0.12原典](https://raw.githubusercontent.com/dotnet/aspnetcore/v10.0.12/LICENSE.txt)と照合、一致 | cfc21f5e8bd655ae997eec916138b707b1d290b83272c02a95c9f821b8c87310 |
| Blazor-10.0.12-NOTICES.txt | Components.WebAssembly 10.0.12の通知と一致 | ae45a01fa3062e9d9932760cf834dae3ba23dbd75a75a2b919654f9c738d1ed9 |

Microsoft packageのnuspecはMIT、Microsoft著作権とsource `dotnet/dotnet 95017c711e6afc1085133d440e42b4bd78155701`を示す。[.NET 10.0.12 release](https://github.com/dotnet/core/blob/main/release-notes/10.0/10.0.12/10.0.12.md)もSDK10.0.401との対応を確認。`licenses.html`から上記全文へアクセスでき、新publishにlicensesの7原通知・それぞれbr/gzが存在する。

署名付きNuGetのraw archive SHA-512とlockのcontentHashは同じ値ではない。最初の単純SHA比較32件不一致を改竄扱いせず、[NuGet原実装](https://github.com/NuGet/NuGet.Client/blob/dev/src/NuGet.Core/NuGet.Packaging/PackageArchiveReader.cs)を確認し、rawをnupkg.sha512、署名非依存contentHashを.nupkg.metadata/lockへ別々に照合。32件とも一致。不正の証拠はない。ただし署名チェーンのオンライン完全再検証は今回行っていない。

## セキュリティ・Git履歴

### 新たに発見した.NET PDBパス

新publishの展開後UTF-8/UTF-16検査で以下を検出した。

- `_framework/KanjiVariants.dk66zd9i5b.wasm`: KanjiVariants本体checkoutの `obj/Release/net6.0/KanjiVariants.pdb` のWindows絶対パス1件。
- `_framework/KanjiVariants.Playground.9m2duervjf.wasm`: Playground checkoutの `obj/Release/net10.0/KanjiVariants.Playground.pdb` のWindows絶対パス1件。

いずれも `C:\Users\kobayashi\source\repos\...` で始まる。圧縮br/gzを展開しても同じため検出ファイルは6、独立したパスは2。本体NuGet DLLとRelease Playground DLLをPEReader.ReadDebugDirectory/ReadCodeViewDebugDirectoryDataで読んで、**CodeView debug directoryのPDBパス**と確認した。PDBファイル自体がpublishに存在するという意味ではない。Linderaだけを調べる既存パス検査の範囲外だった。

提案: Playgroundは再現ビルド時のPathMap/固定仮想ソースrootを設定し、DLL→trim→Webcil後まで検証。本体はNuGet 1.2.0に埋め込まれているのでPlayground側PathMapだけでは除去できない。本体の許可された再ビルド/修正版の採用、またはデバッグ情報を適切に扱う公式publish手順を検証する別作業が必要。既存NuGet DLL/WASMの文字列パッチや今回の無断パッケージ更新はしない。

### その他の検査

- publish252ファイルを棚卸し。br/gzも展開し、UTF-8/UTF-16LE/BEの双方でローカルユーザーrootと認証キーの代表形式を検査。上述PDBパス以外に同ルールでの秘密キー混入は検出なし。全ての独自形式/暗号化秘密を見つける保証はしない。
- tracked sourceのWindowsユーザー絶対root/代表credential検査は0件。著作権者の公表名、公式URL、upstreamの著作権表示は意図された通知で、秘密情報としない。
- HEADに到達するGit239 blobで、代表credential/開発ユーザーrootは0件。秘密鍵BEGIN文字列1件はFuriganaPathChecks.mjsの検出fixtureで、実秘密鍵なし。reflog/到達不能な旧c7cbcfコミット、他のremote branch/公開済み履歴すべてを検査したものではない。amendで到達不能になった内容が既に公開されていれば、amendだけで外部公開を消せない。
- 本publishに `.pdb`/`.map`/`.log`/`.bak`/`.tmp`、.git/.env/node_modules/obj/binのディレクトリはない。Framework JSにはmapのコメントがあるがmapは配信していない。DevServerのデバッグ通信やログサービスも同梱していない。
- Home/FuriganaPreviewは構造化範囲をRazorでエスケープ表示。MarkupString/innerHTML/evalへの利用者入力の挿入経路なし。実ブラウザで読みを `<img src=x onerror=alert(1)>` にするとrtの文字列として表示され、preview内のimgは0件。その後読みを戻した。
- 学年判定は既存EducationKanjiDiagnostics.AnalyzeText。2,000 UTF-16（変換は100,000）上限・不正UTF-16拒否・原文revision・手動読み優先はテスト再実行済み。超過入力を黙って切り捨てない。入力欄の保持自体はブラウザメモリを使うので、極端に大きいpasteを完全に無負荷にはできない。
- 独自JSのfetchはmodule相対manifest/engine/辞書の取得。入力はWorker postMessageとWASMメモリへ渡し、外部APIへの送信経路なし。localStorage/sessionStorageへの保存なし。テーマもdocument dataset/セッション状態。clipboardは利用者がコピーを押した場合のみ。外部GitHub/出典リンクは利用者の通常ナビゲーションであり、入力送信ではない。
- Workerは初回のみ辞書読込・初期化再利用。120秒タイムアウト/errorでterminate/resetして再試行、原文変更後の旧結果はdiscard。OOM時にブラウザプロセスそのものが停止するケースまで復旧保証はしない。
- manifestだけでは可変配布元全体の真正性を保証しない。WorkerのWASM固定hash/取得hash検査とJS来歴を確認したが、JSはimport前に独立固定hashで検査していない。同一originの任意改竄を防ぐ仕組みとして扱わない。CSPの導入は将来の追加防御として検討できるが、現状にXSSが成立した証拠はない。

### 既知の脆弱性

2026-10-13実行。NuGetの `dotnet list ... --vulnerable --include-transitive --format json` は成功、該当報告0。implicit browser runtime pack10.0.12もOSV照会で該当0。未検出を未知の脆弱性なしと同一視しない。

Cargo106件のうち101 registry package/versionをOSVで照会。残り5件は固定Lindera workspaceで、開発元公開advisories APIは0件。registry照会の唯一の該当は [RUSTSEC-2024-0449](https://rustsec.org/advisories/RUSTSEC-2024-0449.html)、unsafe-libyaml0.2.11のunmaintained（CVSSなし、具体的脆弱性情報ではない）。lindera-analysis/src/tokenizer.rsのYAML設定読込用にserde_yaml_ngから利用されるが、現Workerは固定bytesの辞書とTokenizer(normal)を使い、入力文章をYAMLとして渡さない。C2と評価した。

Rust/wasm-bindgenの開発元公開advisories APIも確認。wasm-bindgenは0件、Rustは6件で、影響範囲の上限はそれぞれ1.89/1.81/1.77.2/1.58.1/1.56.1/1.26未満等、1.98.1には該当しない。OSVにcrates.ioのrust名で送った補助照会はtoolchainの証明に使っていない。

Actionsの公開repository advisoryは各0件だが、**これだけで依存に脆弱性なしとはいえない。** 公式tagのlockにある非devのnpm205 package/versionをOSV照会し、22組/46固有advisoryに該当。CI専用でブラウザには配信されない。lockと実bundleの完全対応を証明したものではないが、公式distでundici/form-data/unzip-stream/fast-xml-parser/brace-expansion等のコードマーカーも確認した。

| 代表項目 | 該当と修正版例 | 現workflowへの到達可能性と対応 |
|---|---|---|
| form-data 4.0.0 (deploy-pages lock) | [GHSA-fjxv-7rqg-78g4](https://github.com/advisories/GHSA-fjxv-7rqg-78g4)、CRITICAL、4.0.4等で修正 | 弱いmultipart boundary乱数。攻撃者がmultipartの内容を制御し境界を推測する条件。利用者の文章はCIへ来ず、現deploy APIの具体的multipart到達は未証明。公式Action修正版をレビュー |
| unzip-stream0.3.1 (deploy-pages lock/bundle) | [GHSA-6jrj-vc65-c983](https://github.com/advisories/GHSA-6jrj-vc65-c983)、HIGH、0.3.2で修正 | 悪意あるarchive展開時の任意ファイル書込。現artifactは同workflowの固定publishから作り、PR/workflow_run/外部artifact入力なし。該当関数が実行されるかは未証明。依存更新を確認 |
| fast-xml-parser5.9.3 (setup-dotnet) | [GHSA-8r6m-32jq-jx6q](https://github.com/advisories/GHSA-8r6m-32jq-jx6q)、HIGH、5.10.1で修正 | DOCTYPE反復による制限回避。global.jsonには固定SDKのみ、利用者XML入力なし。公式取得XML/リポジトリ内設定等の具体的経路を別途確認 |
| brace-expansion5.0.6/1.1.15等 | [GHSA-3jxr-9vmj-r5cp](https://github.com/advisories/GHSA-3jxr-9vmj-r5cp)、HIGH、5.0.7/1.1.16/2.1.2等 | パターン入力のDoS。現workflowは固定artifact path等。外部入力へ広げるworkflow変更時に再評価 |
| undici6.27.0/5.28.2 | [GHSA-3wwx-pv8p-q78v](https://github.com/advisories/GHSA-3wwx-pv8p-q78v)ほか、WS/HTTP処理の警告 | WS/HTTPの各条件を個別確認。通常の固定HTTPS取得とすべての危険な機能が同じ到達性とはしない |

全22組/46IDの一覧は付録。既知の重大advisoryを見落とさず記録する一方、悪用可能なブラウザ脆弱性/CI乗っ取りを証明したとはしない。現在はgateによりupload/deployに到達しない。承認の前にB2を評価し直すことを強く推奨する。

## 新publishと公開制御

新成果物: `artifacts/prepublication-audit/publish/wwwroot`。252ファイル、41,913,712 bytes（rawとbr/gzを全て合算した保管量、初回転送量ではない）。framework raw15,321,155 bytes、br3,433,925 bytes。辞書9ファイルはgzip11,510,702 bytes、展開47,524,848 bytes。ブラウザ内で展開/コピーするためメモリはこの量より増える。実機メモリ値は未測定。

本番Lindera WASMは2,214,024 bytes、SHA-256 `fbe6bf9a280f10f7e897fb88d997838c6c1bf1df20bf288ea3df23962a1897ba`。JSは66,542 bytes、`a9e082fca426d6d225a439bac39c9d690aa5176598d7c902ca71e1fe4ba8d03a`。自前provenance/lock、WASM/JS、辞書gzipと展開hash、29通知全て一致。公式npm WASMへの逆戻りをdistribution負のテストでも拒否した。実publishのファイル一覧/hashは `publish-inventory.json`。

`/KanjiVariants.Playground/`を適用、25静的参照成功。localhost限定の一時サーバーで実ブラウザがWorker/JS/WASM/辞書を読み込み、自動生成を完了。ローカルサーバーはWASMをapplication/wasm、JSをtext/javascriptで返す。**これはGitHub Pages実配信のMIME/圧縮交渉を確認したことではない。** 実サーバーの圧縮配信・初回転送量は未検証。全originへのnetwork packet captureも行っていないため、外部送信なしの評価はソース経路と同一origin静的取得に基づく。

workflowは `.github/workflows/pages.yml` の1件のみ。push main（READMEのみを除く）/workflow_dispatchから起動。contents:read、checkoutのpersist-credentials:false。build内でテスト→publish→subpath/参照→publish通知検証→Verify-FuriganaRedistribution→uploadの順。gateはsource整合性と通知/来歴を確認した後falseで停止し、失敗時uploadなし。deployはneeds:buildで、成功時だけpages:write/id-token:writeを持つ。別workflow、PR入力/Issue投稿/任意Pushコマンドを見つけていない。

このgateはふりがなのsourceを検査し、publishとの一致は直前の独立検証が担う。`publicationApproved=true`だけに変更しても、後続にbinaryAttested/SBOM/status/blockersの別条件がある。完全SBOMの不在を法律上の違反とする根拠はないが、現行の安全条件は今回緩和していない。条件変更が必要なら、今後別の根拠付きレビューが必要。

公開APIでremote mainは `0645bdb511dfd664ee4fe5416da85c1c63042637`、ローカルHEADと異なる。既存Pages HTMLのGETは200で、falseが既存サイトを非公開にするわけではない。Pages設定APIは404でsource設定は不明。リポジトリは公開されており、**PushはPagesを止めてもソース・配布バイナリ・Git履歴を公開する別行為**。本監査ではPushも行っていない。

Action majorタグをAPIで解決した監査時の値（workflowはこのSHAへ変更していない）:

| Action | 監査時SHA |
|---|---|
| actions/checkout@v7 | 3d3c42e5aac5ba805825da76410c181273ba90b1 |
| actions/setup-dotnet@v6 | a98b56852c35b8e3190ac28c8c2271da59106c68 |
| actions/upload-pages-artifact@v5 | fc324d3547104276b827a68afc52ff2a11cc49c9 |
| actions/deploy-pages@v4 | d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e |

upload-pages-artifact v5内部はactions/upload-artifact `bbbca2ddaa5d8feaa63e36b76fdaad77386f024f` (v7.0.0)をSHAで指定する。トップレベルのmajor tagは更新可能なため完全固定ではない。原典は各 [actions公式repository](https://github.com/actions)の該当tagのLICENSE/action.yml/package-lock.json/distを取得して確認。

## ユーザー説明と動作検証

UIには自動推定に誤りがある旨、推定は未確認、要確認/未入力、累積学年配当、初回辞書取得と入力送信なしがある。手動確認済みと自動を区別。学年は個人の実際の習得を測定するものではないことを一文追加する案はC4。免責は配信MIT/IPADIC/その他全文に存在し、アプリで読みの保証をしていない。

| 今回再実行した検証 | 結果/範囲 |
|---|---|
| コンソールChecks | 新Releaseビルド後に2,333件成功 |
| Worker Checks | Unicode位置、lazy初期化/再利用/再試行、asset hash、通知成功 |
| パス検査 | 118 fixture成功、配布Lindera WASM/JS検査成功。UTF-8/UTF-16/データセクション。Linderaの開発環境固有パス0件 |
| Distribution負のテスト | 公式WASM/通知/lock/来歴/origin改竄拒否を確認 |
| 独立Rust通知照合 | 106 package、184 license-file参照のhash/全文照合、失敗0 |
| source/publishライセンス検証 | 29通知・証跡、辞書/WASM/JS/hash全て成功 |
| Debug/Release build | 各0警告・0エラー |
| Release publish | 成功。既存SDKのoptional wasm-tools推奨案内は残る |
| Pages準備/参照 | 25参照成功、subpathで実画面起動 |
| 公開前チェック | notice/provenance成功後publicationApproved=falseでexit1、期待する停止 |
| 実ブラウザ・自動 | 今日→きょう、図書館→としょかん、宇宙→うちゅう、読→よ。既習の大人には小学1年で不要なルビなし |
| 手動/学年/コピー | 今日をこんにちに変更して再生成でも保持。1→6でruby0、1へ戻して再利用。括弧付きcopyと表示OFFの原文copyを実clipboardで確認 |
| XSS例 | 読みのimg/onerror文字列がrtテキストとして表示、preview img0 |
| 既存機能 | 髙橋𠮷野さん→高橋吉野さん、髙橋の診断、髙の詳細を実画面で確認 |
| テーマ | 通常表示とダーク表示で確認。今回の実機モバイル/幅変更テストは未実施 |

ブラウザcopyの実値: `今日（こんにち）は図書館（としょかん）で大人と宇宙（うちゅう）の本を読（よ）みます。`、表示OFFは `今日は図書館で大人と宇宙の本を読みます。`。画面証跡は `artifacts/prepublication-audit/browser-furigana.png`。

制限環境で最初のDebug/Release/publishはMSBuild task host起動ができずMSB4216/MSB4027で失敗。通常環境で許可された同ビルドを再実行し全て成功した。NuGet online照会も最初はDNS不可、通常環境で再実行し成功。承認利用上限による停止は今回発生していない。初期の失敗を成功として数えていない。

## 公開前に必要な次の作業

1. 本体のJIS X 0208生成元版/対応表ライセンス・通知要否を確定し、A1の判断根拠を残す。必要な通知を追加する場合はその後のNuGet/publishで照合する。
2. .NET配布2アセンブリのPDB絶対パスを除去する方法を本体/Playground双方で検証し、変更した配布物のhash・来歴・回帰テストを更新する。
3. Actionsの該当依存と実関数到達をレビュー。必要な公式更新を別途承認された作業で採用、commit SHAを固定してCIで再検証する。
4. MJ生成ヘッダーのコード/データの条件を明確にし、IPADIC等の現行/履歴説明を整理。ライセンス全文を都合よく書き換えない。
5. Pages設定/Environmentを権限のある画面で確認し、公開判断とチェック方針を独立レビュー。今回は承認falseを維持。
6. 実機メモリ/性能、Safari/Firefox等を追加測定。品質検証の不足と、確認できない配布権限を同じ阻害理由にしない。

本報告のA/Bは未解消。検証成功・通知充足だけをもって公開可能に変更していない。現行機能・解析仕様・NuGet版・本体は不変。本報告書追加後のGit差分は報告書のみ。

## 付録: 依存一覧

以下は実lock・コンパイル記録・ソース通知に照合した版一覧。ソース候補やコンパイル記録を最終リンクの完全SBOMとして扱わない。

### NuGet32件（SDKが注入した依存も含む）

| 名称 | 版 | 配布対応/用途 | 条件 |
|---|---|---|---|
| KanjiVariants | 1.2.0 | ブラウザ: KanjiVariants | MIT + データ個別条件 |
| Microsoft.AspNetCore.App.Internal.Assets | 10.0.12 | 配布managed assembly対応なし（build/解決依存） | Microsoft MIT + 該当第三者通知 |
| Microsoft.AspNetCore.Components.WebAssembly | 10.0.12 | ブラウザ: Microsoft.AspNetCore.Components.WebAssembly | Microsoft MIT + 該当第三者通知 |
| Microsoft.AspNetCore.Components.WebAssembly.DevServer | 10.0.12 | 配布managed assembly対応なし（build/解決依存） | Microsoft MIT + 該当第三者通知 |
| Microsoft.NET.ILLink.Tasks | 10.0.12 | 配布managed assembly対応なし（build/解決依存） | Microsoft MIT + 該当第三者通知 |
| Microsoft.NET.Sdk.WebAssembly.Pack | 10.0.12 | 配布managed assembly対応なし（build/解決依存） | Microsoft MIT + 該当第三者通知 |
| Microsoft.AspNetCore.Authorization | 10.0.12 | 配布managed assembly対応なし（build/解決依存） | Microsoft MIT + 該当第三者通知 |
| Microsoft.AspNetCore.Components | 10.0.12 | ブラウザ: Microsoft.AspNetCore.Components | Microsoft MIT + 該当第三者通知 |
| Microsoft.AspNetCore.Components.Analyzers | 10.0.12 | 配布managed assembly対応なし（build/解決依存） | Microsoft MIT + 該当第三者通知 |
| Microsoft.AspNetCore.Components.Forms | 10.0.12 | 配布managed assembly対応なし（build/解決依存） | Microsoft MIT + 該当第三者通知 |
| Microsoft.AspNetCore.Components.Web | 10.0.12 | ブラウザ: Microsoft.AspNetCore.Components.Web | Microsoft MIT + 該当第三者通知 |
| Microsoft.AspNetCore.Metadata | 10.0.12 | 配布managed assembly対応なし（build/解決依存） | Microsoft MIT + 該当第三者通知 |
| Microsoft.Extensions.Configuration | 10.0.12 | ブラウザ: Microsoft.Extensions.Configuration | Microsoft MIT + 該当第三者通知 |
| Microsoft.Extensions.Configuration.Abstractions | 10.0.12 | ブラウザ: Microsoft.Extensions.Configuration.Abstractions | Microsoft MIT + 該当第三者通知 |
| Microsoft.Extensions.Configuration.Binder | 10.0.12 | 配布managed assembly対応なし（build/解決依存） | Microsoft MIT + 該当第三者通知 |
| Microsoft.Extensions.Configuration.FileExtensions | 10.0.12 | 配布managed assembly対応なし（build/解決依存） | Microsoft MIT + 該当第三者通知 |
| Microsoft.Extensions.Configuration.Json | 10.0.12 | ブラウザ: Microsoft.Extensions.Configuration.Json | Microsoft MIT + 該当第三者通知 |
| Microsoft.Extensions.DependencyInjection | 10.0.12 | ブラウザ: Microsoft.Extensions.DependencyInjection | Microsoft MIT + 該当第三者通知 |
| Microsoft.Extensions.DependencyInjection.Abstractions | 10.0.12 | ブラウザ: Microsoft.Extensions.DependencyInjection.Abstractions | Microsoft MIT + 該当第三者通知 |
| Microsoft.Extensions.Diagnostics | 10.0.12 | 配布managed assembly対応なし（build/解決依存） | Microsoft MIT + 該当第三者通知 |
| Microsoft.Extensions.Diagnostics.Abstractions | 10.0.12 | 配布managed assembly対応なし（build/解決依存） | Microsoft MIT + 該当第三者通知 |
| Microsoft.Extensions.FileProviders.Abstractions | 10.0.12 | 配布managed assembly対応なし（build/解決依存） | Microsoft MIT + 該当第三者通知 |
| Microsoft.Extensions.FileProviders.Physical | 10.0.12 | 配布managed assembly対応なし（build/解決依存） | Microsoft MIT + 該当第三者通知 |
| Microsoft.Extensions.FileSystemGlobbing | 10.0.12 | 配布managed assembly対応なし（build/解決依存） | Microsoft MIT + 該当第三者通知 |
| Microsoft.Extensions.Logging | 10.0.12 | ブラウザ: Microsoft.Extensions.Logging | Microsoft MIT + 該当第三者通知 |
| Microsoft.Extensions.Logging.Abstractions | 10.0.12 | ブラウザ: Microsoft.Extensions.Logging.Abstractions | Microsoft MIT + 該当第三者通知 |
| Microsoft.Extensions.Options | 10.0.12 | ブラウザ: Microsoft.Extensions.Options | Microsoft MIT + 該当第三者通知 |
| Microsoft.Extensions.Options.ConfigurationExtensions | 10.0.12 | 配布managed assembly対応なし（build/解決依存） | Microsoft MIT + 該当第三者通知 |
| Microsoft.Extensions.Primitives | 10.0.12 | ブラウザ: Microsoft.Extensions.Primitives | Microsoft MIT + 該当第三者通知 |
| Microsoft.Extensions.Validation | 10.0.12 | 配布managed assembly対応なし（build/解決依存） | Microsoft MIT + 該当第三者通知 |
| Microsoft.JSInterop | 10.0.12 | ブラウザ: Microsoft.JSInterop | Microsoft MIT + 該当第三者通知 |
| Microsoft.JSInterop.WebAssembly | 10.0.12 | ブラウザ: Microsoft.JSInterop.WebAssembly | Microsoft MIT + 該当第三者通知 |

名称は `packages.lock.json` のnet10.0解決に基づく。対応なしはパッケージ全ファイルの不要性やruntime全体にコードがないことを断定する意味ではない。Developer/Analyzer/ILLink/WebAssembly SDKをブラウザ依存に数えず、implicit runtime packは本文で別に扱う。

### Rust/Lindera106コンパイルpackage

T=normal target候補、H=proc-macro host subtree、B=build-only。個々のcustom-build/host variantは同梱来歴JSONへ記録。licenseは実ソースと照合した宣言式（選択した許諾/追加条件の区別は本文参照）。全source/license checksumはSELF-BUILD-PROVENANCE.json/SELF-BUILD-CARGO.lockに保持する。

| 名称 | 版 | 区分 | 許諾式 | 版固定source |
|---|---|---|---|---|
| aho-corasick | 1.1.4 | T | Unlicense OR MIT | [source](https://crates.io/crates/aho-corasick/1.1.4) |
| anyhow | 1.0.104 | T | MIT OR Apache-2.0 | [source](https://crates.io/crates/anyhow/1.0.104) |
| bitflags | 1.3.2 | T | MIT/Apache-2.0 | [source](https://crates.io/crates/bitflags/1.3.2) |
| bumpalo | 3.20.2 | H | MIT OR Apache-2.0 | [source](https://crates.io/crates/bumpalo/3.20.2) |
| bytecheck | 0.8.2 | T | MIT | [source](https://crates.io/crates/bytecheck/0.8.2) |
| bytecheck_derive | 0.8.2 | H | MIT | [source](https://crates.io/crates/bytecheck_derive/0.8.2) |
| byteorder | 1.5.0 | T | Unlicense OR MIT | [source](https://crates.io/crates/byteorder/1.5.0) |
| cfg-if | 1.0.4 | T | MIT OR Apache-2.0 | [source](https://crates.io/crates/cfg-if/1.0.4) |
| crawdad | 0.4.1 | T | MIT OR Apache-2.0 | [source](https://crates.io/crates/crawdad/0.4.1) |
| csv | 1.4.0 | T | Unlicense/MIT | [source](https://crates.io/crates/csv/1.4.0) |
| csv-core | 0.1.13 | T | Unlicense/MIT | [source](https://crates.io/crates/csv-core/0.1.13) |
| daachorse | 5.0.0 | T | MIT OR Apache-2.0 | [source](https://crates.io/crates/daachorse/5.0.0) |
| displaydoc | 0.2.5 | H | MIT OR Apache-2.0 | [source](https://crates.io/crates/displaydoc/0.2.5) |
| encoding_rs | 0.8.41 | T | (Apache-2.0 OR MIT) AND BSD-3-Clause | [source](https://crates.io/crates/encoding_rs/0.8.41) |
| encoding_rs_io | 0.1.8 | T | MIT OR Apache-2.0 | [source](https://crates.io/crates/encoding_rs_io/0.1.8) |
| equivalent | 1.0.2 | T | Apache-2.0 OR MIT | [source](https://crates.io/crates/equivalent/1.0.2) |
| form_urlencoded | 1.2.2 | T | MIT OR Apache-2.0 | [source](https://crates.io/crates/form_urlencoded/1.2.2) |
| futures-core | 0.3.32 | T | MIT OR Apache-2.0 | [source](https://crates.io/crates/futures-core/0.3.32) |
| futures-task | 0.3.32 | T | MIT OR Apache-2.0 | [source](https://crates.io/crates/futures-task/0.3.32) |
| futures-util | 0.3.32 | T | MIT OR Apache-2.0 | [source](https://crates.io/crates/futures-util/0.3.32) |
| glob | 0.3.4 | T | MIT OR Apache-2.0 | [source](https://crates.io/crates/glob/0.3.4) |
| hashbrown | 0.17.1 | T | MIT OR Apache-2.0 | [source](https://crates.io/crates/hashbrown/0.17.1) |
| heck | 0.5.0 | H | MIT OR Apache-2.0 | [source](https://crates.io/crates/heck/0.5.0) |
| icu_collections | 2.2.0 | T | Unicode-3.0 | [source](https://crates.io/crates/icu_collections/2.2.0) |
| icu_locale_core | 2.2.0 | T | Unicode-3.0 | [source](https://crates.io/crates/icu_locale_core/2.2.0) |
| icu_normalizer | 2.2.0 | T | Unicode-3.0 | [source](https://crates.io/crates/icu_normalizer/2.2.0) |
| icu_normalizer_data | 2.2.0 | T | Unicode-3.0 | [source](https://crates.io/crates/icu_normalizer_data/2.2.0) |
| icu_properties | 2.2.0 | T | Unicode-3.0 | [source](https://crates.io/crates/icu_properties/2.2.0) |
| icu_properties_data | 2.2.0 | T | Unicode-3.0 | [source](https://crates.io/crates/icu_properties_data/2.2.0) |
| icu_provider | 2.2.0 | T | Unicode-3.0 | [source](https://crates.io/crates/icu_provider/2.2.0) |
| idna | 1.1.0 | T | MIT OR Apache-2.0 | [source](https://crates.io/crates/idna/1.1.0) |
| idna_adapter | 1.2.1 | T | Apache-2.0 OR MIT | [source](https://crates.io/crates/idna_adapter/1.2.1) |
| indexmap | 2.14.0 | T | Apache-2.0 OR MIT | [source](https://crates.io/crates/indexmap/2.14.0) |
| itoa | 1.0.18 | T | MIT OR Apache-2.0 | [source](https://crates.io/crates/itoa/1.0.18) |
| js-sys | 0.3.103 | T | MIT OR Apache-2.0 | [source](https://crates.io/crates/js-sys/0.3.103) |
| kanaria | 0.2.0 | T | MIT | [source](https://crates.io/crates/kanaria/0.2.0) |
| lindera | 6.2.0 | T | MIT | [source](https://github.com/lindera/lindera/tree/0482efcc46b5ec518b7238efae55e9fed9bba0c0/lindera) |
| lindera-analysis | 6.2.0 | T | MIT | [source](https://github.com/lindera/lindera/tree/0482efcc46b5ec518b7238efae55e9fed9bba0c0/lindera-analysis) |
| lindera-binding-core | 6.2.0 | T | MIT | [source](https://github.com/lindera/lindera/tree/0482efcc46b5ec518b7238efae55e9fed9bba0c0/lindera-binding-core) |
| lindera-dictionary | 6.2.0 | T | MIT | [source](https://github.com/lindera/lindera/tree/0482efcc46b5ec518b7238efae55e9fed9bba0c0/lindera-dictionary) |
| lindera-wasm | 6.2.0 | T | MIT | [source](https://github.com/lindera/lindera/tree/0482efcc46b5ec518b7238efae55e9fed9bba0c0/lindera-wasm) |
| litemap | 0.8.2 | T | Unicode-3.0 | [source](https://crates.io/crates/litemap/0.8.2) |
| log | 0.4.34 | T | MIT OR Apache-2.0 | [source](https://crates.io/crates/log/0.4.34) |
| memchr | 2.8.3 | T | Unlicense OR MIT | [source](https://crates.io/crates/memchr/2.8.3) |
| memmap2 | 0.9.11 | T | MIT OR Apache-2.0 | [source](https://crates.io/crates/memmap2/0.9.11) |
| multiversion_no_op | 1.0.0 | H | Apache-2.0 OR MIT | [source](https://crates.io/crates/multiversion_no_op/1.0.0) |
| munge | 0.4.7 | T | MIT | [source](https://crates.io/crates/munge/0.4.7) |
| munge_macro | 0.4.7 | H | MIT | [source](https://crates.io/crates/munge_macro/0.4.7) |
| once_cell | 1.21.4 | T | MIT OR Apache-2.0 | [source](https://crates.io/crates/once_cell/1.21.4) |
| percent-encoding | 2.3.2 | T | MIT OR Apache-2.0 | [source](https://crates.io/crates/percent-encoding/2.3.2) |
| pin-project-lite | 0.2.17 | T | Apache-2.0 OR MIT | [source](https://crates.io/crates/pin-project-lite/0.2.17) |
| potential_utf | 0.1.5 | T | Unicode-3.0 | [source](https://crates.io/crates/potential_utf/0.1.5) |
| proc-macro2 | 1.0.106 | H | MIT OR Apache-2.0 | [source](https://crates.io/crates/proc-macro2/1.0.106) |
| ptr_meta | 0.3.1 | T | MIT | [source](https://crates.io/crates/ptr_meta/0.3.1) |
| ptr_meta_derive | 0.3.1 | H | MIT | [source](https://crates.io/crates/ptr_meta_derive/0.3.1) |
| quote | 1.0.45 | H | MIT OR Apache-2.0 | [source](https://crates.io/crates/quote/1.0.45) |
| rancor | 0.1.1 | T | MIT | [source](https://crates.io/crates/rancor/0.1.1) |
| regex | 1.13.1 | T | MIT OR Apache-2.0 | [source](https://crates.io/crates/regex/1.13.1) |
| regex-automata | 0.4.16 | T | MIT OR Apache-2.0 | [source](https://crates.io/crates/regex-automata/0.4.16) |
| regex-syntax | 0.8.11 | T | MIT OR Apache-2.0 | [source](https://crates.io/crates/regex-syntax/0.8.11) |
| rend | 0.5.3 | T | MIT | [source](https://crates.io/crates/rend/0.5.3) |
| rkyv | 0.8.18 | T | MIT | [source](https://crates.io/crates/rkyv/0.8.18) |
| rkyv_derive | 0.8.18 | H | MIT | [source](https://crates.io/crates/rkyv_derive/0.8.18) |
| rustversion | 1.0.22 | B | MIT OR Apache-2.0 | [source](https://crates.io/crates/rustversion/1.0.22) |
| ryu | 1.0.23 | T | Apache-2.0 OR BSL-1.0 | [source](https://crates.io/crates/ryu/1.0.23) |
| scopeguard | 1.2.0 | T | MIT OR Apache-2.0 | [source](https://crates.io/crates/scopeguard/1.2.0) |
| serde | 1.0.229 | T | MIT OR Apache-2.0 | [source](https://crates.io/crates/serde/1.0.229) |
| serde_core | 1.0.229 | T | MIT OR Apache-2.0 | [source](https://crates.io/crates/serde_core/1.0.229) |
| serde_derive | 1.0.229 | H | MIT OR Apache-2.0 | [source](https://crates.io/crates/serde_derive/1.0.229) |
| serde_json | 1.0.151 | T | MIT OR Apache-2.0 | [source](https://crates.io/crates/serde_json/1.0.151) |
| serde_yaml_ng | 0.10.0 | T | MIT | [source](https://crates.io/crates/serde_yaml_ng/0.10.0) |
| serde-wasm-bindgen | 0.6.5 | T | MIT | [source](https://crates.io/crates/serde-wasm-bindgen/0.6.5) |
| simdutf8 | 0.1.5 | T | MIT OR Apache-2.0 | [source](https://crates.io/crates/simdutf8/0.1.5) |
| slab | 0.4.12 | T | MIT | [source](https://crates.io/crates/slab/0.4.12) |
| smallvec | 1.15.1 | T | MIT OR Apache-2.0 | [source](https://crates.io/crates/smallvec/1.15.1) |
| stable_deref_trait | 1.2.1 | T | MIT OR Apache-2.0 | [source](https://crates.io/crates/stable_deref_trait/1.2.1) |
| strum | 0.28.0 | T | MIT | [source](https://crates.io/crates/strum/0.28.0) |
| strum_macros | 0.28.0 | H | MIT | [source](https://crates.io/crates/strum_macros/0.28.0) |
| syn | 2.0.117 | H | MIT OR Apache-2.0 | [source](https://crates.io/crates/syn/2.0.117) |
| syn | 3.0.2 | H | MIT OR Apache-2.0 | [source](https://crates.io/crates/syn/3.0.2) |
| synstructure | 0.13.2 | H | MIT | [source](https://crates.io/crates/synstructure/0.13.2) |
| thiserror | 2.0.20 | T | MIT OR Apache-2.0 | [source](https://crates.io/crates/thiserror/2.0.20) |
| thiserror-impl | 2.0.20 | H | MIT OR Apache-2.0 | [source](https://crates.io/crates/thiserror-impl/2.0.20) |
| tinystr | 0.8.3 | T | Unicode-3.0 | [source](https://crates.io/crates/tinystr/0.8.3) |
| tinyvec | 1.11.0 | T | Zlib OR Apache-2.0 OR MIT | [source](https://crates.io/crates/tinyvec/1.11.0) |
| tinyvec_macros | 0.1.1 | T | MIT OR Apache-2.0 OR Zlib | [source](https://crates.io/crates/tinyvec_macros/0.1.1) |
| unicode-blocks | 0.1.10 | T | MIT | [source](https://crates.io/crates/unicode-blocks/0.1.10) |
| unicode-ident | 1.0.24 | T | (MIT OR Apache-2.0) AND Unicode-3.0 | [source](https://crates.io/crates/unicode-ident/1.0.24) |
| unicode-normalization | 0.1.25 | T | MIT OR Apache-2.0 | [source](https://crates.io/crates/unicode-normalization/0.1.25) |
| unicode-segmentation | 1.13.3 | T | MIT OR Apache-2.0 | [source](https://crates.io/crates/unicode-segmentation/1.13.3) |
| unsafe-libyaml | 0.2.11 | T | MIT | [source](https://crates.io/crates/unsafe-libyaml/0.2.11) |
| url | 2.5.8 | T | MIT OR Apache-2.0 | [source](https://crates.io/crates/url/2.5.8) |
| utf8_iter | 1.0.4 | T | Apache-2.0 OR MIT | [source](https://crates.io/crates/utf8_iter/1.0.4) |
| wasm-bindgen | 0.2.126 | T | MIT OR Apache-2.0 | [source](https://crates.io/crates/wasm-bindgen/0.2.126) |
| wasm-bindgen-macro | 0.2.126 | H | MIT OR Apache-2.0 | [source](https://crates.io/crates/wasm-bindgen-macro/0.2.126) |
| wasm-bindgen-macro-support | 0.2.126 | H | MIT OR Apache-2.0 | [source](https://crates.io/crates/wasm-bindgen-macro-support/0.2.126) |
| wasm-bindgen-shared | 0.2.126 | T | MIT OR Apache-2.0 | [source](https://crates.io/crates/wasm-bindgen-shared/0.2.126) |
| writeable | 0.6.3 | T | Unicode-3.0 | [source](https://crates.io/crates/writeable/0.6.3) |
| yoke | 0.8.2 | T | Unicode-3.0 | [source](https://crates.io/crates/yoke/0.8.2) |
| yoke-derive | 0.8.2 | H | Unicode-3.0 | [source](https://crates.io/crates/yoke-derive/0.8.2) |
| zerofrom | 0.1.7 | T | Unicode-3.0 | [source](https://crates.io/crates/zerofrom/0.1.7) |
| zerofrom-derive | 0.1.7 | H | Unicode-3.0 | [source](https://crates.io/crates/zerofrom-derive/0.1.7) |
| zerotrie | 0.2.4 | T | Unicode-3.0 | [source](https://crates.io/crates/zerotrie/0.2.4) |
| zerovec | 0.11.6 | T | Unicode-3.0 | [source](https://crates.io/crates/zerovec/0.11.6) |
| zerovec-derive | 0.11.3 | H | Unicode-3.0 | [source](https://crates.io/crates/zerovec-derive/0.11.3) |
| zmij | 1.0.21 | T | MIT | [source](https://crates.io/crates/zmij/1.0.21) |

### Actionsのnpm警告22組/46固有ID

lockは監査時のmajor tagから取得。appのnpm依存ではない。全件の原advisory JSONをignored evidenceへ保存。到達性/同梱版の完全証明とは別で、未確認を悪用成功と書かない。

| パッケージ | 版 | 該当Action | advisory |
|---|---|---|---|
| undici | 6.27.0 | checkout, setup-dotnet | [GHSA-3wwx-pv8p-q78v](https://github.com/advisories/GHSA-3wwx-pv8p-q78v), [GHSA-8xcm-r25x-g524](https://github.com/advisories/GHSA-8xcm-r25x-g524), [GHSA-m8rv-5g2x-5cg5](https://github.com/advisories/GHSA-m8rv-5g2x-5cg5), [GHSA-r53p-7pc4-xj5r](https://github.com/advisories/GHSA-r53p-7pc4-xj5r), [GHSA-rfgv-xxqx-mfg5](https://github.com/advisories/GHSA-rfgv-xxqx-mfg5), [GHSA-v3r7-h72x-cjcm](https://github.com/advisories/GHSA-v3r7-h72x-cjcm) |
| brace-expansion | 5.0.6 | setup-dotnet | [GHSA-3jxr-9vmj-r5cp](https://github.com/advisories/GHSA-3jxr-9vmj-r5cp), [GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p), [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg), [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr), [GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7), [GHSA-rgw5-rvv9-x895](https://github.com/advisories/GHSA-rgw5-rvv9-x895) |
| fast-xml-parser | 5.9.3 | setup-dotnet | [GHSA-8r6m-32jq-jx6q](https://github.com/advisories/GHSA-8r6m-32jq-jx6q) |
| brace-expansion | 1.1.15 | setup-dotnet | [GHSA-3jxr-9vmj-r5cp](https://github.com/advisories/GHSA-3jxr-9vmj-r5cp), [GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p), [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg), [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr), [GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7), [GHSA-rgw5-rvv9-x895](https://github.com/advisories/GHSA-rgw5-rvv9-x895) |
| @octokit/request-error | 2.1.0 | deploy-pages | [GHSA-xx4v-prfh-6cgc](https://github.com/advisories/GHSA-xx4v-prfh-6cgc) |
| @octokit/plugin-paginate-rest | 2.21.3 | deploy-pages | [GHSA-h5c3-5r3r-rr8q](https://github.com/advisories/GHSA-h5c3-5r3r-rr8q) |
| @octokit/request | 5.6.3 | deploy-pages | [GHSA-rmvr-2pp2-xj38](https://github.com/advisories/GHSA-rmvr-2pp2-xj38) |
| undici | 5.28.2 | deploy-pages | [GHSA-2mjp-6q6p-2qxm](https://github.com/advisories/GHSA-2mjp-6q6p-2qxm), [GHSA-35p6-xmwp-9g52](https://github.com/advisories/GHSA-35p6-xmwp-9g52), [GHSA-3787-6prv-h9w3](https://github.com/advisories/GHSA-3787-6prv-h9w3), [GHSA-4992-7rv2-5pvq](https://github.com/advisories/GHSA-4992-7rv2-5pvq), [GHSA-8xcm-r25x-g524](https://github.com/advisories/GHSA-8xcm-r25x-g524), [GHSA-9qxr-qj54-h672](https://github.com/advisories/GHSA-9qxr-qj54-h672), [GHSA-c76h-2ccp-4975](https://github.com/advisories/GHSA-c76h-2ccp-4975), [GHSA-cxrh-j4jr-qwg3](https://github.com/advisories/GHSA-cxrh-j4jr-qwg3), [GHSA-g8m3-5g58-fq7m](https://github.com/advisories/GHSA-g8m3-5g58-fq7m), [GHSA-g9mf-h72j-4rw9](https://github.com/advisories/GHSA-g9mf-h72j-4rw9), [GHSA-m4v8-wqvr-p9f7](https://github.com/advisories/GHSA-m4v8-wqvr-p9f7), [GHSA-m8rv-5g2x-5cg5](https://github.com/advisories/GHSA-m8rv-5g2x-5cg5), [GHSA-p88m-4jfj-68fv](https://github.com/advisories/GHSA-p88m-4jfj-68fv), [GHSA-r53p-7pc4-xj5r](https://github.com/advisories/GHSA-r53p-7pc4-xj5r), [GHSA-v3r7-h72x-cjcm](https://github.com/advisories/GHSA-v3r7-h72x-cjcm), [GHSA-v9p9-hfj2-hcw8](https://github.com/advisories/GHSA-v9p9-hfj2-hcw8), [GHSA-vrm6-8vpv-qv8q](https://github.com/advisories/GHSA-vrm6-8vpv-qv8q), [GHSA-vxpw-j846-p89q](https://github.com/advisories/GHSA-vxpw-j846-p89q) |
| @fastify/busboy | 2.1.0 | deploy-pages | [GHSA-gxm5-99cw-xjw9](https://github.com/advisories/GHSA-gxm5-99cw-xjw9), [GHSA-x8mw-p69m-v3mx](https://github.com/advisories/GHSA-x8mw-p69m-v3mx) |
| @octokit/plugin-paginate-rest | 9.1.5 | deploy-pages | [GHSA-h5c3-5r3r-rr8q](https://github.com/advisories/GHSA-h5c3-5r3r-rr8q) |
| @octokit/request | 8.1.6 | deploy-pages | [GHSA-rmvr-2pp2-xj38](https://github.com/advisories/GHSA-rmvr-2pp2-xj38) |
| @octokit/request-error | 5.0.1 | deploy-pages | [GHSA-xx4v-prfh-6cgc](https://github.com/advisories/GHSA-xx4v-prfh-6cgc) |
| brace-expansion | 1.1.11 | deploy-pages | [GHSA-3jxr-9vmj-r5cp](https://github.com/advisories/GHSA-3jxr-9vmj-r5cp), [GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p), [GHSA-f886-m6hf-6m8v](https://github.com/advisories/GHSA-f886-m6hf-6m8v), [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg), [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr), [GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7), [GHSA-rgw5-rvv9-x895](https://github.com/advisories/GHSA-rgw5-rvv9-x895), [GHSA-v6h2-p8h4-qcjw](https://github.com/advisories/GHSA-v6h2-p8h4-qcjw) |
| form-data | 4.0.0 | deploy-pages | [GHSA-fjxv-7rqg-78g4](https://github.com/advisories/GHSA-fjxv-7rqg-78g4), [GHSA-hmw2-7cc7-3qxx](https://github.com/advisories/GHSA-hmw2-7cc7-3qxx) |
| lodash | 4.17.21 | deploy-pages | [GHSA-f23m-r3pf-42rh](https://github.com/advisories/GHSA-f23m-r3pf-42rh), [GHSA-r5fr-rjxr-66jc](https://github.com/advisories/GHSA-r5fr-rjxr-66jc), [GHSA-xxjr-mmjv-4gpg](https://github.com/advisories/GHSA-xxjr-mmjv-4gpg) |
| minimatch | 3.1.2 | deploy-pages | [GHSA-23c5-xmqv-rm74](https://github.com/advisories/GHSA-23c5-xmqv-rm74), [GHSA-3ppc-4f35-3m26](https://github.com/advisories/GHSA-3ppc-4f35-3m26), [GHSA-7r86-cg39-jmmj](https://github.com/advisories/GHSA-7r86-cg39-jmmj) |
| path-to-regexp | 6.2.1 | deploy-pages | [GHSA-9wv6-86v2-598j](https://github.com/advisories/GHSA-9wv6-86v2-598j) |
| brace-expansion | 2.0.1 | deploy-pages | [GHSA-3jxr-9vmj-r5cp](https://github.com/advisories/GHSA-3jxr-9vmj-r5cp), [GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p), [GHSA-f886-m6hf-6m8v](https://github.com/advisories/GHSA-f886-m6hf-6m8v), [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg), [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr), [GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7), [GHSA-rgw5-rvv9-x895](https://github.com/advisories/GHSA-rgw5-rvv9-x895), [GHSA-v6h2-p8h4-qcjw](https://github.com/advisories/GHSA-v6h2-p8h4-qcjw) |
| minimatch | 5.1.6 | deploy-pages | [GHSA-23c5-xmqv-rm74](https://github.com/advisories/GHSA-23c5-xmqv-rm74), [GHSA-3ppc-4f35-3m26](https://github.com/advisories/GHSA-3ppc-4f35-3m26), [GHSA-7r86-cg39-jmmj](https://github.com/advisories/GHSA-7r86-cg39-jmmj) |
| unzip-stream | 0.3.1 | deploy-pages | [GHSA-6jrj-vc65-c983](https://github.com/advisories/GHSA-6jrj-vc65-c983) |
| uuid | 8.3.2 | deploy-pages | [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) |
| yaml | 1.10.2 | deploy-pages | [GHSA-48c2-rrv3-qjmp](https://github.com/advisories/GHSA-48c2-rrv3-qjmp) |

### ローカル検証証拠

`artifacts/prepublication-audit/`のbuild-debug.log/build-release.log/publish.log/checks.log、publish-inventory.json、security-scan.json、git-history-scan.json、nuget-inventory.json、nuget-hash-check.json、nuget-vulnerabilities.json、independent-rust-notices.json、osv-batch.json、Actionsの原source/lock/dist/advisory、github-settings.json/additional-remote-checks.json、browser-furigana.pngに生結果を保存。これらは一時調査成果物でGit追加対象ではない。ネットワーク原典の取得に失敗したURLは別の原ソース/API/保存済み原ファイルで確認した場合と、Pages設定など未確認のままの項目を本文で分けている。
