#!/usr/bin/env bash
# 开启 GitHub Pages(从 main 分支,根目录)
cd /d/HermesTeam/xiaolongbao-home || exit 1

CRED=$(cat ~/.git-credentials | grep -i github.com | head -1)
USER=$(echo "$CRED" | sed -E 's#https://([^:]+):.*#\1#')
TOKEN=$(echo "$CRED" | sed -E 's#https://[^:]+:([^@]+)@.*#\1#')

echo "== 开启 GitHub Pages =="
curl -s -X POST "https://api.github.com/repos/$USER/xiaolongbao-home/pages" \
  -u "$USER:$TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -d '{"source":{"branch":"main","path":"/"}}' \
  -o "$LOCALAPPDATA/Temp/pages_result.json" -w "HTTP %{http_code}\n"

echo "== 返回 =="
cat "$LOCALAPPDATA/Temp/pages_result.json" | grep -E '"(status|html_url|url)"' | head -6
echo "== 完成 =="
