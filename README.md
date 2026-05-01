# 汉语 · HSK Vocab

Web app học từ vựng tiếng Trung HSK 1-2-3 với flashcard, stroke order, quiz và reverse mode (Việt → Trung).

**Live:** https://hskvocab.pages.dev

## Cấu trúc

```
.
├── HSK Vocab.html                 # Source chính (dev)
├── styles.css                     # Stylesheet (3 themes: clean / ink / soft)
├── tweaks.js                      # Theme switcher
├── HSK Vocab Bundled Source.html  # Source + bundler thumbnail
├── build.sh                       # Sync source → dist/
└── dist/                          # Folder deploy Cloudflare Pages
    ├── index.html
    ├── styles.css
    └── tweaks.js
```

## Deploy

Cloudflare Pages tự deploy mỗi khi push lên `main`.

**Build settings (Cloudflare Pages → Settings → Builds & deployments):**
- Build command: `bash build.sh`
- Build output directory: `dist`
- Root directory: `/`

### Local preview / manual deploy

```bash
# Sync dist từ source
bash build.sh

# (optional) deploy thủ công
wrangler pages deploy dist --project-name=hskvocab
```

## Features

- Flashcard 3D flip với hanzi · pinyin · Hán-Việt · nghĩa
- Stroke order practice (HanziWriter)
- Quiz mode + swipe gesture
- **Reverse mode**: hiện tiếng Việt → nhớ chữ Hán + pinyin
- 3 themes: Clean (warm white) · Ink (dark CJK gold) · Soft (indigo)
- Mobile-first responsive
