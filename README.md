# 汉语 · HSK Vocab

Web app học từ vựng tiếng Trung HSK 1-2-3 cho người Việt. Lịch ôn spaced repetition (SM-2),
hai hướng thẻ độc lập, khai thác âm Hán-Việt làm neo ghi nhớ.

**Live:** https://hskvocab.pages.dev

## Cấu trúc

```
.
├── HSK Vocab.html                 # Source chính — HTML + toàn bộ JS inline (vanilla, không framework)
├── styles.css                     # Stylesheet (3 themes: clean / ink / soft)
├── tweaks.js                      # Theme switcher
├── test-srs.js                    # Test lõi SRS — trích hàm trực tiếp từ source
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
bash build.sh                                   # sync dist từ source
python -m http.server 8931 --directory dist     # xem thử
node test-srs.js                                # chạy test lõi SRS

# (optional) deploy thủ công
wrangler pages deploy dist --project-name=hskvocab
```

## Lịch ôn (SRS)

Thuật toán **SM-2**, 4 mức chấm điểm: **Quên · Khó · Được · Dễ** (phím `1`-`4`).
Dưới mỗi nút hiện khoảng cách ôn tiếp theo để chấm cho chính xác.

**Hai hướng thẻ có lịch độc lập** — đây là điểm cốt lõi:

| Hướng | Mặt trước | Mặt sau |
|---|---|---|
| `recog` — Nhận mặt | 说 | shuō · THUYẾT · nói · cấu tạo bộ thủ |
| `prod` — Viết chữ | "nói, nói chuyện" | 说 shuō · THUYẾT |

Nhận mặt chữ dễ hơn viết chữ rất nhiều. Gộp chung một lịch sẽ kéo giãn khoảng cách ôn của
hướng viết một cách sai lệch, nên mỗi từ sinh hai thẻ với hai lịch riêng.

Nhịp độ mặc định: **15 thẻ mới/ngày**, tối đa **120 thẻ ôn/ngày** (chỉnh trong tab Tiến độ).
Chấm *Quên* đẩy thẻ về cuối hàng đợi, ôn lại ngay trong phiên. Thẻ quên ≥ 6 lần được gắn cờ
🐢 ở màn hình Hôm nay kèm gợi ý học lại bằng bộ thủ.

### Lưu trữ

| Key localStorage | Nội dung |
|---|---|
| `hsk123_srs_v2` | `{ cards, settings, newToday }` — `cards` khoá theo `"<từ>_<cấp>:<hướng>"` |
| `hsk123_progress_v2` | Trạng thái hiển thị (chưa học / đang học / đã thuộc) |
| `hsk_streak_v2` | Số hành động theo ngày, dùng vẽ heatmap |
| `hsk123_srs_v1` | Lịch cũ 1 chiều — chỉ đọc một lần để migrate, không ghi nữa |

Lịch v1 khi migrate được gán cho hướng **nhận mặt**; hướng viết bắt đầu từ đầu.

Tab **Tiến độ** có nút tải file sao lưu / khôi phục JSON. Đăng nhập Google (Firebase) đồng bộ
`progress` + `srs` lên cloud, tuỳ chọn.

## Tính năng

- **Hôm nay** — số thẻ đến hạn, tách theo hai hướng, nút bắt đầu ôn, heatmap 30 ngày
- Flashcard 3D flip: hanzi · pinyin · Hán-Việt · nghĩa · phân tách bộ thủ
- **Bộ thủ** — 96 mảnh cấu tạo, âm Hán-Việt, nghĩa, chữ ví dụ, có tìm kiếm
- **Viết thử ngay trên thẻ** hướng viết chữ — HanziWriter quiz chấm từng nét trước khi lật
- Stroke order practice riêng (HanziWriter)
- Quiz mode · Ghép cặp · Từ điển · Phân biệt chữ giống nhau
- Phát âm bằng Web Speech API
- Thống kê **chữ hay sai nhất** xếp theo số lần quên, tách hai hướng
- 3 themes: Clean (warm white) · Ink (dark CJK gold) · Soft (indigo)
- Mobile-first, hoạt động offline sau lần tải đầu

Không có streak counter — đứt chuỗi là lý do bỏ app. Heatmap cho thấy xu hướng mà không phạt ngày nghỉ.
