# SPEC — Site Nego Portal · ท่อนเจรจา (nego) ให้ตรงกับ App Pipeline

> **ไฟล์นี้เก็บอะไร:** data model + logic ของท่อน "เจรจา" ที่ยกมาจาก App Pipeline (ground truth)
> เพื่อให้ตัวเลขใน Portal ตรงกับ Pipeline · อ่านก่อนแก้ `compute()` ท่อนเจรจา หรือ `Code.gs` sync
> **สถานะ:** ✅ **IMPLEMENTED** (28 ก.ย.26) — compute() ท่อนเจรจา + Code.gs sync แก้แล้วตาม Lead เคาะ ·
> พิสูจน์ตัวเลขจากข้อมูลจริง (รันโค้ดแอปจริงบน f_src_sla+pnego_exp) ตรงกับ Pipeline · **ยังไม่ deploy** (ต้อง syncAll ก่อนถึงจะครบ)
> เจ้าของเอกสาร: Franky · ปรับล่าสุด 2026-09-28

## อ่านมาจาก

| ไฟล์ | สถานะที่อ่าน | ใช้เป็น |
|---|---|---|
| `C:\Users\jeerasak.li\AppData\Local\Temp\pipe.html` | อ่านจริง บรรทัด 2820–4500 | ground truth ของ logic เจรจา (CalcEngine — port ตรงจาก `refresh_data.py`) |
| `D:\BSA\App\site-nego-portal\cjx_siteops.html` | อ่านจริง บรรทัด 1138–1420 | compute() ปัจจุบัน (ท่อนเจรจา `:1155-1212`) |
| `D:\BSA\App\site-nego-portal\Code.gs` | อ่านจริงทั้งไฟล์ | sync ปัจจุบัน |
| `D:\BSA\App\site-nego-portal\PRD.md` | อ่านจริง | ยืนยันว่า PRD เดิมระบุ src_nego Main Status เป็น source-of-truth (ขัดกับงานนี้ — ดู §9) |
| `f_src_sla.json` (Master src_sla, ณ 25 ก.ย.26) | อ่านจริง 684 แถว 111 คอลัมน์ | ข้อมูลฐานจริงของ Pipeline สำหรับพิสูจน์ตัวเลข |
| `pnego_exp.csv` (แท็บ nego gid=1549155273 export) | อ่านจริง 482 แถว | lookup sign2/nego2/approval2 |
| skill `site-nego-portal` (data-binding / apps-script / gotchas) | อ่านจริง | ยืนยัน column map ของ src_sla / src_nego |

---

## 1. ⚠️ ข้อค้นพบสำคัญ — Pipeline นับ nego จาก "ชีต SLA" ไม่ใช่แท็บ gid=1549155273

โจทย์ตั้งต้นบอกว่า "ทั้ง 2 แอปควรอ่านแท็บ nego เดียวกัน (gid=1549155273) แล้ว bucket จาก col8/col9" — **อ่านโค้ดจริงแล้วไม่ใช่แบบนั้น**

**ความจริง (pipe.html):**
- ประชากรฐาน (base population) ของ funnel เจรจา = **ชีต SLA / Site Expansion (103 คอลัมน์)** — `computeCounts(rows,L)` รับ `rows` = SLA sheet (`pipe.html:3131-3138`, config คอลัมน์ `:2839-2847` คอมเมนต์ "SLA sheet (gid=0)")
- แท็บ nego gid=1549155273 ถูกใช้เป็น **lookup รอง** แค่ 3 ค่าเท่านั้น (`:2863-2868`, `:3034-3035, :3045`):
  - `sign2` = nego col17 (วันเซ็นสัญญาจริง)
  - `nego2` = nego col9 (Main Status)
  - `approval2` = nego col37 (รูปแบบการอนุมัติ — ใช้ตั้ง SLA 5/10 วัน)
- lookup อื่นที่ nego boxes พึ่ง: `tjLegal` (แท็บ TJ gid=1839838784 col11 send / col12 scan), `pnegoKt` (แท็บ pipeline-nego gid=1464560053 col25 KT), construction (gid=1005640128 col63/col142)

