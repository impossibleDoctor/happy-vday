const screenIds = ["intro-screen", "flow-screen"];
const stepIds = ["step-type", "step-datetime", "step-location", "step-name", "step-final"];
const totalPrompts = 4;

export function showScreen(id) {
  screenIds.forEach((screenId) => {
    const element = document.getElementById(screenId);
    if (!element) {
      return;
    }
    element.classList.toggle("is-active", screenId === id);
  });
}

export function showStep(stepIndex) {
  stepIds.forEach((stepId, index) => {
    const element = document.getElementById(stepId);
    if (!element) {
      return;
    }

    element.classList.toggle("is-active", index === stepIndex);

    if (index === stepIndex) {
      element.classList.add("flash-pop");
      window.setTimeout(() => element.classList.remove("flash-pop"), 600);
    }
  });

  const progressLabel = document.getElementById("progress-label");
  const progressFill = document.getElementById("progress-fill");
  const inviteShell = document.getElementById("invite-shell");

  if (inviteShell) {
    inviteShell.classList.toggle("is-open", stepIndex === 4);
  }

  if (!progressLabel || !progressFill) {
    return;
  }

  if (stepIndex < totalPrompts) {
    progressLabel.textContent = `Step ${stepIndex + 1} of ${totalPrompts}`;
    progressFill.style.width = `${((stepIndex + 1) / totalPrompts) * 100}%`;
  } else {
    progressLabel.textContent = "Story complete";
    progressFill.style.width = "100%";
  }
}

export function renderLocationCards(locations, onPick) {
  const grid = document.getElementById("location-grid");
  if (!grid) {
    return;
  }

  grid.innerHTML = locations
    .map((location) => {
      if (location.id === "other") {
        return `
          <article class="location-card" data-location-id="${location.id}">
            <img src="${location.image}" alt="${location.label}" loading="lazy" />
            <div class="meta">
              <label class="field other-location-field">
                <input id="other-location-input" type="text" placeholder="${location.label}" />
              </label>
              <button class="pick-location" type="button" data-location-id="${location.id}">Pick this</button>
            </div>
          </article>`;
      }

      return `
        <article class="location-card" data-location-id="${location.id}">
          <img src="${location.image}" alt="${location.label}" loading="lazy" />
          <div class="meta">
            <strong>${location.label}</strong>
            <button class="pick-location" type="button" data-location-id="${location.id}">Pick this</button>
          </div>
        </article>`;
    })
    .join("");

  grid.addEventListener("click", (event) => {
    if (!(event.target instanceof HTMLElement)) {
      return;
    }

    const pickButton = event.target.closest(".pick-location");
    if (!(pickButton instanceof HTMLElement)) {
      return;
    }

    const locationId = pickButton.dataset.locationId;
    if (locationId) {
      onPick(locationId);
    }
  });
}

export function highlightLocation(locationId) {
  document.querySelectorAll(".location-card").forEach((card) => {
    const isMatch = card instanceof HTMLElement && card.dataset.locationId === locationId;
    card.classList.toggle("is-selected", Boolean(isMatch));
  });
}

export function markSelectedChoice(containerId, value) {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }

  container.querySelectorAll(".choice").forEach((button) => {
    const isMatch = button instanceof HTMLElement && button.dataset.value === value;
    button.classList.toggle("is-selected", Boolean(isMatch));
  });
}

export function setFinalCopy(text) {
  const target = document.getElementById("final-copy");
  if (target) {
    target.textContent = text;
  }
}
