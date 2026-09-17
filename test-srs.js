// Kiểm tra lõi SRS: trích trực tiếp từ source, chạy với DOM giả tối thiểu.
const fs = require("fs");
const src = fs.readFileSync("HSK Vocab.html", "utf8");

function slice(startMark, endMark) {
  const a = src.indexOf(startMark);
  const b = src.indexOf(endMark, a);
  if (a < 0 || b < 0) throw new Error("không tìm thấy đoạn: " + startMark);
  return src.slice(a, b + endMark.length);
}

const consts = slice('const DIR = { RECOG', 'function srsKey(wordKey, dir) { return wordKey + ":" + dir; }');
const core = slice('function startOfDay(ts) {', 'return due.concat(fresh);\n        }');

const VOCAB = [
  { h: "爱", lv: 1 }, { h: "八", lv: 1 }, { h: "杯子", lv: 1 },
  { h: "说", lv: 2 }, { h: "时间", lv: 2 }, { h: "运动", lv: 3 },
];
VOCAB.forEach(w => { w.key = w.h + "_" + w.lv; });

const harness = `
${consts}
const DAY_MS = 86400000;
let state = { srs: {}, settings: Object.assign({}, DEFAULT_SETTINGS), newToday: { date: "", count: 0 } };
function todayStr() { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,10); }
function getPool() { return VOCAB; }
${core}
return { state, srsKey, srsApply, srsNext, srsPreview, srsDue, isLeech, dueList, dueCount,
         newCardList, buildSession, newTodayCount, migrateSrsV1, newSrsCard, siblingStudiedToday,
         DIR, RATE, startOfDay, endOfToday };
`;

const api = new Function("VOCAB", harness)(VOCAB);
const { state, srsKey, srsApply, srsPreview, isLeech, dueList, dueCount, buildSession,
        newCardList, migrateSrsV1, DIR, RATE } = api;

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.log("  ✗ " + msg); } }
function eq(a, b, msg) { ok(a === b, msg + " — nhận " + JSON.stringify(a) + ", mong đợi " + JSON.stringify(b)); }

// --- 1. Chuỗi SM-2 cơ bản ---
const k = srsKey("说_2", DIR.RECOG);
let c = srsApply(k, RATE.GOOD);
eq(c.interval, 1, "lần Được đầu tiên → 1 ngày");
eq(c.reps, 1, "reps = 1");
c = srsApply(k, RATE.GOOD);
eq(c.interval, 6, "lần Được thứ hai → 6 ngày");
c = srsApply(k, RATE.GOOD);
eq(c.interval, 15, "lần Được thứ ba → 6 * 2.5 = 15 ngày");
eq(c.ease, 2.5, "ease giữ nguyên với Được");

// --- 2. Dễ đẩy interval và ease, ease trần 2.5 ---
c = srsApply(k, RATE.EASY);
ok(c.interval > 15, "Dễ kéo dài interval (" + c.interval + " > 15)");
ok(c.ease <= 2.5, "ease không vượt trần 2.5 (" + c.ease + ")");

// --- 3. Khó giảm ease và rút ngắn interval ---
const before = state.srs[k].interval;
c = srsApply(k, RATE.HARD);
ok(c.ease < 2.5, "Khó giảm ease (" + c.ease + ")");
ok(c.interval < before * 2.5, "Khó rút ngắn interval");

// --- 4. Quên: reset reps, tăng lapses, ôn lại trong phiên ---
c = srsApply(k, RATE.FORGOT);
eq(c.reps, 0, "Quên reset reps");
eq(c.lapses, 1, "Quên tăng lapses");
eq(c.interval, 0, "Quên → interval 0 (ôn lại trong phiên)");
ok(c.due <= Date.now(), "Quên → đến hạn ngay");

// --- 5. Sàn ease 1.3 ---
for (let i = 0; i < 20; i++) srsApply(k, RATE.FORGOT);
eq(state.srs[k].ease, 1.3, "ease chạm sàn 1.3");

// --- 6. Leech ---
ok(isLeech(k), "quên >= 6 lần → leech");
ok(!isLeech(srsKey("爱_1", DIR.RECOG)), "thẻ chưa học không phải leech");

// --- 7. Hai hướng độc lập ---
state.srs = {};
const kr = srsKey("时间_2", DIR.RECOG), kp = srsKey("时间_2", DIR.PROD);
srsApply(kr, RATE.GOOD); srsApply(kr, RATE.GOOD); srsApply(kr, RATE.EASY);
srsApply(kp, RATE.FORGOT);
state.srs[kr].last = Date.now() - 3 * 86400000;   // nhận mặt học từ mấy hôm trước, không dính phần hoãn
ok(state.srs[kr].interval > 5, "hướng nhận mặt đi xa (" + state.srs[kr].interval + " ngày)");
eq(state.srs[kp].interval, 0, "hướng viết vẫn ở mức 0 — lịch không bị kéo theo");
eq(dueCount(DIR.RECOG), 0, "nhận mặt chưa tới hạn");
eq(dueCount(DIR.PROD), 1, "viết chữ tới hạn ngay");

