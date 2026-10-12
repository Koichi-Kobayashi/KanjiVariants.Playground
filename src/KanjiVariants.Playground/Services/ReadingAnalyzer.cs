using Microsoft.JSInterop;
using Microsoft.AspNetCore.Components;

namespace KanjiVariants.Playground.Services;

public interface IReadingAnalyzer
{
    bool IsInitialized { get; }
    Task<IReadOnlyList<ReadingToken>> AnalyzeAsync(string text);
}

public sealed class LinderaReadingAnalyzer(IJSRuntime js, NavigationManager navigation) : IReadingAnalyzer, IAsyncDisposable
{
    private Task<IJSObjectReference>? module;
    public bool IsInitialized { get; private set; }
    public async Task<IReadOnlyList<ReadingToken>> AnalyzeAsync(string text)
    {
        module ??= js.InvokeAsync<IJSObjectReference>("import", new Uri(new Uri(navigation.BaseUri), "js/furigana-client.js").AbsoluteUri).AsTask();
        try
        {
            var reference = await module;
            var tokens = await reference.InvokeAsync<ReadingToken[]>("analyze", text);
            IsInitialized = true;
            return tokens;
        }
        catch
        {
            IsInitialized = false;
            // A failed module import may be retried; the JS bridge resets a failed worker.
            if (module.IsFaulted) module = null;
            throw;
        }
    }
    public async ValueTask DisposeAsync()
    {
        if (module is null || !module.IsCompletedSuccessfully) return;
        try { var reference = await module; await reference.InvokeVoidAsync("dispose"); await reference.DisposeAsync(); }
        catch (JSException) { }
    }
}
