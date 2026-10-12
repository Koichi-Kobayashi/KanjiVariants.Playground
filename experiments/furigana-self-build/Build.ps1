param([string]$Root = (Join-Path $PSScriptRoot '../..'), [switch]$Repeat, [switch]$Candidate, [string]$CargoHome, [string]$SourceDirectory)
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path -LiteralPath $Root).Path
$source = Join-Path $repo 'artifacts/license-audit/source/lindera-6.2.0'
if ($SourceDirectory) { $source = (Resolve-Path -LiteralPath $SourceDirectory).Path }
$output = Join-Path $repo 'artifacts/furigana-self-build'
$lock = Join-Path $source 'Cargo.lock'
if ((Get-FileHash -LiteralPath $lock).Hash.ToLowerInvariant() -ne '6b30d175d6234ad39b8b969101af13834b28545f3eb9801e454002832db18d75') { throw 'Fixed Cargo.lock mismatch' }
$bindgen = Join-Path $output 'tools/wasm-bindgen-0.2.126-x86_64-pc-windows-msvc/wasm-bindgen.exe'
if (!(Test-Path -LiteralPath $bindgen)) { throw 'Prepare the SHA-256 verified official wasm-bindgen CLI 0.2.126 first.' }
if ((Get-FileHash -LiteralPath $bindgen).Hash.ToLowerInvariant() -ne '2d5de73be088f1b53764fb298fe24f9fd44f438fa02e5d208159780b20e858ed') { throw 'Fixed wasm-bindgen CLI mismatch' }
if ($env:RUSTFLAGS -or $env:CARGO_ENCODED_RUSTFLAGS -or $env:RUSTC_WRAPPER -or $env:RUSTC_WORKSPACE_WRAPPER) { throw 'Run with standard compiler flags and without custom compiler wrappers.' }
& (Join-Path $PSScriptRoot 'Inspect-Inputs.ps1') -Root $repo -SourceDirectory $source
$suffix = if ($Repeat) { '-repeat' } else { '' }
$targetDirectory = Join-Path $output "target-normalized$suffix"
$cargoRoot = if ($CargoHome) { (Resolve-Path -LiteralPath $CargoHome).Path } elseif ($env:CARGO_HOME) { (Resolve-Path -LiteralPath $env:CARGO_HOME).Path } else { Join-Path $env:USERPROFILE '.cargo' }
$toolchainRoot = (& rustc +1.98.1 --print sysroot)
$mapping = @(@($repo,'/src/playground'),@($targetDirectory,'/build/target'),@($source,'/src/lindera'),@($cargoRoot,'/cargo'),@($toolchainRoot,'/rust/toolchain'))
foreach ($registry in (Get-ChildItem -LiteralPath (Join-Path $cargoRoot 'registry/src') -Directory)) { $mapping += ,@($registry.FullName,'/cargo/registry') }
$flags = @()
foreach ($pair in $mapping) {
    foreach ($spelling in @($pair[0],$pair[0].Replace('\','/')) | Select-Object -Unique) { $flags += "--remap-path-prefix=$spelling=$($pair[1])" }
}
$previousCargoHome = $env:CARGO_HOME
$previousEncodedFlags = $env:CARGO_ENCODED_RUSTFLAGS
try {
    $env:CARGO_HOME = $cargoRoot
    $env:CARGO_ENCODED_RUSTFLAGS = $flags -join [char]31
    $commandArgs = @('+1.98.1','build','--manifest-path',(Join-Path $source 'lindera-wasm/Cargo.toml'),'-p','lindera-wasm','--target','wasm32-unknown-unknown','--release','--no-default-features','--locked','--offline','--target-dir',$targetDirectory,'--message-format=json-render-diagnostics','-vv')
    & cargo @commandArgs > (Join-Path $output "compiler-artifacts-normalized$suffix.jsonl") 2> (Join-Path $output "compiler-commands-normalized$suffix.log")
    if ($LASTEXITCODE -ne 0) { throw 'Locked normalized cargo build failed; see compiler command log' }
} finally { $env:CARGO_HOME = $previousCargoHome; $env:CARGO_ENCODED_RUSTFLAGS = $previousEncodedFlags }
if ($LASTEXITCODE -ne 0) { throw 'Locked cargo build failed' }
& $bindgen (Join-Path $targetDirectory 'wasm32-unknown-unknown/release/lindera_wasm.wasm') --target web --out-dir (Join-Path $output "pkg-normalized$suffix") --out-name lindera_wasm
if ($LASTEXITCODE -ne 0) { throw 'wasm-bindgen transformation failed' }
& node (Join-Path $repo 'scripts/Verify-FuriganaPaths.mjs') (Join-Path $output "pkg-normalized$suffix/lindera_wasm_bg.wasm") (Join-Path $output "pkg-normalized$suffix/lindera_wasm.js")
if ($LASTEXITCODE -ne 0) { throw 'Artifact privacy/path inspection failed' }
if (!$Candidate) {
    & node (Join-Path $repo 'scripts/Verify-FuriganaBuildOutput.mjs') (Join-Path $output "pkg-normalized$suffix")
    if ($LASTEXITCODE -ne 0) { throw 'Unreviewed output; investigate differences instead of adopting automatically.' }
}
if ((Get-FileHash -LiteralPath $lock).Hash.ToLowerInvariant() -ne '6b30d175d6234ad39b8b969101af13834b28545f3eb9801e454002832db18d75') { throw 'Cargo.lock changed' }
Write-Output 'Experimental build only. No production assets or publication approval changed.'
