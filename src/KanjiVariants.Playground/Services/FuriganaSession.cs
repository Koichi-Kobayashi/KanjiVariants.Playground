namespace KanjiVariants.Playground.Services;

// Component-owned session: switching screens preserves it, editing creates a new source revision.
public sealed class FuriganaSession(FuriganaService service)
{
    public string Input { get; private set; } = "今日は図書館で大人と宇宙の本を読みます。";
    public KanjiGrade Grade { get; private set; } = KanjiGrade.Grade1;
    public long Revision { get; private set; }
    public FuriganaDocument? Document { get; private set; }
    public bool ShowReadings { get; set; } = true;
    public bool IsCurrent => Document is not null && Document.Revision == Revision;
    public string? Error { get; private set; }

    public void SetInput(string input)
    {
        if (Input == input) return;
        Input = input;
        Revision++;
        Error = null;
    }
    public void SetGrade(KanjiGrade grade)
    {
        if ((int)grade is < 1 or > 6) throw new ArgumentOutOfRangeException(nameof(grade));
        Grade = grade;
        if (IsCurrent) Document!.SetGrade(service.Analyze(Input, Grade));
    }
    public void Generate()
    {
        Error = null;
        try
        {
            var diagnosis = service.Analyze(Input, Grade);
            if (IsCurrent) Document!.SetGrade(diagnosis);
            else Document = new(Revision, diagnosis);
        }
        catch (ArgumentException ex) { Error = ex.Message; }
    }
    private FuriganaDocument Current() => IsCurrent ? Document! : throw new InvalidOperationException("原文が変わっています。対象を確認し直してください。");
    public void SetReading(FuriganaRange range, string reading) => Current().SetReading(range, reading);
    public void Split(FuriganaRange range) => Current().Split(range);
    public void MergeNext(FuriganaRange range) => Current().MergeNext(range);
    public string CopyText() => FuriganaPresentation.CopyText(Current(), ShowReadings);
}
