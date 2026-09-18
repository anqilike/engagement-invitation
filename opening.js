(function () {
  "use strict";

  const cover = document.getElementById("invitationCover");
  const openButton = document.getElementById("openInvitation");
  const coverPaper = cover ? cover.querySelector(".invitation-cover__paper") : null;
  const music = document.getElementById("festiveMusic");
  const musicToggle = document.getElementById("musicToggle");
  if (!cover) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const preloader = document.getElementById("preloader");
  let touchStartY = 0;

  const syncMusicButton = () => {
    if (!music || !musicToggle) return;
    const playing = !music.paused && !music.ended;
    const label = musicToggle.querySelector(".music-toggle__text");
    musicToggle.classList.toggle("is-playing", playing);
    musicToggle.setAttribute("aria-pressed", String(playing));
    musicToggle.setAttribute("aria-label", playing ? "暂停背景音乐" : "播放背景音乐");
    if (label) label.textContent = playing ? "暂停音乐" : musicToggle.classList.contains("is-attention") ? "点击播放音乐" : "播放音乐";
    if (playing) musicToggle.classList.remove("is-attention");
  };

  const playMusic = () => {
    if (!music) return;
    music.muted = false;
    music.volume = 0.32;
    const playback = music.play();
    if (playback && typeof playback.catch === "function") {
      playback.catch(() => {
        if (musicToggle) {
          musicToggle.classList.add("is-attention");
          const label = musicToggle.querySelector(".music-toggle__text");
          if (label) label.textContent = "点击播放音乐";
        }
        window.setTimeout(() => {
          music.play().catch(() => {});
        }, 220);
      });
    }
  };

  const toggleMusic = () => {
    if (!music) return;
    if (music.paused) {
      playMusic();
    } else {
      music.pause();
    }
  };

  const hidePreloader = () => {
    if (!preloader) return;
    preloader.classList.add("preloader--done");
    preloader.setAttribute("aria-hidden", "true");
  };

  window.setTimeout(hidePreloader, 120);
  document.body.classList.add("cover-locked");

  const finish = () => {
    document.body.classList.remove("cover-locked");
    document.body.classList.add("cover-opened");
    cover.hidden = true;
  };

  const open = () => {
    if (cover.classList.contains("is-opening")) return;
    hidePreloader();
    playMusic();
    document.body.classList.add("cover-opening");

    if (reducedMotion) {
      finish();
      return;
    }

    cover.classList.add("is-opening");
    window.setTimeout(() => {
      document.body.classList.remove("cover-opening");
      finish();
    }, 1600);
  };

  if (openButton) openButton.addEventListener("click", open);
  if (openButton) openButton.addEventListener("pointerdown", playMusic);
  if (coverPaper) coverPaper.addEventListener("click", open);
  if (musicToggle) musicToggle.addEventListener("click", toggleMusic);
  if (music) {
    music.addEventListener("play", syncMusicButton);
    music.addEventListener("pause", syncMusicButton);
    music.addEventListener("ended", syncMusicButton);
  }
  syncMusicButton();
  if (music && music.preload !== "none") music.load();
  cover.addEventListener("click", (event) => {
    if (event.target === cover) open();
  });
  cover.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") open();
  });
  cover.addEventListener(
    "touchstart",
    (event) => {
      touchStartY = event.changedTouches[0].clientY;
    },
    { passive: true }
  );
  cover.addEventListener(
    "touchend",
    (event) => {
      const endY = event.changedTouches[0].clientY;
      if (touchStartY - endY > 56) open();
    },
    { passive: true }
  );
})();
