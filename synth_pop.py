#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""仿流行英文歌气质的背景乐 —— 合成合成器(数据驱动,结构清晰)
C-G-Am-F 经典进行 + 4/4 鼓组 + 五声旋律 + 贝斯
输出: public/audio/starfield.mp3 (经 ffmpeg 转码)
"""
import numpy as np
from scipy.io import wavfile

SR = 44100

# ---------- 波形 ----------
def env_ad(n, attack, release):
    e = np.ones(n)
    a = int(SR*attack); r = int(SR*release)
    if a > 0: e[:a] = np.linspace(0, 1, a)
    if r > 0: e[-r:] = np.linspace(1, 0, r)
    return np.minimum(e, 1)

def sine(freq, dur, amp=0.5, attack=0.008, release=0.12):
    n = int(SR*dur); t = np.linspace(0, dur, n, False)
    return (np.sin(2*np.pi*freq*t) * env_ad(n, attack, release) * amp).astype(np.float32)

def saw(freq, dur, amp=0.22, attack=0.03, release=0.25):
    n = int(SR*dur); t = np.linspace(0, dur, n, False)
    wave = np.zeros(n)
    for k in range(1, 9):
        wave += np.sin(2*np.pi*freq*k*t)/k
    m = np.max(np.abs(wave)); wave = wave/m if m > 0 else wave
    return (wave * env_ad(n, attack, release) * amp).astype(np.float32)

def noise(dur, amp=0.3, attack=0.001, release=0.04, hp=False):
    n = int(SR*dur); x = np.random.randn(n)
    if hp: x = x - np.concatenate(([0], x[:-1]))
    return (x * env_ad(n, attack, release) * amp).astype(np.float32)

# ---------- 频率表 ----------
N = {'G2':98.00,'A2':110.00,'C3':130.81,'F2':87.31,
     'E3':164.81,'F3':174.61,'G3':196.00,'A3':220.00,'B3':246.94,'C4':261.63,
     'D4':293.66,'E4':329.63,'F4':349.23,'G4':392.00,'A4':440.00,'B4':493.88,
     'C5':523.25,'D5':587.33,'E5':659.25,'F5':698.46,'G5':783.99,'A5':880.00}

BPM = 108
BEAT = 60.0/BPM
BAR = BEAT*4

def place(track, sig, start):
    s = int(start*SR); e = min(s+len(sig), len(track))
    if s < len(track): track[s:e] += sig[:e-s]

def kick():
    dur=0.22; n=int(SR*dur); t=np.linspace(0,dur,n,False)
    freq=150*np.exp(-t*22)+45; phase=2*np.pi*np.cumsum(freq)/SR
    return (np.sin(phase)*np.exp(-t*16)*0.9).astype(np.float32)
def snare(): return noise(0.16, amp=0.4, hp=True)
def hihat(): return noise(0.06, amp=0.2, hp=True)

# ---------- 结构: 8 小节 C G Am F | C G Am F ----------
# 和弦 [根音, pad高音, 贝斯根音]
chords = [
    ['C3', ['C4','E4','G4'], 'C3'],
    ['G3', ['G3','B3','D4'], 'G2'],
    ['A3', ['A3','C4','E4'], 'A2'],
    ['F3', ['F3','A3','C4'], 'F2'],
    ['C3', ['C4','E4','G4'], 'C3'],
    ['G3', ['G3','B3','D4'], 'G2'],
    ['A3', ['A3','C4','E4'], 'A2'],
    ['F3', ['F3','A3','C4'], 'F2'],
]
# 主旋律:第二遍略有变化,循环更自然
melody = [
    [('E5',0,0.5),('G5',0.5,0.5),('A5',1,1.0),('G5',2,1.0),('E5',3,1.0)],
    [('D5',0,0.5),('E5',0.5,0.5),('G5',1,1.5),('E5',2.5,1.5)],
    [('A4',0,0.75),('C5',0.75,0.75),('D5',1.5,0.5),('E5',2,1.0),('D5',3,1.0)],
    [('C5',0,1.5),('D5',1.5,0.5),('E5',2,1.5)],
    [('E5',0,0.5),('G5',0.5,0.5),('A5',1,1.0),('A5',2,1.5),('G5',3.5,0.5)],
    [('D5',0,0.5),('E5',0.5,0.5),('G5',1,1.0),('B4',2,1.0),('D5',3,1.0)],
    [('C5',0,0.5),('A4',0.5,0.5),('C5',1,0.5),('D5',1.5,0.5),('E5',2,1.5)],
    [('C5',0,2.0),('G4',2,1.0),('C5',3,1.0)],
]

total = int(SR*(BAR*len(chords) + 0.8))
track = np.zeros(total, dtype=np.float32)

for bar,(root,pads,bass) in enumerate(chords):
    t0 = bar*BAR
    # 和弦 pad(锯齿,柔和)
    for p in pads:
        place(track, saw(N[p], BAR, amp=0.13, attack=0.06, release=0.35), t0)
    # 根音低频
    place(track, saw(N[root], BAR, amp=0.12, attack=0.06, release=0.35), t0)
    # 贝斯(跟根音,低八度,每拍)
    bf = N[bass]/2
    for beat in range(4):
        place(track, sine(bf, BEAT*0.85, amp=0.30, attack=0.005, release=0.08), t0+beat*BEAT)
    # 鼓组
    for beat in range(4):
        place(track, kick(), t0+beat*BEAT)
        if beat in (1,3): place(track, snare(), t0+beat*BEAT)
        place(track, hihat(), t0+beat*BEAT)
        place(track, hihat(), t0+beat*BEAT+BEAT/2)
    # 旋律
    for (note, off, dl) in melody[bar]:
        if note: place(track, sine(N[note], dl*BEAT, amp=0.32, attack=0.01, release=0.1), t0+off*BEAT)

# ---------- 保存 ----------
peak = np.max(np.abs(track))
if peak > 0: track = track/peak*0.85
fade = int(SR*1.2)
track[:fade] *= np.linspace(0,1,fade)
track[-fade:] *= np.linspace(1,0,fade)
wavfile.write('public/audio/_pop_tmp.wav', SR, (track*32767).astype(np.int16))
print("wav done, dur", round(len(track)/SR,2), "s")
