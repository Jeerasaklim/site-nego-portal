/* ============================================================================================
 * siteops-compute.js — กติกาคิดสถานะงานเปิดสาขา (เจรจา · รังวัด · อ.1 · ทะเบียน · ต่ออายุ) ที่เดียวของทุกแอป
 *
 * ต้นทางจริง = ไฟล์นี้ในรีโป site-nego-portal · Portal (cjx_siteops.html) โหลดไฟล์นี้ก่อนสคริปต์หลัก
 * ExpansionOS (รีโป cjx-inspect) ใช้สำเนาที่ "คัดลอกด้วยสคริปต์" จากไฟล์นี้เท่านั้น — ห้ามแก้สำเนาฝั่งนั้นด้วยมือ
 * แก้กติกา = แก้ที่นี่ แล้วรันคัดลอกฝั่ง ExpansionOS (npm run data:siteops) · ตัวตรวจ drift จะฟ้องถ้าลืม
 *
 * ⚠️ เป็น classic script (ไม่ใช่ module) โดยตั้งใจ: ทุกชื่อเป็น global ให้โค้ดหน้าจอของ Portal ใช้ต่อได้เหมือนเดิม
 *    ExpansionOS รันไฟล์นี้ใน node:vm แล้วตั้ง TODAY / NOTES_WH ใน context เอง (TODAY = เที่ยงคืนวันกรุงเทพ)
 * ⚠️ ห้ามใส่ URL ที่เขียนได้ / key / secret ลงไฟล์นี้ — ไฟล์นี้ถูกคัดลอกไปอีกรีโป
 * ⚠️ เนื้อทุกบรรทัดข้างล่างย้ายมาจาก cjx_siteops.html @756c033 แบบตัวอักษรตรงกัน (ไม่แก้ตรรกะ) — 2026-11-25
 * ============================================================================================ */

/* ---- กล่องเจรจา (เดิม cjx_siteops.html:431-444) ---- */
/* ===== โมเดลกล่องเจรจา (nego) — ยกจาก App Pipeline "Site Nego" ให้ครบทุกกล่อง (28 ก.ย.26) =====
 * นับจากชีต SLA (src_sla) เป็นประชากรฐาน · แต่ละสาขาเข้ากล่องเดียว · กล่องข้างเส้น (pot/stuck/hold/siteex)
 * ไม่นับเป็น WIP · main flow = waitkt→sign→send→check→final · done = เข้าท่อน อ.1 (จบเจรจา) */
var NBX={pot:"ความเป็นไปได้ต่ำ",stuck:"ติดเงื่อนไข",hold:"Potential with cons",siteex:"รอนำเสนอใหม่",waitkt:"รอเสนอใบปะหน้าใหม่",sign:"รอเซ็นสัญญา",send:"รอส่งตรวจสอบสัญญา",check:"รอ Legal ตรวจสอบสัญญา",final:"สัญญา Final",done:"ยื่น อ.1"};
var NEGO_STEPS=[
  {ico:"🌱",stp:NBX.pot,task:"สถานะเจรจา 8.ความเป็นไปได้ต่ำ · ยังไม่เข้า WIP",sla:"ไม่จับ SLA"},
  {ico:"⚠️",stp:NBX.stuck,task:"สถานะเจรจา 2.เจรจา-ติดขัด · ยังไม่เข้า WIP",sla:"—"},
  {ico:"⏸️",stp:NBX.hold,task:"สถานะเจรจา 0.Potential with cons · ยังไม่เข้า WIP",sla:"รอปลดล็อก"},
  {ico:"↩️",stp:NBX.siteex,task:"ส่งกลับสรรหา / รอนำเสนอทำเลใหม่ (09/12)",sla:"นอกเส้นทางเจรจาหลัก"},
  {ico:"📋",stp:NBX.waitkt,task:"เสนอ KT ลงนามใบปะหน้า · รอรอบเสนอใหม่",sla:"5/10 วันทำการ จาก max(อนุมัติรถตู้, วันเสนอ KT)"},
  {ico:"✍️",stp:NBX.sign,task:"KT อนุมัติแล้ว · รอเจ้าของที่ดินเซ็นสัญญา",sla:"5/10 วันทำการ จาก max(อนุมัติรถตู้, วันเสนอ KT)"},
  {ico:"📤",stp:NBX.send,task:"เซ็นแล้ว · รอส่งเอกสารตรวจสอบสัญญาให้ Legal",sla:"3 วันทำการ จากวันเซ็น"},
  {ico:"⚖️",stp:NBX.check,task:"ส่ง Legal แล้ว · รอ Legal Scan สัญญาเข้าระบบ",sla:"3 วันทำการ จากวันส่ง Legal"},
  {ico:"✅",stp:NBX.final,task:"Legal Scan แล้ว · สัญญา Final — จบท่อนเจรจา (ส่งต่อ อ.1)",sla:"จบท่อนเจรจา"}];