**ผลต่อ Portal:** Portal **มีชีต SLA อยู่แล้ว** = `src_sla` (published gid=238646031, sync ครบทุกคอลัมน์ใน Code.gs) และ **column layout ตรงกับ Pipeline เป๊ะ** (พิสูจน์แล้ว §7 ตาราง column) → **นับ nego ให้ตรง Pipeline ทำได้จาก `src_sla` + `src_nego` ที่มีอยู่แล้วเป็นหลัก** ไม่ต้องเปลี่ยนไปนับจากแท็บ nego ตรง ๆ อย่างที่ interim ทำ

**ต่างจาก layout:** Portal `src_sla` มี banner ที่ row0, header ที่ **row1**, data เริ่ม **row2** (Pipeline gid=0 header row0/data row1) → เวลา port ต้องตั้ง `HEADER_ROW=1` (หรือ detect "Site Code") ไม่ใช่ 0 ตำแหน่งคอลัมน์เหมือนกันทุกช่อง (พิสูจน์ §7)

---

## 2. Data model — คอลัมน์ที่ logic เจรจาใช้

### 2.1 ชีต SLA = `src_sla` (ประชากรฐาน · index 0-based · data เริ่ม row2)
อ้าง `pipe.html:2839-2847` — ยืนยันชื่อ header กับข้อมูลจริงใน `f_src_sla.json` แล้ว (§7)

| const (pipe.html) | idx | header (src_sla row1) | ใช้ทำอะไร |
|---|---|---|---|
| COL_CODE | 0 | Site Code | join key |
| COL_NAME | 2 | (ชื่อสาขา) | แสดงผล |
| COL_APPSHEET | 6 | Status APPSHEET | `isHoldNego` ("6.1 Hold เจรจาราคา"), opened ("9.Opened") |
| COL_EXPANSION | 8 | Status Site Expansion | opened/cancel/repropose ("01.เปิดแล้ว"/"10.ยกเลิก"/"09.รอนำเสนอใหม่") |
| COL_APPROVED | 11 | วันที่ผู้บริหารพิจารณาทำเล | `reviewed` gate (G3) + start ของ aging รอเซ็น |
| COL_SIGN_DATE | 26 | วันเซ็นสัญญาจริง | `isSigned` (หลัก) |
| COL_SEND_LEGAL | 29 | วันที่ส่งเอกสารให้ LG | `sendLegal` (fallback ของ TJ) |
| COL_LEGAL_SCAN | 30 | วันที่ LG Scan สัญญาเข้าระบบ | `legalScan` (fallback ของ TJ) |
| COL_SUBMIT_O1 | 33 | ยื่น อ.1 | `noO1` (ออกจากท่อนเจรจา ไป อ.1) |
| COL_GOT_O1 | 34 | ได้ อ.1 | `noO1` |
| COL_PIC_SITE | 52 | เจรจา ชื่อ-สกุล | ผู้รับผิดชอบ (detail) |
| COL_NEGO | 53 | Status Site Nego | `negoStatus` (หลัก; ในชุดข้อมูลจริงมักว่าง → fallback nego2) |
| COL_NOTE | 54 | หมายเหตุ Status Site Nego | หมายเหตุ (detail) |
| COL_APPROVAL_RESULT | 73 | ผลอนุมัติรถตู้ | gate G3 ("Approved") |
| COL_OPEN_DATE | 40 | Grand opening | detail |
| COL_CANCEL_DATE | 48 | วันที่อนุมัติยกเลิก | detail |

### 2.2 แท็บ nego = `src_nego` (lookup รอง · join by Site Code)
Portal remap ปัจจุบัน (Code.gs `NEGO_MAP`): `src_nego` col4 ← nego col37 (approval), col5 ← nego col9 (Main Status), **col9 ← nego col17 (signed) [เพิ่มใหม่ 28 ก.ย.26]**

| lookup (Pipeline) | มาจาก nego col | ใน src_nego คือ col | มีแล้วไหม |
|---|---|---|---|
| `nego2` (Main Status) | 9 | **col5** | ✅ มีแล้ว |
| `approval2` (รูปแบบอนุมัติ) | 37 | **col4** | ✅ มีแล้ว |
| `sign2` (วันเซ็นจริง) | 17 | **col9** | ✅ เพิ่มใน Code.gs รอบนี้ (additive) |

