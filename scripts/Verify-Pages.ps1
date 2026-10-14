param([string]$PublishRoot = 'artifacts/publish/wwwroot')
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path -LiteralPath $PublishRoot).Path
$html = Get-Content -LiteralPath (Join-Path $root 'index.html') -Raw
if ($html -notmatch '<base href="/KanjiVariants.Playground/"\s*/>') { throw 'Pages base path mismatch.' }
if ($html.Contains('#[.') -or $html.Contains('<script type="importmap"></script>')) { throw 'Unresolved .NET asset placeholders.' }
if (!(Test-Path -LiteralPath (Join-Path $root '.nojekyll'))) { throw '.nojekyll missing.' }
$count = 0
foreach ($page in @('index.html', 'licenses.html')) {
    $content = Get-Content -LiteralPath (Join-Path $root $page) -Raw
    foreach ($match in [regex]::Matches($content, '(?:src|href)="([^"]+)"')) {
        $reference = $match.Groups[1].Value
        if ($reference -match '^(https?:|#|/|\./$)') { continue }
        if (!(Test-Path -LiteralPath (Join-Path $root $reference) -PathType Leaf)) { throw "Missing file: $reference in $page" }
        $count++
    }
}
if ((Get-FileHash THIRD-PARTY-NOTICES/KanjiVariants-1.2.1.md).Hash -ne (Get-FileHash (Join-Path $root 'licenses/KanjiVariants-1.2.1.txt')).Hash) { throw 'KanjiVariants notice mismatch.' }
foreach ($name in @('KanjiVariants-1.2.1-JIS0208.TXT','KanjiVariants-1.2.1-Unicode-LICENSE.txt')) {
    if ((Get-FileHash (Join-Path 'THIRD-PARTY-NOTICES' $name)).Hash -ne (Get-FileHash (Join-Path $root ('licenses/' + $name))).Hash) { throw "KanjiVariants source/license mismatch: $name" }
}
if ((Get-FileHash (Join-Path $root 'licenses/KanjiVariants-1.2.1-JIS0208.TXT')).Hash.ToLowerInvariant() -ne '1c571870457f19c97720631fa83ee491549a96ba1436da1296786a67d8632e87') { throw 'Fixed JIS0208 source hash mismatch.' }
if (Get-ChildItem -LiteralPath (Join-Path $root 'licenses') -Filter 'KanjiVariants-1.2.0*') { throw 'Old KanjiVariants notices in publish.' }
$files = Get-ChildItem -LiteralPath (Join-Path $root '_framework') -File
$raw = ($files | Where-Object { $_.Extension -notin @('.br','.gz') } | Measure-Object Length -Sum).Sum
$brotli = ($files | Where-Object Extension -eq '.br' | Measure-Object Length -Sum).Sum
$kanji = $files | Where-Object { $_.Name -like 'KanjiVariants.*.wasm*' -and $_.Name -notlike 'KanjiVariants.Playground.*' }
"Static references verified: $count"
"Framework raw total: $raw bytes (all ICU variants included, not initial transfer size)"
"Framework Brotli total: $brotli bytes (potential compressed size; host negotiation required)"
$kanji | Select-Object Name,Length
