# Playgroundのライセンスと外部データ

Playground独自のプログラムコードは [MIT License](LICENSE)（Copyright (c) 2026 Koichi Kobayashi）です。この指定は依存ライブラリや外部データには適用しません。

## KanjiVariants 1.2.0

NuGetパッケージを改変せず利用しています。[パッケージ同梱通知の全文](THIRD-PARTY-NOTICES/KanjiVariants-1.2.0.md)を保存しています。[本体の通知](https://github.com/Koichi-Kobayashi/KanjiVariants/blob/main/LICENSE-NOTICES.md)も参照してください。

| 対象 | 提供元・適用条件 |
| --- | --- |
| 独自プログラムコード | Koichi Kobayashi / MIT（外部データ由来の生成表を除く） |
| MJ文字情報一覧表・MJ縮退マップ | IPA / [CC BY-SA 2.1 JP](https://creativecommons.org/licenses/by-sa/2.1/jp/) |
| IVD・Standardized Variants・Unihan | Unicode, Inc. / Unicode利用条件・Unicode License V3 |
| JIS X 0212対応表 | Unicode ICU / Unicode・ICU通知（IBMほかの著作権を含む） |
| JIS X 0208対応表 | Python euc_jpデコーダーから生成。使用されたPythonのライセンス・通知も要確認 |
| 常用漢字・音訓・送り仮名 | 文化庁資料を本体側で加工 / 文部科学省ウェブサイト利用規約 |
| 教育漢字・学校段階別音訓 | 文部科学省資料を本体側で加工 / 文部科学省ウェブサイト利用規約 |

MJデータは本体で検索表へ加工されています。Playgroundで追加のデータ抽出・改変はしていません。再配布されるMJ由来データの表示・継承条件はCC BY-SA 2.1 JPに従います。Playground全体のコードが一律に同ライセンスになるとは断定しません。

Unicode・ICUの著作権・許諾本文は保存したパッケージ通知に収録しています。Python対応表の生成に使われたディストリビューションの具体的な版と通知はパッケージの通知だけでは確定できません。追加の再配布条件が必要かは本体側への確認事項として残します。

## .NET / Blazor

Microsoft.AspNetCore.Components.WebAssemblyおよび.NETランタイムを配信します。MicrosoftのMITライセンスと第三者通知を参照してください。

配信版10.0.12のライセンス・第三者通知の全文は`THIRD-PARTY-NOTICES/Blazor-10.0.12-*.txt`と`DotNet-10.0.12-*.txt`に保存しています。パッケージを更新するときは通知の版も更新してください。

- [ASP.NET Core LICENSE](https://github.com/dotnet/aspnetcore/blob/main/LICENSE.txt)
- [ASP.NET Core第三者通知](https://github.com/dotnet/aspnetcore/blob/main/THIRD-PARTY-NOTICES.txt)
- [.NET Runtime LICENSE](https://github.com/dotnet/runtime/blob/main/LICENSE.TXT)
- [.NET Runtime第三者通知](https://github.com/dotnet/runtime/blob/main/THIRD-PARTY-NOTICES.TXT)

Webサイトの`licenses.html`からも、これらの通知とデータ出典へアクセスできます。
