using KanjiVariants;
using KanjiVariants.Playground.Services;

internal static class VariationChecks
{
    public static void Run(Action<bool, string> check)
    {
        const CharacterSet jis = CharacterSet.JisX0208;
        const KanjiFallbackOptions allow = KanjiFallbackOptions.AllowVariationSelectorFallback;
        var service = new DiagnosticService();
        check(VariationExamples.Ivs == "\u8FBB\U000E0100", "IVS example exact sequence");
        check(VariationExamples.Svs == "\u4E0D\uFE00", "SVS example exact sequence");
        foreach (var (text, expected) in new[] { (VariationExamples.Ivs, "辻"), (VariationExamples.Svs, "不") })
        {
            check(KanjiCharacter.TryParse(text, out var parsed) && parsed.HasVariationSelector, "sample registered");
            check(KanjiText.Replace(text, jis) == text, "example off preserves sequence");
            check(KanjiText.Replace(text, jis, allow) == expected, "example on fallback");
            var result = service.Analyze(text, jis);
            var row = result.Rows.Single();
            check(result.Text == text && !result.IsSupported && row.Item.Replacement is null, "candidate display never changes original diagnosis");
            check(row.Item.Utf16Length == text.Length && row.HasVariationSelector, "sequence one logical item");
            var candidate = row.Candidates.Single(x => x.Text == expected);
            check(candidate.Kind == AlternativeKind.VariationSelectorFallback && candidate.IsPreferred, "fallback provenance and priority");
            check(candidate.Text == expected, "candidate copy payload is base only");
        }
        var priority = service.Analyze("亟\U000E0102", jis).Rows.Single();
        check(priority.Candidates.First().Text == "丞" && priority.Candidates.First().IsPreferred, "MJ selected before fallback");
        check(priority.Candidates.First().Kind == AlternativeKind.MjMapping, "MJ selected provenance");
        check(priority.Candidates.Single(x => x.Text == "亟").Kind == AlternativeKind.MjMapping
            && !priority.Candidates.Single(x => x.Text == "亟").IsPreferred, "base also in MJ does not override unique mapping");
        var duplicate = service.Analyze("辻\U000E0102", jis).Rows.Single();
        check(duplicate.Candidates.Count(x => x.Text == "辻") == 1, "overlapping MJ and base deduplicated");
        check(duplicate.Candidates.Single(x => x.Text == "辻").Kind == AlternativeKind.MjMapping, "overlap classified MJ first");
        var svsMj = service.Analyze("欄\uFE00", jis).Rows.Single();
        check(svsMj.HasVariationSelector && svsMj.Candidates.Any(x => x.Kind == AlternativeKind.MjMapping), "registered SVS MJ candidates");
        check(svsMj.Candidates.Single(x => x.IsPreferred).SelectionReason == KanjiDiagnosticReason.VariationSelectorFallbackAvailable,
            "MJ candidate membership distinct from actual fallback selection");
        foreach (var text in new[] { "髙\uFE0F", "髙\U000E01EF", "A\uFE00" })
        {
            var row = service.Analyze(text, jis).Rows.Single();
            check(row.Item.Reason == KanjiDiagnosticReason.UnregisteredVariationSequence && row.Candidates.Count == 0, "unregistered no candidates");
            check(KanjiText.Replace(text, jis, allow) == text, "unregistered never stripped");
        }
        check(service.Analyze(VariationExamples.Ivs, CharacterSet.JisX0212).Rows.Single().Candidates.Count == 0, "base outside target not offered");
        foreach (var target in DiagnosticService.Targets)
        foreach (var text in new[] { VariationExamples.Ivs, VariationExamples.Svs, "亟\U000E0102", "辻\U000E0102", "欄\uFE00", "姬\uFE00", "丂\U000E0100", "髙\uFE0F", "㐄", "髙", "😀" })
        {
            var result = service.Analyze(text, target.Value);
            var row = result.Rows.Single();
            check(result.Text == text && result.IsSupported == KanjiText.IsSupported(text, target.Value), "unchanged original support");
            check(row.Item.Original == text, "no intermediate split");
            if (!row.CanSearchAlternatives) { check(row.Candidates.Count == 0, "unparsed no fallback"); continue; }
            var options = row.HasVariationSelector ? allow : KanjiFallbackOptions.None;
            var official = Kanji.GetAlternatives(text, target.Value, options).Select(x => x.ToString()).ToArray();
            check(row.Candidates.Select(x => x.Text).Order().SequenceEqual(official.Order()), "candidate set matches public API");
            check(row.Candidates.Select(x => x.Text).Distinct().Count() == row.Candidates.Count, "no duplicates");
            var mj = Kanji.GetAlternatives(text, target.Value).Select(x => x.ToString()).ToArray();
            foreach (var candidate in row.Candidates)
            {
                check(KanjiText.IsSupported(candidate.Text, target.Value), "every candidate in selected set");
                check((candidate.Kind == AlternativeKind.MjMapping) == mj.Contains(candidate.Text), "exact candidate provenance");
                check(candidate.Text == KanjiCharacter.Parse(candidate.Text).ToString(), "copy payload complete valid expression");
            }
            bool hasPreferred = Kanji.TryGetAlternative(text, target.Value, out var preferred, options);
            check(row.Candidates.Count(x => x.IsPreferred) == (hasPreferred ? 1 : 0), "exact preference count");
            if (hasPreferred) check(row.Candidates.First().Text == preferred.ToString(), "public selected alternative first");
            if (hasPreferred && row.HasVariationSelector)
                check(row.Candidates.First().SelectionReason == KanjiDiagnostics.AnalyzeText(text, target.Value, options).Items.Single().Reason,
                    "actual selection reason from diagnostics API");
        }
    }
}
