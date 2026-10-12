namespace KanjiVariants.Playground.Services;

// UTF-16 DTO shared with the engine adapter; no Lindera-specific types outside JS.
public sealed record ReadingToken(int Start, int End, string Surface, string? Reading, bool Unknown,
    bool Valid, string[] Pos);

public static class FuriganaAutomaticPlan
{
    public static IReadOnlyList<FuriganaRange> Build(FuriganaDocument document, IReadOnlyList<ReadingToken> tokens)
    {
        var items = document.Diagnosis.Items;
        var boundaries = items.Select(x => x.Utf16Index).Append(document.Text.Length).ToHashSet();
        var manual = document.Ranges.Where(x => x.Origin == FuriganaReadingOrigin.Manual).ToList();
        var chosen = new List<FuriganaRange>(manual);
        var runs = new FuriganaDocument(document.Revision, document.Diagnosis).Ranges;
        var blocked = new Dictionary<int, string>();
        int previousEnd = 0;
        bool invalidPositions = false;
        foreach (var token in tokens)
        {
            bool valid = token.Valid && token.Start >= previousEnd && token.End > token.Start && token.End <= document.Text.Length &&
                token.Start >= 0 && document.Text[token.Start..token.End] == token.Surface;
            if (!valid) { invalidPositions = true; break; }
            previousEnd = token.End;
        }
        // Unlocatable tokens cannot be assigned by searching repeated surface strings.
        if (invalidPositions)
        {
            foreach (var run in runs) blocked[run.Start] = "原文との位置対応が不正です。読みを確認してください。";
        }
        else
        {
            foreach (var run in runs)
            {
                var intersecting = tokens.Where(t => Overlaps(run.Start, run.Start + run.Length, t.Start, t.End)).ToArray();
                if (intersecting.Any(t => t.Unknown || string.IsNullOrWhiteSpace(t.Reading) || t.Reading == "*"))
                    blocked[run.Start] = "未知語・読み未取得を含みます。範囲全体の読みを確認してください。";
                else if (intersecting.Any(t => !boundaries.Contains(t.Start) || !boundaries.Contains(t.End)))
                    blocked[run.Start] = "字形指定を含む文字の境界が一致しません。読みを確認してください。";
                else if (intersecting.Length == 0)
                    blocked[run.Start] = "読みを取得できませんでした。";
            }
            foreach (var token in tokens)
            {
                if (token.Unknown || !boundaries.Contains(token.Start) || !boundaries.Contains(token.End) ||
                    string.IsNullOrWhiteSpace(token.Reading) || token.Reading == "*") continue;
                var tokenUnits = items.Where(x => x.Utf16Index >= token.Start && x.Utf16Index < token.End).ToArray();
                if (!tokenUnits.Any(FuriganaService.IsKanji)) continue;
                if (runs.Any(r => blocked.ContainsKey(r.Start) && Overlaps(r.Start, r.Start + r.Length, token.Start, token.End))) continue;
                string reading = ToHiragana(token.Reading);
                int end = token.End;
                // Only remove a literal trailing kana anchor. Never split all-kanji readings by length.
                int prefix = tokenUnits.TakeWhile(FuriganaService.IsKanji).Sum(x => x.Utf16Length);
                string suffix = token.Surface[prefix..];
                if (prefix > 0 && suffix.Length > 0 && suffix.All(IsKana) &&
                    reading.EndsWith(ToHiragana(suffix), StringComparison.Ordinal) && reading.Length > suffix.Length)
                {
                    end = token.Start + prefix;
                    reading = reading[..^suffix.Length];
                }
                if (reading.Length > 200 || !reading.All(IsKana)) continue;
                if (manual.Any(r => Overlaps(r.Start, r.Start + r.Length, token.Start, end))) continue;
                string? note = token.Pos.Contains("固有名詞") ? "固有名詞の読みは要確認です。" : null;
                chosen.Add(new(document.Revision, token.Start, end - token.Start, document.Text[token.Start..end],
                    reading, FuriganaReadingOrigin.Automatic, note));
            }
        }
        // Keep uncovered kanji as editable ranges; gaps (including kana, spaces and newlines) remain source text.
        int start = -1, endOfRange = 0;
        void Flush()
        {
            if (start < 0) return;
            var run = runs.First(r => r.Start <= start && start < r.Start + r.Length);
            chosen.Add(new(document.Revision, start, endOfRange - start, document.Text[start..endOfRange],
                ReviewMessage: blocked.GetValueOrDefault(run.Start)));
            start = -1;
        }
        foreach (var item in items)
        {
            bool covered = chosen.Any(r => r.Start <= item.Utf16Index && item.Utf16Index < r.Start + r.Length);
            if (FuriganaService.IsKanji(item) && !covered)
            {
                if (start < 0) start = item.Utf16Index;
                endOfRange = item.Utf16Index + item.Utf16Length;
            }
            else Flush();
        }
        Flush();
        return chosen.OrderBy(x => x.Start).ToArray();
    }

    private static bool Overlaps(int start, int end, int otherStart, int otherEnd) => start < otherEnd && otherStart < end;
    private static bool IsKana(char value) => value is >= 'ぁ' and <= 'ゖ' or >= 'ァ' and <= 'ヶ' or 'ー';
    private static string ToHiragana(string text) => string.Concat(text.Select(c => c is >= 'ァ' and <= 'ヶ' ? (char)(c - 0x60) : c));
}
