param([string]$PublishRoot = 'artifacts/publish/wwwroot', [string]$BasePath = '/KanjiVariants.Playground/')
$ErrorActionPreference = 'Stop'
if ($BasePath -notmatch '^/[A-Za-z0-9._/-]*/$') { throw 'BasePath must start and end with / and contain only safe path characters.' }
$indexPath = Join-Path $PublishRoot 'index.html'
$html = Get-Content -LiteralPath $indexPath -Raw
if ($html -notmatch '<base href="[^"]*"\s*/?>') { throw 'base href was not found.' }
$html = $html -replace '<base href="[^"]*"\s*/?>', ('<base href="' + $BasePath + '" />')
Set-Content -LiteralPath $indexPath -Value $html -Encoding utf8NoBOM
Set-Content -LiteralPath (Join-Path $PublishRoot '.nojekyll') -Value '' -Encoding utf8NoBOM
# 画面はルートだけ。静的ライセンスページは実ファイルとして配信し、SPAの深い経路を作らない。
