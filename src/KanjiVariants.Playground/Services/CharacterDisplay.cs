namespace KanjiVariants.Playground.Services;

public static class CharacterDisplay
{
    // 表示専用のUnicode VS範囲。登録の判定・論理単位の分割・基底文字への変換には使わない。
    public static IReadOnlyList<int> VariationSelectorCodePoints(string text) => Array.AsReadOnly(text.EnumerateRunes()
        .Where(x => x.Value is >= 0xFE00 and <= 0xFE0F or >= 0xE0100 and <= 0xE01EF)
        .Select(x => x.Value).ToArray());
    // 表示専用。変換・比較・論理単位の分割には使わない。不正なUTF-16をU+FFFDと誤表示しない。
    public static string CodePoints(string text, KanjiDiagnosticReason reason = KanjiDiagnosticReason.Supported) =>
        reason == KanjiDiagnosticReason.InvalidUtf16 ? "不正UTF-16（Unicodeスカラーなし）"
        : string.Join(" ", text.EnumerateRunes().Select(x => $"U+{x.Value:X4}"));

    public static string Visible(string text, KanjiDiagnosticReason reason) =>
        reason == KanjiDiagnosticReason.InvalidUtf16 ? "不正UTF-16"
        : text switch { " " => "空白", "\r" => "CR", "\n" => "LF", "\t" => "TAB", "\0" => "NUL", _ => text };

    public static string ChangeReason(KanjiDiagnosticReason reason) => reason switch
    {
        KanjiDiagnosticReason.MjUniqueMappingAvailable => "MJ縮退（一意な変換先）",
        KanjiDiagnosticReason.VariationSelectorFallbackAvailable => "IVS/SVSの基底文字へのフォールバック",
        _ => "ライブラリが返した置換（種別不明）"
    };
}
