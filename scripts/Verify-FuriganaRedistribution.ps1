param([string]$PublishRoot = 'artifacts/publish/wwwroot')
$ErrorActionPreference = 'Stop'
node (Join-Path $PSScriptRoot 'Verify-FuriganaLicenseEvidence.mjs') $PublishRoot
if ($LASTEXITCODE -ne 0) { throw '配布物・監査通知の整合性確認に失敗しました。' }
# The scoped technical check also compares the published manifest/evidence/assets.
# Owner publication approval remains an independent, final condition.
node (Join-Path $PSScriptRoot 'Verify-FuriganaAttestation.mjs') --publish-root $PublishRoot --fetch-inputs --require-publication
if ($LASTEXITCODE -ne 0) { throw '認証または公開承認が未充足のため、アップロード・デプロイを停止します。直前の検証結果を参照してください。' }
Write-Output 'Scoped attestation and independent owner publication approval verified.'
