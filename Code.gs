/**
 * CJX Site Ops — Updates Store (Google Apps Script)
 * เก็บ "ผลที่ทีมกรอกในแอป" ลงชีตกลางของเรา (CJX Site Ops - App Updates)
 *   doPost = แอปเขียนผลเข้ามา   ·   doGet = ให้ตัว build ดึงไปรวมกับข้อมูลฐาน
 *
 * Deploy (ทำครั้งเดียว ~3 นาที):
 *  1. เปิด https://script.google.com  → New project → วางโค้ดนี้ทั้งหมด
 *  2. (ถ้าต้องการ) เปลี่ยน SECRET ให้ตรงกับในแอป
 *  3. Deploy ▸ New deployment ▸ Web app
 *       - Execute as: Me   ·   Who has access: Anyone
 *  4. Authorize (อนุญาตเข้าถึง Google Sheets)
 *  5. คัดลอก Web app URL (…/exec) ส่งกลับมา → ผมเสียบเข้าแอป + ตัว build
 *
 *  ชีตกลางนี้พี่เป็นเจ้าของอยู่แล้ว → เขียนได้เลย ไม่ต้องขอสิทธิ์ใคร
 *
 *  [อัปเดต 31 ส.ค. 2026] เพิ่ม "ตรวจจับการแก้ข้อมูลเก่าจากต้นทาง" —
 *  ทุกครั้งที่ sync ถ้าค่าที่เคยมีในต้นทางถูกเปลี่ยน จะบันทึกลงแท็บ "_changes"
 *  (เวลา · ชีต · Site Code · คอลัมน์ · ค่าเก่า → ค่าใหม่)
 */

var SECRET = "cjx-siteops-write-2026";
var UPDATES_ID = "1Jx3iDrxcaarr8iZi9DfYYJSlAz3hYej7S2Ui1XUQF-8";
var HEAD = ["Timestamp", "Site Code", "Track", "Field", "Value", "User", "Note"];

// ===== เขียนกลับชีตต้นทาง (source) =====
// ทะเบียน: ตอบ "เสร็จ" ในแอป → ลงวันที่ในช่องเอกสารนั้น ของสาขานั้น ในชีตทะเบียนต้นทาง
//   *** ต้องแชร์ชีตทะเบียนนี้ให้บัญชีที่รัน Apps Script เป็น Editor ก่อน ***
var REG_SRC_ID = "18gVIl2NztRw-HUgpSbpjXNO5I_tj7Yuci5Zp9YskCAo";   // Pipeline งานทะเบียนและรัฐกิจ (gid 0)

function _sheet() {
  var ss = SpreadsheetApp.openById(UPDATES_ID);
  var sh = ss.getSheets()[0];
  if (sh.getLastRow() === 0) sh.appendRow(HEAD);
  return sh;
}

function doPost(e) {
  var out = { ok: false };
  try {
    var p = JSON.parse(e.postData.contents);
    if (p.secret !== SECRET) { out.err = "bad secret"; return _json(out); }
    _sheet().appendRow([new Date(), p.code || "", p.track || "", p.field || "", p.value || "", p.user || "", p.note || ""]);
    out.ok = true;
    out.src = _writeSource(p.track, p.field, p.code, p.value);   // เขียนกลับชีตต้นทาง (ถ้า map ได้)
  } catch (err) { out.err = String(err); }
  return _json(out);
}

