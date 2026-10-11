# 文章一括変換の実装・検証

この文書は一括変換追加時の記録です。その後のIVS/SVS入力例・診断候補改善と合計1,547件の検証は[VARIATIONS.md](VARIATIONS.md)を参照してください。

## 調査したAPI

使用パッケージは既存のKanjiVariants 1.2.0のままです。NuGetのXMLドキュメントと、パッケージに記録されたコミット[`983fa8e6b98b7af0c503c686560b62c0778c9738`](https://github.com/Koichi-Kobayashi/KanjiVariants/tree/983fa8e6b98b7af0c503c686560b62c0778c9738)の公開API・テストを照合しました。本体は変更していません。

| API | 今回確認した仕様・使い方 |
| --- | --- |
| `KanjiText.Replace(string, CharacterSet, KanjiFallbackOptions = None)` | 文章全体を変換してstringを返す。対象文字の維持、MJの一意な縮退先、登録済みVSの許可時フォールバック、未解決文字の保持は本体に任せる。正規化や独自候補選択を追加しない。 |
| `KanjiText.IsSupported(string, CharacterSet)` | 変換後の文章全体を必ず判定する。空文字列・ASCIIは使用可能。JIS収録規則の判定で、エンコーディング可否の判定ではない。 |
| `Kanji.GetAlternatives` | 対象集合の候補一覧。文字列およびKanjiCharacterのオーバーロードがあり、戻り値は`IReadOnlyList<KanjiCharacter>`。診断画面で利用。候補一覧から自動で先頭を選ぶ処理はしない。 |
| `Kanji.TryGetAlternative` | 一意に選べる場合のboolとout KanjiCharacter。MJ縮退先が集合外の場合、別の候補があってもその候補を勝手に選ばない。既存仕様の照合に使用。 |
| `CharacterSet` | 0208、0212、0213第1面、第2面、全体の5集合。0212は0208との和集合ではなく、第2面も第1面を含まない。 |
| `KanjiFallbackOptions` | 初期値None、チェック時のみAllowVariationSelectorFallback。MJの一意な縮退先は優先され、OFFでもMJ縮退は実行される。未登録VSは基底文字にフォールバックしない。 |
| `KanjiDiagnostics.AnalyzeText` | 同じ入力・集合・オプションに対するItemsのOriginal、Replacement、Reasonを使う。UTF-16インデックス・長さは本体が返す。理由を推測しない。 |

## 設計

`ConversionService`がReplace、変換後IsSupported、変更集計、変換後の未解決文字の診断を担当します。変更集計は診断結果の実際のReplacementから、元の文字・置換先・理由をキーに集約します。サロゲートやVSをcharで比較する差分処理はありません。変更数はライブラリの論理単位の出現数です。出力の対象外文字は出力を再診断し、元の入力位置を流用しません。

コードポイント表示だけは`EnumerateRunes`を使います。これは文字変換・論理単位の分割には使用しません。不正UTF-16についてはU+FFFDという別の文字のコードポイントを表示せず、不正であることを表示します。変換結果そのものは本体が返した文字列を維持します。

画面は2つのコンポーネントを保持し、非表示にするだけで入力・結果を維持します。集合選択とクリップボードサービスは共通化し、既存診断は引き続きフォールバックNoneで実行します。結果は実行時のスナップショットで、入力や設定を変えた場合に前回の結果であることを表示します。

長文変換の上限は100,000 UTF-16単位です。診断の既存上限2,000単位は維持します。入力の切り詰めはしません。長い詳細一覧は50種類ずつ追加表示します。処理はブラウザのUIスレッドで同期実行するため、長文処理中の操作は待たされる場合があります。Web WorkerやAOTは今回追加していません。

## 仕様照合の根拠

- [KanjiVariantsTests.cs](https://github.com/Koichi-Kobayashi/KanjiVariants/blob/983fa8e6b98b7af0c503c686560b62c0778c9738/KanjiVariants.Tests/KanjiVariantsTests.cs)：髙→高、𠮷→吉、㐺の0213面別の挙動、複数候補・登録済みVS・MJ優先。
- [KanjiTextDiagnosticsTests.cs](https://github.com/Koichi-Kobayashi/KanjiVariants/blob/983fa8e6b98b7af0c503c686560b62c0778c9738/KanjiVariants.Tests/KanjiTextDiagnosticsTests.cs)：理由とReplacement、UTF-16境界、MJ縮退とVSフォールバックの区別。
- [JisX0212Tests.cs](https://github.com/Koichi-Kobayashi/KanjiVariants/blob/983fa8e6b98b7af0c503c686560b62c0778c9738/KanjiVariants.Tests/JisX0212Tests.cs)：独立した集合、丂丄Ä、登録済みIVS/SVSの許可時の置換。
- [VariationSelectorBoundaryTests.cs](https://github.com/Koichi-Kobayashi/KanjiVariants/blob/983fa8e6b98b7af0c503c686560b62c0778c9738/KanjiVariants.Tests/VariationSelectorBoundaryTests.cs)：余分なVS、不正サロゲートの保持。

コンソール検証は既存364件に753件を追加し、合計1,117件です。固定した正式な例に加え、5集合×2オプション×11入力のReplace/IsSupported/診断結果との一致、変更・残存回数、100,000単位の上限・補助文字境界、既存診断の回帰を検証します。追加NuGetパッケージはありません。

## ローカル検証結果

2026年10月12日、SDK 10.0.401、既存lock fileで検証。

- `dotnet restore --locked-mode`：成功。
- `dotnet build --no-restore`、`dotnet build -c Release --no-restore`：成功、警告0・エラー0。
- `dotnet test -c Release --no-build --no-restore`：終了コード0。このコンソール構成ではテスト検出は行わない。
- `dotnet run --project tests/KanjiVariants.Playground.Checks`と同Release：1,117件成功。こちらが実際の仕様検証。

- `dotnet publish src/KanjiVariants.Playground -c Release --no-restore`：成功。既定トリミング、ILLink警告なし。wasm-tools未導入の追加最適化案内あり、AOTは未実施。
- `Prepare-Pages.ps1` / `Verify-Pages.ps1`：base、.nojekyll、12個の静的参照、KanjiVariants通知全文一致の検証に成功。
- Release公開物を`http://localhost:5175/KanjiVariants.Playground/`で一時静的配信し、Codex内ブラウザで実行。入力・全文変換・比較欄・変更理由・コードポイント・回数・残った対象外文字の表示を確認。
- 5集合の正式な例、IVS/SVSのON/OFF、未登録VS、絵文字、複数行、反復入力、空入力、変換と診断の独立状態、古い結果の注意表示を確認。
- 100,000 UTF-16単位（末尾に補助文字を含む）の変換で切り詰めなし、99,999箇所の変換を確認。変換・検証・集計476.0 ms。100,001単位はエラー表示。60種類の対象外文字を50種類→60種類に追加表示できた。
- 既存の髙橋診断と丂丄Äの0212診断、候補コピーボタン、全文コピーボタンの成功フィードバックを確認。検証ブラウザではnavigator.clipboardの成功後も操作APIの読み戻し・貼り付けに以前の値が返った。実OSクリップボードの全文一致は未確認。標準のwriteText呼び出しを維持し、実Chrome/Edge等での貼り付けをコミット前の確認項目とする。
- PC（1280×900）のライト表示とスマートフォン幅（390×844）のダーク表示、比較欄の2列→1列、横はみ出しなし、Tabで機能切り替えボタンへ移動・Enterで切り替えを確認。
- サブパスのルート再読み込み、ライセンスページと通知リンク、起動中のブラウザエラーログなしを確認。実際の日本語IME、実モバイル端末、スクリーンリーダーは未検証。

初回のページ遷移で`#app`に記録されたWebAssembly起動時刻は1,062.4 ms、最初の例文変換は9.6 ms。キャッシュや端末の影響を含むローカル観測で、公開サイトのコールドロード性能を示すものではない。

配信物のフレームワーク合計は未圧縮15,245,379 bytes（全ICUバリアントを含み、初回転送量ではない）、Brotli合計3,405,848 bytes（配信ホストの圧縮ネゴシエーション次第）。KanjiVariantsのWebcilは6,166,297 bytes、Brotli 693,161 bytes。今回の一時静的サーバーは非圧縮配信で、実Pagesの圧縮・初回転送量は未計測。

## ライセンス・公開

パッケージ・データの更新や内部実装のコピーはなく、既存LICENSE、LICENSE-NOTICES、通知全文を維持します。独自コードのMITと外部データの条件は既存の通知どおり区別します。ワークフロー・base設定・配信方式は変更せず、既存のコンソール検証に追加テストが含まれます。今回コミット・Push・Actionsの公開処理・GitHub設定変更は実行しません。

検証用の一時サーバーは停止し、5175番ポートに待ち受けがないことを確認しました。スクリーンショット・公開物はGit対象外のartifacts内に保存しています。

## 作成・変更したファイル

| ファイル | 内容 |
| --- | --- |
| `src/KanjiVariants.Playground/Services/ConversionService.cs`（新規） | 一括変換、適合判定、変更・残存文字の集計モデル |
| `src/KanjiVariants.Playground/Services/ClipboardService.cs`（新規） | 共通コピー処理 |
| `src/KanjiVariants.Playground/Services/CharacterDisplay.cs`（新規） | 表示専用コードポイント・理由 |
| `src/KanjiVariants.Playground/Components/ConversionPanel.razor`（新規） | 文章入力・集合選択・オプション・実行 |
| `src/KanjiVariants.Playground/Components/ConversionResults.razor`（新規） | 全文比較・コピー・集計一覧・段階表示 |
| `src/KanjiVariants.Playground/Components/DiagnosticPanel.razor`（新規） | 既存診断画面の独立状態 |
| `src/KanjiVariants.Playground/Components/CharacterSetSelect.razor`（新規） | 集合選択UIの共通化 |
| `src/KanjiVariants.Playground/Components/DiagnosticResults.razor` | 共通コピーサービスへの移行 |
| `src/KanjiVariants.Playground/Pages/Home.razor` | 変換を初期画面にした機能切り替え・説明 |
| `src/KanjiVariants.Playground/Program.cs` | サービス登録 |
| `src/KanjiVariants.Playground/wwwroot/css/app.css` | 既存配色を使う追加UI・モバイル配置 |
| `src/KanjiVariants.Playground/wwwroot/index.html` | description・起動文言 |
| `tests/KanjiVariants.Playground.Checks/ConversionChecks.cs`（新規） | 一括変換の仕様・集計・境界・回帰検証 |
| `tests/KanjiVariants.Playground.Checks/Program.cs` | 追加検証の実行 |
| `tests/KanjiVariants.Playground.Checks/KanjiVariants.Playground.Checks.csproj` | 変換・表示サービスのリンク |
| `README.md` | 利用方法・規則・例・公開状況 |
| `docs/CONVERSION.md`（新規） | 今回の調査・実装・検証記録 |
| `docs/RESEARCH.md`、`docs/VALIDATION.md` | 初期記録と今回の記録を区別するリンク |

## コミット前の確認

実Chrome/Edge等で全文コピー→貼り付けの一致と日本語IME入力を確認してください。主要モバイル端末・スクリーンリーダー・AOT・実Pages配信の初回転送量は今後の検証対象です。Git対象外のartifactsを追加する必要はありません。Git差分に本体変更・パッケージ変更・ライセンス通知削除・公開設定変更がないことを確認済みです。
