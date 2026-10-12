using KanjiVariants;
using KanjiVariants.Playground.Services;

internal static class CharacterDetailsChecks
{
    public static void Run(Action<bool, string> check)
    {
        var service = new CharacterDetailsService();
        string[] corpus = ["高", "一", "丑", "髙", "辻\U000E0102", "欄\uFE00", "\U00020B9F", "𠮷", "A", "あ", "😀", "髙\uFE0F", "\uD800", "\uDC00", "\uFE00", "愛", "哀", "把", "葛"];
        foreach (var original in corpus)
        {
            var model = service.Get(original);
            bool parsed = KanjiCharacter.TryParse(original, out var character);
            check(model.Original == original && model.Error is null, "details original preserved");
            check(model.CanAnalyze == parsed, "details parse scope");
            check(model.VariationSelectors.SequenceEqual(CharacterDisplay.VariationSelectorCodePoints(original)), "display selectors only");
            if (!parsed)
            {
                check(model.JisSets.Count == 0 && model.JoyoEntry is null && model.EducationGrade is null
                    && model.IsJinmeiyoKanji is null && model.IsNameUsableKanji is null, "unparsed does not fabricate membership");
                continue;
            }
            check(model.JisSets.Count == 5, "five independent JIS sets");
            foreach (var set in model.JisSets)
                check(set.IsSupported == Kanji.IsSupported(character, set.Target.Value), "details JIS API parity");
            check(ReferenceEquals(model.JoyoEntry, JoyoKanji.Get(character)), "readings entry shared without copying");
            check(model.EducationGrade == EducationKanji.GetGrade(character), "grade API parity");
            check(model.IsJinmeiyoKanji == JinmeiyoKanji.IsJinmeiyoKanji(character), "jinmeiyo API parity");
            check(model.IsNameUsableKanji == JinmeiyoKanji.IsNameUsableKanji(character), "name classification API parity");
        }
        var high = service.Get("高");
        check(high.JoyoEntry is not null && high.IsJinmeiyoKanji == false && high.IsNameUsableKanji == true, "official 高 classifications");
        check(service.Get("一").EducationGrade == KanjiGrade.Grade1, "official 一 grade");
        var ox = service.Get("丑");
        check(ox.JoyoEntry is null && ox.IsJinmeiyoKanji == true && ox.IsNameUsableKanji == true, "official 丑 not joyo but jinmeiyo");
        foreach (var original in new[] { "辻\U000E0102", "欄\uFE00" })
        {
            var model = service.Get(original);
            check(model.CanAnalyze && model.JisSets.All(x => !x.IsSupported) && model.JoyoEntry is null
                && model.EducationGrade is null && model.IsJinmeiyoKanji == false && model.IsNameUsableKanji == false, "VS not reduced to base membership");
        }
        check(service.Get("髙\uFE0F").VariationSelectors.Single() == 0xFE0F, "unregistered VS still displayed");
        check(CharacterDisplay.CodePoints("\uD800", KanjiDiagnosticReason.InvalidUtf16) == "不正UTF-16（Unicodeスカラーなし）", "invalid UTF16 not FFFD");
        var readings = service.Get("哀").JoyoEntry!.Readings;
        check(readings[0].Reading == "アイ" && readings[0].Type == KanjiReadingType.On, "original on reading");
        check(readings[0].Examples.SequenceEqual(new[] { "哀愁", "哀願", "悲哀" }), "official examples preserved");
        check(readings[1].Type == KanjiReadingType.Kun, "on/kun classification preserved");
        check(service.Get("愛").JoyoEntry!.Readings[0].Note == "愛媛（えひめ）県", "official note preserved");

        var diagnosis = new DiagnosticService().Analyze("高高辻\U000E0102辻\U000E0100\uD800", CharacterSet.JisX0208);
        int lookups = 0;
        var session = new CharacterDetailsSession(original => { lookups++; return service.Get(original); });
        check(session.OpenedCount == 0 && lookups == 0 && session.CacheCount == 0, "no eager details");
        session.Toggle(diagnosis.Rows[0].Item);
        var first = session.GetExpansion(0)!.Model;
        check(session.IsOpen(0) && lookups == 1 && !session.LastLookupWasCached, "open on demand");
        session.Toggle(diagnosis.Rows[1].Item);
        check(session.IsOpen(0) && session.IsOpen(1) && session.OpenedCount == 2 && lookups == 1
            && session.LastLookupWasCached && ReferenceEquals(first, session.GetExpansion(1)!.Model), "duplicate rows stay open with shared details");
        session.Toggle(diagnosis.Rows[1].Item);
        check(session.IsOpen(0) && !session.IsOpen(1) && session.OpenedCount == 1 && lookups == 1, "same row closes only itself without lookup");
        session.Toggle(diagnosis.Rows[2].Item);
        session.Toggle(diagnosis.Rows[3].Item);
        check(lookups == 3 && session.CacheCount == 3 && session.OpenedCount == 3, "different VS exact ordinal keys stay open");
        session.Toggle(diagnosis.Rows[2].Item);
        check(!session.IsOpen(diagnosis.Rows[2].Item.Utf16Index) && session.IsOpen(diagnosis.Rows[3].Item.Utf16Index)
            && session.IsOpen(0), "closing one VS keeps other details open");
        session.Toggle(diagnosis.Rows[2].Item);
        check(lookups == 3 && session.LastLookupWasCached, "VS detail reuse");
        session.Toggle(diagnosis.Rows[4].Item);
        check(session.GetExpansion(diagnosis.Rows[4].Item.Utf16Index)?.Model.CanAnalyze == false && lookups == 4, "invalid item safe expansion");
        var newSession = new CharacterDetailsSession(service.Get);
        check(newSession.OpenedCount == 0 && newSession.CacheCount == 0, "new diagnosis resets scope");
        var canonical = new CharacterDetailsSession(original => { lookups++; return service.Get(original); });
        var forms = KanjiDiagnostics.AnalyzeText("がか\u3099", CharacterSet.JisX0208).Items;
        foreach (var item in forms) canonical.Toggle(item);
        check(canonical.CacheCount == forms.Select(x => x.Original).Distinct(StringComparer.Ordinal).Count(), "no normalization of cache keys");
        Console.WriteLine($"Details session: {session.CacheCount} cached expressions; exact lookup count {lookups} (includes separate normalization session)");
    }
}