// เขียนกลับชีตต้นทาง — ตอนนี้รองรับ "ทะเบียน" (track=reg, field=done)
//   p.value = ดัชนีคอลัมน์ (0-based) ของช่องเอกสารที่เสร็จ → ลงวันที่ในช่องนั้น ถ้ายังว่าง
function _writeSource(track, field, code, value) {
  try {
    if (track === "reg" && field === "done" && code) {
      var col = parseInt(value, 10); if (isNaN(col)) return "reg:badcol";
      var sh = SpreadsheetApp.openById(REG_SRC_ID).getSheets()[0];   // gid 0 = ชีตแรก
      var codes = sh.getRange(1, 1, sh.getLastRow(), 1).getValues(); // คอลัมน์ A = Site Code
      for (var i = 0; i < codes.length; i++) {
        if ((codes[i][0] || "").toString().trim() === code.toString().trim()) {
          var cell = sh.getRange(i + 1, col + 1);                    // 0-based → 1-based
          if (!(cell.getValue() || "").toString().trim()) cell.setValue(new Date());
          return "reg row" + (i + 1) + " col" + (col + 1);
        }
      }
      return "reg:notfound";
    }
  } catch (err) { return "srcErr:" + err; }
  return "";
}

function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    // ?tab=src_nego (ฯลฯ) → คืนข้อมูล tab นั้นจากชีตกลาง (เลี่ยงปัญหา CORS ของ docs.google.com บน GitHub Pages)
    if (p.tab) {
      var sh = SpreadsheetApp.openById(UPDATES_ID).getSheetByName(p.tab);
      if (!sh) return _json({ ok: false, err: "no tab: " + p.tab });
      return _json({ ok: true, rows: sh.getDataRange().getValues() });
    }
    if (p.key && p.key !== SECRET) return _json({ ok: false, err: "bad key" });
    var d = _sheet().getDataRange().getValues();
    return _json({ ok: true, rows: d });
  } catch (err) { return _json({ ok: false, err: String(err) }); }
}

function _json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* ============ SYNC: ดึงทุกชีตต้นฉบับมาเก็บเป็นสำเนาในชีตกลาง ============
 *  วิธีเปิดใช้ (ทำครั้งเดียว):
 *    1. เลือกฟังก์ชัน "setupSync" ด้านบน (dropdown) แล้วกด Run
 *    2. อนุญาต (authorize) → มันจะ sync ทันที + ตั้งเวลาออโต้ทุก 5 นาที
 *    (จะ sync เองทุก 5 นาที ไม่ต้องทำอะไรอีก)
 */