### 2.3 lookup ที่ยังขาด (ผลต่อความละเอียดบางกล่อง — ดู §8)
| lookup | source | ผลถ้าไม่มี |
|---|---|---|
| `tjLegal` send/scan | แท็บ TJ gid=1839838784 col11/12 | ใช้ SLA col29/30 แทนได้ (TJ เป็นแค่ override วันที่สดกว่า) → กระทบเฉพาะการแยก send_check ↔ check_contract ↔ contract_final |
| `pnegoKt` | แท็บ pipeline-nego gid=1464560053 col25 | `waitKtCover` จะคืน true ทุกครั้งที่ nego2="7.เสนอ KT..." (ไม่กรองด้วยวันนัด KT ในอนาคต) → กระทบการแยก wait_kt ↔ sign_contract เล็กน้อย |
| construction col63 (permit), col142 (send_ratkit) | gid=1005640128 | `inO1Prep`=false เสมอ → contract_final อาจเกินจริงเมื่อมี legal flow ทำงาน |

---

## 3. Lifecycle — การจัดสาขาเข้ากล่อง (port ตรงจาก pipe.html)

ลำดับการกรอง (`computeCounts` `:3137-3181`):

```
SLA rows (data row2+)
 └─ pipelineRows (:3108-3128)  = keep ถ้า:
      G1  exp ∉ {"ขึ้นรถตู้วันนี้","Reject"}                        (:3114)
      G2  negoStatus ≠ "5.ยกเลิก"                                    (:3115)
      G3  approval=="Approved"  OR  parseDate(col11) < today          (:3116-3119)
      (special) NO_O1_REQUIRED {"NSP68-1701"} → set submit_o1         (:3122-3126)
   = data
 └─ approved = data.filter(exp ∉ {"01.เปิดแล้ว","10.ยกเลิก"})        (:3140)   → "อนุมัติรถตู้"
 └─ pulled   = approved.filter(!isRepropose(exp))                     (:3141)   ตัด site_ex ก่อน
 └─ holdNego = pulled.filter(isHoldNego)                              (:3142)
 └─ active   = pulled.filter(!isHoldNego)                             (:3143)
 └─ base(wip)= active.filter(negoStatus ∉ {"0.Potential with cons","2.เจรจา-ติดขัด"})  (:3144-3146)
```

**predicates (อ้างบรรทัด):**
- `negoStatus(r)` = `col53 || nego2[code]` (`:3059`)
- `isHoldNego(r)` = nospace(col6)==nospace("6.1 Hold เจรจาราคา") (`:3060`)
- `isSigned(r)` = `col26 != "" || sign2[code] != ""` (`:3061`)
- `isRepropose(v)` = v=="09.รอนำเสนอใหม่" หรือ `/^12\.\s*รอนำเสนอ/` (`:2886`)
- `noO1(r)` = `col33=="" && col34==""` (`:3169`)
- `sendLegal(r)` = `tjLegal.send || col29` (normDate) (`:3066`)
- `legalScan(r)` = `tjLegal.scan || col30` (normDate) (`:3067`)
- `inO1Prep(r)` = noO1 && legalScan≠"" && permitSubmit≠"" && hasN4 && send_ratkit≠"" (`:3081-3088`)
- `waitKtCover(r)` = nego2=="7.เสนอ KT ลงนามใบปะหน้า" และ (pnegoKt ว่าง → true, ไม่งั้น วันนัด KT > วันนี้) (`:3267-3273`)

---

## 4. Logic rules — กล่องเจรจาและสูตรนับ

อ้าง `computeCounts :3157-3181` + list builders `:4188-4243`

```
RULE approve      : approved.length                                   (:3161)  "อนุมัติรถตู้ (รวม 09/12)"
RULE opened       : outcome.filter(exp=="01.เปิดแล้ว")                (:3157,3159)
RULE cancelled    : outcome.filter(!opened && isCancelled)            (:3158,3160)
RULE site_ex      : approved.filter(isRepropose)                      (:3163)
RULE hold_nego    : holdNego.length                                   (:3164)
RULE nego_stuck   : active.filter(negoStatus=="2.เจรจา-ติดขัด")       (:3165)
RULE potential    : active.filter(negoStatus=="0.Potential with cons")(:3166)
RULE wip          : base.length                                       (:3167)
RULE confirm_o1   : base.filter(!noO1)  = ออกไปท่อน อ.1 แล้ว          (:3173)
RULE stage_group  : wip - confirm_o1  = "ยังอยู่ในท่อนเจรจา"          (:3232)
--- 5 กล่องย่อยของ stage_group ---
RULE wait_kt        : toSign.filter(waitKtCover)                      (:3176)
RULE sign_contract  : toSign.length - wait_kt   [toSign=base∧noO1∧!isSigned]  (:3175,3177)
RULE send_check     : base ∧ noO1 ∧ isSigned ∧ sendLegal=="" ∧ legalScan==""  (:3179)
RULE check_contract : base ∧ noO1 ∧ isSigned ∧ sendLegal!="" ∧ legalScan==""  (:3180)
RULE contract_final : base ∧ noO1 ∧ legalScan!="" ∧ !inO1Prep         (:3181)
  ยืนยัน: stage_group == wait_kt+sign_contract+send_check+check_contract+contract_final
```

