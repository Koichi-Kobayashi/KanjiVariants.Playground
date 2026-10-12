using System.Text.Json;
using KanjiVariants;
var root = Path.GetFullPath(args.Length > 0 ? args[0] : "experiments/furigana-p2a");
using var cases = JsonDocument.Parse(File.ReadAllText(Path.Combine(root, "cases.json")));
var results = new Dictionary<string, object>();
foreach (var item in cases.RootElement.EnumerateArray())
{
    var id = item.GetProperty("id").GetString()!;
    if (id.StartsWith("invalid-")) continue; // Browser boundary guard is tested directly for these.
    var text = item.GetProperty("text").GetString()!;
    results[id] = Enumerable.Range(1, 6).Select(grade => EducationKanjiDiagnostics.AnalyzeText(text, (KanjiGrade)grade)).ToArray();
}
Directory.CreateDirectory(Path.Combine(root, "generated"));
File.WriteAllText(Path.Combine(root, "generated", "education.json"), JsonSerializer.Serialize(results,
    new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
Console.WriteLine($"Generated actual KanjiVariants 1.2.0 education diagnostics for {results.Count} cases × six grades.");
