namespace KanjiVariants.Playground.Services;

public sealed class FuriganaService
{
    public const int MaxUtf16Length = 2000;

    public EducationKanjiTextDiagnosticResult Analyze(string text, KanjiGrade grade)
    {
        ArgumentNullException.ThrowIfNull(text);
        if (text.Length > MaxUtf16Length)
            throw new ArgumentException("入力は2,000 UTF-16単位以内にしてください。入力は切り捨てません。");
        var result = EducationKanjiDiagnostics.AnalyzeText(text, grade);
        if (result.HasInvalidUtf16)
        {
            var positions = result.Items.Where(x => x.Reason == EducationKanjiDiagnosticReason.InvalidUtf16)
                .Select(x => (x.Utf16Index + 1).ToString());
            throw new ArgumentException($"不正なUTF-16があります（先頭からのUTF-16位置: {string.Join(", ", positions)}）。孤立したサロゲートを修正してください。");
        }
        return result;
    }

    public static bool IsKanji(EducationKanjiTextDiagnosticItem item) => item.Reason is
        EducationKanjiDiagnosticReason.Learned or EducationKanjiDiagnosticReason.LearnedInLaterGrade or
        EducationKanjiDiagnosticReason.NotEducationKanji;

    public static bool IsUnlearned(EducationKanjiTextDiagnosticItem item) => item.Reason is
        EducationKanjiDiagnosticReason.LearnedInLaterGrade or EducationKanjiDiagnosticReason.NotEducationKanji;
}

public enum FuriganaReadingOrigin { None, Automatic, Manual }
public sealed record FuriganaRange(long Revision, int Start, int Length, string Surface, string Reading = "",
    FuriganaReadingOrigin Origin = FuriganaReadingOrigin.None, string? ReviewMessage = null);
public sealed record FuriganaPart(string Text, string? Reading, bool NeedsReview,
    FuriganaReadingOrigin Origin = FuriganaReadingOrigin.None, string? ReviewMessage = null);

// Rendering and copy share the same policy. No HTML or tokenizer-specific types are stored here.
public static class FuriganaPresentation
{
    public static IReadOnlyList<FuriganaPart> Build(FuriganaDocument document, bool showReadings)
    {
        var parts = new List<FuriganaPart>();
        int offset = 0;
        foreach (var range in document.Ranges)
        {
            if (offset < range.Start) parts.Add(new(document.Text[offset..range.Start], null, false));
            bool target = document.UnlearnedCount(range) > 0;
            var reading = target && showReadings && !string.IsNullOrWhiteSpace(range.Reading) ? range.Reading : null;
            parts.Add(new(range.Surface, reading, target && string.IsNullOrWhiteSpace(range.Reading), range.Origin, range.ReviewMessage));
            offset = range.Start + range.Length;
        }
        if (offset < document.Text.Length) parts.Add(new(document.Text[offset..], null, false));
        return parts;
    }

    public static string CopyText(FuriganaDocument document, bool showReadings) =>
        string.Concat(Build(document, showReadings).Select(x => x.Reading is null ? x.Text : $"{x.Text}（{x.Reading}）"));
}

public sealed class FuriganaDocument
{
    private readonly List<FuriganaRange> ranges = new();
    public string Text { get; }
    public long Revision { get; }
    public EducationKanjiTextDiagnosticResult Diagnosis { get; private set; }
    public IReadOnlyList<FuriganaRange> Ranges => ranges.AsReadOnly();

    public FuriganaDocument(long revision, EducationKanjiTextDiagnosticResult diagnosis)
    {
        Revision = revision;
        Text = diagnosis.Text;
        Diagnosis = diagnosis;
        int start = -1, end = 0;
        foreach (var item in diagnosis.Items)
        {
            if (FuriganaService.IsKanji(item))
            {
                if (start < 0) start = item.Utf16Index;
                end = item.Utf16Index + item.Utf16Length;
            }
            else if (start >= 0) { AddRange(start, end); start = -1; }
        }
        if (start >= 0) AddRange(start, end);
    }

    private void AddRange(int start, int end) => ranges.Add(new(Revision, start, end - start, Text[start..end]));
    public IEnumerable<EducationKanjiTextDiagnosticItem> Units(FuriganaRange range) => Diagnosis.Items
        .Where(x => x.Utf16Index >= range.Start && x.Utf16Index < range.Start + range.Length);
    public int UnlearnedCount(FuriganaRange range) => Units(range).Count(FuriganaService.IsUnlearned);
    public void SetGrade(EducationKanjiTextDiagnosticResult diagnosis)
    {
        if (diagnosis.Text != Text) throw new ArgumentException("原文が一致しません。");
        Diagnosis = diagnosis;
    }
    private int Find(FuriganaRange range)
    {
        int index = ranges.IndexOf(range);
        if (range.Revision != Revision || index < 0) throw new ArgumentException("範囲が現在の結果と一致しません。");
        return index;
    }
    public void SetReading(FuriganaRange range, string reading)
    {
        int index = Find(range);
        // A reading is a short, single-line annotation. Arbitrary text is escaped by Razor.
        if (reading.Length > 200 || reading.Any(char.IsControl) || !IsValidUtf16(reading))
            throw new ArgumentException("読みは200 UTF-16単位以内、改行・制御文字・不正UTF-16なしで入力してください。");
        ranges[index] = range with { Reading = reading.Trim(), Origin = FuriganaReadingOrigin.Manual, ReviewMessage = null };
    }
    private static bool IsValidUtf16(string text)
    {
        int offset = 0;
        while (offset < text.Length)
        {
            if (System.Text.Rune.DecodeFromUtf16(text.AsSpan(offset), out _, out int consumed) != System.Buffers.OperationStatus.Done)
                return false;
            offset += consumed;
        }
        return true;
    }
    public void Split(FuriganaRange range)
    {
        int index = Find(range);
        var units = Units(range).Where(FuriganaService.IsKanji).ToArray();
        if (units.Length < 2) return;
        ranges.RemoveAt(index);
        ranges.InsertRange(index, units.Select(x => new FuriganaRange(Revision, x.Utf16Index, x.Utf16Length, x.Original,
            Origin: FuriganaReadingOrigin.Manual)));
    }
    public bool CanMerge(FuriganaRange range)
    {
        int index = Find(range);
        return index + 1 < ranges.Count && range.Start + range.Length == ranges[index + 1].Start;
    }
    public void MergeNext(FuriganaRange range)
    {
        int index = Find(range);
        if (!CanMerge(range)) throw new ArgumentException("隣接する漢字範囲がありません。");
        var next = ranges[index + 1];
        ranges[index] = new(Revision, range.Start, range.Length + next.Length, range.Surface + next.Surface,
            Origin: FuriganaReadingOrigin.Manual);
        ranges.RemoveAt(index + 1);
    }

    public void ApplyAutomatic(IReadOnlyList<ReadingToken> tokens) =>
        ReplaceRanges(FuriganaAutomaticPlan.Build(this, tokens));

    private void ReplaceRanges(IReadOnlyList<FuriganaRange> replacement)
    {
        ranges.Clear();
        ranges.AddRange(replacement);
    }
}