**SLA (วันทำการ · หยุด Sat/Sun + วันหยุด CJ 2026 `:2902-2906`):**
- wait_kt / sign_contract: aging จาก `max(col11 วันอนุมัติรถตู้, pnegoKt วันนัด KT ที่ ≤ วันนี้)` · target = **10** ถ้า approval2=="Approved with condition" ไม่งั้น **5** (`:4425-4438`)
- send_check: 3 วันจากวันเซ็น (`:4442`) · check_contract: 3 วันจากวันส่ง LG (`:4443`)
- `workingDays(start,end)` = `:3093-3106`, `parseDate` = `:2938-2954` (⚠️ Pipeline รับเดือน**อังกฤษ**เท่านั้น — ข้อมูล Portal เป็นเดือน**ไทย** ต้องใช้ pdate() ของ Portal ที่รองรับไทย ดู §8)

---

## 5. Module map (ภายใน cjx_siteops.html — single-file)

```
LOGIC.nego  (แทนบล็อก :1155-1212)
  หน้าที่: จัดสาขาเข้ากล่องเจรจา + นับ ตามกฎ §3-4 ( port จาก Pipeline)
  อ่าน: src_sla (ฐาน), src_nego (nego2/approval2/sign2), src_flow (tjLegal),
        src_constr (opened + inO1Prep ถ้าเปิด), overlay upd (nego/signed)
  เป็นเจ้าของ: DATA.nego.{owners,tasks,steps,final} + DATA.perf.nego
  เปิดให้เรียก: (pure) buildNego(sla,nego,flow,constr,upd) → {tasks,counts}
  ขึ้นกับ: helper วันที่ pdate/daysBetween ของ Portal (มีอยู่แล้ว)
```
- ห้าม view คำนวณเอง — RENDER อ่าน DATA.nego เท่านั้น (โครงเดิมทำถูกอยู่แล้ว)

---

## 6. Contracts สำหรับ Usopp (ถ้า Lead สั่งให้เขียน compute ใหม่)

รูปทรง task ที่ RENDER/rail/dashboard พึ่งอยู่ **ต้องคงไว้** (ไม่งั้น UI พัง): `{code,name,prov,owner,step,st,slatxt,sk,why,stat,substat,note,kt,ag,signed,due,dueLbl,w}` (ดู `:1205`)
- `step` ต้องเป็นค่าใน `NEGO_STEPS[].stp` · `st` ∈ {done,red,amber,green,none}
- `DATA.perf.nego` ต้องมี key เดิม: `{total,signed,pending,final,at_sign,over,close_pct,sla_pct}`
- **การ map กล่อง Pipeline → step ของ Portal ยังไม่ตัดสิน** — เป็นการตัดสินใจ UX/logic ที่ต้องให้ Lead เลือก (ดู §8)

## 7. หลักฐาน — column ตรง + ตัวเลข reconcile

**column ตรง** (ตรวจ `f_src_sla.json` row1 vs Pipeline const): c26=วันเซ็นสัญญาจริง, c29=ส่ง LG, c30=LG Scan, c33=ยื่น อ.1, c34=ได้ อ.1, c52=เจรจาชื่อ-สกุล, c53=Status Site Nego, c54=หมายเหตุ, c73=ผลอนุมัติรถตู้ — **ตรงทุกช่อง**

**ตัวเลขที่ reproduce จากข้อมูลจริง** (script port กฎ §3-4 รันบน `f_src_sla.json` + `pnego_exp.csv`, ณ 25 ก.ย.26):

