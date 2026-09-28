/* ==========================================================================
   Bushido Studio — Script principal
   Sommaire :
   1.  Header sticky (ombre au scroll) + menu mobile
   2.  Animations au scroll (Intersection Observer)
   3.  Compteurs animés (+6 000 vidéos, +140 marques…)
   4.  Spotlight curseur sur les cartes
   5.  Copie des codes promo dans le presse-papier
   6.  Filtre du portfolio
   7.  Accordéon FAQ
   8.  Cartes vidéo : aperçu au survol + lightbox
   9.  Carrousel témoignages
   10. Barre CTA mobile
   11. Pop-up de capture email
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------
     1. HEADER STICKY + MENU MOBILE
  --------------------------------------------------------------------- */
  const header = document.getElementById('site-header');
  const toggleHeaderShadow = () => {
    header.classList.toggle('scrolled', window.scrollY > 12);
  };
  toggleHeaderShadow();
  window.addEventListener('scroll', toggleHeaderShadow, { passive: true });

  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    mobileMenuBtn.setAttribute(
      'aria-expanded',
      mobileMenu.classList.contains('open') ? 'true' : 'false'
    );
  });
  // Ferme le menu mobile après clic sur un lien
  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => mobileMenu.classList.remove('open'));
  });

  /* ---------------------------------------------------------------------
     2. ANIMATIONS AU SCROLL (fade-in / slide-up)
  --------------------------------------------------------------------- */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

  /* ---------------------------------------------------------------------
     3. COMPTEURS ANIMÉS
     Usage : <span data-count-to="6000">0</span>
  --------------------------------------------------------------------- */
  const numberFormat = new Intl.NumberFormat('fr-FR');

  const runCounter = (el) => {
    const target = parseInt(el.getAttribute('data-count-to'), 10);
    if (isNaN(target)) return;

    if (prefersReducedMotion) {
      el.textContent = numberFormat.format(target);
      return;
    }

    const duration = 1500;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = numberFormat.format(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.6 }
  );
  document.querySelectorAll('[data-count-to]').forEach((el) => counterObserver.observe(el));

  /* ---------------------------------------------------------------------
     4. SPOTLIGHT CURSEUR
     Le halo est dessiné en CSS ; ici on ne fait que positionner son centre.
  --------------------------------------------------------------------- */
  document.querySelectorAll('.spotlight').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      card.style.setProperty('--my', `${e.clientY - rect.top}px`);
    });
  });

  /* ---------------------------------------------------------------------
     5. COPIE DES CODES PROMO
  --------------------------------------------------------------------- */
  const toast = document.getElementById('copy-toast');
  let toastTimeout;
  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 2200);
  };

  document.querySelectorAll('[data-copy-code]').forEach((el) => {
    el.addEventListener('click', async () => {
      const code = el.getAttribute('data-copy-code');
      try {
        await navigator.clipboard.writeText(code);
        showToast(`Code "${code}" copié !`);
      } catch (err) {
        showToast('Copie manuelle : ' + code);
      }
    });
  });

  /* ---------------------------------------------------------------------
     6. FILTRE DU PORTFOLIO
  --------------------------------------------------------------------- */
  const filterButtons = document.querySelectorAll('.portfolio-filter-btn');
  const portfolioItems = document.querySelectorAll('.portfolio-item');

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const category = btn.getAttribute('data-filter');

      filterButtons.forEach((b) => {
        b.classList.remove('bg-bushido-red', 'text-white', 'border-bushido-red');
        b.classList.add('border-[#2a2a2a]', 'text-bushido-gray');
      });
      btn.classList.add('bg-bushido-red', 'text-white', 'border-bushido-red');
      btn.classList.remove('border-[#2a2a2a]', 'text-bushido-gray');

      portfolioItems.forEach((item) => {
        const matches = category === 'all' || item.getAttribute('data-category') === category;
        item.classList.toggle('hidden-item', !matches);
      });
    });
  });

  /* ---------------------------------------------------------------------
     7. ACCORDÉON FAQ
  --------------------------------------------------------------------- */
  document.querySelectorAll('.faq-item').forEach((item) => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach((i) => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ---------------------------------------------------------------------
     8. CARTES VIDÉO — APERÇU AU SURVOL + LIGHTBOX
     Pour activer une vraie vidéo : ajoute data-video-src="assets/videos/x.mp4"
     sur la carte. L'aperçu muet au survol et le lightbox se branchent seuls.
  --------------------------------------------------------------------- */
  const lightboxOverlay = document.getElementById('video-lightbox-overlay');
  const lightboxContent = document.getElementById('video-lightbox-content');
  const lightboxClose = document.getElementById('video-lightbox-close');

  document.querySelectorAll('.video-card').forEach((card) => {
    const src = card.getAttribute('data-video-src');

    // Aperçu muet en boucle au survol (desktop uniquement)
    if (src && !prefersReducedMotion) {
      card.addEventListener('mouseenter', () => {
        if (card.querySelector('video')) return;
        const preview = document.createElement('video');
        preview.src = src;
        preview.muted = true;
        preview.loop = true;
        preview.playsInline = true;
        card.prepend(preview);
        preview.play().catch(() => {});
      });
      card.addEventListener('mouseleave', () => {
        const preview = card.querySelector('video');
        if (preview) preview.remove();
      });
    }

    card.addEventListener('click', () => {
      const label = card.getAttribute('data-label') || 'Vidéo';
      if (src) {
        lightboxContent.innerHTML = `<video src="${src}" controls autoplay playsinline class="w-full h-full object-cover"></video>`;
      } else {
        lightboxContent.innerHTML = `
          <div class="flex flex-col items-center justify-center gap-3 text-center p-10">
            <div class="w-16 h-16 rounded-full bg-bushido-red/20 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M8 5v14l11-7-11-7z" fill="#E10600"/></svg>
            </div>
            <p class="font-heading text-xl text-white">${label}</p>
            <p class="text-bushido-gray text-sm max-w-xs">Emplacement réservé — remplace ce placeholder par ta vraie vidéo dans le dossier <code class="text-bushido-red">/assets/videos/</code>.</p>
          </div>`;
      }
      lightboxOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  const closeLightbox = () => {
    lightboxOverlay.classList.remove('active');
    lightboxContent.innerHTML = '';
    document.body.style.overflow = '';
  };
  lightboxClose.addEventListener('click', closeLightbox);
  lightboxOverlay.addEventListener('click', (e) => {
    if (e.target === lightboxOverlay) closeLightbox();
  });

  /* ---------------------------------------------------------------------
     9. CARROUSEL TÉMOIGNAGES
  --------------------------------------------------------------------- */
  const track = document.getElementById('testimonials-track');
  const prevBtn = document.getElementById('testimonials-prev');
  const nextBtn = document.getElementById('testimonials-next');
  const scrollAmount = () => track.querySelector('.testimonial-card').offsetWidth + 24;

  prevBtn.addEventListener('click', () => track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' }));
  nextBtn.addEventListener('click', () => track.scrollBy({ left: scrollAmount(), behavior: 'smooth' }));

  /* ---------------------------------------------------------------------
     10. BARRE CTA MOBILE
     Visible une fois le hero passé, masquée sur les tarifs et le footer
     pour ne pas doubler les CTA déjà présents à l'écran.
  --------------------------------------------------------------------- */
  const mobileCta = document.getElementById('mobile-cta');
  const heroSection = document.getElementById('hero');
  const pricingSection = document.getElementById('tarifs');
  const footerSection = document.querySelector('footer');

  let heroPassed = false;
  const suppressors = new Set();
  const updateMobileCta = () => {
    mobileCta.classList.toggle('visible', heroPassed && suppressors.size === 0);
  };

  new IntersectionObserver(
    ([entry]) => {
      heroPassed = !entry.isIntersecting;
      updateMobileCta();
    },
    { threshold: 0 }
  ).observe(heroSection);

  const suppressObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          suppressors.add(entry.target);
        } else {
          suppressors.delete(entry.target);
        }
      });
      updateMobileCta();
    },
    { threshold: 0 }
  );
  [pricingSection, footerSection].forEach((el) => suppressObserver.observe(el));

  /* ---------------------------------------------------------------------
     11. Échap ferme le lightbox vidéo
  --------------------------------------------------------------------- */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLightbox();
    }
  });

});
