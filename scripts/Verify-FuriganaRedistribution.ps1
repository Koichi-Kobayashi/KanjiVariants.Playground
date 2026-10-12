$ErrorActionPreference = 'Stop'
node (Join-Path $PSScriptRoot 'Verify-FuriganaLicenseEvidence.mjs')
if ($LASTEXITCODE -ne 0) { throw '自動ふりがなの配布物・監査通知の整合性確認に失敗しました。' }
$manifest = Get-Content (Join-Path $PSScriptRoot '../src/KanjiVariants.Playground/wwwroot/furigana/lindera-6.2.0/manifest.json') -Raw | ConvertFrom-Json
if ($manifest.licenseAudit.noticeFulfillment.status -ne 'satisfied-for-fixed-source-scope' -or $manifest.licenseAudit.noticeFulfillment.unresolved.Count -ne 0) {
    throw ('確認した依存範囲の必要通知が未充足です: ' + ($manifest.licenseAudit.noticeFulfillment.unresolved -join ' / '))
}
Write-Output '確認した固定ソース依存範囲の必要通知: 充足。kanariaの通知不足は解消。'
if ($manifest.buildOrigin -ne 'self-built' -or $manifest.licenseAudit.buildProvenance.status -ne 'recorded-self-build') {
    throw '採用した自前WASMのビルド来歴がありません。'
}
Write-Output '採用した自前WASMの固定ソース・lock・コンパイル依存記録・通知の検証: 成功。完全バイナリSBOMの証明とは区別します。'
if ($manifest.publicationApproved -ne $true) {
    throw 'publicationApproved=false のため公開を停止します。自前WASM採用と公開承認は別工程です。'
}
if ($manifest.licenseAudit.sbomCompleteness.status -ne 'verified' -or $manifest.licenseAudit.binaryAttested -ne $true) {
    throw '公開承認フラグだけでは未確認のバイナリ対応を承認できません。監査状態の独立した確認が必要です。'
}
if ($manifest.publicationApproved -ne $true -or $manifest.publicationBlockers.Count -ne 0 -or $manifest.licenseAudit.status -ne 'approved' -or $manifest.licenseAudit.binaryAttested -ne $true) {
    throw ('自動ふりがなの公開条件が未解決です。公開を停止します: ' + ($manifest.publicationBlockers -join ' / '))
}
Write-Output 'Furigana redistribution approval verified.'
