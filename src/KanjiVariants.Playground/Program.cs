using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using KanjiVariants.Playground;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddSingleton<KanjiVariants.Playground.Services.DiagnosticService>();
builder.Services.AddSingleton<KanjiVariants.Playground.Services.FuriganaService>();
builder.Services.AddScoped<KanjiVariants.Playground.Services.IReadingAnalyzer, KanjiVariants.Playground.Services.LinderaReadingAnalyzer>();
builder.Services.AddSingleton<KanjiVariants.Playground.Services.CharacterDetailsService>();
builder.Services.AddSingleton<KanjiVariants.Playground.Services.ConversionService>();
builder.Services.AddScoped<KanjiVariants.Playground.Services.ClipboardService>();

await builder.Build().RunAsync();
