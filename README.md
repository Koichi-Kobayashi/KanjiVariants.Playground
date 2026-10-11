# KanjiVariants.Playground
日本語の漢字の異体字変換・文字集合判定・漢字診断をブラウザ上で試せるWebアプリケーション。KanjiVariantsを使用しています。

「髙橋」や「𠮷野」が指定した文字集合で使えるか、代わりに使える候補があるかを確認する日本語のWebデモです。診断はブラウザ内で完結し、入力を外部サーバーに送信しません。

## 今回利用できる機能

- JIS X 0208、JIS X 0212、JIS X 0213第1面・第2面・全体の文字列判定
- 文字ごとの判定理由とMJ縮退マップに基づく代替候補の表示・コピー
- 補助文字、IVS・SVS、未登録Variation Sequence、不正UTF-16の安全な診断
- ライト・ダーク・システムテーマ、日本語UI、PC・スマートフォン向けレイアウト

入力は自動変換しません。候補をコピーし、利用者が選択して利用します。候補には元と同じ文字が含まれる場合もあります。

**JIS集合の判定はShift-JIS・CP932などへのエンコード可否とは異なります。** KanjiVariantsの文字列APIの規則ではASCII（制御文字を含む）は各集合で使用可能です。JIS X 0212はJIS X 0208を含まない独立した集合、第2面は第1面を含まない集合です。IVS・SVS付き表現はそのままでは対象外で、VSを暗黙に削除しません。

## 使用技術と構成

