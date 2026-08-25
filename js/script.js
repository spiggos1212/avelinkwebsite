// =========================================================
// AVELINK PRACTICE — script.js
// Βασική διαδραστικότητα: mobile menu toggle + dropdown +
// "συμπαγές" header όταν κάνεις scroll.
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");
  const toggleBtn = document.getElementById("navbarToggle");
  const menu = document.getElementById("navbarMenu");

  // Το header ξεκινάει διάφανο (πάνω από το hero video/gradient) και
  // γίνεται συμπαγές (λευκό φόντο, σκούρο κείμενο) μόλις κάνεις scroll.
  const SCROLL_THRESHOLD = 60;

  const updateHeaderState = () => {
    header.classList.toggle("site-header--solid", window.scrollY > SCROLL_THRESHOLD);
  };

  updateHeaderState();
  window.addEventListener("scroll", updateHeaderState, { passive: true });

  // Άνοιγμα / κλείσιμο mobile menu
  toggleBtn.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    toggleBtn.setAttribute("aria-expanded", isOpen);
  });

  // Κλείσιμο menu όταν πατηθεί κάποιο link (χρήσιμο σε mobile).
  // Εξαίρεση: ο σύνδεσμος "Services" σε mobile δεν πρέπει να κλείνει όλο
  // το menu — αυτός ανοίγει/κλείνει μόνο το δικό του dropdown (βλ. παρακάτω).
  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      const isDropdownToggle = link.parentElement.classList.contains("has-dropdown");
      if (isDropdownToggle && window.innerWidth <= 900) {
        return;
      }
      menu.classList.remove("is-open");
      toggleBtn.setAttribute("aria-expanded", "false");
    });
  });

  // Dropdown (Services) — click toggle για mobile/touch,
  // ενώ σε desktop δουλεύει ήδη με :hover μέσω CSS
  const dropdownParent = document.querySelector(".has-dropdown");
  const dropdownLink = dropdownParent.querySelector(":scope > a");

  dropdownLink.addEventListener("click", (e) => {
    if (window.innerWidth <= 900) {
      e.preventDefault();
      dropdownParent.classList.toggle("is-open");
    }
  });

  // Partner form — live τιμή δίπλα στη μπάρα "αριθμός καταλυμάτων" (1–25)
  const unitsRange = document.getElementById("pf-units");
  const unitsValue = document.getElementById("pf-units-value");
  if (unitsRange && unitsValue) {
    unitsRange.addEventListener("input", () => {
      unitsValue.textContent = unitsRange.value;
    });
  }

  // Carousels (reviews + properties) — autoplay, infinite loop, pause on
  // hover, όπως στο πραγματικό avelink.gr. Κάθε .carousel στη σελίδα
  // παίρνει τη δική του ανεξάρτητη λειτουργία.
  document.querySelectorAll(".carousel").forEach(initCarousel);
});

