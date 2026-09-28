# PHASE — Site Nego Portal · รื้อท่อนเจรจา (nego) ให้ตรง App Pipeline 100%

> **ไฟล์นี้เก็บอะไร:** แบ่งเฟสงานรื้อ nego · เจ้าของ · ลำดับพึ่งพา · เสร็จเมื่อ · สถานะ · สิ่งที่ยัง block
> **อ่านก่อน:** จะเริ่ม/รับช่วงเฟสใดเฟสหนึ่งของงานรื้อ nego
> **อ้างอิง:** `PRD.md` (SLA-driven) · `UX-UI.md` · `SPEC.md` (ground truth logic + §8 blast radius)
> **เจ้าของ:** Luffy · **เขียนเมื่อ:** 2026-09-28
> **ขอบเขต:** เฉพาะ **ท่อนเจรจา (nego)** · ท่อนรังวัด/อ.1/ทะเบียน ไม่แตะในงานนี้

---

## ⛔ กฎของงานรื้อนี้ (ทุกเฟสต้องเคารพ)

- **ห้าม deploy จนกว่า Lead สั่ง** · ทุกการแก้ `cjx_siteops.html` / `Code.gs` ต้องสำรอง `.bak-<วันเวลา>` ก่อน
- **`Code.gs` + `cjx_siteops.html` ต้อง deploy พร้อมกัน** — ถ้าเปลี่ยน layout `src_nego`/`compute()` แยกกัน แอป live พัง (`SPEC.md` §8)
- **ห้ามแตะท่อนอื่น** (survey / อ.1 / ทะเบียน / ต่ออายุ) — เปลี่ยนเฉพาะบล็อกเจรจา `:1155-1212` + `NEGO_STEPS`/rail/perf ที่ผูกกับเจรจา
- **ไม่มีเฟสไหน "เสร็จ" จนกว่า Robin ปล่อยผ่าน** (ค่าตั้งต้น Robin = ยังไม่ผ่าน)

---

## ตารางเฟส

| # | เฟส | คนทำ | ขึ้นกับ | เสร็จเมื่อ | สถานะ |
|---|---|---|---|---|---|
| 0 | เอกสารวางแผน (PRD/UX-UI/SPEC/PHASE) | Luffy + Franky | - | 4 ไฟล์ตรงกัน · Lead อนุมัติ · Robin ตรวจเอกสาร | 🟡 เขียนเสร็จ · รอ Robin |
| 1 | Plumbing: `src_nego` มี sign2 (additive) | Franky | 0 | `Code.gs NEGO_MAP` มี `9:17` · ไม่กระทบ col 0-8 | 🟢 แก้ในไฟล์แล้ว · ยังไม่ deploy |
| 2 | `buildNego()` — compute nego SLA-driven | Franky (logic) → Usopp (เขียน) | 1 | นับ wip/stage_group/5 กล่อง ตรง SPEC §7 (±หมายเหตุ lookup ขาด) · task shape เดิมครบ | ⬜ รอเริ่ม |
| 3 | UI: rail กล่องใหม่ + KPI + ตาราง | Usopp | 2 | rail แสดงกล่องกลุ่ม A/B/C · KPI ฐาน Pipeline · สมการ reconcile บนจอ | ⬜ รอเริ่ม |
| 4 | Deploy (Code.gs+HTML) + syncAll + verify ตรง Pipeline | Usopp/Jinbe | 2,3 + Lead สั่ง | เทียบ Portal vs Pipeline: wip/stage_group/กล่อง ตรง (เว้นกล่องที่ lookup ขาด) | ⬜ บล็อก (ดูล่าง) |
| 5 | Robin gate — review code + ตัวเลข | Robin | 4 | ไม่มี Critical/Major ค้าง · `REVIEW.md` ออก | ⬜ รอเริ่ม |

---

## เฟส 0 — เอกสารวางแผน
ได้อะไร: ทีมมีเอกสารตรงกันว่า nego เป็น SLA-driven ครบทุกกล่องแบบ Pipeline
แตะไฟล์: `PRD.md` (อัปเดต) · `UX-UI.md` (ใหม่) · `PHASE.md` (ใหม่) · `SPEC.md` (Franky · มีแล้ว)
ห้ามแตะ: โค้ด (`cjx_siteops.html`, `Code.gs`)
เสร็จเมื่อ: 4 เอกสารไม่ขัดกัน · Lead อนุมัติ · Robin ตรวจเอกสารผ่าน
สถานะ: PRD/UX-UI/PHASE เขียนเสร็จ 28 ก.ย. · **รอ Lead อ่าน + Robin ตรวจ**

## เฟส 1 — Plumbing sign2 (additive)
ได้อะไร: `src_nego` มีคอลัมน์วันเซ็นจริง (col9←nego17) พร้อมให้ compute ใหม่ใช้ โดยไม่ทำแอป live พัง
แตะไฟล์: `Code.gs` (`NEGO_MAP` เท่านั้น)
ห้ามแตะ: col 0-8 ของ src_nego · sync ท่อนอื่น
เสร็จเมื่อ: `NEGO_MAP = {…, 9:17}` (✅ ยืนยันในไฟล์แล้ว บรรทัด 122) · deploy พร้อมเฟส 4
สถานะ: 🟢 **แก้ในไฟล์แล้ว (Franky)** · ยังไม่ deploy (ถูกต้องตามกฎ — รอไปพร้อม HTML)