- .NET 10 / C# / Blazor WebAssembly Standalone
- [KanjiVariants](https://github.com/Koichi-Kobayashi/KanjiVariants) [NuGet 1.2.0](https://www.nuget.org/packages/KanjiVariants/1.2.0)（net6.0、追加パッケージ依存なし）
- GitHub Pages / GitHub公式Pages Actions

ASP.NET Coreのサーバープロジェクト、分析SDK、外部フォント、外部API通信はありません。アプリ・.NETランタイム・文字データを初回に取得し、C#の診断処理をブラウザ内部で実行します。

```text
src/KanjiVariants.Playground/
  Pages/Home.razor                  入力・実行・テーマ
  Components/DiagnosticResults.razor 結果・コピー
  Services/DiagnosticService.cs     公開API呼び出しと結果モデル
  wwwroot/                         CSS・最小JS・静的ライセンス画面
tests/KanjiVariants.Playground.Checks/ 仕様例とUnicode境界の照合
scripts/                           Pages準備・検証・ローカル静的配信
docs/RESEARCH.md                    ライブラリ調査と互換性
docs/VALIDATION.md                  実測・確認範囲・未検証事項
THIRD-PARTY-NOTICES/                該当版の通知全文
```

## ローカル起動

[.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)の10.0.401を用意してください。`global.json`とCIで同じSDKに固定し、暗黙のランタイムパッケージとlock fileのずれを防ぎます。SDKを更新するときは依存関係と通知も更新してください。通常のビルド・起動には`wasm-tools`は必須ではありません。

```powershell
dotnet restore --locked-mode
dotnet build
dotnet run --project src/KanjiVariants.Playground --launch-profile http
```

表示されたURL（標準では`http://localhost:5175`）を開きます。初期入力は「髙橋」です。入力はUTF-16で2,000単位まで。補助文字は2単位、VSも追加の単位数を使います。長すぎる入力は切り捨てずエラーにします。

### Releaseビルドのローカル確認

```powershell
dotnet run --project src/KanjiVariants.Playground -c Release --launch-profile release-http
```

`release-http`はHTTP・Production環境で起動し、Blazorブラウザデバッガーの`inspectUri`を設定しません。Visual Studioでは構成を**Release**、起動プロファイルを**release-http**にして、**Ctrl+F5（デバッグなしで開始）**で確認できます。プロファイルの選択だけではビルド構成はReleaseに変わりません。

従来の`http`・`https`は開発・デバッグ用で、Release構成でも起動環境はDevelopmentです。Visual Studioの「例外がスローされました」という出力は、捕捉済み例外にも表示されるため、それだけでアプリの異常終了とは判断できません。画面が起動しない・診断できない場合は、例外メッセージとスタックトレース、ブラウザコンソールを確認してください。

仕様の照合：

```powershell
dotnet run --project tests/KanjiVariants.Playground.Checks
```

追加のテストパッケージは使用せず、本体README・固定コミットのテスト例と公開APIを照合します。これは本体の全テストを実行するものではありません。

## GitHub Pagesへの公開

想定URL：[https://koichi-kobayashi.github.io/KanjiVariants.Playground/](https://koichi-kobayashi.github.io/KanjiVariants.Playground/)

1. GitHubリポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** にします。
2. **Settings → Actions → General** でActionsと使用するGitHub公式Actionsが許可されていることを確認します。
3. `github-pages` Environmentの保護ルールに応じて、`main`からのデプロイを許可し、必要なら承認します。
4. 利用者が変更をレビューしてコミット・Pushした後、`main`へのPushまたは手動実行で`pages.yml`が動きます。
5. Actionsのbuild/deploy成功と上記URLの表示を確認します。

初期構築・ローカル検証ではGitHubの設定変更やデプロイは行っていません。ワークフローを置くだけではPagesのSource設定は完了しません。

ワークフローはlock fileで復元、Releaseビルド・仕様照合、publish、サブパス設定、静的参照検証、`upload-pages-artifact`、`deploy-pages`の順で動きます。deploy jobだけに`pages: write`と`id-token: write`を与えています。

`wwwroot/index.html`の開発用baseは`/`です。公開物だけを`Prepare-Pages.ps1`で`/KanjiVariants.Playground/`へ変更します。.NET 10のフィンガープリント付き起動JS・import mapを維持し、CSS・JS・通知は相対パスで参照します。`.nojekyll`も生成し、隠しファイルを含めてartifactへ渡します。

画面はルートのみで、ライセンスは実ファイル`licenses.html`です。この2つは再読み込みできます。深いSPA経路は作っていないため、404をindexへ転送する回避策は不要です。将来ルートを増やす場合はPagesの404対応も設計してください。

公開前のサブパス検証（PowerShell 7、静的配信だけ追加でNode.jsを使用）：

```powershell
dotnet publish src/KanjiVariants.Playground -c Release -o artifacts/publish
./scripts/Prepare-Pages.ps1
./scripts/Verify-Pages.ps1
node scripts/Serve-Pages.mjs
```

`http://localhost:5175/KanjiVariants.Playground/`で確認できます。開発サーバーとは同時に起動しないでください。静的検証サーバーは127.0.0.1だけで待ち受けます。配信サイズを測るときは、以前の公開物の残りがない新しい出力ディレクトリを使用してください。

## ライセンスと出典

独自コードは[MIT License](LICENSE)。依存関係と外部データは[LICENSE-NOTICES.md](LICENSE-NOTICES.md)を参照してください。Webサイトのフッターからも通知全文にアクセスできます。

IPAのMJデータはCC BY-SA 2.1 JP、UnicodeデータはUnicodeの条件、ICU対応表はUnicode・ICU通知、文部科学省・文化庁資料は文部科学省ウェブサイト利用規約に従います。これらを一律にMITとして扱いません。Python由来のJIS X 0208対応表について、生成時のディストリビューションの具体的な通知は確認事項として記録しています。

パッケージ更新時はlock file、保存した通知、Webの通知リンク、版表示、仕様照合を同時に見直してください。

## 今後の追加予定

教育漢字の学年別診断、常用漢字診断、人名用漢字判定、文章の詳細診断、MJ文字情報、コードポイント表示、TXT・CSVファイル診断、結果のダウンロードを予定しています。これらは今回のUIには実装していません。

まずは実際のPages配信と主要モバイルブラウザでの確認を行い、次に既存の診断サービスと結果コンポーネントを拡張する形で学年・常用漢字の診断を追加できます。AOTと配信最適化は別途計測して判断します。
