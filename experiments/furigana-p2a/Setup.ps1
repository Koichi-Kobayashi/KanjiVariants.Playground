$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
Set-Location $PSScriptRoot
New-Item -ItemType Directory -Force vendor, vendor/lindera, vendor/kuromoji, results | Out-Null
$downloads = @(
    @{ Url='https://registry.npmjs.org/lindera-wasm/-/lindera-wasm-6.2.0.tgz'; File='vendor/lindera-wasm-6.2.0.tgz' },
    @{ Url='https://registry.npmjs.org/kuromoji/-/kuromoji-0.1.2.tgz'; File='vendor/kuromoji-0.1.2.tgz' },
    @{ Url='https://github.com/lindera/lindera/releases/download/v6.2.0/lindera-ipadic-6.2.0.zip'; File='vendor/lindera-ipadic-6.2.0.zip' }
)
foreach ($entry in $downloads) {
    if (!(Test-Path $entry.File)) { Invoke-WebRequest $entry.Url -OutFile $entry.File }
}
$dictionaryHash = (Get-FileHash vendor/lindera-ipadic-6.2.0.zip -Algorithm SHA256).Hash.ToLowerInvariant()
if ($dictionaryHash -ne '5ed4bba6b429030b0387df67d40d5751d35dedef0306f4bac6d957cad5f04b72') { throw 'Dictionary SHA-256 mismatch' }
foreach ($entry in @(@{Name='lindera-wasm';Version='6.2.0'},@{Name='kuromoji';Version='0.1.2'})) {
    $metadata = Invoke-RestMethod ('https://registry.npmjs.org/' + $entry.Name + '/' + $entry.Version)
    $metadata | ConvertTo-Json -Depth 12 | Set-Content -Encoding utf8NoBOM ('vendor/' + $entry.Name + '-metadata.json')
    $bytes = [IO.File]::ReadAllBytes((Join-Path $PSScriptRoot ('vendor/' + $entry.Name + '-' + $entry.Version + '.tgz')))
    $actual = 'sha512-' + [Convert]::ToBase64String([Security.Cryptography.SHA512]::HashData($bytes))
    if ($actual -ne $metadata.dist.integrity) { throw ('npm integrity mismatch: ' + $entry.Name) }
}
tar -xf vendor/lindera-wasm-6.2.0.tgz -C vendor/lindera
if ($LASTEXITCODE) { throw 'Lindera extraction failed' }
tar -xf vendor/kuromoji-0.1.2.tgz -C vendor/kuromoji
if ($LASTEXITCODE) { throw 'Kuromoji extraction failed' }
Expand-Archive vendor/lindera-ipadic-6.2.0.zip vendor/ipadic -Force
# Version-pinned official source documents, separate from the npm artifact.
$sourceFiles = @{
    'lindera-README.md'='https://raw.githubusercontent.com/lindera/lindera/v6.2.0/lindera-wasm/README.md'
    'lindera-Cargo.toml'='https://raw.githubusercontent.com/lindera/lindera/v6.2.0/lindera-wasm/Cargo.toml'
    'lindera-ipadic-build.rs'='https://raw.githubusercontent.com/lindera/lindera/v6.2.0/lindera-ipadic/build.rs'
    'lindera-LICENSE'='https://raw.githubusercontent.com/lindera/lindera/v6.2.0/LICENSE'
}
foreach ($name in $sourceFiles.Keys) { Invoke-WebRequest $sourceFiles[$name] -OutFile ('vendor/' + $name) }
node prepare.mjs
if ($LASTEXITCODE) { throw 'Asset measurement failed' }
dotnet run --project EducationFixtures -- $PSScriptRoot
if ($LASTEXITCODE) { throw 'Education fixtures failed' }