/* ---- ตัวช่วยวันที่/ช่อง (เดิม :1198-1200 · :1202-1210 — csv() อยู่ที่ Portal เพราะเป็นตัวโหลด) ---- */
var TODAY=new Date();TODAY.setHours(0,0,0,0);
function iso(d){return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);}
function cc(r,i){return (r&&i<r.length&&r[i]!=null)?String(r[i]).trim():"";}
var _TM=[[0x0e21,0x2e,0x0e04,0x2e],[0x0e01,0x2e,0x0e1e,0x2e],[0x0e21,0x0e35,0x2e,0x0e04,0x2e],[0x0e40,0x0e21,0x2e,0x0e22,0x2e],[0x0e1e,0x2e,0x0e04,0x2e],[0x0e21,0x0e34,0x2e,0x0e22,0x2e],[0x0e01,0x2e,0x0e04,0x2e],[0x0e2a,0x2e,0x0e04,0x2e],[0x0e01,0x2e,0x0e22,0x2e],[0x0e15,0x2e,0x0e04,0x2e],[0x0e1e,0x2e,0x0e22,0x2e],[0x0e18,0x2e,0x0e04,0x2e]];
var THM={};_TM.forEach(function(a,i){THM[a.map(function(c){return String.fromCharCode(c);}).join("")]=i;});
var ENM={jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
function pdate(s){s=(s||"").trim();if(s.length>=10&&s[4]=="-"&&/^\d/.test(s)){var d=new Date(+s.slice(0,4),+s.slice(5,7)-1,+s.slice(8,10));if(!isNaN(d.getTime()))return d;}var p=s.split("-");if(p.length==3){var m=THM[p[1]];if(m==null)m=ENM[(p[1]||"").toLowerCase().slice(0,3)];if(m!=null){var y=+p[2];if(y<100)y+=2000;var dd=new Date(y,m,+p[0]);if(!isNaN(dd.getTime()))return dd;}}return null;}
function daysBetween(a,b){return Math.round((a-b)/86400000);}
function wdBetween(a,b){if(!a||!b)return null;if(b<a)return 0;var n=0,cur=new Date(a.getTime());cur.setDate(cur.getDate()+1);while(cur<=b){var g=cur.getDay();if(g!==0&&g!==6)n++;cur.setDate(cur.getDate()+1);}return n;}
/* วันทำการแบบ Pipeline (workingDays: หลัง start ถึง end · ข้าม ส-อา + วันหยุด CJ 2026–2027 · ติดลบถ้า end<start) — pipe.html:3093 */
var HOL26={"2026-01-01":1,"2026-01-02":1,"2026-04-13":1,"2026-04-14":1,"2026-04-15":1,"2026-05-01":1,"2026-06-03":1,"2026-07-28":1,"2026-08-12":1,"2026-10-13":1,"2026-12-05":1,"2026-12-07":1,"2026-12-30":1,"2026-12-31":1};
/* วันหยุด CJ 2027 (2570) สำนักงานใหญ่ — ประกาศ CJX-AN-69010 (อีเมล Internal Communication 24 ก.ย. 2026) · 13 วัน รวมวันชดเชย:
   04-ม.ค. ชดเชยมาฆบูชา(21 ก.พ.) · 03-พ.ค. ชดเชยแรงงาน(1 พ.ค.) · 06-ธ.ค. ชดเชย 5 ธ.ค. · 30-ธ.ค. ชดเชยปิยมหาราช(23 ต.ค.)
   ⚠️ ปีถัดไป: เพิ่ม HOLyy ตามประกาศจริง แล้วเติมใน HOL ข้างล่าง — ไม่มีปีนั้น = วันหยุดปีนั้นถูกนับเป็นวันทำการ (SLA เพี้ยนเงียบ) */
var HOL27={"2027-01-01":1,"2027-01-04":1,"2027-04-13":1,"2027-04-14":1,"2027-04-15":1,"2027-05-03":1,"2027-06-03":1,"2027-07-28":1,"2027-08-12":1,"2027-10-13":1,"2027-12-06":1,"2027-12-30":1,"2027-12-31":1};
function wdH(a,b){if(!a||!b)return null;var end=new Date(b.getFullYear(),b.getMonth(),b.getDate()),step=(end>=a)?1:-1,cur=new Date(a.getFullYear(),a.getMonth(),a.getDate()),n=0;while(cur.getTime()!==end.getTime()){cur.setDate(cur.getDate()+step);var g=cur.getDay();var k=cur.getFullYear()+"-"+("0"+(cur.getMonth()+1)).slice(-2)+"-"+("0"+cur.getDate()).slice(-2);if(g>=1&&g<=5&&!HOL26[k]&&!HOL27[k])n+=step;}return n;}

/* ---- ยกเลิก (undo) + compute (เดิม :1237-1543) ---- */
/* ↩️ ยกเลิก (undo) — event field="undo", value="<field>" หรือ "<field>|<value>" (reg/done ระบุช่อง, o1/step ระบุขั้น)
   ยกเลิก = ตัด event ก่อนหน้าที่ key ตรงกัน "ทั้งหมด" (กดซ้ำหลายครั้งก็หายด้วยการยกเลิกครั้งเดียว) · log ไม่ถูกลบ = มีประวัติครบ · ไม่ยุ่ง renew (มี reset ของมันเอง) */
function _updKey(u){var k=u.code+"|"+u.track+"|"+u.field;if((u.track==="reg"&&u.field==="done")||(u.track==="o1"&&u.field==="step")||u.track==="note")k+="|"+u.value;return k;}
function _applyUndo(upd){var out=[];(upd||[]).forEach(function(u){if(u.field==="undo"){var tk=u.code+"|"+u.track+"|"+u.value;out=out.filter(function(x){return _updKey(x)!==tk;});}else out.push(u);});return out;}
/* Kissflow → เติมช่องที่ชีตว่าง (25 พ.ย. 69 จีสั่ง "เชื่อม Kissflow เหมือน App Pipeline")
   ใช้แท็บ KF_Fill ชุดเดียวกับ Pipeline (kfSync ทุก 30 นาที ในชีต GO State) · กติกาเดียวกับ Pipeline _kfApplyFills_ (GO_webapp.gs):
   ชีตมีค่า = ใช้ชีต · ชีตว่างแต่ Kissflow มีวัน = เติม · เฉพาะ tab "sla" (col 12 รังวัด · 20 คัด น.4 · 21/22 ผัง · 26 วันเซ็น · 33 ยื่น อ.1)
   tab "constr" col144 ไม่เติม — Portal ไม่ได้ใช้ช่องนั้น · คืน meta ไว้เตือนเมื่อข้อมูล Kissflow เก่า/อ่านไม่ได้ */
var KF_STALE_MIN=120;
function _kfApply(sla,kf){var meta={synced_at:"",fills:0,applied:0,stale:true,err:""};if(!kf||!kf.length){meta.err="ไม่มีข้อมูล KF_Fill";return {sla:sla,meta:meta};}
 if(kf[0]&&kf[0][0]==="ERR"){meta.err=String(kf[0][1]||"อ่านไม่ได้");return {sla:sla,meta:meta};}
 meta.synced_at=String(kf[0][6]||"").replace("synced_at ","");var t=new Date(meta.synced_at.replace(" ","T")+":00+07:00");
 meta.stale=isNaN(t.getTime())||(Date.now()-t.getTime())>KF_STALE_MIN*60000;
 var nz=function(s){return String(s==null?"":s).replace(/\s+/g,"");},THN=[];for(var k in THM)THN[THM[k]]=k;
 var idx={};sla.forEach(function(r,i){var c=nz(r[0]);if(c)(idx[c]=idx[c]||[]).push(i);});
 var out=sla.slice();
 for(var i=1;i<kf.length;i++){var code=nz(kf[i][0]),tb=kf[i][1],col=parseInt(kf[i][2],10),d=String(kf[i][3]||"");
   if(!code||tb!=="sla"||isNaN(col)||!/^\d{4}-\d{2}-\d{2}$/.test(d))continue;meta.fills++;
   var p=d.split("-"),disp=(+p[2])+"-"+THN[+p[1]-1]+"-"+p[0].slice(2);    // รูปแบบเดียวกับชีต (24-พ.ย.-26)
   (idx[code]||[]).forEach(function(ri){if(cc(out[ri],col)==="")
     {var row=out[ri].slice();while(row.length<=col)row.push("");row[col]=disp;out[ri]=row;meta.applied++;}});}
 return {sla:out,meta:meta};}
function compute(neg,sla,reg,constr,ratown,upd,flow,lic,taxSign,taxLand,tj,pnego,kf){
 upd=_applyUndo(upd);
 var _kf=_kfApply(sla||[],kf);sla=_kf.sla;
 // ---- SLA sheet (อ.1) ----
 var hr=0;for(var i=0;i<8&&i<sla.length;i++){if(sla[i].join("|").indexOf("Site Code")>=0){hr=i;break;}}
 var SGOT={},SWAI={},SSUB={},SSTP={};function okv(v){return v&&v.indexOf("1899")<0&&v.indexOf("1900")<0;}
 for(i=hr+1;i<sla.length;i++){var r=sla[i];var c=cc(r,0);if(!c)continue;if(okv(cc(r,33)))SSUB[c]=cc(r,33);if(okv(cc(r,34)))SGOT[c]=1;if(okv(cc(r,46)))SWAI[c]=1;}
 // ---- construction opened + prov/name ----
 var opened={},cprov={},cname={};   /* constr = normalized [code,name,prov,open,active,hide] */
 for(i=0;i<constr.length;i++){var r=constr[i];var c=cc(r,0);if(!c)continue;cprov[c]=cc(r,2);if(!cname[c])cname[c]=cc(r,1);var o=pdate(cc(r,3));if((cc(r,4)=="Active"||cc(r,5)=="Hide")&&o&&o<=TODAY)opened[c]=1;}
 // เสริม: ร้านที่ชีต SLA บอกว่าเปิดแล้ว (คนอาจไม่ได้กรอกใน construction sheet) — เปิดแล้ว = ไม่มีงานค้าง (กฎทั้งแอป)
 for(i=hr+1;i<sla.length;i++){var r=sla[i];var c=cc(r,0);if(!c)continue;var s6=cc(r,6),s8=cc(r,8);if(s6.indexOf("Opened")>=0||/^9\./.test(s6)||s8.indexOf("เปิดแล้ว")>=0||/^01\./.test(s8))opened[c]=1;}
 // ---- ratkit owner ----
 var rkOwn={},rkProv={};var rhr=0;for(i=0;i<6&&i<ratown.length;i++){if(ratown[i].join("|").indexOf("Site Code")>=0){rhr=i;break;}}
 for(i=rhr+1;i<ratown.length;i++){var r=ratown[i];var c=cc(r,0);if(c){rkOwn[c]=cc(r,5);rkProv[c]=cc(r,4);}}
 // ---- overlay ----
 var reg_done={},nego_signed={},svy_appoint={},svy_surveyed={},svy_sent={},renew_skip={},renew_status={};
 upd.forEach(function(u){var co=u.code;if(!co)return;if(u.track=="reg"&&u.field=="done"){(reg_done[co]=reg_done[co]||{})[parseInt(u.value,10)]=1;}else if(u.track=="o1"){if(u.field=="submit"){if(!SSUB[co])SSUB[co]=u.value||iso(TODAY);}else if(u.field=="got")SGOT[co]=1;else if(u.field=="waiver")SWAI[co]=1;else if(u.field=="step")SSTP[co]=u.value;}else if(u.track=="nego"&&u.field=="signed")nego_signed[co]=1;else if(u.track=="survey"){if(u.field=="appoint")svy_appoint[co]=u.value||"1";else if(u.field=="surveyed")svy_surveyed[co]=1;else if(u.field=="sent")svy_sent[co]=1;}else if(u.track=="renew"){if(u.field=="skip"){(renew_skip[co]=renew_skip[co]||{})[u.value]=1;}else if(u.field=="unskip"){if(renew_skip[co])delete renew_skip[co][u.value];}else if(u.field=="submit"||u.field=="done"){var _rp=(u.value||"").split("|");(renew_status[co]=renew_status[co]||{})[_rp[0]]={s:u.field,ex:_rp[1]||""};}else if(u.field=="reset"){if(renew_status[co])delete renew_status[co][u.value];}}});
 function bkk(p){return (p||"").indexOf("กรุงเทพ")>=0;}
 // ================= เจรจา (nego) — port logic App Pipeline: ฐาน = src_sla, box ครบทุกกล่อง =================
 // (pipe.html computeCounts :3137-3181 · predicates :3059-3088 · waitKtCover :3267) — นับทุกสาขาที่ "อนุมัติรถตู้"
 var negRows=neg.slice(1).filter(function(r){return cc(r,0);});         // คงไว้: ท่อน อ.1/รังวัด ด้านล่างยังใช้
 function gm(r){var m=cc(r,5);return (m&&/[0-9]/.test(m[0]))?m[0]:"?";}  // คงไว้: ใช้ seed candidate อ.1
 var NF=NBX.final;  // final ของท่อนเจรจา = สัญญา Final (จบเจรจา · ยื่น อ.1 เป็นงานของรัฐกิจ)
 // --- lookups จากแท็บ nego (src_nego): col5=Main Status · col4=รูปแบบอนุมัติ · col9=วันเซ็นจริง · col3=owner ---
 var nego2={},approval2={},sign2={},negOwnL={};
 for(var ni=1;ni<neg.length;ni++){var nr=neg[ni];var nc=cc(nr,0);if(!nc)continue;
   var mv=cc(nr,5);if(!(nc in nego2)||(nego2[nc]===""&&mv!==""))nego2[nc]=mv;
   var av=cc(nr,4);if(!(nc in approval2)||(approval2[nc]===""&&av!==""))approval2[nc]=av;
   var sv=cc(nr,9);if(!(nc in sign2)||(sign2[nc]===""&&sv!==""))sign2[nc]=sv;
   negOwnL[nc]=cc(nr,3);}
 // --- tjLegal (src_tj:[code,send,scan]) · pnegoKt (src_pnego:[code,kt]) · permit/send_ratkit (src_constr col6/7) · ratkitN4 (src_ratown col13) ---
 var tjSend={},tjScan={};if(tj&&tj.length>1){for(var tji=1;tji<tj.length;tji++){var tr=tj[tji];var tc=cc(tr,0);if(!tc)continue;tjSend[tc]=cc(tr,1)||tjSend[tc]||"";tjScan[tc]=cc(tr,2)||tjScan[tc]||"";}}
 var pnegoKt={};if(pnego&&pnego.length>1){for(var pgi=1;pgi<pnego.length;pgi++){var pr2=pnego[pgi];var pgc=cc(pr2,0);if(!pgc)continue;var kv=cc(pr2,1);if(!(pgc in pnegoKt)||(pnegoKt[pgc]===""&&kv!==""))pnegoKt[pgc]=kv;}}
 var permitSub={},sendRatkit={};for(i=0;i<constr.length;i++){var cr=constr[i];var crc=cc(cr,0);if(!crc)continue;if(cc(cr,6))permitSub[crc]=cc(cr,6);if(cc(cr,7))sendRatkit[crc]=cc(cr,7);}
 var ratkitN4={};for(i=rhr+1;i<ratown.length;i++){var rr2=ratown[i];var rc2=cc(rr2,0);if(rc2&&cc(rr2,13))ratkitN4[rc2]=cc(rr2,13);}
 // --- predicates (ตรงกับ pipe.html) ---
 function nspace(s){return (s||"").replace(/\s+/g,"");}
 function nStat(r){return cc(r,53)||(nego2[cc(r,0)]||"");}                                 // :3059
 function nHold(r){return nStat(r)==="0.Potential with cons";}   // 27 พ.ย. ตาม Pipeline isHoldNego (8 ต.ค.): สถานะ BB "0.Potential with cons" · เลิกใช้คอลัมน์ G "6.1 Hold เจรจาราคา"                 // :3060
 function nSigned(r){var c=cc(r,0);var _s=nStat(r);return cc(r,26)!==""||(sign2[c]||"")!==""||!!nego_signed[c]||_s.indexOf("3.")===0||_s.indexOf("4.")===0||_s==="เปิดร้านแล้ว";}   /* 27 พ.ย.: ตัด opened[c] (ชีตก่อสร้าง) ออก ให้ตรง Pipeline isSigned */ // เซ็นแล้ว = วันเซ็น OR สถานะ 3./4./เปิดแล้ว (กติกา 28 ก.ย. signed-rule-both-apps) :3061
 function nNoO1(r){return cc(r,33)===""&&cc(r,34)==="";}                                    // :3169
 function nSendLg(r){var c=cc(r,0);return (tjSend[c]||"")||cc(r,29);}                       // :3066
 function nScanLg(r){var c=cc(r,0);return (tjScan[c]||"")||cc(r,30);}                       // :3067
 function nRepro(v){v=(v||"").trim();return v==="09.รอนำเสนอใหม่"||/^12\.\s*รอนำเสนอ/.test(v);} // :2886
 function nHasN4(r){var c=cc(r,0);return cc(r,20)!==""||(ratkitN4[c]||"")!==""||cc(r,21)!=="";} // :3064
 function nInO1Prep(r){var c=cc(r,0);return nScanLg(r)!==""&&(permitSub[c]||"")!==""&&nHasN4(r)&&(sendRatkit[c]||"")!=="";} // :3081
 function nWaitKt(r){var c=cc(r,0);if((nego2[c]||"")!=="7.เสนอ KT ลงนามใบปะหน้า")return false;var z=pnegoKt[c]||"";if(!z)return true;var d=pdate(z);return d==null||d>TODAY;} // :3267
 function nSignDate(r){return cc(r,26)||(sign2[cc(r,0)]||"");}
 function negoBox(r){var exp=cc(r,8);
   if(nRepro(exp))return NBX.siteex;
   if(nHold(r))return NBX.hold;
   var ns=nStat(r);
   if(ns==="8.ความเป็นไปได้ต่ำ")return NBX.pot;                              // 27 พ.ย. ตาม Pipeline NEGO_POTENTIAL (8 ต.ค.)
   if(ns==="2.เจรจา-ติดขัด")return NBX.stuck;
   if(!nNoO1(r))return NBX.final;                                          // ยื่น อ.1 แล้ว = จบเจรจา (สัญญา Final เป็นกล่องจบ · อ.1 เป็นท่อนรัฐกิจ)
   if(!nSigned(r))return nWaitKt(r)?NBX.waitkt:NBX.sign;                    // :3175-3177
   if(nScanLg(r)==="")return nSendLg(r)===""?NBX.send:NBX.check;            // :3179-3180
   return NBX.final;}                                                       // :3181 (เซ็น+ส่ง/สแกน legal ครบ = จบเจรจา)
 function nSla(r,box){var c=cc(r,0);
   if(box===NBX.waitkt||box===NBX.sign){var ad=pdate(cc(r,11)),kt=pdate(pnegoKt[c]||"");var start=ad;if(kt&&kt<=TODAY&&(!start||start<kt))start=kt;var tgt=((approval2[c]||"")==="Approved with condition")?10:5;return {ag:start?wdH(start,TODAY):null,tgt:tgt};}
   if(box===NBX.send)return {ag:(function(){var d=pdate(nSignDate(r));return d?wdH(d,TODAY):null;})(),tgt:3};
   if(box===NBX.check)return {ag:(function(){var d=pdate(nSendLg(r));return d?wdH(d,TODAY):null;})(),tgt:3};
   return {ag:null,tgt:null};}
 // --- build tasks บนประชากร "approved" (อนุมัติรถตู้ · ตัดเปิด/ยกเลิก) ---
 var negT=[],nowner={},nsigned={},nTotal=0,nSignedAll=0,nWip=0,nFinal=0,signedCodes={};
 for(var nk=hr+1;nk<sla.length;nk++){var r=sla[nk];var c=cc(r,0);if(!c)continue;
   var exp=cc(r,8);
   if(exp==="ขึ้นรถตู้วันนี้"||exp==="Reject")continue;              // G1 (:3114)
   if(nStat(r)==="5.ยกเลิก")continue;                               // G2 (:3115)
   var adG=pdate(cc(r,11));if(!(cc(r,73)==="Approved"||(adG!=null&&adG<TODAY)))continue;  // G3 (:3116)
   if(exp==="01.เปิดแล้ว"||exp==="10.ยกเลิก")continue;              // approved = ตัดเปิด/ยกเลิก (:3140)
   nTotal++;
   var box=negoBox(r);
   var own=negOwnL[c]||cc(r,52)||cc(r,4)||"(ไม่ระบุ)";
   var isSg=nSigned(r);if(isSg)nSignedAll++;
   if(isSg)signedCodes[c]={name:cc(r,2)||cc(r,4)||c,prov:cc(r,3)};   // ชุด "เซ็นแล้ว" (เกณฑ์ nSigned เดียวกับ nego/Pipeline) → ใช้เป็นประชากรเข้าท่อน อ.1
   nowner[own]=(nowner[own]||0)+1;if(isSg)nsigned[own]=(nsigned[own]||0)+1;
   var inWip=(box!==NBX.siteex&&box!==NBX.hold&&box!==NBX.pot&&box!==NBX.stuck);
   if(inWip){nWip++;if(box===NBX.final)nFinal++;}
   var sla2=nSla(r,box),ag=sla2.ag,tgt=sla2.tgt,st,sx,sk;
   if(box===NBX.final){st="done";sx="สัญญา Final · จบท่อนเจรจา ✓"+(nNoO1(r)?"":" (ยื่น อ.1 แล้ว)");sk=[9,0];}
   else if(ag==null){st="none";sx="—";sk=[3,0];}
   else if(ag>tgt){st="red";sx="เกิน SLA "+(ag-tgt)+" วันทำการ (aging "+ag+"/"+tgt+")";sk=[0,-ag];}
   else if(ag===tgt){st="amber";sx="ครบ SLA พอดี (aging "+ag+"/"+tgt+")";sk=[1,-ag];}
   else{st="green";sx="ตรง SLA (aging "+ag+"/"+tgt+")";sk=[2,-ag];}
   var note=cc(r,54).replace(/\s+/g," ").trim();var stat=nStat(r)||box;
   var task={code:c,name:cc(r,2)||cc(r,4)||c,prov:cc(r,3),owner:own,step:box,st:st,slatxt:sx,sk:sk,
     why:(note?box+" · "+note.slice(0,45):box),stat:stat,substat:(cc(r,6)||"—"),note:note,kt:(pnegoKt[c]||""),ag:(ag==null?null:ag),signed:isSg};
   if(st==="red"){task.due=iso(TODAY);task.dueLbl="เกิน SLA";}
   if(box!==NBX.final)task.w={track:"nego",field:"signed",lbl:"✅ เซ็นสัญญาแล้ว"};
   negT.push(task);}
 var _negBase={};negT.forEach(function(t){_negBase[t.code]=1;});
 var _negWip={};negT.forEach(function(t){if(t.step!==NBX.siteex&&t.step!==NBX.hold&&t.step!==NBX.pot&&t.step!==NBX.stuck)_negWip[t.code]=1;});   // WIP base (= Pipeline base) → ฐานท่อน อ.1   // ประชากร approved ของเจรจา → ใช้เป็นฐานท่อนรังวัด
 var nPending=negT.filter(function(t){return t.step!==NBX.final&&t.step!==NBX.siteex;}).length; // ค้าง = ทุกกล่อง ยกเว้น สัญญา Final(จบเจรจา รวมยื่นอ.1)/รอนำเสนอใหม่(ตีกลับสรรหา)
 var nOver=negT.filter(function(t){return t.st=="red";}).length;
 var nSla2=negT.filter(function(t){return t.ag!=null&&t.step!==NBX.final;}).length;
 // ================= อ.1 — 9 กล่องตาม Pipeline แท็บ อ.1 (app/src/o1-tab.js PRE/POST) · 27 พ.ย. 69 จีสั่ง "ทำเลย" =================
 // ก่อนยื่น 6 กล่อง = กล่องหน้า Overall (calc-engine computeCounts) · 1 สาขาอยู่ได้หลายกล่อง (t.boxes) เหมือน Pipeline (นับรายกล่อง)
 // หลังยื่น 3 กล่อง = After อ.1 (ยื่นแล้ว·รอใบ / อนุโลม / ได้ อ.1) · ฐาน = WIP เจรจา (_negWip = Pipeline base/afterCohort)
 var A_CF="สัญญา Final",A_P7="แบบขออนุญาต Final",A_N4="รอคัด น.4",A_N42="เอกสาร น.2+น.4 Final",A_WO="เตรียมเอกสาร ยื่น อ.1",A_RO="รอยื่น อ.1",
     A_TRK="ยื่นแล้ว · รอใบอนุญาต อ.1",A_WAI="ได้รับอนุโลม อ.1 (เข้าก่อสร้างได้ · รอใบจริง)",A_OK="ได้ อ.1 แล้ว";var OF=A_OK;
 var A_PRE=[A_CF,A_P7,A_N4,A_N42,A_WO,A_RO];
 var RAT_STEPS=[{ico:"📄",stp:A_CF,task:"Legal Scan แล้ว · ยังไม่ครบชุดเตรียม อ.1",sla:"—"},
   {ico:"📐",stp:A_P7,task:"ผังอนุมัติครบ + ยื่นแบบขออนุญาตแล้ว",sla:"—"},
   {ico:"📑",stp:A_N4,task:"ยังไม่มี น.4 / ยังไม่เข้าคณะกรรมการผัง",sla:"10 วันทำการ จากวันอนุมัติรถตู้"},
   {ico:"📚",stp:A_N42,task:"มี น.4 + ส่งเอกสารรัฐกิจแล้ว · ยังไม่ครบชุด",sla:"—"},
   {ico:"🗂️",stp:A_WO,task:"ชุดเอกสารครบ · รอส่งให้รัฐกิจ",sla:"3 วันทำการ จาก max(สแกนสัญญา/ยื่นแบบ/ส่งรัฐกิจ)"},
   {ico:"📤",stp:A_RO,task:"ส่งเอกสารให้รัฐกิจแล้ว · รอยื่น อ.1",sla:"5 วันทำการ จากวันส่งเอกสารให้รัฐกิจ"},
   {ico:"🔎",stp:A_TRK,task:"ยื่น อ.1 แล้ว · รอใบอนุญาต",sla:"ต่างจังหวัด 45 / กทม. 60 วันปฏิทิน จากวันยื่น"},
   {ico:"🏗️",stp:A_WAI,task:"ได้รับอนุโลม · เข้าก่อสร้างได้ · รอใบจริง",sla:"—"},
   {ico:"✅",stp:A_OK,task:"ได้ใบ อ.1 · ส่งต่อทีมก่อสร้าง",sla:"จบท่อน อ.1"}];
 var rkSendDoc={};for(i=rhr+1;i<ratown.length;i++){var rr3=ratown[i];var rc3=cc(rr3,0);if(rc3&&cc(rr3,18))rkSendDoc[rc3]=cc(rr3,18);}   // Pipeline RATKIT_COL_SEND_DOC=18
 function _wdMax(arr){var best=null;arr.forEach(function(v){var d=pdate(v||"");if(d&&(!best||d>best))best=d;});return best?wdH(best,TODAY):null;}
 var ratT=[];
 var regRk={};for(var ri=1;ri<reg.length;ri++){var rr0=reg[ri];var rc0=cc(rr0,0);if(rc0&&cc(rr0,3))regRk[rc0]=cc(rr0,3);}   // Pipeline ทะเบียนและรัฐกิจ Column D = ผู้รับผิดชอบ
 var _o1seen={};
 for(i=hr+1;i<sla.length;i++){var r=sla[i];var c=cc(r,0);if(!c||_o1seen[c]||!_negWip[c])continue;_o1seen[c]=1;   // ฐานเดียวกับ Pipeline afterCohort
   var prov=cc(r,3)||rkProv[c]||cprov[c]||"";var own=regRk[c]||rkOwn[c]||"(ไม่ระบุ)";
   var sub=SSUB[c]||"",got=!!SGOT[c],wv=!!SWAI[c]&&!got;
   var boxes=[],bst={},bsx={},step,st,sx,sk,due="",dueLbl="";
   if(sub||got){                                                                 // หลังยื่น (Pipeline: submit_o1 หรือ got_o1)
     if(got){step=A_OK;st="done";sx="ได้ อ.1 ✓";sk=[3,0];}
     else if(wv){step=A_WAI;st="none";sx="อนุโลม · รอใบจริง";sk=[2,0];}
     else{step=A_TRK;var sd=pdate(sub);var lim=bkk(prov)?60:45;var dl=sd?daysBetween(new Date(sd.getTime()+lim*86400000),TODAY):null;
       if(dl==null){st="none";sx="รอผล";sk=[2,0];}else if(dl<0){st="red";sx="เกิน SLA "+(-dl)+" วัน";sk=[0,dl];}else if(dl<=7){st="amber";sx="เหลือ "+dl+" วัน";sk=[1,dl];}else{st="green";sx="เหลือ "+dl+" วัน";sk=[1,dl];}
       if(sd){due=iso(new Date(sd.getTime()+lim*86400000));dueLbl="ครบ SLA อ.1";}}
     boxes=[step];bst[step]=st;
   }else{                                                                        // ก่อนยื่น: กล่องหน้า Overall (computeCounts :3364-3413)
     var scan=nScanLg(r),pmt=permitSub[c]||"",srk=sendRatkit[c]||"",hasN4d=(cc(r,20)!==""||(ratkitN4[c]||"")!==""||cc(r,21)!=="");
     var prep=nInO1Prep(r),surv=(cc(r,12)!==""||cc(r,13)!==""),ready=(scan!==""&&pmt!==""&&hasN4d&&srk!=="");
     var add=function(bx,ag,tgt){boxes.push(bx);if(tgt==null){bst[bx]="none";bsx[bx]="—";return;}
       if(ag==null){bst[bx]="none";bsx[bx]="—";}else if(ag>tgt){bst[bx]="red";bsx[bx]="เกิน SLA "+(ag-tgt)+" วันทำการ ("+ag+"/"+tgt+")";}else if(ag===tgt){bst[bx]="amber";bsx[bx]="ครบ SLA พอดี ("+ag+"/"+tgt+")";}else{bst[bx]="green";bsx[bx]="ตรง SLA ("+ag+"/"+tgt+")";}};
     if(scan!==""&&!prep)add(A_CF);
     if(surv&&cc(r,21)!==""&&cc(r,22)!==""&&pmt!==""&&!prep)add(A_P7);
     if(cc(r,20)===""&&(ratkitN4[c]||"")===""&&cc(r,21)==="")add(A_N4,wdH(pdate(cc(r,11)),TODAY),10);
     if(hasN4d&&srk!==""&&!prep)add(A_N42);
     if(ready&&!(rkSendDoc[c]||""))add(A_WO,_wdMax([scan,pmt,srk]),3);
     if(ready&&(rkSendDoc[c]||""))add(A_RO,_wdMax([rkSendDoc[c]]),5);
     if(!boxes.length)continue;                                                  // ไม่อยู่ในกล่องไหน = ไม่ใช่งาน อ.1 (เหมือน Pipeline)
     var RK={red:0,amber:1,green:2,none:3};step=boxes[0];st="none";boxes.forEach(function(bx){if(RK[bst[bx]]<RK[st]){st=bst[bx];}});
     var wb=boxes.filter(function(bx){return bst[bx]===st;})[0]||step;sx=bsx[wb]||"—";sk=(st==="red"?[0,0]:st==="amber"?[1,0]:[2,0]);
   }
   var t={code:c,name:cc(r,2)||cname[c]||c,prov:prov,owner:own,step:step,boxes:boxes,boxSt:bst,st:st,slatxt:sx,sk:sk,waiver:wv,kt:"",stat:(wv?"อนุโลม":""),
     why:(got?"ได้ใบ อ.1 แล้ว":(wv?"ได้รับอนุโลม · ก่อสร้างก่อนได้":(sub?"ยื่น อ.1 แล้ว รอผล":"ก่อนยื่น · "+boxes.join(" / "))))};
   if(due){t.due=due;t.dueLbl=dueLbl;}
   if(!got){
     if(!sub)t.w={track:"o1",field:"submit",value:"",lbl:"🔎 ยื่น อ.1 แล้ว"};
     else t.w={track:"o1",field:"got",value:"",lbl:"✅ ได้ อ.1 แล้ว"};
     if(sub&&!wv)t.w2={track:"o1",field:"waiver",value:"",lbl:"🏗️ อนุโลม (ก่อสร้างก่อน)"};
   }
   ratT.push(t);
 }
 var rOver=ratT.filter(function(t){return t.st=="red";}).length;
 var rPrep=ratT.filter(function(t){return A_PRE.indexOf(t.step)>=0;}).length;
 var rSub=ratT.filter(function(t){return t.step===A_TRK||t.step===A_WAI;}).length;
 var oGot=ratT.filter(function(t){return t.step==A_OK;}).length;
 var oWai=ratT.filter(function(t){return t.step===A_WAI;}).length;
 // ================= ทะเบียน =================
 var RG_PREP="เตรียมเอกสารทะเบียนบ้าน",RG_HOME="ทะเบียนบ้าน + ภ.พ.09",RG_UTIL="น้ำ-ไฟ",RG_LIC="ใบอนุญาต (D-11~D-8)",RGF="จดทะเบียนครบ (จบ)";
 var REG_STEPS=[{ico:"📝",stp:RG_PREP,task:"รวบรวมเอกสารเริ่มต้น — งานแรกของทีมทะเบียน",sla:"เริ่มที่นี่"},
   {ico:"🏠",stp:RG_HOME,task:"ยื่นทะเบียนบ้าน D-19 → ได้ D-9 · จดเพิ่มสาขา ภ.พ.09 (D-16)",sla:"ได้บ้านก่อน D-9"},
   {ico:"💧",stp:RG_UTIL,task:"น้ำ-ไฟ ชั่วคราว + ถาวร (เตรียม/ขอ/ได้)",sla:"ให้ทันวันเปิด"},
   {ico:"📄",stp:RG_LIC,task:"เสียง/ถัง/สุรา/ป้าย/ซากสัตว์/อาหาร/อันตราย/ภพ.06/ภอ.11",sla:"ยื่นก่อน D-8"},
   {ico:"✅",stp:RGF,task:"ครบทุกใบ · เปิดร้านได้",sla:"จบงานทะเบียน"}];
 var DOCS=[{g:RG_HOME,n:"ทะเบียนบ้าน",done:15,d:9},{g:RG_HOME,n:"ภ.พ.09 เพิ่มสาขา",done:17,d:16},
   {g:RG_UTIL,n:"น้ำ-ไฟ ชั่วคราว",done:7},{g:RG_UTIL,n:"น้ำ ถาวร",done:10},{g:RG_UTIL,n:"ไฟ ถาวร",done:13},
   {g:RG_LIC,n:"ขอใช้เสียง",done:20,d:11},{g:RG_LIC,n:"ถังเทศบาล + ถังขยะ",done:18,d:11},{g:RG_LIC,n:"สุรา + อาหารสัตว์",done:22,d:11},
   {g:RG_LIC,n:"ภาษีป้าย + สิ่งปลูกสร้าง",done:23,d:8},{g:RG_LIC,n:"ค้าซากสัตว์",done:25,d:8},{g:RG_LIC,n:"สะสม+จำหน่ายอาหาร",done:27,d:8},
   {g:RG_LIC,n:"กิจการอันตราย (ยาฆ่าแมลง)",done:29,d:8},{g:RG_LIC,n:"กิจการอันตราย (แก็ซกระป๋อง)",done:31,d:8},{g:RG_LIC,n:"ภพ.06",done:32,d:8},{g:RG_LIC,n:"ภอ.11",done:33,d:8}];
 var RG=true;
 var regT=[];
 for(i=1;i<reg.length;i++){var r=reg[i];var c=cc(r,0);if(!c)continue;var act=false;for(var j=14;j<34;j++)if(cc(r,j)){act=true;break;}if(!act)continue;
   var opd=pdate(cc(r,4));
   var rdn=function(dc){return !!cc(r,dc)||(reg_done[c]&&reg_done[c][dc]);};
   var chk=[],doneN=0;
   for(j=0;j<DOCS.length;j++){var D=DOCS[j];var ok=rdn(D.done);if(ok)doneN++;var cst="none",csx="รอทำ",cdue="";
     if(ok){cst="done";csx="เสร็จ ✓";}
     else if(D.d&&opd){var _dd=new Date(opd.getTime()-D.d*86400000);cdue=iso(_dd);var dl0=daysBetween(_dd,TODAY);if(dl0<0){cst="red";csx="เลย D-"+D.d+" มา "+(-dl0)+" วัน";}else if(dl0<=7){cst="amber";csx="เหลือ "+dl0+" วัน (D-"+D.d+")";}else{cst="green";csx="เหลือ "+dl0+" วัน";}}
     chk.push({n:D.n,g:D.g,col:D.done,ok:ok,st:cst,sx:csx,due:cdue});}
   var homeOk=rdn(15)&&rdn(17),utilOk=rdn(7)&&rdn(10)&&rdn(13),licOk=true;
   for(j=0;j<DOCS.length;j++)if(DOCS[j].g==RG_LIC&&!rdn(DOCS[j].done)){licOk=false;break;}
   var stp;if(!rdn(14))stp=RG_PREP;else if(!homeOk)stp=RG_HOME;else if(!utilOk)stp=RG_UTIL;else if(!licOk)stp=RG_LIC;else stp=RGF;
   var st,sx,sk;
   if(stp==RGF){st="done";sx="ครบ ✓";sk=[3,0];}
   else{var worst=null;chk.forEach(function(x){if(x.g==stp&&!x.ok&&(x.st=="red"||x.st=="amber")){if(!worst||x.st=="red")worst=x;}});
     if(worst){st=worst.st;sx=worst.sx;sk=[worst.st=="red"?0:1,0];}else{st="none";sx=(stp==RG_PREP?"เตรียมเอกสาร":"กำลังทำ");sk=[2,0];}}
   var pend=chk.filter(function(x){return !x.ok;});
   regT.push({code:c,name:cc(r,1),prov:cc(r,2),owner:"หมิว",step:stp,st:st,slatxt:sx,sk:sk,checklist:chk,kt:"",
     why:"เปิด "+(cc(r,4)||"?")+" · เสร็จ "+doneN+"/"+DOCS.length+" ใบ",
     w:(pend.length?{track:"reg",field:"done",value:pend[0].col,lbl:"✅ "+pend[0].n+" เสร็จ"}:null)});}
 var regOver=regT.filter(function(t){return t.st=="red";}).length;
 // ===== ต่ออายุใบอนุญาต — อ่านวันหมดจริงจากชีตใบอนุญาต (src_lic) · "-"/ว่าง = ไม่มีใบนั้น =====
 var renewT=[],siteByT={};
 var SEVMAP={red:3,amber:2,submit:1,green:0,done:-1,skip:-2};
 function _renewResolve(code,k,expiry,skipped,st0,left0){
   if(skipped)return {st:"skip",left:"🚫 ยกเว้น (ไม่ต้องขอ)"};
   var ov=renew_status[code]&&renew_status[code][k];
   if(ov&&ov.ex===expiry){ if(ov.s==="done")return {st:"done",left:"✅ ต่อแล้ว/จ่ายแล้ว"}; if(ov.s==="submit")return {st:"submit",left:"📤 ยื่นเรื่องต่อแล้ว · รอผล"}; }
   return {st:st0,left:left0};
 }
 function _findCol(H,kw){for(var ci=0;ci<H.length;ci++){if((((H[ci]||"")+"")).indexOf(kw)>=0)return ci;}return -1;}
 function _findHdr(rows,kw){for(var hi=0;hi<Math.min(rows.length,6);hi++){if(rows[hi].join("|").indexOf(kw)>=0)return hi;}return -1;}
 var LIC_DEF=[
  {kw:"สุรา ประเภท 1", k:"liquor1", n:"ขายสุรา ประเภท 1 (ค้าส่ง)", lead:90, loc:false},
  {kw:"สุรา ประเภท 2", k:"liquor2", n:"ขายสุรา ประเภท 2 (ค้าปลีก)", lead:90, loc:false},
  {kw:"ยาสูบ", k:"tobacco", n:"ขายยาสูบ ประเภท 2", lead:90, loc:false},
  {kw:"ค้าซากสัตว์", k:"animal", n:"ค้าซากสัตว์ (ร.10)", lead:60, loc:false},
  {kw:"ขายอาหารสัตว์", k:"feed", n:"ขายอาหารสัตว์", lead:90, loc:false},
  {kw:"สะสมอาหาร", k:"food_store", n:"สะสมอาหาร", lead:45, loc:true},
  {kw:"จำหน่ายอาหาร", k:"food_sell", n:"จำหน่ายอาหาร", lead:45, loc:true},
  {kw:"ยาฆ่าแมลง", k:"haz_pest", n:"กิจการอันตราย (ยาฆ่าแมลง)", lead:45, loc:true},
  {kw:"แก๊ส", k:"haz_gas", n:"กิจการอันตราย (แก๊สกระป๋อง)", lead:45, loc:true}
 ];
 if(lic&&lic.length>1){var lhr=_findHdr(lic,"รหัสสาขา");if(lhr<0)lhr=_findHdr(lic,"Site Code");
   if(lhr>=0){var LH=lic[lhr];
     var cSite=_findCol(LH,"Site Code"),cTc=_findCol(LH,"รหัสสาขา"),cCode=(cSite>=0?cSite:cTc),cName=_findCol(LH,"ชื่อสาขา"),cProv=_findCol(LH,"จังหวัด");
     LIC_DEF.forEach(function(L){L.col=_findCol(LH,L.kw);});
     for(var li2=lhr+1;li2<lic.length;li2++){var lr=lic[li2];
       var lc=(cCode>=0?(cc(lr,cCode)||"").trim():""),lTc=(cTc>=0?(cc(lr,cTc)||"").trim():"");if(!lc)lc=lTc;if(!lc)continue;
       if(lTc)siteByT[lTc]=lc;
       var lnm=(cName>=0?cc(lr,cName):""),lpv=(cProv>=0?cc(lr,cProv):"");
       LIC_DEF.forEach(function(L){if(L.col<0)return;
         var ex=pdate((cc(lr,L.col)||"").trim());if(!ex)return;
         var dEx=daysBetween(ex,TODAY),fb=new Date(ex.getTime()-L.lead*86400000),st0,leftTxt;
         if(dEx<0){st0="red";leftTxt="🔴 หมดอายุแล้ว "+(-dEx)+" วัน";}
         else if(dEx<=14){st0="red";leftTxt="ด่วน · เหลือ "+dEx+" วัน";}
         else if(dEx<=L.lead){st0="amber";leftTxt="ถึงกำหนดต่อ · เหลือ "+dEx+" วัน";}
         else{st0="green";leftTxt="เหลือ "+dEx+" วัน";}
         var skipped=!!(renew_skip[lc]&&renew_skip[lc][L.k]),_R=_renewResolve(lc,L.k,iso(ex),skipped,st0,leftTxt);
         renewT.push({code:lc,name:lnm,prov:lpv,lic:L.n,k:L.k,loc:L.loc,basis:(L.loc?"🏛️ ตามท้องถิ่น":"วันในใบ"),expiry:iso(ex),fileby:"ภายใน "+iso(fb)+" (ก่อน "+L.lead+" วัน)",left0:leftTxt,left:_R.left,st0:st0,st:_R.st,skip:skipped,sev:SEVMAP[_R.st]});
       });
     }
   }
 }
 // ===== ภาษีป้าย + ภาษีที่ดิน (รายปี · ปฏิทิน) =====
 var pyThai=TODAY.getFullYear()+543;
 function taxTasks(rows,tk,licName,md2,fileTxt,checkPaid){
   if(!rows||rows.length<2)return;
   var thr=_findHdr(rows,"รหัสสาขา");if(thr<0)thr=0;var TH=rows[thr];
   var cTc=_findCol(TH,"รหัสสาขา");if(cTc<0)cTc=_findCol(TH,"Site Code");if(cTc<0)cTc=1;
   var cSc=_findCol(TH,"Site Code");var cNm=_findCol(TH,"ชื่อสาขา");if(cNm<0)cNm=2;var cPv=_findCol(TH,"จังหวัด");if(cPv<0)cPv=5;
   var paidCol=-1;if(checkPaid){for(var hi=cTc+1;hi<TH.length;hi++){if((TH[hi]||"").indexOf(String(pyThai))>=0){paidCol=hi;break;}}}
   var due=new Date(TODAY.getFullYear(),md2[0],md2[1]);
   for(var ti=thr+1;ti<rows.length;ti++){var tr2=rows[ti];var _tRaw=(cc(tr2,cTc)||"").trim();var _sc=(cSc>=0?(cc(tr2,cSc)||"").trim():"");if(!_tRaw&&!_sc)continue;var tc=_sc||siteByT[_tRaw]||_tRaw;
     var paid=(checkPaid&&paidCol>=0)?!!((cc(tr2,paidCol)||"").trim()):false;
     var dDue=daysBetween(due,TODAY),st0,leftTxt;
     if(paid){st0="green";leftTxt="✓ ทำแล้ว ("+pyThai+")";}
     else if(dDue<0){st0="red";leftTxt="🔴 เลยกำหนด "+(-dDue)+" วัน · ยังไม่ทำ ("+pyThai+")";}
     else if(dDue<=60){st0="amber";leftTxt="ใกล้กำหนด · เหลือ "+dDue+" วัน";}
     else{st0="green";leftTxt="ยังไม่ถึงกำหนด";}
     var skipped=!!(renew_skip[tc]&&renew_skip[tc][tk]),_Rt=_renewResolve(tc,tk,"รายปี "+pyThai,skipped,st0,leftTxt);
     renewT.push({code:tc,name:cc(tr2,cNm),prov:cc(tr2,cPv),lic:licName,k:tk,loc:false,basis:"🗓️ ภาษีรายปี",expiry:"รายปี "+pyThai,fileby:fileTxt,left0:leftTxt,left:_Rt.left,st0:st0,st:_Rt.st,skip:skipped,sev:SEVMAP[_Rt.st]});
   }
 }
 taxTasks(taxSign,"tax_sign","ภาษีป้าย",[2,31],"ยื่น ภ.ป.1 ภายใน มี.ค.",true);
 taxTasks(taxLand,"tax_land","ภาษีที่ดินและสิ่งปลูกสร้าง",[3,30],"ชำระภายใน เม.ย.",false);
 // ================= รังวัด (งานทีมเจรจา) — จากชีต SLA =================
 // col11 วันพิจารณาทำเล(อนุมัติ) · col12 รังวัดพื้นที่ · col13 วันส่งผลรังวัด · col56 ก่อสร้างรับผล · col73 ผลอนุมัติรถตู้
 var negOwn={},negNm2={},negProv2={};
 negRows.forEach(function(r){var c=cc(r,0);if(!c)return;negOwn[c]=cc(r,3);negNm2[c]=cc(r,1);negProv2[c]=cc(r,2);});
 var SVF="ส่งผลรังวัดให้ก่อสร้าง (จบ)";
 var SVY_STEPS=[
   {ico:"📍",stp:"รอรังวัด",task:"อนุมัติทำเลแล้ว · รอเข้ารังวัดพื้นที่",sla:"10 วันทำการ จากวันอนุมัติทำเล"},
   {ico:"📅",stp:"นัดวันรังวัด",task:"นัดวันเข้ารังวัดแล้ว · รอถึงวันรังวัด",sla:"เข้ารังวัดตามนัด"},
   {ico:"📐",stp:"รังวัด",task:"รังวัดพื้นที่/ส่งผลแล้ว · รอวัดค่าระดับก่อนส่งก่อสร้าง",sla:"วัดค่าระดับ/ส่งผลโดยเร็ว"},
   {ico:"✅",stp:SVF,task:"รังวัด+วัดค่าระดับเสร็จ · ส่งทีมก่อสร้างแล้ว · จบงานรังวัด",sla:"จบงานรังวัด"}];
 var svyT=[];
 for(i=hr+1;i<sla.length;i++){var r=sla[i];var c=cc(r,0);if(!c||opened[c])continue;
   var se8=cc(r,8),se9=cc(r,9);if((se8+" "+se9).indexOf("ยกเลิก")>=0)continue;      // ตัดที่ยกเลิก
   if(!_negBase[c])continue;   // 27 พ.ย.: ฐานเดียวกับเจรจา/Pipeline (ผ่านด่าน G1-G3 อนุมัติรถตู้ · ตัดเปิด/ยกเลิก) — เดิมไม่กรอง → สาขายังไม่อนุมัติรถตู้หลุดเข้ารอรังวัด
   var _svb=negoBox(r);if(_svb===NBX.siteex||_svb===NBX.hold||_svb===NBX.pot||_svb===NBX.stuck)continue; // WIP gate: ตัดสาขาที่ยังค้างเจรจา (potential/stuck/hold/site-ex) ให้นับตรง base ของ Pipeline (:3144-3146)
   // ---- Pipeline survey logic เป๊ะ (computeCounts :3398-3399): base & noO1 · รอรังวัด=c12&c13 ว่าง · measure=surveyed & วัดค่าระดับ(c14) ว่าง ----
   if(!(cc(r,33)===""&&cc(r,34)===""))continue;                                        // noO1: ยื่น/ได้ อ.1 แล้ว = พ้นรังวัด → นับที่ท่อน อ.1 (ไม่ใช้ col56 เป็น "จบ" อีก)
   var apprD=pdate(cc(r,11)),svD=pdate(cc(r,12)),sentD=pdate(cc(r,13));
   var surveyed=(cc(r,12)!==""||cc(r,13)!=="")||!!svy_surveyed[c]||!!svy_sent[c];      // Pipeline surveyed = c12(รังวัดพื้นที่) || c13(ส่งผลรังวัด)
   var leveled=(cc(r,14)!=="")||!!svy_sent[c];                                          // ผ่าน measure = วัดค่าระดับ(c14) แล้ว = จบรังวัด
   var appointed=!!svy_appoint[c];
   var step,st,sx,sk,why,w=null;
   if(surveyed&&leveled){step=SVF;st="done";sx="รังวัด+วัดค่าระดับเสร็จ · ส่งก่อสร้าง ✓";sk=[3,0];why=(cc(r,14)?"วัดค่าระดับ "+cc(r,14):(cc(r,13)?"ส่งผลรังวัด "+cc(r,13):"ส่งก่อสร้างแล้ว"));}
   else if(surveyed){var baseD=svD||sentD,wd2=baseD?wdBetween(baseD,TODAY):null;step="รังวัด";
     if(wd2==null){st="none";sx="รังวัดแล้ว · รอวัดค่าระดับ/ส่งผล";sk=[1,0];}
     else if(wd2>5){st="red";sx="รังวัดแล้ว "+wd2+" วันทำการ ยังไม่วัดระดับ/ส่งผล";sk=[0,-wd2];}
     else{st="green";sx="รังวัดแล้ว "+wd2+" วันทำการ";sk=[1,-wd2];}
     why=(cc(r,12)?"รังวัด "+cc(r,12):"รังวัดพื้นที่แล้ว");
     w={track:"survey",field:"sent",lbl:"📤 วัดค่าระดับ/ส่งผลให้ก่อสร้างแล้ว"};}
   else if(appointed){step="นัดวันรังวัด";st="amber";var ad=(typeof svy_appoint[c]=="string"&&svy_appoint[c]!="1")?svy_appoint[c]:"";sx="นัดแล้ว"+(ad?" "+ad:"");sk=[1,-1];why="นัดวันรังวัดแล้ว"+(ad?" ("+ad+")":"")+" · รอเข้ารังวัด";
     w={track:"survey",field:"surveyed",lbl:"📐 รังวัดเสร็จแล้ว"};}
   else{step="รอรังวัด";var wd=apprD?wdBetween(apprD,TODAY):null;
     if(wd==null){st="none";sx="—";sk=[2,0];}
     else if(wd>10){st="red";sx="ค้าง "+wd+" วันทำการ (เกิน 10)";sk=[0,-wd];}
     else if(wd>=8){st="amber";sx="ค้าง "+wd+" วันทำการ";sk=[1,-wd];}
     else{st="green";sx="ค้าง "+wd+" วันทำการ";sk=[1,-wd];}
     why=(cc(r,11)?"อนุมัติทำเล "+cc(r,11):"อนุมัติทำเลแล้ว")+" · รอรังวัด";
     w={track:"survey",field:"appoint",lbl:"📅 นัดวันรังวัดแล้ว"};}
   var task={code:c,name:negNm2[c]||cc(r,4)||c,prov:negProv2[c]||cc(r,3)||"",owner:negOwn[c]||"(ไม่ระบุ)",step:step,st:st,slatxt:sx,sk:sk,why:why,stat:"",note:"",kt:""};
   if(w)task.w=w;
   svyT.push(task);}
 var svWait=svyT.filter(function(t){return t.step=="รอรังวัด";}).length;
 var svAppt=svyT.filter(function(t){return t.step=="นัดวันรังวัด";}).length;
 var svMeas=svyT.filter(function(t){return t.step=="รังวัด";}).length;
 var svDone=svyT.filter(function(t){return t.step==SVF;}).length;
 var svOver=svyT.filter(function(t){return t.st=="red";}).length;
 // ================= perf =================
 function owners(arr){var s={};arr.forEach(function(t){if(t.owner&&t.owner!="(ไม่ระบุ)")s[t.owner]=1;});return Object.keys(s).sort();}
 var probc={};negT.forEach(function(t){if(t.step!=NF)probc[t.step]=(probc[t.step]||0)+1;});
 var pn=[];Object.keys(nowner).sort(function(a,b){return nowner[b]-nowner[a];}).forEach(function(o){if(o=="(ไม่ระบุ)")return;var tot=nowner[o],s=nsigned[o]||0,ov=negT.filter(function(t){return t.owner==o&&t.st=="red";}).length;pn.push({nm:o,hold:tot,pct:tot?Math.round(100*s/tot):0,over:ov});});
 var rown={};ratT.forEach(function(t){if(t.step!=OF)rown[t.owner]=(rown[t.owner]||0)+1;});
 var pr=[];Object.keys(rown).sort(function(a,b){return rown[b]-rown[a];}).forEach(function(o){if(o=="(ไม่ระบุ)")return;var ov=ratT.filter(function(t){return t.owner==o&&t.st=="red";}).length;pr.push({nm:o,hold:rown[o],over:ov});});
 // ---- Cohort: อนุมัติรถตู้เดือนไหน → ปิดดีล (เซ็นสัญญา) ไปเท่าไหร่ (col11 วันอนุมัติ · col73 ผล · col26 วันเซ็น) ----
 var COH={};
 for(i=hr+1;i<sla.length;i++){var r=sla[i];var c=cc(r,0);if(!c)continue;
   if(cc(r,73).indexOf("Approve")<0)continue;var ad=pdate(cc(r,11));if(!ad)continue;
   var mk=ad.getFullYear()+"-"+("0"+(ad.getMonth()+1)).slice(-2);
   var o=COH[mk]||(COH[mk]={m:mk,approved:0,signed:0});o.approved++;
   if(cc(r,26)||cc(r,25))o.signed++;}
 var cohort=Object.keys(COH).sort().map(function(k){return COH[k];});
 return {updated:iso(TODAY),wh:NOTES_WH,_opened:opened,_upd:upd,_kf:_kf.meta,_regDocs:DOCS,
   nego:{owners:owners(negT),tasks:negT,steps:NEGO_STEPS,final:NF},
   survey:{owners:owners(svyT),tasks:svyT,steps:SVY_STEPS,final:SVF},
   ratkit:{o1:{owners:owners(ratT),tasks:ratT,steps:RAT_STEPS,final:OF},reg:{owners:owners(regT),tasks:regT,steps:REG_STEPS,final:RGF}},
   renew:{tasks:renewT},
   perf:{nego:{total:nTotal,signed:nSignedAll,pending:nPending,final:nFinal,wip:nWip,at_sign:negT.filter(function(t){return t.step===NBX.sign;}).length,over:nOver,close_pct:nTotal?Math.round(100*nSignedAll/nTotal):0,sla_pct:nSla2?Math.round(100*(nSla2-nOver)/nSla2):100},
     survey:{over:svOver,wait:svWait,appoint:svAppt,measured:svMeas,done:svDone},
     ratkit:{got:oGot,wait:rSub,prep:rPrep,waiver:oWai,over:rOver,reg_wait:regT.length,reg_over:regOver,sla_pct:rSub?Math.round(100*(rSub-rOver)/rSub):100},
     problems:RG?[]:[],persons_nego:pn,persons_rat:pr,cohort:cohort}};
}
