using Microsoft.JSInterop;

namespace KanjiVariants.Playground.Services;

public sealed class ClipboardService(IJSRuntime js)
{
    public async Task<bool> CopyAsync(string text)
    {
        try { await js.InvokeVoidAsync("playground.copy", text); return true; }
        catch (JSException) { return false; }
    }
}
