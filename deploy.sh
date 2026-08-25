#!/usr/bin/env bash
# 创建 GitHub 公开仓库 —— 使用 JSON 文件 payload,避开中文编码问题
cd /d/HermesTeam/xiaolongbao-home || exit 1

CRED=$(cat ~/.git-credentials | grep -i github.com | head -1)
USER=$(echo "$CRED" | sed -E 's#https://([^:]+):.*#\1#')
TOKEN=$(echo "$CRED" | sed -E 's#https://[^:]+:([^@]+)@.*#\1#')

echo "== 用 $USER 创建仓库 =="
curl -s -X POST "https://api.github.com/user/repos" \
  -u "$USER:$TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary "@repo_payload.json" \
  -o "$LOCALAPPDATA/Temp/repo_created.json" -w "HTTP %{http_code}\n"

echo "== 返回 =="
cat "$LOCALAPPDATA/Temp/repo_created.json" | head -30

echo "== 设置 remote 并推送 =="
git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/$USER/xiaolongbao-home.git"
git branch -M main
git push -u origin main 2>&1 | tail -10
echo "== 完成 =="
