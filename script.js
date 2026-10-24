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
   6. Student Results Portal Client
   --------------------------------------------------------- */
function initResultsPortal() {
  const form = document.getElementById('resultsLoginForm');
  const alertBox = document.getElementById('resultsAlert');
  const submitBtn = document.getElementById('resultsSubmitBtn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const admissionNo = document.getElementById('admissionNumber')?.value.trim();
    const pin = document.getElementById('studentPin')?.value.trim();
    const term = document.getElementById('academicTerm')?.value;
    const session = document.getElementById('academicSession')?.value;

    if (!admissionNo || !pin) {
      showAlert('Please enter both your Admission Number and 6-digit Portal PIN.', 'danger');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Verifying Credentials...';
    }
    showAlert('Checking server records securely...', 'info');

    try {
      const response = await fetch('/api/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/pdf, application/json'
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
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Download Result Sheet';
        }
      } else {
        const data = await response.json().catch(() => ({}));
        const errorMsg = data.error || 'Invalid Admission Number or PIN. Please verify your details.';
        
        if (data.status === 'opening_soon') {
          showAlert(data.message || 'The Online Results Portal is currently being configured for the new academic term. Please contact the school office at 08123458536.', 'warning');
        } else {
          showAlert(errorMsg, 'danger');
        }
      }
    } catch (err) {
      console.warn('Backend endpoint unavailable or offline:', err);
      showAlert(
        'The Results Portal server endpoint is currently connecting to Cloudflare KV/R2 storage. If you need your child\'s result sheet immediately, please contact the school office directly on 08123458536.',
        'warning'
      );
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Access Report Sheet';
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
