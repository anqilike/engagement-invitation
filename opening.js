(function () {
  "use strict";

  const cover = document.getElementById("invitationCover");
  const openButton = document.getElementById("openInvitation");
  const coverPaper = cover ? cover.querySelector(".invitation-cover__paper") : null;
  if (!cover) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const preloader = document.getElementById("preloader");
  let touchStartY = 0;

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
    cover.classList.add("is-opening");

    if (reducedMotion) {
      finish();
      return;
    }

    window.setTimeout(finish, 1700);
  };

  if (openButton) openButton.addEventListener("click", open);
  if (coverPaper) coverPaper.addEventListener("click", open);
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
