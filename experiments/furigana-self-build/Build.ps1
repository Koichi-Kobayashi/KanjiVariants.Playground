param([string]$Root = (Join-Path $PSScriptRoot '../..'), [switch]$Repeat)
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path -LiteralPath $Root).Path
$source = Join-Path $repo 'artifacts/license-audit/source/lindera-6.2.0'
$output = Join-Path $repo 'artifacts/furigana-self-build'
$lock = Join-Path $source 'Cargo.lock'
if ((Get-FileHash -LiteralPath $lock).Hash.ToLowerInvariant() -ne '6b30d175d6234ad39b8b969101af13834b28545f3eb9801e454002832db18d75') { throw 'Fixed Cargo.lock mismatch' }
$bindgen = Join-Path $output 'tools/wasm-bindgen-0.2.126-x86_64-pc-windows-msvc/wasm-bindgen.exe'
if (!(Test-Path -LiteralPath $bindgen)) { throw 'Prepare the SHA-256 verified official wasm-bindgen CLI 0.2.126 first.' }
if ((Get-FileHash -LiteralPath $bindgen).Hash.ToLowerInvariant() -ne '2d5de73be088f1b53764fb298fe24f9fd44f438fa02e5d208159780b20e858ed') { throw 'Fixed wasm-bindgen CLI mismatch' }
if ($env:RUSTFLAGS -or $env:CARGO_ENCODED_RUSTFLAGS -or $env:RUSTC_WRAPPER -or $env:RUSTC_WORKSPACE_WRAPPER) { throw 'Run with standard compiler flags and without custom compiler wrappers.' }
& (Join-Path $PSScriptRoot 'Inspect-Inputs.ps1') -Root $repo
$suffix = if ($Repeat) { '-repeat' } else { '' }
$commandArgs = @('+1.98.1','build','--manifest-path',(Join-Path $source 'lindera-wasm/Cargo.toml'),'-p','lindera-wasm','--target','wasm32-unknown-unknown','--release','--no-default-features','--locked','--offline','--target-dir',(Join-Path $output "target$suffix"),'--message-format=json-render-diagnostics')
& cargo @commandArgs > (Join-Path $output "compiler-artifacts$suffix.jsonl")
if ($LASTEXITCODE -ne 0) { throw 'Locked cargo build failed' }
& $bindgen (Join-Path $output "target$suffix/wasm32-unknown-unknown/release/lindera_wasm.wasm") --target web --out-dir (Join-Path $output "pkg$suffix") --out-name lindera_wasm
if ($LASTEXITCODE -ne 0) { throw 'wasm-bindgen transformation failed' }
if ((Get-FileHash -LiteralPath $lock).Hash.ToLowerInvariant() -ne '6b30d175d6234ad39b8b969101af13834b28545f3eb9801e454002832db18d75') { throw 'Cargo.lock changed' }
Write-Output 'Experimental build only. No production assets or publication approval changed.'
