# DeenImpact Academy – Staff Training Manual & Results Portal Guide
**A Simple, No-Code System for Uploading & Managing Student Report Sheets**

---

> **Who is this guide for?**
> - **Part 1:** For the **Webmaster / Developer** (adding the Google Sheet variable to Cloudflare Pages).
> - **Part 2 & 3:** For the **School Owner / Principal** to use when training administrative staff and teachers.
> - **Part 4:** Ready-to-copy announcement templates for **Parents**.

---

## Part 1: One-Time Cloudflare Setup (For the Webmaster)

Once the school owner creates their Google Sheet and publishes it as a CSV (explained in Part 2), add it to Cloudflare Pages:

### Steps in Cloudflare Dashboard:
1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **Workers & Pages** in the left sidebar.
3. Click on your project: **`deen-impact`**.
4. Go to the **Settings** tab at the top.
5. In the left sub-menu, select **Environment variables**.
6. Under **Production**, click **Add variable** (or **Edit variables**):
   - **Variable name:** `RESULTS_SHEET_URL`
   - **Value:** Paste the published Google Sheet CSV link provided by the school (starts with `https://docs.google.com/spreadsheets/d/e/.../pub?output=csv`).
7. Click **Save**.
8. Go to the **Deployments** tab, click the three dots (`...`) next to the latest active deployment, and select **Retry deployment** (or trigger a new build) so the new variable takes effect.

---

## Part 2: One-Time Google Sheet Setup (For the School Owner)

The school only needs to create **one** master Google Sheet for results.

### Step 1: Create the Google Sheet
1. Open [Google Sheets](https://sheets.google.com) and create a **Blank spreadsheet**.
2. Title it: **`DeenImpact Academy – Student Results Registry`**.
3. In **Row 1**, type these exact column headers across Columns A to G:

| Column A | Column B | Column C | Column D | Column E | Column F | Column G |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Admission Number** | **PIN** | **Student Name** | **Class** | **Term** | **Session** | **Report Link** |

### Example Filled Sheet:

| Admission Number | PIN | Student Name | Class | Term | Session | Report Link |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `DIA/2026/001` | `4129` | Zaynab Adeyemo | Basic 4 | 1st Term | 2026/2027 | `https://drive.google.com/file/d/1aBcD.../view` |
| `DIA/2026/002` | `8351` | Abdullah Kareem | JSS 2 | 1st Term | 2026/2027 | `https://drive.google.com/file/d/2eFgH.../view` |
| `DIA/2026/003` | `1940` | Maryam Bello | Primary 1 | 1st Term | 2026/2027 | `https://drive.google.com/file/d/3iJkL.../view` |

> **Tips on Choosing PINs:**
> - PINs can be **any 4 to 8 digit number** (e.g. scratch card PIN, a random 4-digit code, or the parent's phone number).
> - Make sure the PIN is confidential to each student.

---

### Step 2: Publish the Sheet to the Web (Takes 30 Seconds)
To let the school website securely read the sheet without granting public access to edit:
1. In Google Sheets, click **File** in the top-left menu.
2. Hover over **Share** &rarr; click **Publish to web**.
3. In the pop-up box:
   - Change **Entire Document** to your sheet tab name (e.g. `Sheet1`).
   - Change **Web page** dropdown to **Comma-separated values (.csv)**.
4. Click the blue **Publish** button and confirm **OK**.
5. Copy the generated link (it will look like: `https://docs.google.com/spreadsheets/d/e/2PACX-1v.../pub?output=csv`).
6. Send this link to your webmaster to enter into Cloudflare.

> **Important:**
> You only need to publish the sheet **once**. Every new student or result you add in the future updates automatically in real time!

---

## Part 3: Term-by-Term Routine for Teachers & Staff

When exams finish and terminal report cards are prepared, staff follow this 3-step routine:

### Step 1: Save Report Cards as PDF
- Generate or scan the student's terminal report card as a PDF document.
- Name the PDF clearly (e.g. `DIA_2026_001_Term1.pdf`).

### Step 2: Upload to Google Drive
1. Open Google Drive and create a folder for the term, e.g.:
   `DeenImpact Academy > Results 2026-2027 > 1st Term`
2. Upload the student report PDFs into this folder.
3. Right-click the folder (or individual PDF) &rarr; **Share** &rarr; **Share**:
   - Under **General access**, change from *Restricted* to: **"Anyone with the link"**.
   - Ensure the role is set to **Viewer**.
   - Click **Copy link** &rarr; **Done**.

### Step 3: Enter the Row in Google Sheets
1. Open your master Google Sheet.
2. Enter the student's **Admission Number**, **PIN**, **Name**, **Class**, **Term**, and **Session**.
3. Paste the Google Drive link into **Column G (Report Link)**.

**That is all!** The moment you paste the link, the parent can immediately visit the school website and download their child's report card.

---

## Part 4: Parent Communication Templates

When results are ready, send this official broadcast to parents via WhatsApp or SMS:

### WhatsApp Broadcast Template:
```text
Assalamu Alaikum wa Rahmatullah wa Barakatuh,
Dear Parents & Guardians of DeenImpact Academy,

We are pleased to inform you that the official end-of-term Examination Report Sheets for the [1st Term, 2026/2027 Session] are now available on the school website portal.

To access and download your child's official report sheet:
1. Visit: https://deenimpactacademy.com.ng/results.html
2. Enter your child's Student Admission Number (e.g., DIA/2026/001)
3. Enter your confidential Portal PIN
4. Click "Verify & Download Report Sheet"

If you have misplaced your child's Admission Number or PIN, please contact the administrative office directly on WhatsApp: 08123458536.

Jazakumullahu Khairan,
DeenImpact Academy Management
Knowledge, Action and Guidance
Apete, Ibadan
```

---

## Frequently Asked Questions for Staff

**Q: What if a parent enters the wrong PIN?**  
The website will display an alert: *"Invalid Admission Number or PIN. Please verify your details from your term receipt, or contact the school office on 08123458536."* It also provides a 1-click button to chat directly with the administrative office on WhatsApp.

**Q: Can a parent see other students' grades or links?**  
No. The website's serverless lookup only queries and reveals the single report card link belonging to the authenticated Admission Number and PIN. The master spreadsheet is not exposed to the browser.

**Q: What if we make a mistake on a report card after publishing?**  
Simply upload the corrected PDF to Google Drive, get its new link, and replace the link in Column G of your Google Sheet. The website will immediately serve the corrected PDF. No technical assistance needed!
