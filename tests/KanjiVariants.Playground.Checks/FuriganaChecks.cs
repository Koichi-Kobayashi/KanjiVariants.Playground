using KanjiVariants;
using KanjiVariants.Playground.Services;

internal static class FuriganaChecks
{
    public static void Run(Action<bool, string> check)
    {
        var service = new FuriganaService();
        var session = new FuriganaSession(service);
        session.SetInput("今日、大人。今日\r\n <>&😀");
        session.Generate();
        var document = session.Document!;
        check(session.IsCurrent && document.Ranges.Count == 3, "ruby kanji runs");
        session.SetReading(document.Ranges[0], "きょう");
        session.SetReading(document.Ranges[1], "おとな");
        check(session.CopyText() == "今日（きょう）、大人。今日\r\n <>&😀", "ruby known-only and missing reading copy");
        check(document.Ranges[2].Reading == "", "ruby separate occurrences");
        check(document.UnlearnedCount(document.Ranges[0]) == 1, "ruby partial learned word");
        session.ShowReadings = false;
        check(session.CopyText() == session.Input, "ruby OFF copy is exact source");
        session.ShowReadings = true;
        session.SetGrade(KanjiGrade.Grade2);
        check(session.CopyText() == session.Input && document.Ranges[0].Reading == "きょう", "ruby higher grade hides but preserves");
        session.SetGrade(KanjiGrade.Grade1);
        check(session.CopyText().StartsWith("今日（きょう）"), "ruby lower grade restores reading");
        session.Generate();
        check(ReferenceEquals(document, session.Document), "ruby regeneration retains ranges/readings");
        session.Split(document.Ranges[0]);
        check(document.Ranges.Take(2).Select(x => x.Surface).SequenceEqual(new[] { "今", "日" }), "ruby one click split");
        session.SetReading(document.Ranges[0], "いま");
        check(session.CopyText().StartsWith("今（いま）日"), "ruby partial annotation");
        session.MergeNext(document.Ranges[0]);
        check(document.Ranges[0].Surface == "今日" && document.Ranges[0].Reading == "", "ruby merge clears unaligned readings");
        session.SetReading(document.Ranges[0], "きょう");
        long revision = document.Revision;
        session.SetInput("今日！");
        check(!session.IsCurrent && ReferenceEquals(session.Document, document), "ruby stale source snapshot retained");
        try { session.CopyText(); check(false, "ruby stale copy guard missing"); }
        catch (InvalidOperationException) { check(true, "ruby stale copy blocked"); }
        try { session.SetReading(document.Ranges[0], "あす"); check(false, "ruby stale edit missing"); }
        catch (InvalidOperationException) { check(true, "ruby stale edit blocked"); }
        session.SetInput(document.Text);
        check(!session.IsCurrent, "ruby text revert does not revive source revision");
        session.Generate();
        check(session.Document!.Revision > revision && session.Document.Ranges[0].Reading == "", "ruby no implicit cross-revision transfer");
        try { session.SetReading(document.Ranges[0], "きょう"); check(false, "ruby old range accepted"); }
        catch (ArgumentException) { check(true, "ruby old range rejected"); }

        foreach (var grade in Enum.GetValues<KanjiGrade>())
        {
            var text = string.Concat(EducationKanji.GetByGrade(grade).Select(x => x.ToString()));
            var diagnosis = service.Analyze(text, grade);
            check(diagnosis.UnlearnedItems.Count == 0, $"ruby cumulative grade {grade}");
            if ((int)grade > 1)
                check(service.Analyze(text, (KanjiGrade)((int)grade - 1)).UnlearnedItems.Count == diagnosis.Items.Count, $"ruby grade boundary {grade}");
        }
        session.SetInput("辻\U000E0100不\uFE00𠮷髙\uFE0F生きる\n <script>&\"😀");
        session.Generate();
        document = session.Document!;
        session.Split(document.Ranges[0]);
        check(document.Ranges.Take(4).Select(x => x.Surface).SequenceEqual(new[] { "辻\U000E0100", "不\uFE00", "𠮷", "髙\uFE0F" }), "ruby VS and supplementary units not split");
        session.SetReading(document.Ranges[0], "<b>&\"");
        var parts = FuriganaPresentation.Build(document, true);
        check(string.Concat(parts.Select(x => x.Text)) == session.Input, "ruby structured rendering preserves source incl HTML chars");
        check(parts[0].Reading == "<b>&\"", "ruby reading stored as text for Razor encoding");
        session.ShowReadings = false;
        check(session.CopyText() == session.Input, "ruby Unicode and HTML OFF copy");
        foreach (var bad in new[] { "\uD800", "x\uDC00y" })
        {
            session.SetInput(bad); session.Generate();
            check(session.Error?.Contains("UTF-16") == true && !session.IsCurrent, "ruby invalid UTF16 blocks new preview");
            check(ReferenceEquals(document, session.Document), "ruby invalid UTF16 preserves old snapshot");
        }
        session.SetInput(new string('あ', 2001)); session.Generate();
        check(session.Input.Length == 2001 && session.Error is not null && !session.IsCurrent, "ruby upper limit no truncation");
        session.SetInput(new string('あ', 2000)); session.Generate();
        check(session.IsCurrent && session.CopyText() == session.Input, "ruby max length and non-kanji");
        session.SetInput(""); session.Generate();
        check(session.IsCurrent && session.CopyText() == "", "ruby empty source");
        session.ShowReadings = true;
        session.SetInput("宇宙を生きる"); session.SetGrade(KanjiGrade.Grade1); session.Generate();
        document = session.Document!;
        session.SetReading(document.Ranges[0], "うちゅう");
        session.SetReading(document.Ranges[1], "い");
        check(session.CopyText() == "宇宙（うちゅう）を生きる", "ruby learned 生 has no unnecessary reading");
        try { document.MergeNext(document.Ranges[0]); check(false, "ruby merge across kana accepted"); }
        catch (ArgumentException) { check(true, "ruby merge across kana rejected"); }
        foreach (var reading in new[] { "\uD800", "a\nb", new string('あ', 201) })
        {
            try { session.SetReading(document.Ranges[0], reading); check(false, "ruby invalid reading accepted"); }
            catch (ArgumentException) { check(true, "ruby invalid reading rejected"); }
        }
    }
}
