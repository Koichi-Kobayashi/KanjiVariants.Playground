$ErrorActionPreference = 'Stop'
$manifest = Get-Content (Join-Path $PSScriptRoot '../src/KanjiVariants.Playground/wwwroot/furigana/lindera-6.2.0/manifest.json') -Raw | ConvertFrom-Json
if ($manifest.publicationApproved -ne $true -or $manifest.publicationBlockers.Count -ne 0) {
    throw ('自動ふりがなの公開条件が未解決です。公開を停止します: ' + ($manifest.publicationBlockers -join ' / '))
}
Write-Output 'Furigana redistribution approval verified.'
