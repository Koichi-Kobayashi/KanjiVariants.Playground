using System.Text.Json;
using KanjiVariants;
using KanjiVariants.Playground.Services;

internal static class FuriganaAutomaticChecks
{
    public static void Run(Action<bool,string> check)
    {
        var service=new FuriganaService();
        var session=new FuriganaSession(service);
        ReadingToken Token(int start,int end,string surface,string reading,bool unknown=false,bool valid=true) =>
            new(start,end,surface,reading,unknown,valid,Array.Empty<string>());
        session.SetInput("今日と図書館で宇宙の本を読みました。生きる大人。");
        var request=session.BeginAutomatic()!;
        var text=session.Input;
        // Explicit positions in fixtures, never locate repeated tokens by surface search at runtime.
        var tokens=new[] { Token(0,2,"今日","キョウ"),Token(3,6,"図書館","トショカン"),
            Token(7,9,"宇宙","ウチュウ"),Token(10,11,"本","ホン"),Token(12,14,"読み","ヨミ"),
            Token(18,21,"生きる","イキル"),Token(21,23,"大人","オトナ") };
        check(session.ApplyAutomatic(request,tokens),"auto request applied");
        check(session.CopyText()=="今日（きょう）と図書館（としょかん）で宇宙（うちゅう）の本を読（よ）みました。生きる大人。","auto word ruby, kana suffix and learned exclusions");
        var doc=session.Document!;
        check(doc.Ranges.First().Origin==FuriganaReadingOrigin.Automatic,"auto provenance");
        check(doc.Ranges.Single(x=>x.Surface=="読").Reading=="よ","auto safe suffix alignment");
        session.SetReading(doc.Ranges.First(),"こんにち");
        var again=session.BeginAutomatic()!;
        session.ApplyAutomatic(again,tokens);
        check(doc.Ranges.First().Reading=="こんにち"&&doc.Ranges.First().Origin==FuriganaReadingOrigin.Manual,"manual wins over automatic rerun");
        session.SetGrade(KanjiGrade.Grade6);
        check(session.CopyText()==text,"auto grade6 hides all learned ruby");
        session.SetGrade(KanjiGrade.Grade1);
        check(session.CopyText().Contains("図書館（としょかん）"),"auto grade change reuses readings");
        session.ShowReadings=false;check(session.CopyText()==text,"auto OFF copy exact source");session.ShowReadings=true;
        var older=session.BeginAutomatic()!;var newer=session.BeginAutomatic()!;
        check(!session.ApplyAutomatic(older,tokens),"older concurrent request rejected");
        session.SetInput("今日");check(!session.ApplyAutomatic(newer,tokens),"stale source result rejected");
        request=session.BeginAutomatic()!;
        session.SetReading(session.Document!.Ranges[0],"きょう（確認）");
        session.ApplyAutomatic(request,new[]{Token(0,2,"今日","キョウ")});
        check(session.Document.Ranges[0].Reading=="きょう（確認）","editing during request is preserved");
        session.SetReading(session.Document.Ranges[0],"");
        session.ApplyAutomatic(session.BeginAutomatic()!,new[]{Token(0,2,"今日","キョウ")});
        check(session.CopyText()=="今日","manual cleared reading not filled again");
        session.SetInput("髙橋さん");request=session.BeginAutomatic()!;
        session.ApplyAutomatic(request,new[]{Token(0,1,"髙","*",true),Token(1,2,"橋","キョウ")});
        check(session.CopyText()==session.Input&&session.Document!.Ranges[0].ReviewMessage is not null,"unknown kanji neighborhood blocks wrong known fragment");
        session.SetInput("今日。今日");request=session.BeginAutomatic()!;
        session.ApplyAutomatic(request,new[]{Token(0,2,"今日","キョウ"),Token(0,2,"今日","キョウ")});
        check(session.CopyText()==session.Input&&session.Document!.Ranges.All(x=>x.ReviewMessage is not null),"overlapping identical tokens reject whole result");
        session.SetInput("今日");request=session.BeginAutomatic()!;
        session.ApplyAutomatic(request,new[]{Token(-1,2,"今日","キョウ",valid:false)});
        check(session.CopyText()=="今日","invalid conversion has no ruby");
        session.SetInput("辻\U000E0100不\uFE00𠮷\r\n今日 今日 <>&😀");request=session.BeginAutomatic()!;
        session.ApplyAutomatic(request,new[]{Token(0,1,"辻","ツジ"),Token(1,3,"\U000E0100","*",true),Token(3,4,"不","フ"),Token(4,5,"\uFE00","*",true),
            Token(5,7,"𠮷","*",true),Token(9,11,"今日","キョウ"),Token(12,14,"今日","キョウ")});
        check(session.CopyText()=="辻\U000E0100不\uFE00𠮷\r\n今日（きょう） 今日（きょう） <>&😀","auto retains VS, supplementary, repeated text and gaps");
        check(string.Concat(FuriganaPresentation.Build(session.Document!,true).Select(x=>x.Text))==session.Input,"auto preview structured source exact");
        session.SetInput("取り扱い");request=session.BeginAutomatic()!;
        session.ApplyAutomatic(request,new[]{Token(0,4,"取り扱い","トリアツカイ")});
        check(session.Document!.Ranges[0].Surface=="取り扱い","internal kana fallback uses whole word");
        session.Split(session.Document.Ranges[0]);
        check(session.Document.Ranges.Select(x=>x.Surface).SequenceEqual(new[]{"取","扱"}),"manual split of mixed word keeps kana as gaps");
        session.SetInput("今日\uD800");check(session.BeginAutomatic() is null,"invalid UTF16 never reaches engine");
        session.SetInput(new string('あ',2001));check(session.BeginAutomatic() is null,"overlong input never reaches engine");
        // Real P2a token snapshots: no dependency on ignored vendor or benchmark output.
        var fixtures=JsonSerializer.Deserialize<Fixture[]>(File.ReadAllText(Path.Combine(AppContext.BaseDirectory,"FuriganaAutomaticTokens.json")),new JsonSerializerOptions{PropertyNameCaseInsensitive=true})!;
        foreach(var fixture in fixtures)foreach(var grade in Enum.GetValues<KanjiGrade>())
        {
            var document=new FuriganaDocument(0,service.Analyze(fixture.Text,grade));
            document.ApplyAutomatic(fixture.Tokens);
            var parts=FuriganaPresentation.Build(document,true);
            check(string.Concat(parts.Select(x=>x.Text))==fixture.Text,"actual P2a source preserved across grades");
            foreach(var range in document.Ranges.Where(x=>x.Origin==FuriganaReadingOrigin.Automatic))
                check(range.Surface==fixture.Text.Substring(range.Start,range.Length),"actual P2a range/source identity");
            foreach(var part in parts.Where(x=>x.Reading is not null))
                check(document.Ranges.Any(r=>r.Surface==part.Text&&document.UnlearnedCount(r)>0),"actual P2a only unlearned displayed");
        }
    }
    private sealed record Fixture(string Text,ReadingToken[] Tokens);
}
