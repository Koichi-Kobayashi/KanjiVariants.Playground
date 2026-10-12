using System.Diagnostics;
using KanjiVariants;
using KanjiVariants.Playground.Services;

// 固定したNuGet版のREADMEと本体テストから引用した仕様例を照合する。
// 出典と固定コミットはdocs/RESEARCH.md参照。独自変換の期待値は作らない。
int checks = 0;
void Check(bool condition, string label)
{
    if (!condition) throw new InvalidOperationException(label);
    checks++;
}
var service = new DiagnosticService();
long allocatedBefore = GC.GetTotalAllocatedBytes(true);
long liveBefore = GC.GetTotalMemory(true);
var watch = Stopwatch.StartNew();
var initial = service.Analyze("髙橋", CharacterSet.JisX0208);
watch.Stop();
long allocatedAfter = GC.GetTotalAllocatedBytes(true);
long liveAfter = GC.GetTotalMemory(true);
Console.WriteLine($"Desktop cold diagnosis: {watch.Elapsed.TotalMilliseconds:F2} ms; allocated delta: {allocatedAfter - allocatedBefore:N0} bytes; managed live delta: {liveAfter - liveBefore:N0} bytes (not browser memory)");
Check(!initial.IsSupported && initial.Rows.Count == 2, "髙橋 / JIS X 0208");
Check(initial.Rows[0].Alternatives.Contains("高"), "髙 → 高 candidate");
Check(initial.Rows[1].Item.IsSupported, "橋 supported");
Check(service.Analyze("𠮷", CharacterSet.JisX0208).Rows[0].Alternatives.Contains("吉"), "𠮷 → 吉 candidate");
Check(KanjiText.Replace("髙橋𠮷野", CharacterSet.JisX0208) == "高橋吉野", "README Replace example");
Check(Kanji.IsSupported("丑", CharacterSet.JisX0213Plane1), "丑 plane 1");
Check(!Kanji.IsSupported("丑", CharacterSet.JisX0213Plane2), "丑 not plane 2");
Check(Kanji.IsSupported("丑", CharacterSet.JisX0213), "丑 both planes");
Check(Kanji.IsSupported("丂", CharacterSet.JisX0212), "丂 JIS X 0212");
Check(!Kanji.IsSupported("丂", CharacterSet.JisX0208), "丂 not JIS X 0208");
Check(service.Analyze("丂丄Ä", CharacterSet.JisX0212).IsSupported, "JIS X 0212 non-kanji text example");
Check(!service.Analyze("髙\uFE0F", CharacterSet.JisX0208).Rows[0].CanSearchAlternatives, "unregistered VS not candidate input");
Check(service.Analyze("😀", CharacterSet.JisX0208).Rows.Single().Item.Reason == KanjiDiagnosticReason.NoReplacement, "emoji not supported");
Check(service.Analyze("辻\U000E0100", CharacterSet.JisX0208).Rows.Single().Item.Reason == KanjiDiagnosticReason.NoReplacement, "IVS no implicit fallback");
Check(service.Analyze("不\uFE00", CharacterSet.JisX0208).Rows.Single().CanSearchAlternatives, "SVS parsed");
Check(service.Analyze("", CharacterSet.JisX0212).IsSupported, "empty text library rule");

foreach (var target in DiagnosticService.Targets)
{
    foreach (var text in new[] { "髙橋𠮷野", "Aあ①😀", "丂丄Ä", "辻\U000E0100不\uFE00髙\uFE0F", "\uFE00\U000E0100髙", "A𠮷辻\U000E0100\uDB40\r\n高", "\U00020509\U000E0103", "", "\uD800", "\uDC00" })
    {
        var result = service.Analyze(text, target.Value);
        Check(result.Text == text, "input preserved");
        Check(result.IsSupported == KanjiText.IsSupported(text, target.Value), "text API parity");
        Check(string.Concat(result.Rows.Select(x => x.Item.Original)) == text, "units cover original text");
        int offset = 0;
        foreach (var row in result.Rows)
        {
            Check(row.Item.Utf16Index == offset, "continuous positions");
            offset += row.Item.Utf16Length;
            if (row.CanSearchAlternatives)
                Check(row.Alternatives.SequenceEqual(Kanji.GetAlternatives(row.Item.Original, target.Value).Select(x => x.ToString())), "candidate API parity");
        }
    }
}
var boundaries = service.Analyze("A𠮷辻\U000E0100\uDB40\r\n高", CharacterSet.JisX0208);
Check(boundaries.Rows.Select(x => x.Item.Utf16Index).SequenceEqual(new[] { 0, 1, 3, 6, 7, 8, 9 }), "upstream boundary indices");
Check(boundaries.Rows[3].Item.Reason == KanjiDiagnosticReason.InvalidUtf16, "isolated surrogate safely diagnosed");
try { service.Analyze(new string('髙', DiagnosticService.MaxUtf16Length + 1), CharacterSet.JisX0208); throw new Exception("length guard missing"); }
catch (ArgumentException) { checks++; }
ConversionChecks.Run(Check);
VariationChecks.Run(Check);
CharacterDetailsChecks.Run(Check);
FuriganaChecks.Run(Check);
FuriganaAutomaticChecks.Run(Check);
Console.WriteLine($"Passed {checks} checks.");
