# 운동 음원 넣는 곳 (public/music)

여기에 mp3를 떨어뜨리면 운동 화면 오디오에서 재생됩니다.
Firebase Storage 안 씁니다 — 그냥 이 폴더가 그대로 사이트에 서빙돼요.

## 폴더 위치

```
public/music/
├── bgm/                  ← 가사 없는 BGM
│   ├── boost/  ⚡ 부스트 (신나는)
│   └── flow/   🌊 플로우 (차분한)
└── hype/                 ← 가사 있는 동기부여
    ├── mild/    🌱 순한맛
    ├── medium/  🌶️ 덜매운맛
    └── spicy/   🔥 매운맛
```

## 2단계

1. mp3를 해당 폴더에 넣기 (예: `public/music/bgm/boost/01.mp3`)
2. `lib/music-tracks.ts`에 한 줄 등록:

   ```ts
   boost: [
     { id: "01", title: "아드레날린", src: "/music/bgm/boost/01.mp3" },
   ],
   ```

`src`는 `public`을 뺀 경로 그대로(`/music/...`). `title`은 잠금화면·화면에 뜨는 곡 제목.

곡이 5~10개면 셔플로 연속 재생됩니다. 등록 전까지는 합성 멜로디가 대신 깔려요.
