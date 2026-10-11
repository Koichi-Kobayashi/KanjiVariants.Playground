using System.Diagnostics;

namespace KanjiVariants.Playground.Services;

public sealed record CharacterSetOption(CharacterSet Value, string Label, string Description);
public sealed record DiagnosticRow(KanjiTextDiagnosticItem Item, bool CanSearchAlternatives, IReadOnlyList<string> Alternatives);
public sealed record PlaygroundResult(string Text, CharacterSetOption Target, bool IsSupported,
    IReadOnlyList<DiagnosticRow> Rows, double ElapsedMilliseconds);

public sealed class DiagnosticService
{
    // 途中で文字を切らず、入力全体を受け付けるか拒否する。
    public const int MaxUtf16Length = 2000;
    public static IReadOnlyList<CharacterSetOption> Targets { get; } = Array.AsReadOnly(new[]
    {
        new CharacterSetOption(CharacterSet.JisX0208, "JIS X 0208", "第1・第2水準漢字などを含む文字集合です。"),
        new CharacterSetOption(CharacterSet.JisX0212, "JIS X 0212", "独立した補助文字集合です。JIS X 0208は含めません。"),
        new CharacterSetOption(CharacterSet.JisX0213Plane1, "JIS X 0213 第1面", "JIS X 0208由来の文字に追加文字を含む第1面です。"),
        new CharacterSetOption(CharacterSet.JisX0213Plane2, "JIS X 0213 第2面", "第2面だけが対象です。第1面の文字は含めません。"),
        new CharacterSetOption(CharacterSet.JisX0213, "JIS X 0213 全体", "第1面または第2面に含まれる文字が対象です。")
    });

    public PlaygroundResult Analyze(string text, CharacterSet target)
    {
        ArgumentNullException.ThrowIfNull(text);
        if (text.Length > MaxUtf16Length)
            throw new ArgumentException($"入力はUTF-16で{MaxUtf16Length:N0}単位以内にしてください。補助文字は2単位分です。");
        var option = Targets.Single(x => x.Value == target);
        var watch = Stopwatch.StartNew();
        var diagnosis = KanjiDiagnostics.AnalyzeText(text, target, KanjiFallbackOptions.None);
        var rows = diagnosis.Items.Select(item =>
        {
            var parsed = KanjiCharacter.TryParse(item.Original, out var character);
            IReadOnlyList<string> alternatives = parsed
                ? Kanji.GetAlternatives(character, target, KanjiFallbackOptions.None).Select(x => x.ToString()).ToArray()
                : Array.Empty<string>();
            return new DiagnosticRow(item, parsed, alternatives);
        }).ToArray();
        watch.Stop();
        return new(text, option, diagnosis.IsSupported, rows, watch.Elapsed.TotalMilliseconds);
    }

    public static string Explain(KanjiDiagnosticReason reason) => reason switch
    {
        KanjiDiagnosticReason.Supported => "そのまま使用可能",
        KanjiDiagnosticReason.MjUniqueMappingAvailable => "対象外・MJの一意な代替先あり",
        KanjiDiagnosticReason.VariationSelectorFallbackAvailable => "対象外・基底文字への候補あり",
        KanjiDiagnosticReason.UnregisteredVariationSequence => "未登録のVariation Sequence",
        KanjiDiagnosticReason.InvalidUtf16 => "不正なUTF-16（単独サロゲート）",
        KanjiDiagnosticReason.UniqueAlternativeNotInTargetCharacterSet => "対象外・一意な代替先も対象集合外",
        _ => "対象外・この条件で自動置換先なし"
    };
}
