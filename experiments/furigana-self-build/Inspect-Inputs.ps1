param([string]$Root = (Join-Path $PSScriptRoot '../..'), [string]$SourceDirectory)
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path -LiteralPath $Root).Path
$archivePath = Join-Path $repo 'artifacts/license-audit/lindera-v6.2.0.zip'
$fixedSourcePath = Join-Path $repo 'artifacts/license-audit/source/lindera-6.2.0'
if ($SourceDirectory) { $fixedSourcePath = (Resolve-Path -LiteralPath $SourceDirectory).Path }
$output = Join-Path $repo 'artifacts/furigana-self-build'
New-Item -ItemType Directory -Force -Path $output | Out-Null
if ((Get-FileHash -LiteralPath $archivePath).Hash.ToLowerInvariant() -ne 'f8aa68d5714f0fa17c793a8686d2fb7abef284e336c78c1895837e52c26613c4') { throw 'Fixed source archive mismatch' }
$archive = [System.IO.Compression.ZipFile]::OpenRead($archivePath)
$checkedSourceFiles = 0
try {
    foreach ($entry in $archive.Entries) {
        if (!$entry.Name) { continue }
        $relativeName = $entry.FullName.Substring($entry.FullName.IndexOf('/') + 1)
        $sourceFilePath = Join-Path $fixedSourcePath $relativeName
        $stream = $entry.Open()
        try { $entryHash = [Convert]::ToHexString([System.Security.Cryptography.SHA256]::HashData($stream)).ToLowerInvariant() } finally { $stream.Dispose() }
        if ((Get-FileHash -LiteralPath $sourceFilePath).Hash.ToLowerInvariant() -ne $entryHash) { throw "Source differs from fixed archive: $relativeName" }
        $checkedSourceFiles++
    }
} finally { $archive.Dispose() }
@{filesChecked=$checkedSourceFiles;allMatched=$true;sourceArchiveSha256=(Get-FileHash -LiteralPath $archivePath).Hash.ToLowerInvariant()} | ConvertTo-Json | Set-Content -Encoding utf8 (Join-Path $output 'source-comparison.json')
$toolchainRoot = (& rustc +1.98.1 --print sysroot)
if ($LASTEXITCODE -ne 0) { throw 'Fixed Rust toolchain unavailable' }
Get-ChildItem -LiteralPath (Join-Path $toolchainRoot 'lib/rustlib/wasm32-unknown-unknown/lib') -File | ForEach-Object { @{file=$_.Name;bytes=$_.Length;sha256=(Get-FileHash -LiteralPath $_.FullName).Hash.ToLowerInvariant()} } | ConvertTo-Json -Depth 4 | Set-Content -Encoding utf8 (Join-Path $output 'standard-library-artifacts.json')
Write-Output "Fixed archive matches $checkedSourceFiles source files. Target standard-library input hashes recorded; not a complete SBOM."
