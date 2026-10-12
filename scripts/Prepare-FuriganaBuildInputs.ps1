# Maintainer rebuild preparation; Pages CI uses the reviewed, checked-in artifacts.
param([string]$Root = (Join-Path $PSScriptRoot '..'), [switch]$FetchCrates)
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path -LiteralPath $Root).Path
$audit = Join-Path $repo 'artifacts/license-audit'
$output = Join-Path $repo 'artifacts/furigana-self-build'
New-Item -ItemType Directory -Force -Path $audit,$output | Out-Null
function Get-PinnedArchive([string]$Url,[string]$File,[string]$Expected) {
    if (!(Test-Path -LiteralPath $File)) { Invoke-WebRequest -Uri $Url -OutFile $File }
    if ((Get-FileHash -LiteralPath $File).Hash.ToLowerInvariant() -ne $Expected) { throw "Unreviewed archive: $File" }
}
$sourceZip = Join-Path $audit 'lindera-v6.2.0.zip'
Get-PinnedArchive 'https://github.com/lindera/lindera/archive/refs/tags/v6.2.0.zip' $sourceZip 'f8aa68d5714f0fa17c793a8686d2fb7abef284e336c78c1895837e52c26613c4'
$source = Join-Path $audit 'source/lindera-6.2.0'
if (!(Test-Path -LiteralPath $source)) { Expand-Archive -LiteralPath $sourceZip -DestinationPath (Join-Path $audit 'source') }
$cliZip = Join-Path $output 'bindgen-cli.tar.gz'
Get-PinnedArchive 'https://github.com/wasm-bindgen/wasm-bindgen/releases/download/0.2.126/wasm-bindgen-0.2.126-x86_64-pc-windows-msvc.tar.gz' $cliZip '5a3773c7e69cfb2d865e235e9210de184c8c3af1787720646ec1a8bbe09c6179'
$tools = Join-Path $output 'tools'
if (!(Test-Path -LiteralPath (Join-Path $tools 'wasm-bindgen-0.2.126-x86_64-pc-windows-msvc/wasm-bindgen.exe'))) {
    New-Item -ItemType Directory -Force -Path $tools | Out-Null
    tar -xzf $cliZip -C $tools
    if ($LASTEXITCODE -ne 0) { throw 'CLI extraction failed' }
}
& (Join-Path $repo 'experiments/furigana-self-build/Inspect-Inputs.ps1') -Root $repo
$lockPath = Join-Path $source 'Cargo.lock'
$lockHash = (Get-FileHash -LiteralPath $lockPath).Hash.ToLowerInvariant()
if ($lockHash -ne '6b30d175d6234ad39b8b969101af13834b28545f3eb9801e454002832db18d75') { throw 'Fixed lock mismatch' }
if ($FetchCrates) {
    # Online preparation is separate from the subsequent --locked --offline build.
    cargo +1.98.1 fetch --manifest-path (Join-Path $source 'lindera-wasm/Cargo.toml') --locked --target wasm32-unknown-unknown
    if ($LASTEXITCODE -ne 0) { throw 'Locked workspace crate preparation failed' }
}
$cargoRoot = if ($env:CARGO_HOME) { $env:CARGO_HOME } else { Join-Path $env:USERPROFILE '.cargo' }
$archives = @{}
Get-ChildItem -LiteralPath (Join-Path $cargoRoot 'registry/cache') -Recurse -Filter '*.crate' | ForEach-Object { $archives[$_.Name] = $_ }
$verified = 0
foreach ($block in ((Get-Content -LiteralPath $lockPath -Raw) -split '\[\[package\]\]')) {
    if ($block -notmatch '(?m)^checksum = "([a-f0-9]+)"') { continue }
    $checksum = $Matches[1]
    $null = $block -match '(?m)^name = "([^"]+)"'; $name = $Matches[1]
    $null = $block -match '(?m)^version = "([^"]+)"'; $version = $Matches[1]
    $archive = $archives["$name-$version.crate"]
    if (!$archive) { continue }
    if ((Get-FileHash -LiteralPath $archive.FullName).Hash.ToLowerInvariant() -ne $checksum) { throw "Cargo.lock checksum mismatch: $name $version" }
    $verified++
}
if ((Get-FileHash -LiteralPath $lockPath).Hash.ToLowerInvariant() -ne $lockHash) { throw 'Cargo.lock was rewritten' }
Write-Output "Prepared fixed inputs; $verified cached archives matched Cargo.lock. The offline build will fail on any missing required input."
Write-Output 'The build derives textual native and slash-form remap prefixes from these input locations; do not supply extra RUSTFLAGS or compiler wrappers.'