// --- 8. Migration v1 → recog, prod trống ---
state.srs = migrateSrsV1({ "说_2": { ef: 2.3, interval: 10, reps: 3, due: Date.now() + 5 * 86400000 } });
ok(state.srs["说_2:recog"], "lịch cũ chuyển sang hướng nhận mặt");
ok(!state.srs["说_2:prod"], "hướng viết KHÔNG được thừa hưởng lịch cũ");
eq(state.srs["说_2:recog"].interval, 10, "giữ nguyên interval khi migrate");
eq(state.srs["说_2:recog"].lapses, 0, "lapses khởi tạo 0");
eq(state.srs["说_2:recog"].ease, 2.3, "ef cũ → ease");

// --- 9. buildSession: giới hạn thẻ mới + thẻ ôn ---
state.srs = {};
state.newToday = { date: "", count: 0 };
state.settings = { newPerDay: 4, maxReviews: 120 };
let sess = buildSession();
eq(sess.length, 4, "phiên đầu tiên = newPerDay thẻ mới");
eq(sess[0].dir, DIR.RECOG, "thẻ mới bắt đầu bằng hướng nhận mặt");
ok(sess.every(e => e.w && e.dir), "mỗi mục có cả từ và hướng");

state.newToday = { date: new Date(Date.now() - new Date().getTimezoneOffset()*60000).toISOString().slice(0,10), count: 4 };
eq(buildSession().length, 0, "đã đủ thẻ mới hôm nay → phiên rỗng");

// maxReviews cắt bớt thẻ tới hạn
state.srs = {};
VOCAB.forEach(w => { srsApply(srsKey(w.key, DIR.RECOG), RATE.FORGOT); });
state.settings = { newPerDay: 0, maxReviews: 3 };
eq(buildSession().length, 3, "maxReviews giới hạn số thẻ ôn");

// --- 10. Nhãn khoảng cách ---
state.srs = {};
const nk = srsKey("八_1", DIR.RECOG);
eq(srsPreview(nk, RATE.FORGOT), "trong phiên", "nhãn nút Quên");
eq(srsPreview(nk, RATE.GOOD), "1 ngày", "nhãn nút Được cho thẻ mới");
eq(srsPreview(nk, RATE.EASY), "4 ngày", "nhãn nút Dễ cho thẻ mới (Anki-style, không trùng Được)");

// --- 10b. Dễ ở thẻ mới nhảy thẳng 4 ngày, không trùng Được ---
state.srs = {};
const ek = srsKey("运动_3", DIR.RECOG);
eq(srsApply(ek, RATE.EASY).interval, 4, "Dễ lần đầu → 4 ngày");
state.srs = {};
eq(srsApply(srsKey("运动_3", DIR.PROD), RATE.GOOD).interval, 1, "Được lần đầu vẫn 1 ngày");

// --- 11. dueList sắp xếp theo due tăng dần ---
state.srs = {};
srsApply(srsKey("爱_1", DIR.RECOG), RATE.FORGOT);
state.srs[srsKey("八_1", DIR.RECOG)] = { ease: 2.5, interval: 0, reps: 1, lapses: 0, due: 0, last: 0 };
const dl = dueList();
ok(dl.length === 2 && dl[0].w.key === "八_1", "dueList sắp xếp overdue trước");

// --- 12. Một từ chỉ hiện MỘT lần mỗi ngày, không kèm bản tiếng Việt ngay sau ---
state.srs = {};
state.newToday = { date: "", count: 0 };
state.settings = { newPerDay: 10, maxReviews: 120 };
const s12 = buildSession();
ok(s12.length > 0 && s12.every(e => e.dir === DIR.RECOG), "từ mới chỉ mở hướng nhận mặt");
eq(new Set(s12.map(e => e.w.key)).size, s12.length, "không từ nào lặp lại trong phiên");

const kw = "杯子_1";
const prodOf = k => newCardList().filter(e => e.w.key === k && e.dir === DIR.PROD).length;
eq(prodOf(kw), 0, "chưa học nhận mặt → hướng viết chưa mở");
srsApply(srsKey(kw, DIR.RECOG), RATE.GOOD);
eq(prodOf(kw), 0, "vừa học nhận mặt hôm nay → hướng viết đợi hôm sau");
state.srs[srsKey(kw, DIR.RECOG)].last = Date.now() - 86400000;
eq(prodOf(kw), 1, "sang hôm sau → hướng viết mới mở");

// --- 13. Hai hướng cùng tới hạn → phiên chỉ lấy một ---
state.srs = {};
state.settings = { newPerDay: 0, maxReviews: 120 };
const twoDaysAgo = Date.now() - 2 * 86400000;
state.srs[srsKey("说_2", DIR.RECOG)] = { ease: 2.5, interval: 1, reps: 2, lapses: 0, due: twoDaysAgo, last: twoDaysAgo };
state.srs[srsKey("说_2", DIR.PROD)] = { ease: 2.5, interval: 1, reps: 1, lapses: 0, due: twoDaysAgo, last: twoDaysAgo };
eq(dueList().length, 2, "cả hai hướng đều tới hạn");
eq(buildSession().length, 1, "phiên chỉ lấy một hướng của mỗi từ");
srsApply(srsKey("说_2", DIR.RECOG), RATE.GOOD);
eq(dueCount(DIR.PROD), 0, "vừa ôn nhận mặt hôm nay → hướng viết hoãn sang hôm sau");
eq(buildSession().length, 0, "hết thẻ cho hôm nay, không lặp lại từ vừa học");

console.log("\n" + (fail === 0 ? "PASS" : "FAIL") + ": " + pass + " đạt, " + fail + " hỏng");
process.exit(fail === 0 ? 0 : 1);
