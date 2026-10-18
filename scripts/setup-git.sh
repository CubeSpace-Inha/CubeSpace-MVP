#!/usr/bin/env bash
# 팀 공통 git 설정(git-settings.txt)을 전역 설정에 넣는다. 넣기 전에 지금 값을 홈 폴더에 백업한다.
set -euo pipefail
settings="$(dirname "$0")/git-settings.txt"
backup="$HOME/git-config-backup-$(date +%Y%m%d).txt"

git config --global --list > "$backup" 2>/dev/null || true
echo "지금 전역 설정을 $backup 에 백업했다."

grep -v '^#' "$settings" | grep . | while read -r key value; do
  git config --global "$key" "$value"
done
echo "설정을 넣었다. scripts/verify-git.sh 로 확인한다."