## เฟส 2 — buildNego() compute SLA-driven
ได้อะไร: ฟังก์ชัน pure ที่นับ nego จาก `src_sla` (ฐาน) + `src_nego`/`src_flow` (lookup) ได้กล่องครบตาม SPEC
แตะไฟล์: `cjx_siteops.html` บล็อกเจรจา `:1155-1212` (เขียนเป็น `buildNego(sla,nego,flow,constr,upd)`)
ห้ามแตะ: บล็อก survey/อ.1/ทะเบียน · helper วันที่ที่ใช้ร่วม (ใช้ `pdate()` ของ Portal — เดือนไทย ไม่ใช่ parseDate อังกฤษ)
เสร็จเมื่อ:
- นับได้: `wip`, `stage_group`, `hold_nego`, `potential`, `nego_stuck`, `site_ex`, `wait_kt`, `sign_contract`, `send_check`, `check_contract`, `contract_final`, `confirm_o1`
- สมการ `stage_group = wait_kt+sign_contract+send_check+check_contract+contract_final` เป็นจริง
- ตัวเลขตรงกับ `SPEC.md` §7 (บนสแนป 25 ก.ย.) ภายในหมายเหตุ lookup ที่ยังขาด
- `task` คงคีย์เดิมครบ (`SPEC.md` §6) · `DATA.perf.nego` มีคีย์เดิม
เสี่ยงสุด → ทำก่อน: การเปลี่ยนประชากรฐาน (src_nego→src_sla) + HEADER_ROW=1 ของ src_sla (SPEC §1)
สถานะ: ⬜ รอเริ่ม (Lead ต้องสั่ง Franky pin สูตร close_pct/sla_pct + สั่ง Usopp เขียน)

## เฟส 3 — UI rail/KPI/ตาราง
ได้อะไร: หน้าจอเจรจาแสดงกล่องแบบ Pipeline ครบ + KPI ฐานใหม่ + ตารางกรองได้
แตะไฟล์: `cjx_siteops.html` — `NEGO_STEPS`/rail/KPI/ตาราง/ตัวกรองของเจรจา
ห้ามแตะ: rail/KPI ของท่อนอื่น · ชุด design token กลาง (ใช้ของเดิม)
เสร็จเมื่อ: ตรงตาม `UX-UI.md` §2–6 · rail กับตารางใช้ชุดกล่องเดียวกัน (ไม่หลุด) · states ครบ (โหลดพลาด ≠ ไม่มีงาน)
สถานะ: ⬜ รอเริ่ม (ขึ้นกับเฟส 2)

## เฟส 4 — Deploy + syncAll + verify
ได้อะไร: Portal live นับ nego ตรง Pipeline
แตะไฟล์: deploy `Code.gs` + `cjx_siteops.html` พร้อมกัน · run `syncAll`
ห้ามแตะ: ห้าม deploy ก่อน Lead สั่ง · สำรอง .bak ก่อน
เสร็จเมื่อ: สุ่มเทียบ Portal vs Pipeline — wip/stage_group/กล่อง ตรง (เว้นกล่องที่ lookup ยังขาด — ต้องระบุว่ากล่องไหน approx)
สถานะ: ⬜ **บล็อก** — ดู "สิ่งที่ยัง block"

## เฟส 5 — Robin gate
ได้อะไร: ยืนยันว่าไม่มีบั๊ก/ความไม่สอดคล้องค้าง
แตะไฟล์: `REVIEW.md` (Robin)
เสร็จเมื่อ: ไม่มี Critical/Major ค้าง
สถานะ: ⬜ รอเริ่ม

---

## 🚧 สิ่งที่ยัง block (ต้องให้ Lead เคลียร์)

| # | บล็อก | กระทบเฟส | ต้องทำ |
|---|---|---|---|
| B1 | **สูตร `close_pct`/`sla_pct` แบบ Pipeline ยังไม่ pin** (Lead เคาะ "ฐาน wip/approved" แล้ว แต่ตัวหาร/เศษเป๊ะยังไม่ระบุ) | 2, 3 | Lead สั่ง Franky ระบุใน `SPEC.md` |
| B2 | **spreadsheet ID แท็บ TJ (gid=1839838784) + pipeline-nego (gid=1464560053)** ยังยืนยันไม่ได้ | 2, 4 | Lead หาไฟล์ → Franky · **ถ้าขาด: `wait_kt`/`check_contract`/`contract_final` เป็น approx/0 → "ตรง 100%" ยังไม่ครบ** |
| B3 | **จำนวนคอลัมน์จริงชีต construction** (139 vs col152) | 2 (`inO1Prep`) | Lead → Franky ยืนยันก่อนเพิ่ม col63/142 |
| B4 | **อนุญาต deploy** (งานนี้ห้าม deploy) | 4 | Lead สั่งเมื่อพร้อม |

> **ยังไม่ได้ทำจริง (แยกให้ชัด):** compute() nego ยังเป็นแบบเดิมในโค้ด live · เฟส 2–5 ยังไม่เริ่ม · ความ "ตรง Pipeline 100%" จะยังไม่ครบจนกว่า B2/B3 เคลียร์ (กล่อง send_check/check/final ขึ้นกับ lookup ที่ขาด)
