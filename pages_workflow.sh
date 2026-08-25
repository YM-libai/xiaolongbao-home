#!/usr/bin/env bash
# 把 GitHub Pages 部署源改为 GitHub Actions,并验证 Actions 运行
cd /d/HermesTeam/xiaolongbao-home || exit 1
CRED=$(cat ~/.git-credentials | grep -i github.com | head -1)
USER=$(echo "$CRED" | sed -E 's#https://([^:]+):.*#\1#')
TOKEN=$(echo "$CRED" | sed -E 's#https://[^:]+:([^@]+)@.*#\1#')

echo "== 当前 Pages 配置 =="
curl -s "https://api.github.com/repos/$USER/xiaolongbao-home/pages" \
  -u "$USER:$TOKEN" -H "Accept: application/vnd.github+json" \
  -o "$LOCALAPPDATA/Temp/pages_check.json" -w "HTTP %{http_code}\n"
grep -E '"(source|branch|build_type|status|html_url)"' "$LOCALAPPDATA/Temp/pages_check.json" | head -8

echo ""
echo "== 将 Pages 构建类型改为 github-actions =="
curl -s -X PUT "https://api.github.com/repos/$USER/xiaolongbao-home/pages" \
  -u "$USER:$TOKEN" -H "Accept: application/vnd.github+json" \
  -d '{"build_type":"workflow"}' \
  -o "$LOCALAPPDATA/Temp/pages_update.json" -w "HTTP %{http_code}\n"
grep -E '"(build_type|status|html_url)"' "$LOCALAPPDATA/Temp/pages_update.json" | head -6
echo "== 完成 =="
