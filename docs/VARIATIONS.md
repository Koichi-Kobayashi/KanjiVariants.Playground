# IVS/SVS入力例・診断候補の改善

KanjiVariants 1.2.0の公開APIと、[固定コミットの本体テスト](https://github.com/Koichi-Kobayashi/KanjiVariants/blob/983fa8e6b98b7af0c503c686560b62c0778c9738/KanjiVariants.Tests/KanjiVariantsTests.cs)に基づいて実装。本体・パッケージ・ライセンス通知・Pagesワークフローは変更していません。

## 入力例

`VariationExamples.Ivs`はU+8FBB U+E0100、`Svs`はU+4E0D U+FE00です。両方とも登録済みで、JIS X 0208ではフォールバックOFFで元の表現、ONで辻／不になります。変換画面のボタンは入力と対象集合だけを設定し、ON/OFF設定は維持します。入力例の設定だけで変換・コピーは実行しません。

## 診断の規則

元の文字列の`AnalyzeText(None)`と適合判定は維持します。登録済み表現は`KanjiCharacter.TryParse`と`HasVariationSelector`で確認し、その場合だけ候補検索に`AllowVariationSelectorFallback`を指定します。

`GetAlternatives(None)`に含まれるものはMJ縮退マップ由来、許可時だけ追加されるものは基底文字フォールバック由来です。対象集合への所属・登録条件はライブラリが検証し、候補は重複なく表示します。MJと基底文字が同じ候補ならMJとして表示します。元のMJ一覧を保持した`Alternatives`と、表示用の追加情報付き`Candidates`を分け、既存の仕様照合をそのまま維持しています。

`TryGetAlternative`が選ぶ候補を先頭に示します。これは任意の候補の先頭を選ぶ処理ではありません。選択理由は許可条件の`AnalyzeText`から取得し、候補の由来とは区別します。例えば亟 + U+E0102ではMJ一意縮退の丞が優先されます。欄 + U+FE00では欄はMJ候補の一覧にも含まれますが、許可時の実際の選択理由は基底文字フォールバックです。この場合も字形情報消失の注意を表示します。

診断は入力を変更せず、候補のコピーだけを行います。元の表現・候補それぞれのコードポイント、元の適合性、候補の種類、許可時の変換理由を同じテーブルで表示します。未登録VS、登録済みでも候補なし、候補検索対象外を区別します。VSを独自に削除・分割する処理はありません。

## 配置変更

診断の集合説明をaction-rowの外へ移しました。共通集合選択コンポーネントの説明表示を診断でのみOFFにし、説明とaria-describedbyのリンクは維持します。既存のPC横並び・スマートフォン縦並びの構成を維持します。

## 検証

2026年10月12日、SDK 10.0.401。

- 既存1,117件に430件追加、合計1,547件がDebug・Releaseで成功。
- 正確な例のシーケンス・登録確認、全5集合でMJ／基底文字候補の公開API一致、選択優先順位、実際の選択理由、重複排除、対象集合外・未登録VSの除外、コピー用文字列、入力と判定の保持を照合。
- Debug・Releaseビルド：警告0、エラー0。
- Release publish：成功、既定トリミングでILLink警告なし。wasm-toolsの追加最適化案内あり。AOTは未実施。
- Pages準備・検証：base、.nojekyll、静的参照12件、通知本文一致に成功。
- Release公開物をローカルのPagesサブパスで実行。IVS/SVSボタンの入力値をコードポイントまで照合し、OFF/ONの結果を確認。
- PC幅1280pxで診断のプルダウンとボタンの下端の差0pxを確認。

- 元のIVS/SVS入力5表現が5行として表示され、元の入力を変更しないことを確認。亟のMJ優先、欄の候補由来と選択理由の区別、フォールバックによる字形情報消失の注意を確認。
- JIS X 0212の辻IVSは候補なし、髙 + U+FE0Fは未登録として候補なしを表示。対象集合外の基底文字候補を追加しないことを確認。
- 候補「辻」「不」「丞」「欄」のコピーを実行し、成功表示と検証ブラウザのクリップボード読み戻しの完全一致を確認。改行を含む変換結果「高橋吉野\n資料を送ります。」の全文コピーも一致。前回のCONVERSION.mdに記録した読み戻しの不一致は、今回の検証では再現しなかった。実Chrome/Edge・OS間の貼り付けは未検証。
- PCのダーク表示、390px幅のライト表示、モバイル縦並びと横はみ出しなしを確認。ブラウザの警告・エラーログなし。

スクリーンショット・公開物はGit対象外のartifactsに保存。実端末のIME・スクリーンリーダー・AOTは前回に引き続き未検証です。Gitコミット・Push・デプロイは行いません。

主な変更：ConversionPanel、DiagnosticPanel、DiagnosticResults、CharacterSetSelect、DiagnosticService、CSS、README。追加：VariationExamples、VariationChecksとこの文書。検証プロジェクトに入力例ファイルをリンクし、Programから追加検証を実行します。
