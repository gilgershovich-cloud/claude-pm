/**
 * Receives answers from public/loop-invite/index.html and appends them as rows.
 *
 * Setup: in the Google Sheet, Extensions > Apps Script, paste this file, then
 * Deploy > New deployment > Web app, "Execute as: Me", "Who has access: Anyone".
 * Put the resulting /exec URL in CONFIG.sheetUrl in the page.
 */
const HEADERS = ["זמן", "מזהה ביקור", "שלב", "שאלה", "תשובה", "פעילות", "יום", "שעה", "הערה", "מכשיר"];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.setFrozenRows(1);
      sheet.setRightToLeft(true);
    }
    const d = JSON.parse(e.postData.contents || "{}");
    const cell = (v) => String(v == null ? "" : v).slice(0, 1000);
    sheet.appendRow([
      new Date(),
      cell(d.visit),
      cell(d.step),
      cell(d.question),
      cell(d.answer),
      cell(d.activity),
      cell(d.day),
      cell(d.time),
      cell(d.note),
      cell(d.device),
    ]);
    return ContentService.createTextOutput("ok");
  } finally {
    lock.releaseLock();
  }
}

// Lets you open the /exec URL in a browser to confirm the deployment is live.
function doGet() {
  return ContentService.createTextOutput("loop-invite logger is running");
}