var SOURCES = [
  { tab: "src_nego", url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTqFq4mb_2P2bPpfts-C98Dw78uEXaA_Yt1aZFvmx6gplG4r3X1vh8iyqK0NpO7YsP5kApXYKkAW_nZ/pub?output=csv" },
  { tab: "src_sla", url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSTGFYU9PHIek5uAK_vtT6knOAjSLzOREyffUc0s5fipxbiPK3lzg_bxzxCCS0oZWW-OrvKv8ZWyiGK/pub?output=csv&gid=238646031" },
  { tab: "src_ratown", url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQQUJHYbkRQeludCnbLks5JVdaZV6hsAnJDhLi5iX6Yqo3-8SWnxZVxPoleVMbTKri8w3Q6zAFjoAvp/pub?output=csv" },
  { tab: "src_reg", url: "https://docs.google.com/spreadsheets/d/18gVIl2NztRw-HUgpSbpjXNO5I_tj7Yuci5Zp9YskCAo/gviz/tq?tqx=out:csv&gid=0" }
];
// ชีตก่อสร้าง 139 คอลัมน์ = ใหญ่มาก → copy เฉพาะที่ใช้ (code,name,prov,open,active,hide)
var CONSTR_URL = "https://docs.google.com/spreadsheets/d/1Fnlv8S9uBVL_u_JpoajkNoI0zoyvDj5usCXx6uCtzIk/gviz/tq?tqx=out:csv&gid=1005640128";
var CONSTR_COLS = [2, 3, 5, 137, 138, 139];
// แท็บ "ตารางรับส่งสัญญา กฎหมาย" — milestone contract/legal flow (join ด้วย Site Code col0 ตรงๆ)
var FLOW_URL = "https://docs.google.com/spreadsheets/d/1cVFBJpP_C6XY5hM15pu71ioQO7JZ7pihRq1FJ-v-k1g/gviz/tq?tqx=out:csv&sheet=" + encodeURIComponent("ตารางรับส่งสัญญา กฎหมาย");
var FLOW_COLS = [0, 11, 12, 16, 8];   // code, ส่งกฎหมาย, กฎหมายส่งกลับ, ส่งเจ้าของลงนาม, เซ็นจริง

function syncAll() {
  var ss = SpreadsheetApp.openById(UPDATES_ID);
  var log = [];
  var allDiffs = [];                              // <== เก็บการแก้ข้อมูลเก่าที่เจอ
  SOURCES.forEach(function (s) {
    try {
      var rows = Utilities.parseCsv(UrlFetchApp.fetch(s.url, { muteHttpExceptions: true }).getContentText());
      var d = _diffTab(ss, s.tab, rows); if (d.length) allDiffs = allDiffs.concat(d);   // <== เทียบก่อนเขียนทับ
      _writeRows(ss, s.tab, rows);
      log.push(s.tab + "=" + rows.length);
    } catch (err) {
      log.push(s.tab + " FAIL:" + err);   // ถ้าต้นฉบับพัง = เก็บสำเนาเดิมไว้ ไม่ลบ
    }
  });
  try {   // ก่อสร้าง: ตัดเหลือ 6 คอลัมน์ (header + data จากแถว 4)
    var craw = Utilities.parseCsv(UrlFetchApp.fetch(CONSTR_URL, { muteHttpExceptions: true }).getContentText());
    var out = [["code", "name", "prov", "open", "active", "hide"]];
    for (var i = 3; i < craw.length; i++) {
      var r = craw[i]; if (!(r[2] || "").toString().trim()) continue;
      out.push(CONSTR_COLS.map(function (c) { return r[c] || ""; }));
    }
    var dc = _diffTab(ss, "src_constr", out); if (dc.length) allDiffs = allDiffs.concat(dc);
    _writeRows(ss, "src_constr", out);
    log.push("src_constr=" + out.length);
  } catch (err) { log.push("src_constr FAIL:" + err); }
  try {   // milestone flow: ตัดเหลือ name + 6 วันที่
    var fraw = Utilities.parseCsv(UrlFetchApp.fetch(FLOW_URL, { muteHttpExceptions: true }).getContentText());
    var fout = [["code", "send_legal", "legal_back", "sign_owner", "signed"]];
    for (var i = 1; i < fraw.length; i++) {
      var r = fraw[i]; var cd = (r[0] || "").toString().trim(); if (!cd) continue;
      fout.push(FLOW_COLS.map(function (c) { return r[c] || ""; }));
    }
    var df = _diffTab(ss, "src_flow", fout); if (df.length) allDiffs = allDiffs.concat(df);
    _writeRows(ss, "src_flow", fout); log.push("src_flow=" + fout.length);
  } catch (err) { log.push("src_flow FAIL:" + err); }
  try { mergePeople(ss); } catch (err) { log.push("people FAIL:" + err); }
  if (allDiffs.length) _logChanges(ss, allDiffs);   // <== บันทึกการแก้ข้อมูลเก่าจากต้นทาง
  var m = ss.getSheetByName("_synced") || ss.insertSheet("_synced");
  m.getRange(1, 1, 1, 2).setValues([[new Date(), log.join(" | ") + (allDiffs.length ? "  ·  ⚠️ แก้ข้อมูลเก่า " + allDiffs.length + " ช่อง" : "")]]);
  return log.join(" | ");
}

/* ---------- ตรวจจับการ "แก้ค่าเดิม" ในต้นทาง ----------
 * เทียบสำเนาที่เก็บไว้ใน Master (ของรอบก่อน) กับข้อมูลใหม่ที่เพิ่งดึงมา
 * นับเฉพาะช่องที่ "เคยมีค่าอยู่แล้ว" แล้วถูกเปลี่ยน = มีคนไปแก้ของเดิม
 * (ช่องที่เพิ่งกรอกจากว่าง หรือสาขาใหม่ = ความคืบหน้าปกติ ไม่นับ)
 */
function _diffTab(ss, tab, newRows) {
  var sh = ss.getSheetByName(tab);
  if (!sh || sh.getLastRow() === 0) return [];       // ยังไม่มีสำเนาเดิม = sync รอบแรก ข้าม
  if (!newRows || newRows.length < 2) return [];
  var old = sh.getDataRange().getValues();
  if (old.length < 2) return [];
  var hdr = newRows[0];
  var oldMap = {};
  for (var i = 1; i < old.length; i++) { var c = (old[i][0] || "").toString().trim(); if (c) oldMap[c] = old[i]; }
  var diffs = [];
  for (var i = 1; i < newRows.length; i++) {
    var nr = newRows[i]; var code = (nr[0] || "").toString().trim(); if (!code) continue;
    var orow = oldMap[code]; if (!orow) continue;    // สาขาใหม่ = ไม่ใช่การแก้ของเดิม
    var w = Math.max(nr.length, orow.length);
    for (var j = 1; j < w; j++) {                    // ข้าม col0 (Site Code)
      var ov = (orow[j] == null ? "" : orow[j]).toString().trim();
      var nv = (nr[j] == null ? "" : nr[j]).toString().trim();
      if (ov !== "" && ov !== nv) {                  // ค่าเดิมมีอยู่แล้ว แล้วถูกเปลี่ยน = การแก้
        diffs.push([new Date(), tab, code, (hdr[j] || ("col" + j)).toString().replace(/\s+/g, " ").trim(), ov, nv]);
      }
    }
  }
  return diffs;
}
function _logChanges(ss, diffs) {
  var cs = ss.getSheetByName("_changes") || ss.insertSheet("_changes");
  if (cs.getLastRow() === 0) cs.appendRow(["Timestamp", "Tab", "Site Code", "Column", "Old", "New"]);
  cs.getRange(cs.getLastRow() + 1, 1, diffs.length, 6).setValues(diffs);
}

// สร้าง/เติม tab "people" (email | name | role) จากรายชื่อผู้รับผิดชอบทั้งหมด — เว้น email ให้กรอกเอง
function mergePeople(ss) {
  var names = {};
  [["src_nego", 3], ["src_reg", 3], ["src_ratown", 5]].forEach(function (t) {
    var sh = ss.getSheetByName(t[0]); if (!sh) return;
    var v = sh.getDataRange().getValues();
    for (var i = 1; i < v.length; i++) { var n = (v[i][t[1]] || "").toString().trim(); if (n) names[n] = 1; }
  });
  var ps = ss.getSheetByName("people") || ss.insertSheet("people");
  if (ps.getLastRow() === 0) ps.appendRow(["email", "name", "role"]);
  var ex = ps.getDataRange().getValues(); var have = {};
  for (var i = 1; i < ex.length; i++) { var nm = (ex[i][1] || "").toString().trim(); if (nm) have[nm] = 1; }
  Object.keys(names).sort().forEach(function (n) { if (!have[n]) ps.appendRow(["", n, "member"]); });
}

function _writeRows(ss, tab, rows) {
  if (!rows || !rows.length) return;   // ดึงไม่ได้ = ไม่ล้างของเดิม
  var w = 0;
  rows.forEach(function (r) { if (r.length > w) w = r.length; });
  var pad = rows.map(function (r) { var a = r.slice(); while (a.length < w) a.push(""); return a; });
  var sh = ss.getSheetByName(tab) || ss.insertSheet(tab);
  sh.clearContents();
  sh.getRange(1, 1, pad.length, w).setValues(pad);
}

function setupSync() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "syncAll") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("syncAll").timeBased().everyMinutes(5).create();
  return syncAll();   // sync ทันทีรอบแรก
}
