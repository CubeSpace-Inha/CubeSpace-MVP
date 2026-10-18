# git-settings.txt와 다른 설정만 출력한다. 아무것도 출력하지 않으면 끝.
# Windows PowerShell 5.1이 한글을 읽도록 UTF-8 BOM으로 저장한다.
$settings = Join-Path $PSScriptRoot 'git-settings.txt'
$status = 0

Get-Content $settings | Where-Object { $_ -and -not $_.StartsWith('#') } | ForEach-Object {
  $key, $expected = $_ -split '\s+', 2
  $actual = git config --get $key
  if ($actual -ne $expected) {
    Write-Output "다름: $key = '$actual' (기대: '$expected')"
    $script:status = 1
  }
}
exit $status
