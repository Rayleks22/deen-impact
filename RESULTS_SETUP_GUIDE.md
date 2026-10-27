# DeenImpact Academy – Simple Student Results Setup Guide
**Google Drive & Google Sheets Integration**

This new system replaces the complex command-line scripts and Cloudflare KV/R2 buckets with an intuitive, 100% no-code workflow for teachers and school administrative staff.

---

## 1. How the System Works in 3 Steps

1. **Staff Store Report Cards in Google Drive:** Save each student's report card PDF in a Google Drive folder and copy its share link.
2. **Staff Enter Details in Google Sheets:** Paste the student's Admission Number, PIN, Name, Class, and Google Drive link into a spreadsheet.
3. **Parents Check on Website:** Parents go to `deenimpactacademy.com.ng/results.html`, enter their child's Admission Number and PIN, and instantly get their official, verified report card download button!

---

## 2. Setting Up Your Google Sheet (Only Done Once)

Create a new Google Sheet named **"DeenImpact Academy Student Results"**.

Set row 1 as the column headers:

| A: Admission Number | B: PIN | C: Student Name | D: Class | E: Term | F: Session | G: Report Link |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `DIA/2026/001` | `1234` | Zaynab Adeyemo | Basic 4 | 1st Term | 2026/2027 | `https://drive.google.com/file/d/.../view` |
| `DIA/2026/002` | `5678` | Abdullah Kareem | JSS 2 | 1st Term | 2026/2027 | `https://drive.google.com/file/d/.../view` |
| `DIA/2026/003` | `9012` | Maryam Bello | Primary 1 | 1st Term | 2026/2027 | `https://drive.google.com/file/d/.../view` |

> **Tips on PINs:**
> - You can use any 4 to 8 digit number (e.g. scratch card PIN, random digits, or the parent's phone number).

---

## 3. How to Connect the Google Sheet to the Website (1-Time Setup)

1. In your Google Sheet, click **File** in the top menu.
2. Click **Share** > **Publish to web**.
3. In the dialog:
   - Change "Entire Document" (or select your sheet tab).
   - Change "Web page" dropdown to **Comma-separated values (.csv)**.
4. Click **Publish** and click **OK**.
5. Copy the generated link (it looks like `https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv`).
6. In your **Cloudflare Dashboard**:
   - Go to **Workers & Pages** > Select your `deen-impact` Pages project.
   - Go to **Settings** > **Environment variables**.
   - Click **Add variable**:
     - Variable name: `RESULTS_SHEET_URL`
     - Value: *(Paste your copied Google Sheet CSV link)*
   - Click **Save**.

*That is all! From that moment on, whenever you add, edit, or update rows in Google Sheets, the website reflects it instantly.*

---

## 4. How Staff Upload Results at the End of Every Term

1. Export or scan student report sheets as PDF files.
2. Upload them to a folder in Google Drive (e.g. `DeenImpact 2026-2027 > Term 1`).
3. Right-click each PDF > **Share** > set General Access to **"Anyone with the link can view"** > click **Copy link**.
4. Paste the link into Column G (**Report Link**) of your Google Sheet.
5. Provide the parents with their child's **Admission Number** and **PIN**.

---

## 5. Built-in Testing Account

For immediate demonstration or testing without connecting a Google Sheet yet:
- **Admission Number:** `DIA/2026/001`
- **PIN:** `1234`
- **Result:** Displays a verified sample report card for *Zaynab Adeyemo (Basic 4)* with a download button.
