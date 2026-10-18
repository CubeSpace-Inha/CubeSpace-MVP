# 팀 공통 git 설정(git-settings.txt)을 전역 설정에 넣는다. 넣기 전에 지금 값을 홈 폴더에 백업한다.
# Windows PowerShell 5.1이 한글을 읽도록 UTF-8 BOM으로 저장한다.
$settings = Join-Path $PSScriptRoot 'git-settings.txt'
$backup = Join-Path $HOME "git-config-backup-$(Get-Date -Format yyyyMMdd).txt"

git config --global --list 2>$null | Out-File -Encoding utf8 $backup
Write-Output "지금 전역 설정을 $backup 에 백업했다."

Get-Content $settings | Where-Object { $_ -and -not $_.StartsWith('#') } | ForEach-Object {
  $key, $value = $_ -split '\s+', 2
  git config --global $key $value
}
Write-Output '설정을 넣었다. scripts\verify-git.ps1 로 확인한다.'
