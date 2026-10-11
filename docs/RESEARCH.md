# KanjiVariants調査（2026-10-12）

## 調査対象の固定

NuGet V3の[バージョン一覧](https://api.nuget.org/v3-flatcontainer/kanjivariants/index.json)で安定版は1.0.0、1.0.1、1.1.0、**1.2.0**を確認しました。今回の参照版は1.2.0です。[NuGet](https://www.nuget.org/packages/KanjiVariants/1.2.0)の実パッケージを復元し、README・XML APIコメント・LICENSE-NOTICES.md・nuspecを確認しています。

nuspecのrepository commitは`983fa8e6b98b7af0c503c686560b62c0778c9738`です。仕様照合用ソースはこのコミットに固定しました。本体リポジトリを変更せず、調査コピーはGit対象外のartifactsにだけ置き、アプリへの内部実装・データ表の転記はしていません。

- [固定README](https://github.com/Koichi-Kobayashi/KanjiVariants/blob/983fa8e6b98b7af0c503c686560b62c0778c9738/README.md)
- [固定公開API](https://github.com/Koichi-Kobayashi/KanjiVariants/tree/983fa8e6b98b7af0c503c686560b62c0778c9738/KanjiVariants)
- [固定テスト](https://github.com/Koichi-Kobayashi/KanjiVariants/tree/983fa8e6b98b7af0c503c686560b62c0778c9738/KanjiVariants.Tests)
- [本体ライセンス通知](https://github.com/Koichi-Kobayashi/KanjiVariants/blob/main/LICENSE-NOTICES.md) / [1.2.0同梱通知の保存](../THIRD-PARTY-NOTICES/KanjiVariants-1.2.0.md)

## 公開APIと適用範囲

| 機能 | 確認したAPIと仕様 | 今回の利用 |
| --- | --- | --- |
| 代替候補 | `Kanji.GetAlternatives(KanjiCharacter, CharacterSet, KanjiFallbackOptions)` → `IReadOnlyList<KanjiCharacter>`。MJ候補を対象集合で絞る。空一覧も返す。元と同じ候補もあり得る | 利用 |
| MJ一意縮退 | `Kanji.TryGetAlternative(..., out KanjiCharacter, ...)` → bool。候補の先頭を勝手に選ぶAPIではない | API調査のみ |
| 文字列置換 | `KanjiText.Replace(string, CharacterSet, ...)` → string。一意先が使える場合だけ置換し、対象集合内の入力は維持 | テスト例照合のみ。UIは置換しない |
| 漢字解析 | `KanjiCharacter.TryParse(string?, out KanjiCharacter)` → bool。補助漢字・登録済みIVS/SVSを解析。非漢字・複数単位・不正UTF-16・未登録VSは失敗 | 候補検索可否に利用 |
| 漢字集合 | `Kanji.IsSupported(...)` → bool。string版は解析不能でFormatException。漢字一文字を前提とする | 仕様例照合 |
| 文字列集合 | `KanjiText.IsSupported(string, CharacterSet)` → bool。ASCIIを許容し、非漢字も集合表に従う。空はtrue、不正UTF-16やVS付き表現はfalse | 診断との一致を照合 |
| 文字列診断 | `KanjiDiagnostics.AnalyzeText(string, CharacterSet, ...)` → `KanjiTextDiagnosticResult`。元入力、IsSupported、Items。項目はOriginal、Utf16Index、Utf16Length、IsSupported、Replacement、Reason | 主処理 |
| 単漢字診断 | `KanjiDiagnostics.Analyze(string / KanjiCharacter)` → `KanjiDiagnosticResult`。集合・常用・教育・人名用・MJ情報などを集約 | 今回未使用 |
| 常用漢字 | `JoyoKanji.IsJoyo`、`Get`、`GetReadings`など。本表字のみで旧字体・VSを自動縮退しない | 調査のみ |
| 教育漢字 | `EducationKanji.GetGrade` → `KanjiGrade?`、`IsEducationKanji`、`GetByGrade`。配当漢字そのものを参照 | 調査のみ |
| 人名用漢字 | `JinmeiyoKanji.IsJinmeiyoKanji`、`IsNameUsableKanji`、`GetAll`。後者は常用または人名用の漢字であり、かなを含む名前全体の適法性ではない | 調査のみ |
| 常用・学年文章診断 | `JoyoKanjiDiagnostics.AnalyzeText`、`EducationKanjiDiagnostics.AnalyzeText`。非漢字と未習／表外漢字を区別し、UTF-16位置を保持 | 調査のみ |
| MJ詳細 | `MjCharacter.Find` → `IReadOnlyList<MjCharacterMatch>`、`GetByMjGlyphName` → `MjCharacterEntry?`。1 Unicode表現に複数MJ対応があり得る | 調査のみ |

API名・戻り値は実パッケージとソースで確認しました。候補と一意なReplacementは別物なので、UIは候補一覧を直接取得しています。

## JIS・Unicodeの規則

`CharacterSet.JisX0208`、`JisX0212`、`JisX0213Plane1`、`JisX0213Plane2`、`JisX0213`を使用します。0208は第1・第2水準等を含む集合、0212は独立した補助集合、0213全体は第1面または第2面です。第1水準と第1面を混同しません。JIS X 0213所属はMJ一覧表の実装UCS・X0213情報に基づく本体の表を使用します。

文字列APIはASCIIをすべて許容します。従って厳密なJIS符号化検証ではありません。JIS X 0201半角カナやCP932拡張全体の検査、バイト列のエンコード・デコードも行いません。

論理単位は「1 Unicodeスカラーと直後のVS」で、書記素クラスタではありません。補助文字は分割せず、基底文字＋VSは登録有無によらず同じ項目です。連続VSは本体readerの規則を維持します。CR/LFは別、不正UTF-16は1符号単位ずつInvalidUtf16として保持します。Unicode正規化は加えていません。

登録済みIVS/SVS自体は全5集合で対象外。基底文字へのフォールバックは明示的な`AllowVariationSelectorFallback`だけで有効です。今回は常に`None`。未登録VSは候補検索せず、その理由を表示します。

## WebAssembly互換性・初期化

パッケージはnet6.0でNuGet追加依存なし。net10.0アプリのrestore/buildと、Releaseの静的配信でのブラウザ実行が成功しました。今回使うAPI経路はRune・配列・二分探索・文字列を中心とし、ファイル、ネットワーク、OS依存API、P/Invoke、動的コード生成を使用していません。調査した本体ソースでもこれらの呼び出しは見つかりませんでした。Excelや外部JSONを実行時に読み込む構成ではありません。

主要な`GeneratedData`のstatic readonly配列は初回参照時に初期化され、以後再利用されます。固定版の11配列の要素領域合計は**1,793,110 bytes**（配列ヘッダー・アラインメント等を除く）。JIS X 0212の所属bit表も別途存在します。デスクトップの初回「髙橋」診断で約1.8 MBの管理ヒープ増分を観測しましたが、ブラウザの全メモリ使用量ではありません。

MJ詳細は別の遅延初期化クラスで一覧を解析し、名前・Unicode検索の辞書を構築します。今回`MjCharacter.Find`や単漢字`Analyze`を使わず、この追加初期化を要求していません。将来詳細表示を追加するときには別途計測が必要です。

現経路に反射でAPIを探索する処理はありません。MJ詳細には`Enum.Parse<MjKanjiPolicy>`などのメタデータ使用があるため、本体全機能の反射依存なしとは断定しません。

Releaseの既定トリミングは成功し、ILLink警告なし。KanjiVariantsの配信Webcilは元DLLに近い約6.17 MBで、未利用データが十分削除されたとは判断できません。IsTrimmable/AOT宣言を本体に追加していません。`wasm-tools`未導入でランタイム再リンク最適化の案内が出ますがpublishは成功しています。AOTビルド・全APIのトリミング安全性は未検証です。

## データとライセンス

固定READMEのデータ版はMJ一覧Ver.006.02、MJ縮退マップVer.1.2.0、IVD 2026-08-03、Standardized Variants/Unihan 18.0.0。0212はICUの固定コミット`61607c27732906d36c5bd4d23ecc092f89f53a2b`の対応表です。

プログラムコードMITと、IPA CC BY-SA 2.1 JP、Unicode、ICU、文部科学省・文化庁の条件を区別し、同梱通知全文をWebにも配信します。Python由来の0208対応表について、生成時のPythonディストリビューションの版・通知は同梱通知だけでは確定しません。必要な追加通知は本体側へ確認する項目です。法的な適用範囲を一律MITと断定していません。

## 次の検証

この調査は初期構築時の記録です。その後追加した文章一括変換のAPI仕様・UI・検証範囲は[CONVERSION.md](CONVERSION.md)を参照してください。

実Pages配信での圧縮・Content-Type・初回ロード、iOS Safari等でのメモリ、日本語IME操作、スクリーンリーダー、AOTを確認してください。詳細な実行記録は[VALIDATION.md](VALIDATION.md)にまとめています。
