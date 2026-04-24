(function () {
  const letters = window.letterCollection || {};
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function createAmbientAudio() {
    let context = null;
    let master = null;
    let oscillators = [];
    let isPlaying = false;

    function buildContext() {
      if (context) {
        return;
      }

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        return;
      }

      context = new AudioContextClass();
      master = context.createGain();
      master.gain.value = 0;
      master.connect(context.destination);

      const notes = [196, 246.94, 293.66];
      oscillators = notes.map((frequency, index) => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        const filter = context.createBiquadFilter();

        osc.type = index === 1 ? "triangle" : "sine";
        osc.frequency.value = frequency;
        filter.type = "lowpass";
        filter.frequency.value = 880 - index * 120;
        gain.gain.value = 0.02 - index * 0.004;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(master);
        osc.start();

        return { osc, gain };
      });
    }

    async function toggle(button) {
      buildContext();
      if (!context || !master) {
        button.textContent = "Audio no disponible";
        return;
      }

      await context.resume();
      const now = context.currentTime;

      if (!isPlaying) {
        master.gain.cancelScheduledValues(now);
        master.gain.linearRampToValueAtTime(0.09, now + 1.2);
        isPlaying = true;
        button.classList.add("is-active");
        button.setAttribute("aria-pressed", "true");
        button.textContent = "Pausar ambiente";
      } else {
        master.gain.cancelScheduledValues(now);
        master.gain.linearRampToValueAtTime(0, now + 0.8);
        isPlaying = false;
        button.classList.remove("is-active");
        button.setAttribute("aria-pressed", "false");
        button.textContent = "Activar ambiente";
      }
    }

    return { toggle, get isPlaying() { return isPlaying; } };
  }

  function buildParagraphs(container, paragraphs) {
    container.innerHTML = "";
    paragraphs.forEach((paragraph) => {
      const node = document.createElement("p");
      node.textContent = paragraph;
      container.appendChild(node);
    });
  }

  function animateHero() {
    if (typeof gsap === "undefined") {
      return;
    }

    const titleLines = document.querySelectorAll(".hero__line");
    const heroLede = document.querySelector(".hero__lede");
    const heroEyebrow = document.querySelector(".hero__eyebrow");
    const heroActions = document.querySelectorAll(".hero__actions > *");
    const cards = document.querySelectorAll(".envelope-card");

    if (prefersReducedMotion) {
      gsap.set([heroEyebrow, titleLines, heroLede, heroActions, cards], { clearProps: "all" });
      return;
    }

    gsap.set(titleLines, { yPercent: 115, opacity: 0 });
    gsap.set(heroEyebrow, { opacity: 0, y: 18 });
    gsap.set(heroLede, { opacity: 0, y: 28, clipPath: "inset(0 0 100% 0)" });
    gsap.set(".hero__actions > *", { opacity: 0, y: 18 });
    gsap.set(cards, { opacity: 0, y: 40, rotateX: -10 });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.to(heroEyebrow, { opacity: 1, y: 0, duration: 0.7 })
      .to(titleLines, { yPercent: 0, opacity: 1, stagger: 0.14, duration: 1.1 }, "-=0.25")
      .to(heroLede, { opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)", duration: 0.9 }, "-=0.5")
      .to(".hero__actions > *", { opacity: 1, y: 0, stagger: 0.1, duration: 0.6 }, "-=0.45")
      .to(cards, { opacity: 1, y: 0, rotateX: 0, stagger: 0.14, duration: 0.9 }, "-=0.2");

    cards.forEach((card) => {
      const flap = card.querySelector(".envelope-card__flap");
      card.addEventListener("pointerenter", () => {
        gsap.to(card, { y: -8, rotateX: 5, duration: 0.35, ease: "power2.out" });
        gsap.to(flap, { rotateX: -20, duration: 0.35, ease: "power2.out" });
      });

      card.addEventListener("pointerleave", () => {
        gsap.to(card, { y: 0, rotateX: 0, duration: 0.45, ease: "power3.out" });
        gsap.to(flap, { rotateX: 0, duration: 0.45, ease: "power3.out" });
      });
    });
  }

  function attachScrollButtons() {
    document.querySelectorAll("[data-scroll-target]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = document.querySelector(button.dataset.scrollTarget);
        if (target) {
          target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
        }
      });
    });
  }

  function attachLetterOverlay(audioController) {
    if (typeof gsap === "undefined") {
      return;
    }

    const overlay = document.getElementById("letter-overlay");
    const envelope = document.getElementById("letter-envelope");
    const backdrop = overlay.querySelector(".letter-overlay__backdrop");
    const closeButton = overlay.querySelector(".letter-close");
    const eyebrow = document.getElementById("letter-eyebrow");
    const title = document.getElementById("letter-title");
    const body = document.getElementById("letter-body");
    const cards = document.querySelectorAll(".envelope-card");
    let activeTimeline = null;
    let activeCard = null;

    function closeOverlay() {
      if (!overlay || overlay.hidden) {
        return;
      }

      const previousCard = activeCard;
      const cardRect = previousCard ? previousCard.getBoundingClientRect() : null;

      if (activeTimeline) {
        activeTimeline.kill();
      }

      const tl = gsap.timeline({
        defaults: { ease: "power3.inOut" },
        onComplete: () => {
          overlay.hidden = true;
          activeCard = null;
        }
      });

      tl.to(".letter-sheet__body p", { opacity: 0, y: 12, stagger: 0.03, duration: 0.2 }, 0)
        .to(".letter-envelope__flap", { rotateX: 0, duration: 0.35 }, 0)
        .to(".letter-sheet", { yPercent: 0, duration: 0.38 }, 0)
        .to(overlay, { opacity: 0, duration: 0.32 }, 0);

      if (cardRect) {
        tl.to(envelope, {
          top: cardRect.top,
          left: cardRect.left,
          width: cardRect.width,
          height: cardRect.height,
          borderRadius: 32,
          duration: 0.65
        }, 0);
      }
    }

    function openOverlay(card) {
      const data = letters[card.dataset.letter];
      if (!data) {
        return;
      }

      activeCard = card;
      eyebrow.textContent = data.eyebrow;
      title.textContent = data.title;
      buildParagraphs(body, data.paragraphs);

      const rect = card.getBoundingClientRect();
      const targetWidth = Math.min(window.innerWidth * 0.8, 920);
      const targetHeight = Math.min(window.innerHeight * 0.8, 720);
      const targetTop = (window.innerHeight - targetHeight) / 2;
      const targetLeft = (window.innerWidth - targetWidth) / 2;

      overlay.hidden = false;
      gsap.set(overlay, { opacity: 1 });
      gsap.set(envelope, {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        borderRadius: 32
      });
      gsap.set(".letter-envelope__flap", { rotateX: 0 });
      gsap.set(".letter-sheet", { yPercent: 72 });
      gsap.set(".letter-sheet__body p", { opacity: 0, y: 22 });

      if (!audioController.isPlaying) {
        const audioButton = document.getElementById("audio-toggle");
        audioController.toggle(audioButton).catch(() => undefined);
      }

      if (activeTimeline) {
        activeTimeline.kill();
      }

      activeTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });
      activeTimeline
        .fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.28 }, 0)
        .to(envelope, {
          top: targetTop,
          left: targetLeft,
          width: targetWidth,
          height: targetHeight,
          borderRadius: 34,
          duration: prefersReducedMotion ? 0.01 : 0.85
        }, 0)
        .to(".letter-envelope__flap", {
          rotateX: -175,
          duration: prefersReducedMotion ? 0.01 : 0.56,
          ease: "power2.out"
        }, prefersReducedMotion ? 0 : 0.42)
        .to(".letter-sheet", {
          yPercent: 0,
          duration: prefersReducedMotion ? 0.01 : 0.62
        }, prefersReducedMotion ? 0 : 0.54)
        .to(".letter-sheet__body p", {
          opacity: 1,
          y: 0,
          stagger: prefersReducedMotion ? 0 : 0.12,
          duration: 0.48
        }, prefersReducedMotion ? 0 : 0.8);
    }

    cards.forEach((card) => {
      card.addEventListener("click", () => openOverlay(card));
    });

    backdrop.addEventListener("click", closeOverlay);
    closeButton.addEventListener("click", closeOverlay);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeOverlay();
      }
    });
  }

  window.addEventListener("DOMContentLoaded", () => {
    const audioButton = document.getElementById("audio-toggle");
    const audioController = createAmbientAudio();

    audioButton.addEventListener("click", () => {
      audioController.toggle(audioButton).catch(() => {
        audioButton.textContent = "Audio bloqueado";
      });
    });

    attachScrollButtons();
    animateHero();
    attachLetterOverlay(audioController);
  });
})();
