export function runIntro() {
  const scene = document.getElementById("scene");
  if (scene) {
    scene.classList.add("run");
  }

  window.setTimeout(() => {
    const bubble = document.getElementById("speech-bubble");
    bubble?.classList.add("is-visible");
  }, 5200);

  window.setTimeout(() => {
    const askCard = document.getElementById("ask-card");
    askCard?.classList.add("is-visible");
  }, 7000);
}

export function runYesMoment(onDone) {
  const overlay = document.getElementById("yey-overlay");
  const poppers = document.getElementById("yey-poppers");
  if (!overlay || !poppers) {
    onDone();
    return;
  }

  overlay.hidden = false;
  poppers.innerHTML = "";

  const icons = ["🎉", "✨", "🎊", "💖", "🌻"];
  for (let index = 0; index < 22; index += 1) {
    const burst = document.createElement("span");
    burst.className = "popper";
    burst.textContent = icons[Math.floor(Math.random() * icons.length)];
    burst.style.left = `${Math.random() * 100}%`;
    burst.style.animationDelay = `${Math.random() * 0.3}s`;
    burst.style.animationDuration = `${0.9 + Math.random() * 0.7}s`;
    burst.style.setProperty("--drift", `${(Math.random() - 0.5) * 240}px`);
    poppers.appendChild(burst);
  }

  window.setTimeout(() => {
    overlay.classList.add("is-done");
  }, 1920);

  window.setTimeout(() => {
    overlay.hidden = true;
    overlay.classList.remove("is-done");
    poppers.innerHTML = "";
    onDone();
  }, 1500);
}

export function runMemeSequence(memes, onDone) {
  const overlay = document.getElementById("meme-overlay");
  const surface = document.getElementById("meme-surface");
  if (!overlay || !surface) {
    onDone();
    return;
  }

  overlay.hidden = false;

  let index = 0;

  const showNext = () => {
    const meme = memes[index];
    if (!meme) {
      window.setTimeout(onDone, 1150);
      return;
    }

    surface.classList.remove("is-visible");
    surface.innerHTML = `
      <article class="meme-card tone-${meme.tone}">
        <img class="meme-image" src="${meme.image}" alt="meme ${index + 1}" />
        <!-- <p class="meme-sub">${meme.caption}</p> -->
      </article>`;

    window.requestAnimationFrame(() => {
      surface.classList.add("is-visible");
    });

    window.setTimeout(() => {
      surface.classList.remove("is-visible");
      index += 1;
      window.setTimeout(showNext, 10);
    }, meme.duration);
  };

  showNext();
}

export function launchCelebration(areaId, amount = 28, emojis) {
  const area = document.getElementById(areaId);
  if (!area) {
    return;
  }

  area.innerHTML = "";
  // const emojis = ["💖", "✨", "🌻", "🎉", "💗"];

  for (let i = 0; i < amount; i += 1) {
    const particle = document.createElement("span");
    particle.className = "confetti";
    particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.animationDuration = `${2 + Math.random() * 1.6}s`;
    particle.style.animationDelay = `${Math.random() * 0.35}s`;
    particle.style.setProperty("--drift", `${(Math.random() - 0.5) * 120}px`);
    area.appendChild(particle);
  }
}
