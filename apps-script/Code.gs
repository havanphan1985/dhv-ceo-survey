/**
 * Nhận kết quả Khảo sát CEO và ghi vào Google Sheet.
 * Dán file này vào Extensions > Apps Script của Sheet, rồi Deploy > New deployment > Web app
 * (Execute as: Me, Who has access: Anyone). Xem README.md.
 */
const SHEET = 'Kết quả';
const CODES = ['A1','A2','A3','A4','A5','A6','A7','A8','A9','A10','A11','A12','A13','A14','A15','A16',
               'B1','B2','B3','B4','B5','B6','B7','B8','B9','B10','B11','B12','B13','B14'];
const HEAD = ['Thời gian','ID','Họ tên','Công ty','Email','SĐT/Zalo','Ngành','Năm hoạt động','Nhân sự',
  'Nghỉ việc 12 tháng','Nghỉ trong 6 tháng đầu','% nghỉ việc','% nghỉ sớm',
  'Chỉ số động lực','Cảm nhận công việc','Phát huy năng lực','Hệ thống tổ chức','Nguồn lực cá nhân',
  'Lãnh đạo bằng VH','Mức độ chủ đích','Hệ thống VH','Cách quản trị','Cấp độ văn hoá',
  'Điểm mù','Cờ cảnh báo','C1 – Câu hỏi mở','Link báo cáo',
  'Bấm đặt lịch','Đã đặt lịch (Calendly)','Muốn khảo sát đội ngũ','Trạng thái DHV']
  .concat(CODES.map(c => 'Đ ' + c), CODES.map(c => 'TL ' + c));

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) sh = ss.insertSheet(SHEET);
  if (sh.getLastRow() === 0) { sh.appendRow(HEAD); sh.setFrozenRows(1); sh.getRange(1,1,1,HEAD.length).setFontWeight('bold'); }
  return sh;
}
// Chặn chèn công thức: ô bắt đầu bằng = + - @ được thêm dấu '
function safe_(v) {
  if (v == null) return '';
  if (typeof v === 'number' || v instanceof Date) return v;
  const s = String(v).slice(0, 5000);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
function rowOf_(sh, id) {
  if (sh.getLastRow() < 2) return 0;
  const ids = sh.getRange(2, 2, sh.getLastRow() - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (ids[i][0] === id) return i + 2;
  return 0;
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (!d || typeof d.id !== 'string' || d.id.length > 64) return out_({ok:false});
    const sh = sheet_();
    let row = rowOf_(sh, d.id);

    if (d.type === 'event') {
      if (!row) return out_({ok:false});
      const col = d.event === 'booking' ? HEAD.indexOf('Bấm đặt lịch') + 1
                : d.event === 'booked' ? HEAD.indexOf('Đã đặt lịch (Calendly)') + 1
                : d.event === 'team_survey' ? HEAD.indexOf('Muốn khảo sát đội ngũ') + 1 : 0;
      if (col) sh.getRange(row, col).setValue(new Date());
      return out_({ok:true});
    }

    if (d.type !== 'submit') return out_({ok:false});
    const p = d.profile || {}, s = d.summary || {}, a = d.answers || {}, sc = d.scores || {}, o = d.open || {};
    const vals = [new Date(d.ts || Date.now()), d.id, p.name, p.company, p.email, p.phone ? "'" + p.phone : '', p.industry, p.years, p.staff,
      p.left12m, p.leftEarly, s.turnover, s.early,
      s.overall, s.exp, s.fun, s.org, s.per, s.lead, s.int, s.sys, s.gov, s.level,
      s.blind, s.flags, o.C1, d.link, '', '', '', 'Mới']
      .concat(CODES.map(c => sc[c]), CODES.map(c => a[c])).map(safe_);
    // Ô link báo cáo có thể dài; Sheet giới hạn 50.000 ký tự/ô
    if (row) {
      const keep = sh.getRange(row, HEAD.indexOf('Bấm đặt lịch') + 1, 1, 4).getValues()[0];
      vals.splice(HEAD.indexOf('Bấm đặt lịch'), 4, keep[0], keep[1], keep[2], keep[3] || 'Mới');
      sh.getRange(row, 1, 1, vals.length).setValues([vals]);
    } else {
      sh.appendRow(vals);
      notify_(p, s, d.link);
    }
    return out_({ok:true});
  } catch (err) {
    return out_({ok:false, error:String(err)});
  } finally {
    lock.releaseLock();
  }
}

// Gửi email báo có bài mới cho chủ Sheet. Xoá nội dung hàm nếu không muốn nhận.
function notify_(p, s, link) {
  const to = Session.getEffectiveUser().getEmail();
  if (!to) return;
  MailApp.sendEmail({
    to: to,
    subject: `[Khảo sát CEO] ${p.company || ''} – ${p.name || ''} (động lực ${s.overall}, VH cấp ${s.level})`,
    htmlBody: `<p><b>${p.name || ''}</b> – ${p.company || ''} (${p.industry || ''}, ${p.staff || '?'} nhân sự)</p>
      <p>Email: ${p.email || '–'} · SĐT/Zalo: ${p.phone || '–'}</p>
      <p>Chỉ số động lực: <b>${s.overall}</b> · Cách quản trị: ${s.gov} · Cấp độ văn hoá: ${s.level}</p>
      <p>Cờ cảnh báo: ${s.flags || 'không có'}</p>
      <p><a href="${link}">Mở báo cáo đầy đủ (tải PDF)</a></p>`
  });
}

function doGet() { return out_({ok:true, service:'dhv-ceo-survey'}); }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
