# DeenImpact Academy Website

Official multi-page website and secure Student Results Portal for **DeenImpact Academy**, a private school located in Apete, Ibadan, Nigeria.

- **Motto:** Knowledge, Action and Guidance
- **Founded:** 2017
- **Ethos:** Combines modern science, technology and authentic Islamic religious practice following the Sunnah.
- **Levels Offered:** Pre-Nursery to SS3 (Nursery, Primary, College)
- **Class Size:** 15 students to 1 teacher
- **Day School Only:** No boarding
- **Domain:** `deenimpactacademy.com.ng`
- **Phone & WhatsApp:** 08123458536
- **Address:** Olomo Quarters 2, Zone 2, near Olose Junction, Apete, Ibadan
- **Website Contact & Content Updater:** Adeyemo Yakub (08123458536)

---

## 📁 Project Directory Structure

```text
deenimpact-academy/
├── index.html              # Home page
├── about.html              # About Us (Heritage, Vision, Mission, Values, Head's Message)
├── academics.html          # Academics & Curriculum (Pre-Nursery to SS3, Labs, Exams)
├── admissions.html         # Admissions (Always open, age 2+, 4-step process)
├── downloads.html          # Document Downloads & Printable Admission Form
├── facilities.html         # Facilities, Campus Safety & Co-curricular Student Life
├── gallery.html            # Photo Gallery (with Lightbox), Video Embeds & Consent Note
├── news-events.html        # News, Announcements & Academic Term Calendar
├── careers.html            # Careers / Vacancy Status & WhatsApp CV Submission
├── faq.html                # Frequently Asked Questions (Accordion)
├── contact.html            # Contact Details, Google Map & Pre-filled WhatsApp Form
├── results.html            # Secure Student Results Portal Login Page
├── style.css               # Shared master CSS (Emerald green, gold, off-white, responsive)
├── script.js               # Shared vanilla JS (Drawer, Accordion, Lightbox, Portal)
├── robots.txt              # Search engine crawler directives
├── sitemap.xml             # XML sitemap for all 12 standalone pages
├── images/                 # Logo, subtle Islamic pattern & placeholder graphics
│   ├── logo.png            # Reserved school logo image slot
│   ├── logo.svg            # Vector branding badge
│   ├── pattern.svg         # Subtle Islamic geometric star lattice pattern
│   └── *.svg               # Calibrated high-contrast educational illustrations
├── downloads/              # Downloadable resources
│   └── admission-form.pdf  # Generated official printable Admission Form PDF
├── functions/
│   └── api/
│       └── results.js      # Cloudflare Pages Function (KV authentication & R2 stream)
└── tools/
    └── hash-pin.py         # Admin CLI tool to generate salted SHA-256 PIN records for KV
```

---

## 🛠️ How to Edit Content (Non-Developer Guide)

All pages are built with plain, clean HTML. No build tools or compiler required.

### 1. Updating About Us Content (`about.html`)
Open `about.html` in Notepad or VS Code:
- Look for `<!-- EDITABLE: School Vision Placeholder -->` or `<!-- EDITABLE: School Mission Placeholder -->` to update the vision and mission statements.
- Look for `<!-- EDITABLE: Message from the Head of School Placeholder -->` to update the official message. When an official photograph of the Head of School is ready, replace the circular emoji avatar with an `<img>` tag pointing to your image.

### 2. Updating News & Academic Calendar (`news-events.html`)
- **To add an announcement:** Find `<!-- EDITABLE NEWS ITEM 1 -->`, duplicate the `<article class="card">...</article>` block, and change the date, title, and paragraph text.
- **To update term dates:** Scroll down to the `Academic Calendar` section and edit the dates directly in the `<table>` rows.

### 3. Replacing Placeholder Images (`/images/`)
- When real photos from school events, laboratory experiments, or assemblies are taken, save them as `.jpg` or `.webp` (recommended size: `800 x 500` pixels).
- Place them in the `images/` directory and update the `src` attribute on the corresponding `<img>` tags in `gallery.html`, `facilities.html`, or `index.html`.
- **Parental Consent Reminder:** In accordance with school safeguarding rules, all photographs of pupils published on the website must have prior parental consent.