| กล่อง | Pipeline (reproduce) | หมายเหตุ |
|---|---|---|
| pipelineRows kept | 481 | (approved 463 + reviewed-by-date 18) |
| approve (อนุมัติรถตู้ รวม 09/12) | 291 | |
| site_ex | 19 | |
| hold_nego | 78 | |
| nego_stuck | 30 | |
| potential | 12 | |
| **wip (base)** | **152** | ในนี้ confirm_o1=84 (ไป อ.1 แล้ว) |
| **stage_group (ยังอยู่เจรจา)** | **68** | = 4+28+36+0+0 ✅ reconcile |
| wait_kt | 4 | approx (pnegoKt ขาด) |
| sign_contract | 28 | |
| send_check | 36 | (จะกระจายไป check/final เมื่อมีข้อมูล TJ) |
| check_contract | 0 | ในสแนปนี้ยังไม่มีวันส่ง LG |
| contract_final | 0 | approx (inO1Prep=false) |
| opened / cancelled | 165 / 28 | |

**Portal ปัจจุบัน (นับจาก src_nego Main Status col5):** nTotal=**324**, signed=**168**, pending=**156**
→ นับคนละประชากรกับ Pipeline อย่างชัดเจน (324 flat vs 152 WIP / 68 in-nego) — นี่คือสาเหตุที่ 2 แอปไม่ตรง

---

## 8. สิ่งที่ implement แล้ว (28 ก.ย.26 · Lead เคาะครบ)

### 8.1 `cjx_siteops.html`
- **globals ใหม่** (`:426`): `NBX` (10 ป้ายกล่อง) + `NEGO_STEPS` (10 step) + `NF=NBX.done` · hoist ออกมาให้ `kpis()`+`compute()` ใช้ร่วม
- **helper ใหม่** (`:1114`): `wdH(a,b)` + `HOL26` — วันทำการแบบ Pipeline (ข้าม ส-อา + วันหยุด CJ 2026)
- **compute() ท่อนเจรจา** (`:1173`) — เขียนใหม่ทั้งบล็อก: ฐาน = `src_sla` (loop `hr+1`), lookups nego2/approval2/sign2 จาก `src_nego`, tjLegal จาก `src_tj`, pnegoKt จาก `src_pnego`, permit/send_ratkit จาก `src_constr` col6/7, ratkitN4 จาก `src_ratown` col13 · `negoBox(r)` จัดกล่องตาม §3-4 · SLA `wdH` 5/10/3
- **kpis() nego** (`:503`) — เลิกอ้าง `S[2]` (เปราะ) → ใช้ `NBX.sign` + task.signed + team-scoped
- **visRows/chip** — เพิ่ม KFILT `signed`
- **loadData** (`:1459`) — เพิ่ม `getTab("src_tj")`,`getTab("src_pnego")` เข้า Promise.all + compute signature
- **labels dashboard** — "เกิน 90 วัน" → "เกิน SLA" (metric เปลี่ยนเป็นวันทำการต่อกล่อง)
- **contract การ์ด task/perf.nego คงเดิม** → rail/dashNeg/cohort/site/drawer ไม่พัง (task shape เดิม + perf.nego = {total,signed,pending,final,wip,at_sign,over,close_pct,sla_pct})

### 8.2 `Code.gs`
- `src_nego` +col9 = วันเซ็นจริง (nego col17) · additive
- `src_constr` +col6 permit(63) +col7 send_ratkit(142) · header 8 คอลัมน์
- **เพิ่ม `src_tj`** (export gid=1839838784 → [code,send,scan]) + **`src_pnego`** (export gid=1464560053 → [code,kt]) — workbook 1Fnlv8, ใช้ export?format=csv (ห้าม gviz)

### 8.3 perf.nego (นิยามใหม่ · ฐาน Pipeline)
- `total` = approved (อนุมัติรถตู้ ตัดเปิด/ยกเลิก) = 291 · `wip` = base = 152 · `final` = confirm_o1 (เข้า อ.1) = 84
- `signed` = approved∧isSigned = 125 · `close_pct` = signed/total = 43% (แสดงคู่ "(signed/total)" สอดคล้อง)
- `over` = นับ st="red" (เกิน SLA วันทำการต่อกล่อง) · `sla_pct` = (SLA-tracked − over)/SLA-tracked
- `at_sign` = กล่อง "รอเซ็นสัญญา"

