$ErrorActionPreference = 'Stop'
node (Join-Path $PSScriptRoot 'Verify-FuriganaLicenseEvidence.mjs')
if ($LASTEXITCODE -ne 0) { throw '自動ふりがなの配布物・監査通知の整合性確認に失敗しました。' }
$manifest = Get-Content (Join-Path $PSScriptRoot '../src/KanjiVariants.Playground/wwwroot/furigana/lindera-6.2.0/manifest.json') -Raw | ConvertFrom-Json
if ($manifest.licenseAudit.noticeFulfillment.status -ne 'satisfied-for-fixed-source-scope' -or $manifest.licenseAudit.noticeFulfillment.unresolved.Count -ne 0) {
    throw ('確認した依存範囲の必要通知が未充足です: ' + ($manifest.licenseAudit.noticeFulfillment.unresolved -join ' / '))
}
Write-Output '確認した固定ソース依存範囲の必要通知: 充足。kanariaの通知不足は解消。'
if ($manifest.licenseAudit.sbomCompleteness.status -ne 'verified' -or $manifest.licenseAudit.binaryAttested -ne $true) {
    throw ('SBOM・実バイナリ対応の確認が未完了のため、公開前監査基準で停止します。完全SBOMがライセンス本文の要求という判断ではありません: ' + ($manifest.publicationBlockers -join ' / '))
}
if ($manifest.publicationApproved -ne $true -or $manifest.publicationBlockers.Count -ne 0 -or $manifest.licenseAudit.status -ne 'approved' -or $manifest.licenseAudit.binaryAttested -ne $true) {
    throw ('自動ふりがなの公開条件が未解決です。公開を停止します: ' + ($manifest.publicationBlockers -join ' / '))
}
Write-Output 'Furigana redistribution approval verified.'
