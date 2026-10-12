using System.Diagnostics;

namespace KanjiVariants.Playground.Services;

public sealed record CharacterDetailsExpansion(CharacterDetailsModel Model, bool WasCached, double LookupMilliseconds);

// 診断結果ごとに作る。文字情報だけを再利用し、UTF-16位置はキャッシュに含めない。
public sealed class CharacterDetailsSession(Func<string, CharacterDetailsModel> getDetails)
{
    private readonly Dictionary<string, CharacterDetailsModel> cache = new(StringComparer.Ordinal);
    private readonly Dictionary<int, CharacterDetailsExpansion> opened = new();
    public int OpenedCount => opened.Count;
    public bool IsOpen(int index) => opened.ContainsKey(index);
    public CharacterDetailsExpansion? GetExpansion(int index) => opened.GetValueOrDefault(index);
    public int CacheCount => cache.Count;
    public bool LastLookupWasCached { get; private set; }
    public double LastLookupMilliseconds { get; private set; }

    public void Toggle(KanjiTextDiagnosticItem item)
    {
        if (opened.Remove(item.Utf16Index)) return;
        var watch = Stopwatch.StartNew();
        LastLookupWasCached = cache.TryGetValue(item.Original, out var details);
        if (!LastLookupWasCached) cache.Add(item.Original, details = getDetails(item.Original));
        watch.Stop();
        LastLookupMilliseconds = watch.Elapsed.TotalMilliseconds;
        opened.Add(item.Utf16Index, new(details!, LastLookupWasCached, LastLookupMilliseconds));
    }
}
