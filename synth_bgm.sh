#!/usr/bin/env bash
# 星云电子氛围音 v5 —— 只用手都支持的标准参数,确保能跑
# 不可谐和正弦拍频 + 粉噪底噪 + 低通/高通 + 混响
cd /d/HermesTeam/xiaolongbao-home || exit 1
mkdir -p public/audio

ffmpeg -y \
  -f lavfi -i "sine=frequency=55:duration=32" \
  -f lavfi -i "sine=frequency=61.5:duration=32" \
  -f lavfi -i "sine=frequency=68:duration=32" \
  -f lavfi -i "sine=frequency=432:duration=32" \
  -f lavfi -i "sine=frequency=540:duration=32" \
  -f lavfi -i "anoisesrc=color=pink:amplitude=0.3:duration=32" \
  -filter_complex "\
[0][1][2]amix=inputs=3:weights=1 0.85 0.68,lowpass=f=210[drone];\
[5]highpass=f=900,volume=0.65[noise];\
[3]volume=0.4[a];\
[4]volume=0.28[b];\
[drone][noise][a][b]amix=inputs=4:weights=1 0.5 0.4 0.26[mix];\
[mix]tremolo=f=0.12:d=0.5,aecho=0.7:0.45:220|440|720:0.42|0.28|0.18,afade=t=in:st=0:d=3.5,afade=t=out:st=28:d=4,volume=0.5" \
  public/audio/starfield.mp3 2>&1 | tail -3
echo "---"
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 public/audio/starfield.mp3 2>/dev/null
