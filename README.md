# 汉语 · HSK Vocab

Web app học từ vựng tiếng Trung HSK 1-2-3 với flashcard, stroke order, quiz và reverse mode (Việt → Trung).

**Live:** https://hoc-tu-vung-hsk.pages.dev

## Cấu trúc

```
.
├── HSK Vocab.html              # Source chính (dev)
├── styles.css                  # Stylesheet (3 themes: clean / ink / soft)
├── tweaks.js                   # Theme switcher
├── HSK Vocab Bundled Source.html  # Source + bundler thumbnail
└── dist/                       # Folder deploy Cloudflare Pages
    ├── index.html
    ├── styles.css
    └── tweaks.js
```

## Deploy

```bash
# Sync dist
cp "HSK Vocab.html" dist/index.html
cp styles.css tweaks.js dist/

# Deploy Cloudflare Pages
wrangler pages deploy dist --project-name=hoc-tu-vung-hsk
```

## Features

- Flashcard 3D flip với hanzi · pinyin · Hán-Việt · nghĩa
- Stroke order practice (HanziWriter)
- Quiz mode + swipe gesture
- **Reverse mode**: hiện tiếng Việt → nhớ chữ Hán + pinyin
- 3 themes: Clean (warm white) · Ink (dark CJK gold) · Soft (indigo)
- Mobile-first responsive
