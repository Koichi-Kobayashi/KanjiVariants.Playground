using KanjiVariants;
using KanjiVariants.Playground.Services;

internal static class ConversionChecks
{
    // 固定NuGet版の本体テストを根拠にした期待値。出典はdocs/CONVERSION.md。
    public static void Run(Action<bool, string> check)
    {
        var service = new ConversionService();
        const CharacterSet jis = CharacterSet.JisX0208;
        const KanjiFallbackOptions allow = KanjiFallbackOptions.AllowVariationSelectorFallback;
        var initial = service.Convert("髙橋𠮷野さんに資料を送ります。", jis);
        check(initial.ConvertedText == "高橋吉野さんに資料を送ります。", "sentence unique mappings");
        check(initial.ChangedCount == 2 && initial.IsSupported && initial.Status == ConversionStatus.Supported, "converted and supported");
        check(initial.Options == KanjiFallbackOptions.None, "default fallback off");
        check(initial.Changes.All(x => x.Reason == KanjiDiagnosticReason.MjUniqueMappingAvailable), "MJ reasons");
        var repeated = service.Convert("髙髙𠮷\r\n𠮷 髙\tABC 123!?", jis);
        check(repeated.ConvertedText == "高高吉\r\n吉 高\tABC 123!?", "whitespace and ASCII preserved");
        check(repeated.ChangedCount == 5 && repeated.Changes.Count == 2, "grouped count");
        check(repeated.Changes.Single(x => x.Original == "髙").Count == 3, "髙 count");
        check(repeated.Changes.Single(x => x.Original == "𠮷").Count == 2, "supplementary count");
        foreach (var input in new[] { "", "高橋", "ASCII\0\t\r\n !?" })
        {
            var result = service.Convert(input, jis);
            check(result.ConvertedText == input && result.Status == ConversionStatus.Unnecessary, "supported unchanged");
            check(result.ChangedCount == 0 && result.RemainingCount == 0, "unchanged counts");
        }
        var outside = service.Convert("髙😀😀〻", jis);
        check(outside.ConvertedText == "高😀😀〻" && outside.ChangedCount == 1, "partial conversion");
        check(!outside.IsSupported && outside.Status == ConversionStatus.UnsupportedRemaining, "partial not success");
        check(outside.RemainingCount == 3 && outside.Remaining.Single(x => x.Original == "😀").Count == 2, "remaining grouped counts");
        var ambiguous = service.Convert("\u3404", jis);
        check(Kanji.GetAlternatives("\u3404", jis).Count > 1, "upstream multiple candidates fixture");
        check(ambiguous.ConvertedText == "\u3404" && ambiguous.ChangedCount == 0 && !ambiguous.IsSupported, "never select first candidate");
        var wrongTarget = service.Convert("\u343A", CharacterSet.JisX0213Plane1);
        check(wrongTarget.ConvertedText == "\u343A" && wrongTarget.Remaining.Single().Reason == KanjiDiagnosticReason.UniqueAlternativeNotInTargetCharacterSet, "unique outside plane retained");
        foreach (var target in new[] { CharacterSet.JisX0213Plane2, CharacterSet.JisX0213 })
            check(service.Convert("\u343A", target).ConvertedText == "\u4E51", "plane2 unique mapping");
        check(service.Convert("丂丄Ä", CharacterSet.JisX0212).Status == ConversionStatus.Unnecessary, "0212 supported unchanged");
        check(!service.Convert("丂高", CharacterSet.JisX0212).IsSupported, "0212 independent set");
        foreach (var (source, replacement) in new[] { ("辻\U000E0100", "辻"), ("不\uFE00", "不") })
        {
            check(service.Convert(source, jis).ConvertedText == source, "fallback off preserves VS");
            var result = service.Convert(source, jis, allow);
            check(result.ConvertedText == replacement && result.IsSupported, "fallback on");
            check(result.Changes.Single().Reason == KanjiDiagnosticReason.VariationSelectorFallbackAvailable, "registered fallback reason");
        }
        var priority = service.Convert("亟\U000E0102", jis, allow);
        check(priority.ConvertedText == "丞" && priority.Changes.Single().Reason == KanjiDiagnosticReason.MjUniqueMappingAvailable, "MJ priority over fallback");
        check(service.Convert("亟\U000E0102", jis).ConvertedText == "丞", "MJ also with fallback off");
        check(service.Convert("姬\uFE00", CharacterSet.JisX0213Plane1, allow).ConvertedText == "姬", "plane1 SVS fallback");
        foreach (var source in new[] { "髙\uFE0F", "髙\U000E01EF", "A\uFE00", "\uFE00", "\U000E0100" })
            check(service.Convert(source, jis, allow).ConvertedText == source, "unregistered or isolated VS retained");
        foreach (var source in new[] { "丂\U000E0100", "乁\uFE00" })
        {
            check(Kanji.TryGetAlternative(source, CharacterSet.JisX0212, out var replacement, allow), "0212 registered fallback exists");
            check(service.Convert(source, CharacterSet.JisX0212, allow).ConvertedText == replacement.ToString(), "0212 official alternative parity");
        }
        string broken = new(new[] { '\uD800', '\uDC00', '\uD800', 'A', '\uDC00' });
        var invalid = service.Convert(broken, jis, allow);
        check(invalid.ConvertedText == broken && !invalid.IsSupported, "malformed UTF16 retained without crash");
        check(invalid.Remaining.Where(x => x.Reason == KanjiDiagnosticReason.InvalidUtf16).Sum(x => x.Count) == 2, "isolated surrogate counts");
        check(CharacterDisplay.CodePoints("𠮷") == "U+20BB7", "supplementary display scalar");
        check(CharacterDisplay.CodePoints("辻\U000E0100") == "U+8FBB U+E0100", "IVS display scalars");
        check(!CharacterDisplay.CodePoints("\uD800", KanjiDiagnosticReason.InvalidUtf16).Contains("FFFD"), "invalid is not replacement character");

        string[] corpus = ["髙橋𠮷野", "丂丄Ä", "㐺㐄㐆丑", "辻\U000E0100不\uFE00亟\U000E0102", "髙\uFE0F😀〻①", "A𠮷辻\U000E0100\uDB40\r\n高", "辻\U000E0100\uFE00𠮷", "\U00020509\U000E0103", "e\u0301ガｶﾞ　 ", "", broken];
        foreach (var target in DiagnosticService.Targets)
        foreach (var options in new[] { KanjiFallbackOptions.None, allow })
        foreach (var text in corpus)
        {
            var result = service.Convert(text, target.Value, options);
            var diagnosis = KanjiDiagnostics.AnalyzeText(text, target.Value, options);
            check(result.OriginalText == text && result.Options == options && result.Target.Value == target.Value, "snapshot preserved");
            check(result.ConvertedText == KanjiText.Replace(text, target.Value, options), "Replace parity all sets/options");
            check(result.IsSupported == KanjiText.IsSupported(result.ConvertedText, target.Value), "output IsSupported parity");
            check(string.Concat(diagnosis.Items.Select(x => x.Replacement ?? x.Original)) == result.ConvertedText, "diagnostic mapping covers exact output");
            var changes = diagnosis.Items.Where(x => x.Replacement is not null && x.Replacement != x.Original).ToArray();
            check(result.ChangedCount == changes.Length, "exact changed unit counts");
            foreach (var row in result.Changes)
                check(row.Count == changes.Count(x => x.Original == row.Original && x.Replacement == row.Replacement && x.Reason == row.Reason), "exact source/replacement/reason groups");
            check(result.RemainingCount == KanjiDiagnostics.AnalyzeText(result.ConvertedText, target.Value).Items.Count(x => !x.IsSupported), "output remaining counts");
        }
        string longText = new string('髙', ConversionService.MaxUtf16Length - 2) + "𠮷";
        var longResult = service.Convert(longText, jis);
        check(longResult.ConvertedText == new string('高', ConversionService.MaxUtf16Length - 2) + "吉", "maximum length no truncation");
        check(longResult.ChangedCount == ConversionService.MaxUtf16Length - 1, "long supplementary unit count");
        try { service.Convert(longText + "A", jis); throw new Exception("conversion length guard missing"); }
        catch (ArgumentException) { check(true, "over-limit rejected without truncation"); }
        try { service.Convert(null!, jis); throw new Exception("null guard missing"); }
        catch (ArgumentNullException) { check(true, "null guard"); }
        // 両サービスが独立しており、フォールバックONの変換が既存診断の条件を変更しない。
        var diagnostic = new DiagnosticService().Analyze("辻\U000E0100髙", jis);
        check(diagnostic.Rows[0].Item.Replacement is null && !diagnostic.IsSupported, "diagnosis remains fallback off");
        check(diagnostic.Rows[1].Alternatives.Contains("高"), "diagnostic candidates regression");
    }
}