### 4. Updating the School Logo
- When the official graphic logo is finalized, save it as a high-resolution transparent PNG named `logo.png`.
- Replace `images/logo.png`. The site header is already configured to automatically display this logo image.

### 5. Adding New Downloadable Documents (`downloads.html`)
- To add a school prospectus, drop `prospectus.pdf` into `downloads/` and remove the `disabled` attribute from the button in `downloads.html`.
- To update the admission form, replace `downloads/admission-form.pdf`.

---

## 🔒 Student Results Portal Administration Guide (Google Sheets & Drive)

The Student Results Portal runs on a simple, 100% no-code Google Sheets & Google Drive integration. School staff do not need to use command lines or Cloudflare storage dashboards.

### Quick Workflow:
1. **Report Cards in Google Drive:** Staff upload PDF report cards to a Google Drive folder and copy each file's shareable link.
2. **Details in Google Sheets:** Staff enter rows with:
   - `Admission Number` (e.g. `DIA/2026/001`)
   - `PIN` (e.g. `1234` or parent's phone number)
   - `Student Name` (e.g. `Zaynab Adeyemo`)
   - `Class` (e.g. `Basic 4`)
   - `Term` (e.g. `1st Term`)
   - `Session` (e.g. `2026/2027`)
   - `Report Link` (Google Drive PDF link)
3. **Connect to Cloudflare Pages (One-Time Setup):**
   - In Google Sheets: **File > Share > Publish to web > Select CSV format > Publish**.
   - Copy the CSV URL.
   - In Cloudflare Dashboard: **Pages Project > Settings > Environment variables > Add `RESULTS_SHEET_URL`** and paste the CSV link.
   - Click Save.

Whenever teachers add or update rows in Google Sheets, the website reflects it instantly!

*For complete details, see `RESULTS_SETUP_GUIDE.md`.*


---

## 🚀 Deployment to Cloudflare Pages

### Option A: Direct Drag & Drop (Fastest)
1. In Cloudflare Dashboard, navigate to **Workers & Pages** &rarr; **Pages** &rarr; **Upload assets**.
2. Name your project `deenimpact-academy`.
3. Drag and drop the `deenimpact-academy` folder (or unzip `deenimpact-academy.zip` and drag all files).
4. Click **Deploy Site**.

### Option B: Connecting a Git Repository (Recommended for continuous updates)
1. Push the contents of `deenimpact-academy` to a GitHub or GitLab repository.
2. In Cloudflare Dashboard &rarr; **Workers & Pages** &rarr; **Create application** &rarr; **Pages** &rarr; **Connect to Git**.
3. Select your repository.
4. Set build settings:
   - **Framework preset:** `None`
   - **Build command:** *(Leave empty)*
   - **Build output directory:** `.`
5. Click **Save and Deploy**.

### Connecting the Custom Domain: `deenimpactacademy.com.ng`
1. Once deployed, open your Pages project &rarr; **Custom domains**.
2. Click **Set up a custom domain**.
3. Type `deenimpactacademy.com.ng` and click **Continue**.
4. If your domain's nameservers are already managed on Cloudflare, DNS records (`CNAME`) will be configured automatically with zero downtime and a free SSL certificate.
5. You can also add `www.deenimpactacademy.com.ng` to redirect seamlessly to the apex domain.

---

## 📞 Website Support & Maintenance Contact

For ongoing content updates, school calendar revisions, or technical assistance:
- **Contact:** Adeyemo Yakub
- **Phone / WhatsApp:** 08123458536
- **Facebook:** [https://www.facebook.com/share/1CiEcBdXnN/](https://www.facebook.com/share/1CiEcBdXnN/)
- **Campus:** Olomo Quarters 2, Zone 2, near Olose Junction, Apete, Ibadan
