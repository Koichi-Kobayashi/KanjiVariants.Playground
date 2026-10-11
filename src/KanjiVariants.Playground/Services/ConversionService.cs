using System.Diagnostics;

namespace KanjiVariants.Playground.Services;

public sealed record ConversionChange(string Original, string Replacement, KanjiDiagnosticReason Reason, int Count);
public sealed record RemainingCharacter(string Original, KanjiDiagnosticReason Reason, int Count);
public enum ConversionStatus { Unnecessary, Supported, UnsupportedRemaining }
public sealed record ConversionResult(string OriginalText, string ConvertedText, CharacterSetOption Target,
    KanjiFallbackOptions Options, bool OriginalIsSupported, bool IsSupported, int ChangedCount,
    IReadOnlyList<ConversionChange> Changes, IReadOnlyList<RemainingCharacter> Remaining,
    double ElapsedMilliseconds)
{
    public int RemainingCount => Remaining.Sum(x => x.Count);
    public ConversionStatus Status => !IsSupported ? ConversionStatus.UnsupportedRemaining
        : OriginalIsSupported && ChangedCount == 0 ? ConversionStatus.Unnecessary : ConversionStatus.Supported;
}

public sealed class ConversionService
{
    // ブラウザのUIスレッドで処理するための上限。切り詰めや正規化はしない。
    public const int MaxUtf16Length = 100_000;

    public ConversionResult Convert(string text, CharacterSet target, KanjiFallbackOptions options = KanjiFallbackOptions.None)
    {
        ArgumentNullException.ThrowIfNull(text);
        if (text.Length > MaxUtf16Length)
            throw new ArgumentException($"入力はUTF-16で{MaxUtf16Length:N0}単位以内にしてください。補助文字は2単位分です。");
        var targetOption = DiagnosticService.Targets.Single(x => x.Value == target);
        var watch = Stopwatch.StartNew();

        // 変換の唯一の実装はライブラリ。詳細は同条件の診断APIが返す置換先・理由から集計する。
        var converted = KanjiText.Replace(text, target, options);
        var supported = KanjiText.IsSupported(converted, target);
        var original = KanjiDiagnostics.AnalyzeText(text, target, options);
        var changes = original.Items
            .Where(x => x.Replacement is not null && !string.Equals(x.Original, x.Replacement, StringComparison.Ordinal))
            .GroupBy(x => (x.Original, Replacement: x.Replacement!, x.Reason))
            .Select(x => new ConversionChange(x.Key.Original, x.Key.Replacement, x.Key.Reason, x.Count()))
            .ToArray();
        // 出力を改めて診断する。元入力のインデックスを出力の位置として転用しない。
        var remaining = supported ? Array.Empty<RemainingCharacter>()
            : KanjiDiagnostics.AnalyzeText(converted, target).Items
                .Where(x => !x.IsSupported)
                .GroupBy(x => (x.Original, x.Reason))
                .Select(x => new RemainingCharacter(x.Key.Original, x.Key.Reason, x.Count()))
                .ToArray();
        watch.Stop();
        return new(text, converted, targetOption, options, original.IsSupported, supported,
            changes.Sum(x => x.Count), Array.AsReadOnly(changes), Array.AsReadOnly(remaining), watch.Elapsed.TotalMilliseconds);
    }
}