function initCarousel(carousel) {
  const track = carousel.querySelector(".carousel__track");
  const prevBtn = carousel.querySelector(".carousel__arrow--prev");
  const nextBtn = carousel.querySelector(".carousel__arrow--next");
  const originalSlides = Array.from(track.children);
  const slideCount = originalSlides.length;
  if (slideCount === 0) return;

  const AUTOPLAY_SPEED = 5000; // ms — ίδιο με το πραγματικό site

  // Τριπλασιάζουμε τα slides (πριν/μετά αντίγραφα) ώστε το carousel να
  // μπορεί να "γυρίζει" ατέρμονα και προς τις δύο κατευθύνσεις.
  originalSlides.forEach((slide) => track.appendChild(slide.cloneNode(true)));
  originalSlides.forEach((slide) => track.appendChild(slide.cloneNode(true)));

  let index = slideCount; // ξεκινάμε στο πρώτο slide του "μεσαίου" αντιγράφου
  let autoplayTimer = null;
  let userInteracted = false;

  const moveTo = (newIndex, animate) => {
    // Ασφαλιστική δικλείδα: ένα resize ή ένα νέο drag μπορεί να διακόψει
    // ένα transition που ήταν σε εξέλιξη (βλ. resize/pointerdown παρακάτω),
    // οπότε το αντίστοιχο "transitionend" — που κανονικά επαναφέρει το
    // index μέσα στο ασφαλές εύρος — ποτέ δεν προλαβαίνει να πυροδοτηθεί.
    // Χωρίς αυτό, το index μπορεί σταδιακά (π.χ. μετά από αρκετά autoplay
    // ticks) να βγει εκτός ορίων του τριπλασιασμένου array και το
    // track.children[index] να γίνει undefined. Το τυλίγουμε πάντα πίσω
    // στο έγκυρο εύρος πριν το χρησιμοποιήσουμε.
    while (newIndex < 0) newIndex += slideCount;
    while (newIndex >= track.children.length) newIndex -= slideCount;
    index = newIndex;
    track.style.transition = animate ? "" : "none";
    track.style.transform = `translateX(-${track.children[index].offsetLeft}px)`;
    if (!animate) {
      // Force reflow ώστε το "χωρίς transition" να προλάβει να εφαρμοστεί
      // πριν ξαναενεργοποιήσουμε το animation στο επόμενο frame.
      track.offsetHeight;
      requestAnimationFrame(() => {
        track.style.transition = "";
      });
    }
  };

  const next = () => moveTo(index + 1, true);
  const prev = () => moveTo(index - 1, true);

  // Όταν φτάσουμε σε κλωνοποιημένο σετ, κάνουμε αθόρυβο "άλμα" πίσω στο
  // αντίστοιχο σημείο του πραγματικού σετ, για ατέρμονο εφέ.
  track.addEventListener("transitionend", () => {
    if (index >= slideCount * 2) {
      moveTo(index - slideCount, false);
    } else if (index < slideCount) {
      moveTo(index + slideCount, false);
    }
  });

  const stopAutoplay = () => {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  };

  const startAutoplay = () => {
    if (userInteracted) return;
    stopAutoplay();
    autoplayTimer = setInterval(next, AUTOPLAY_SPEED);
  };

  moveTo(index, false);
  startAutoplay();

  carousel.addEventListener("mouseenter", stopAutoplay);
  carousel.addEventListener("mouseleave", startAutoplay);

  prevBtn.addEventListener("click", () => {
    userInteracted = true;
    stopAutoplay();
    prev();
  });

  nextBtn.addEventListener("click", () => {
    userInteracted = true;
    stopAutoplay();
    next();
  });

  // Επαναϋπολογισμός θέσης σε αλλαγή μεγέθους παραθύρου (χωρίς animation)
  window.addEventListener("resize", () => moveTo(index, false));

  // --- Touch / drag swipe (mobile + mouse) ---
  const DRAG_THRESHOLD = 40; // px
  let dragStartX = 0;
  let dragDeltaX = 0;
  let isDragging = false;
  let dragMoved = false;

  track.addEventListener("pointerdown", (e) => {
    isDragging = true;
    dragMoved = false;
    dragDeltaX = 0;
    dragStartX = e.clientX;
    userInteracted = true;
    stopAutoplay();
    track.style.transition = "none";
    // Σημείωση: ΔΕΝ κάνουμε setPointerCapture εδώ. Αν το κάνουμε αμέσως
    // στο pointerdown, "κλέβει" και το επόμενο click event — με αποτέλεσμα
    // ένα απλό κλικ (χωρίς σύρσιμο) πάνω σε link μέσα στο slide (π.χ. τα
    // δωμάτια στο Our Properties) να μην πλοηγεί πουθενά. Το κάνουμε μόνο
    // αφού διαπιστωθεί πραγματικό drag, παρακάτω στο pointermove.
  });

  track.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    dragDeltaX = e.clientX - dragStartX;
    if (Math.abs(dragDeltaX) > 5) {
      if (!dragMoved) track.setPointerCapture(e.pointerId);
      dragMoved = true;
    }
    track.style.transform = `translateX(-${track.children[index].offsetLeft - dragDeltaX}px)`;
  });

  const endDrag = () => {
    if (!isDragging) return;
    isDragging = false;
    track.style.transition = "";

    if (dragDeltaX < -DRAG_THRESHOLD) {
      next();
    } else if (dragDeltaX > DRAG_THRESHOLD) {
      prev();
    } else {
      moveTo(index, true);
    }
    dragDeltaX = 0;
  };

  track.addEventListener("pointerup", endDrag);
  track.addEventListener("pointercancel", endDrag);

  // Αποτρέπει να "ανοίξει" κατά λάθος ένα link μέσα στο slide όταν ο
  // χρήστης απλά έσερνε (swipe) αντί να κάνει κλικ.
  track.addEventListener(
    "click",
    (e) => {
      if (dragMoved) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true
  );
}
