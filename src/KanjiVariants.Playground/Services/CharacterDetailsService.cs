namespace KanjiVariants.Playground.Services;

public sealed record CharacterSetMembership(CharacterSetOption Target, bool IsSupported);
public sealed record CharacterDetailsModel(string Original, bool CanAnalyze,
    IReadOnlyList<int> VariationSelectors, IReadOnlyList<CharacterSetMembership> JisSets,
    JoyoKanjiEntry? JoyoEntry, KanjiGrade? EducationGrade,
    bool? IsJinmeiyoKanji, bool? IsNameUsableKanji, string? Error);

public sealed class CharacterDetailsService
{
    public CharacterDetailsModel Get(string original)
    {
        ArgumentNullException.ThrowIfNull(original);
        var selectors = CharacterDisplay.VariationSelectorCodePoints(original);
        CharacterDetailsModel Unavailable(string? error = null) =>
            new(original, false, selectors, Array.Empty<CharacterSetMembership>(), null, null, null, null, error);
        try
        {
            if (!KanjiCharacter.TryParse(original, out var character)) return Unavailable();
            // P1は個別APIのみ。Analyze、MJ詳細、音訓指導段階の取得を行わない。
            var sets = DiagnosticService.Targets.Select(x => new CharacterSetMembership(x, Kanji.IsSupported(character, x.Value))).ToArray();
            return new(original, true, selectors, Array.AsReadOnly(sets), JoyoKanji.Get(character),
                EducationKanji.GetGrade(character), JinmeiyoKanji.IsJinmeiyoKanji(character),
                JinmeiyoKanji.IsNameUsableKanji(character), null);
        }
        catch (Exception)
        {
            return Unavailable("詳細情報を取得できませんでした。再診断してもう一度お試しください。");
        }
    }
}
