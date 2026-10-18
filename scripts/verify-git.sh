#!/usr/bin/env bash
# git-settings.txt와 다른 설정만 출력한다. 아무것도 출력하지 않으면 끝.
settings="$(dirname "$0")/git-settings.txt"
status=0

while read -r key expected; do
  actual="$(git config --get "$key")"
  if [ "$actual" != "$expected" ]; then
    echo "다름: $key = '$actual' (기대: '$expected')"
    status=1
  fi
done < <(grep -v '^#' "$settings" | grep .)
exit $status