### 8.4 ข้อจำกัดที่เหลือ (ต้อง deploy ก่อน)
- **check_contract / contract_final** ในสแนปทดสอบ = 0 เพราะ `src_tj` (วันส่ง LG / LG scan) ยังไม่มีใน Master → send_check ดูดไปหมด (36) · หลัง **deploy Code.gs + syncAll** src_tj จะเข้ามา แล้วจะแตกเป็น send/check/final ตามจริง
- **wait_kt** แม่นขึ้นเมื่อ src_pnego เข้ามา (วันนัด KT ในอนาคต) · **contract_final vs confirm_o1** แม่นขึ้นเมื่อ src_constr 8 คอลัมน์ + src_ratown col13 เข้ามา (inO1Prep)
- **ทดสอบ live DOM ไม่ได้ในรอบนี้** — Master ยังไม่มี src_tj/src_pnego/constr 8 คอลัมน์ (งานนี้ห้าม deploy) · ยืนยัน "ตรง 100%" สมบูรณ์ต้อง deploy → syncAll → เทียบกับ Pipeline อีกครั้ง
- **ต้อง deploy Code.gs + HTML พร้อมกัน** (HTML compute อ่าน layout ใหม่ของ src_constr/tj/pnego)

---

## 9. หลักฐานการทดสอบ (รันโค้ดแอปจริง)

รัน **บล็อก compute nego ที่แก้แล้ว (ดึงจาก HTML ตรง ๆ)** บน `f_src_sla.json` + `pnego_exp.csv` (tj/pnego/constr ว่าง):

| metric | ได้ | Pipeline computeCounts | ตรง |
|---|---|---|---|
| total (approved) | 291 | 291 | ✅ |
| wip (base) | 152 | 152 | ✅ |
| stage_group (wip−final) | 68 | 68 | ✅ |
| final (confirm_o1) | 84 | 84 | ✅ |
| hold_nego / potential / nego_stuck / site_ex | 78 / 12 / 30 / 19 | 78 / 12 / 30 / 19 | ✅ |
| sign_contract / wait_kt | 28 / 4 | 28 / 4 | ✅ |
| send_check | 36 | 36* | ✅ |
| check_contract / contract_final | 0 / 0 | 0 / 0* | ✅ (*ต้องมี src_tj จึงแตกกล่อง) |

→ **ตรง 100% ทุกกล่องที่คำนวณได้จากข้อมูลที่มี** · กล่องที่เหลือ (check/final split) รอ src_tj หลัง deploy

---

## การตัดสินใจ

- ใช้ **src_sla เป็นประชากรฐาน** ไม่ใช่ src_nego | ไม่เอา: นับจากแท็บ nego ตรง ๆ | เพราะ Pipeline นับจาก SLA (pipe.html:3138)
- **rail = 10 กล่องแบบ Pipeline ครบ** (Lead เคาะ "ต้องมีทุกกล่อง") | ไม่เอา: คง 7 step เดิม | เพราะ Lead สั่ง
- **close_pct/sla_pct ฐาน Pipeline** (signed/approved · SLA วันทำการต่อกล่อง) | ไม่เอา: flat ทุกแถวเดิม | Lead เคาะ
- **src_tj/src_pnego = workbook 1Fnlv8 · export CSV** | ไม่เอา: gviz | เพราะ gviz ตัดแถว (pipe.html:4797)
- **task/perf shape เดิม + reuse label "รอเซ็นสัญญา/รอส่ง.../รอกฎหมาย..."** | เพื่อ rail/dashboard/cohort/drawer ไม่พัง
- **ยังไม่ deploy** | ตามคำสั่งงาน — ทดสอบ logic ด้วย reproduction บนข้อมูลจริงแทน

## ต้องยืนยัน / งานต่อ (Lead)

1. **Deploy + verify** — วาง Code.gs ใน Apps Script → run `setupSync`/`syncAll` (src_tj/src_pnego/constr 8 คอลัมน์เข้า Master) → deploy HTML → Ctrl+F5 → เทียบเลขกับ Pipeline live อีกครั้ง (จุดนี้เท่านั้นที่ยืนยัน 100% สมบูรณ์)
2. **Robin** ตรวจก่อนถือว่าผ่าน (ค่าตั้งต้น = ยังไม่ผ่าน)
3. **Luffy** อัปเดต PRD `:49,:264,:282,:129` — สถานะเจรจาเปลี่ยนเป็น SLA-driven + rail 10 กล่อง + denominator ใหม่
4. **aging chart (dashboard)** — ตอนนี้ ag = วันทำการเฉพาะกล่อง SLA (wait_kt/sign/send/check) · null สำหรับกล่องอื่น → chart population เปลี่ยนจากเดิม (calendar) เป็น WD · ถ้าอยากได้มุมอื่นให้ Lead/Usopp ปรับ
