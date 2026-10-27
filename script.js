/**
 * DeenImpact Academy - Vanilla JavaScript
 * Handles navigation drawer, FAQ accordions, Gallery lightbox,
 * WhatsApp enquiry serialization, and Student Results portal interaction.
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initFAQAccordion();
  initGalleryLightbox();
  initWhatsAppEnquiryForm();
  initResultsPortal();
  highlightActiveNav();
});

/* ---------------------------------------------------------
   1. Mobile Navigation Drawer
   --------------------------------------------------------- */
function initMobileNav() {
  const toggleBtn = document.querySelector('.mobile-nav-toggle');
  const drawer = document.querySelector('.mobile-drawer');
  const overlay = document.querySelector('.drawer-overlay');
  const closeBtn = document.querySelector('.mobile-close-btn');

  if (!toggleBtn || !drawer || !overlay) return;

  function openDrawer() {
    drawer.classList.add('open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (closeBtn) closeBtn.focus();
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  toggleBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      closeDrawer();
    }
  });
}

/* ---------------------------------------------------------
   2. Active Navigation Highlight
   --------------------------------------------------------- */
function highlightActiveNav() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-item');

  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });
}

/* ---------------------------------------------------------
   3. FAQ Accordion
   --------------------------------------------------------- */
function initFAQAccordion() {
  const headers = document.querySelectorAll('.accordion-header');

  headers.forEach((header) => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const isOpen = item.classList.contains('active');

      // Close other accordion items
      document.querySelectorAll('.accordion-item').forEach((otherItem) => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
          const otherBtn = otherItem.querySelector('.accordion-header');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        }
      });

      // Toggle current item
      if (isOpen) {
        item.classList.remove('active');
        header.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('active');
        header.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/* ---------------------------------------------------------
   4. Gallery Lightbox Modal
   --------------------------------------------------------- */
function initGalleryLightbox() {
  const galleryItems = document.querySelectorAll('.gallery-item');
  const modal = document.querySelector('.lightbox-modal');
  if (!modal || galleryItems.length === 0) return;

  const modalImg = modal.querySelector('.lightbox-content img');
  const modalCaption = modal.querySelector('.lightbox-caption-text');
  const closeBtn = modal.querySelector('.lightbox-close');

  galleryItems.forEach((item) => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      const caption = item.querySelector('.gallery-caption');
      if (img && modalImg) {
        modalImg.src = img.src;
        modalImg.alt = img.alt || 'DeenImpact Academy Gallery';
      }
      if (caption && modalCaption) {
        modalCaption.textContent = caption.textContent;
      }
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}

/* ---------------------------------------------------------
   5. Contact Enquiry Form to WhatsApp Pre-filled Link
   --------------------------------------------------------- */
function initWhatsAppEnquiryForm() {
  const form = document.getElementById('enquiryForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('parentName')?.value.trim();
    const phone = document.getElementById('parentPhone')?.value.trim();
    const studentClass = document.getElementById('childClass')?.value;
    const message = document.getElementById('parentMessage')?.value.trim();

    if (!name || !phone) {
      alert('Please fill in your Name and Phone Number.');
      return;
    }

    const schoolWhatsAppNumber = '2348123458536';
    let text = `*New Admission Enquiry - DeenImpact Academy*\n\n`;
    text += `*Parent / Guardian Name:* ${name}\n`;
    text += `*Phone Number:* ${phone}\n`;
    text += `*Child Class of Interest:* ${studentClass || 'Not specified'}\n`;
    if (message) {
      text += `*Message / Questions:* ${message}\n`;
    }
    text += `\n_Sent via deenimpactacademy.com.ng enquiry form_`;

    const encoded = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/${schoolWhatsAppNumber}?text=${encoded}`;

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  });
}

/* ---------------------------------------------------------
   6. Student Results Portal Client (Google Sheet & Drive Powered)
   --------------------------------------------------------- */
function initResultsPortal() {
  const form = document.getElementById('resultsLoginForm');
  const alertBox = document.getElementById('resultsAlert');
  const submitBtn = document.getElementById('resultsSubmitBtn');
  const successBox = document.getElementById('resultsSuccessBox');
  const resStudentName = document.getElementById('resStudentName');
  const resAdmissionNo = document.getElementById('resAdmissionNo');
  const resClass = document.getElementById('resClass');
  const resTermSession = document.getElementById('resTermSession');
  const resDownloadBtn = document.getElementById('resDownloadBtn');
  const resHelpBtn = document.getElementById('resHelpBtn');
  const resResetBtn = document.getElementById('resResetBtn');

  if (!form) return;

  // Reset button to check another result
  if (resResetBtn) {
    resResetBtn.addEventListener('click', () => {
      if (successBox) successBox.style.display = 'none';
      if (alertBox) alertBox.style.display = 'none';
      form.style.display = 'block';
      const pinInput = document.getElementById('studentPin');
      if (pinInput) {
        pinInput.value = '';
        pinInput.focus();
      }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const admissionNo = document.getElementById('admissionNumber')?.value.trim();
    const pin = document.getElementById('studentPin')?.value.trim();
    const term = document.getElementById('academicTerm')?.value;
    const session = document.getElementById('academicSession')?.value;

    if (!admissionNo || !pin) {
      showAlert('Please enter both your Admission Number and Portal PIN.', 'danger');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Verifying Credentials...';
    }
    showAlert('Searching official school examination records...', 'info');

    try {
      const response = await fetch('/api/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, application/pdf'
        },
        body: JSON.stringify({
          admissionNumber: admissionNo.toUpperCase(),
          pin: pin,
          term: term,
          session: session
        })
      });

      const contentType = response.headers.get('content-type') || '';

      if (response.ok && contentType.includes('application/pdf')) {
        // Direct PDF stream fallback
        showAlert('Result verified! Downloading your official report sheet...', 'info');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Report_${admissionNo.toUpperCase()}_${term}_${session}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success && data.student) {
        // Hide alert & form, show official verified download card
        if (alertBox) alertBox.style.display = 'none';
        form.style.display = 'none';

        if (successBox) {
          successBox.style.display = 'block';
          if (resStudentName) resStudentName.textContent = data.student.name || 'Student';
          if (resAdmissionNo) resAdmissionNo.textContent = data.student.admissionNumber || admissionNo.toUpperCase();
          if (resClass) resClass.textContent = data.student.className || 'Registered Pupil';
          if (resTermSession) resTermSession.textContent = `${data.student.term || term} • ${data.student.session || session}`;
          if (resDownloadBtn) {
            resDownloadBtn.href = data.student.downloadUrl || '#';
            resDownloadBtn.setAttribute('download', `Report_${admissionNo.toUpperCase()}_${term}.pdf`);
          }
          if (resHelpBtn) {
            const queryText = encodeURIComponent(`Assalamu Alaikum, I have accessed the results portal for ${data.student.name} (${data.student.admissionNumber}) and need administrative assistance.`);
            resHelpBtn.href = `https://wa.me/2348123458536?text=${queryText}`;
          }
        }
      } else {
        const errorMsg = data.error || 'Invalid Admission Number or PIN. Please verify your details.';
        const waHelp = `<div style="margin-top: 0.5rem;"><a href="https://wa.me/2348123458536?text=${encodeURIComponent('Hello DeenImpact Academy, I need help accessing the results portal for Admission Number ' + admissionNo)}" target="_blank" rel="noopener noreferrer" style="font-weight: 700; color: #047857; text-decoration: underline;">Click here to request assistance via WhatsApp</a></div>`;
        showAlert(`${errorMsg}${waHelp}`, 'danger');
      }
    } catch (err) {
      console.warn('Backend endpoint unavailable or offline:', err);
      // Demo fallback for local development preview
      if (admissionNo.toUpperCase().includes('DIA') && (pin === '1234' || pin === '123456')) {
        if (alertBox) alertBox.style.display = 'none';
        form.style.display = 'none';
        if (successBox) {
          successBox.style.display = 'block';
          if (resStudentName) resStudentName.textContent = 'Zaynab Adeyemo';
          if (resAdmissionNo) resAdmissionNo.textContent = admissionNo.toUpperCase();
          if (resClass) resClass.textContent = 'Basic 4 (Emerald)';
          if (resTermSession) resTermSession.textContent = '1st Term • 2026/2027';
          if (resDownloadBtn) resDownloadBtn.href = 'downloads/admission-form.pdf';
        }
      } else {
        showAlert(
          `Unable to connect to the results registry right now. Please contact the school administrative office on <strong>08123458536</strong> or <a href="https://wa.me/2348123458536?text=${encodeURIComponent('Assalamu Alaikum, I would like to request the report sheet for ' + admissionNo)}" target="_blank" rel="noopener noreferrer" style="color: #047857; font-weight: 700; text-decoration: underline;">Chat on WhatsApp</a> to collect your physical or digital report sheet.`,
          'warning'
        );
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Verify &amp; Download Report Sheet';
      }
    }
  });

  function showAlert(message, type) {
    if (!alertBox) return;
    alertBox.style.display = 'block';
    alertBox.className = `alert alert-${type}`;
    alertBox.innerHTML = message;
  }
}
