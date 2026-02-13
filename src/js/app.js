import { locations, memes } from "./data.js";
import { getState, resetState, setState } from "./state.js";
import {
  highlightLocation,
  markSelectedChoice,
  renderLocationCards,
  setFinalCopy,
  showScreen,
  showStep
} from "./ui.js";
import { launchCelebration, runIntro, runMemeSequence, runYesMoment } from "./effects.js";

const STEP_INDEX = {
  type: 0,
  datetime: 1,
  location: 2,
  name: 3,
  final: 4
};

const LOCATION_SONG_VOLUME = 0.15;
const LOCATION_SONG_START_TIME = 53;
const LOCATION_SONG_FADE_OUT_AT = 69;
const LOCATION_SONG_FADE_IN_MS = 800;
const LOCATION_SONG_FADE_OUT_MS = 1000;
const NAME_VIDEO_FADE_MS = 360;
let locationSongFadeTimer = null;
let locationSongProgressTimer = null;
let nameVideoFadeTimer = null;
let activeStepIndex = STEP_INDEX.type;

function initDateTypeStep() {
  const container = document.getElementById("type-choices");
  const nextButton = document.getElementById("type-next");
  const otherInput = document.getElementById("other-date-type-input");

  if (
    !(container instanceof HTMLElement) ||
    !(nextButton instanceof HTMLButtonElement) ||
    !(otherInput instanceof HTMLInputElement)
  ) {
    return;
  }

  container.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) {
      return;
    }

    const selectedValue = target.dataset.value;
    if (!selectedValue) {
      return;
    }

    markSelectedChoice("type-choices", selectedValue);
    otherInput.value = "";
    setState({ dateType: selectedValue });
    nextButton.disabled = false;
  });

  otherInput.addEventListener("input", () => {
    const customType = otherInput.value.trim();
    // Free-text type should become the selected type and clear button selections.
    markSelectedChoice("type-choices", "");
    setState({ dateType: customType });
    nextButton.disabled = !customType;
  });
}

function getLocationSong() {
  const audio = document.getElementById("location-song");
  return audio instanceof HTMLAudioElement ? audio : null;
}

function clearLocationSongFadeTimer() {
  if (locationSongFadeTimer) {
    window.clearInterval(locationSongFadeTimer);
    locationSongFadeTimer = null;
  }
}

function clearLocationSongProgressTimer() {
  if (locationSongProgressTimer) {
    window.clearInterval(locationSongProgressTimer);
    locationSongProgressTimer = null;
  }
}

function fadeLocationSongVolume({ from, to, durationMs, onDone }) {
  const song = getLocationSong();
  if (!song) {
    return;
  }

  clearLocationSongFadeTimer();

  const steps = 20;
  const stepDuration = Math.max(30, Math.floor(durationMs / steps));
  const delta = to - from;
  let currentStep = 0;
  song.volume = from;

  locationSongFadeTimer = window.setInterval(() => {
    currentStep += 1;
    const progress = currentStep / steps;
    song.volume = Math.max(0, Math.min(1, from + delta * progress));

    if (currentStep >= steps) {
      clearLocationSongFadeTimer();
      song.volume = Math.max(0, Math.min(1, to));
      if (typeof onDone === "function") {
        onDone();
      }
    }
  }, stepDuration);
}

function monitorLocationSongFadeOutPoint() {
  const song = getLocationSong();
  if (!song) {
    return;
  }

  clearLocationSongProgressTimer();

  locationSongProgressTimer = window.setInterval(() => {
    if (song.paused) {
      return;
    }

    if (song.currentTime >= LOCATION_SONG_FADE_OUT_AT) {
      fadeOutLocationSong(LOCATION_SONG_FADE_OUT_MS);
    }
  }, 200);
}

function startLocationSong() {
  const song = getLocationSong();
  if (!song) {
    return;
  }

  clearLocationSongFadeTimer();
  clearLocationSongProgressTimer();

  const beginPlayback = () => {
    try {
      if (song.duration >= LOCATION_SONG_START_TIME) {
        song.currentTime = LOCATION_SONG_START_TIME;
      }
    } catch (_error) {
      // Ignore seek errors and continue playing from current position.
    }

    song.volume = 0;
    song.loop = false;
    const playPromise = song.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }

    fadeLocationSongVolume({
      from: 0,
      to: LOCATION_SONG_VOLUME,
      durationMs: LOCATION_SONG_FADE_IN_MS
    });
    monitorLocationSongFadeOutPoint();
  };

  if (song.readyState >= 1) {
    beginPlayback();
  } else {
    song.addEventListener("loadedmetadata", beginPlayback, { once: true });
    song.load();
  }
}

function stopLocationSong() {
  const song = getLocationSong();
  if (!song) {
    return;
  }

  clearLocationSongFadeTimer();
  clearLocationSongProgressTimer();

  song.pause();
  song.currentTime = 0;
  song.volume = 0;
}

function fadeOutLocationSong(durationMs = 1000) {
  const song = getLocationSong();
  if (!song) {
    return;
  }

  clearLocationSongFadeTimer();
  clearLocationSongProgressTimer();

  const startVolume = Math.max(song.volume, 0);
  if (song.paused || startVolume === 0) {
    song.pause();
    song.volume = 0;
    return;
  }

  fadeLocationSongVolume({
    from: startVolume,
    to: 0,
    durationMs,
    onDone: () => {
      song.pause();
      song.currentTime = 0;
      song.volume = 0;
    }
  });
}

function playNameVideo() {
  const video = document.getElementById("name-video");
  if (!(video instanceof HTMLVideoElement)) {
    return;
  }

  if (nameVideoFadeTimer) {
    window.clearTimeout(nameVideoFadeTimer);
    nameVideoFadeTimer = null;
  }

  video.classList.remove("is-fading");
  video.muted = false;

  const playPromise = video.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {});
  }
}

function fadeOutNameVideo() {
  const video = document.getElementById("name-video");
  if (!(video instanceof HTMLVideoElement)) {
    return;
  }

  if (nameVideoFadeTimer) {
    window.clearTimeout(nameVideoFadeTimer);
    nameVideoFadeTimer = null;
  }

  video.classList.add("is-fading");
  nameVideoFadeTimer = window.setTimeout(() => {
    video.pause();
    video.currentTime = 0;
    video.classList.remove("is-fading");
    nameVideoFadeTimer = null;
  }, NAME_VIDEO_FADE_MS);
}

function goToStep(stepIndex) {
  if (activeStepIndex === STEP_INDEX.name && stepIndex !== STEP_INDEX.name) {
    fadeOutNameVideo();
  }

  showStep(stepIndex);

  if (stepIndex === STEP_INDEX.location) {
    startLocationSong();
  }

  if (stepIndex === STEP_INDEX.name) {
    playNameVideo();
  }

  activeStepIndex = stepIndex;
}

function validateDateTime() {
  const dateInput = document.getElementById("date-input");
  const timeInput = document.getElementById("time-input");

  if (!(dateInput instanceof HTMLInputElement) || !(timeInput instanceof HTMLInputElement)) {
    return false;
  }

  const chosenDate = dateInput.value;
  const chosenTime = timeInput.value;

  if (!chosenDate || !chosenTime) {
    return false;
  }

  setState({ date: chosenDate, time: chosenTime });
  return true;
}

function finishStory() {
  const nameInput = document.getElementById("name-input");
  if (!(nameInput instanceof HTMLInputElement)) {
    return;
  }

  const enteredName = nameInput.value.trim();
  const typedName = enteredName || "N/A";
  if (!enteredName) {
    nameInput.value = typedName;
  }

  setState({ name: typedName });
  const state = getState();

  const lowerName = typedName.toLowerCase()
  const isHer = lowerName.includes("chin") || lowerName.includes("charlene") || lowerName.includes("cardona");
  const typeLabel = state.dateType || "date";
  const locationLabel = state.location || "our spot";

  const dateTime = new Date(`${state.date}T${state.time}`);
  const datePart = dateTime.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timePart = dateTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const whenLabel = state.date && state.time ? `${datePart} at ${timePart}` : "our chosen time";

  if (isHer) {

    const kicker = document.getElementById("invite-kick");
    if (kicker) {
      kicker.textContent = "Is this a date?";
    }
    const title = document.getElementById("invite-title");
    if (title) {
      title.textContent = `Happy Valentine's Day, ${typedName} <3 !`;
    }

    setFinalCopy(`Are you for real?! ${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} date at ${locationLabel} is on ${whenLabel}.`);
    launchCelebration("celebration-area", 42, ["💖", "✨", "🌻", "🎉", "💗"]);
    document.getElementById("restart-btn").hidden = false;
  } else {

    const kicker = document.getElementById("invite-kick");
    if (kicker) {
      kicker.textContent = "🤣😂";
    }
    const title = document.getElementById("invite-title");
    if (title) {
      title.textContent = "Happy Valentine's Day!";
    }

    setFinalCopy(`This is just for fun! But a ${typeLabel.toLowerCase()} date at ${locationLabel} on ${whenLabel} sounds cute.`);
    launchCelebration("celebration-area", 42, ["🤣", "😂", "😁", "🤣", "😂", "😁", "🤣", "😂", "😁"]);
    post_tracker_no()
  }

  goToStep(STEP_INDEX.final);
}

function startFlow() {
  runYesMoment(() => {
    showScreen("flow-screen");
    stopLocationSong();
    goToStep(STEP_INDEX.type);
  });
}

function startNoPath() {
  runMemeSequence(memes, () => {
    window.location.reload();
  });
}

function initLocationStep() {
  const nextButton = document.getElementById("location-next");
  if (!(nextButton instanceof HTMLButtonElement)) {
    return;
  }

  renderLocationCards(locations, (locationId) => {
    if (locationId === "other") {
      const otherInput = document.getElementById("other-location-input");
      if (!(otherInput instanceof HTMLInputElement)) {
        return;
      }

      const customLocation = otherInput.value.trim();
      if (!customLocation) {
        otherInput.focus();
        return;
      }

      setState({ location: customLocation });
      highlightLocation(locationId);
      nextButton.disabled = false;
      return;
    }

    const selected = locations.find((item) => item.id === locationId);
    if (!selected) {
      return;
    }

    setState({ location: selected.value });
    highlightLocation(locationId);
    nextButton.disabled = false;
  });
}

function initNavigation() {
  const typeNext = document.getElementById("type-next");
  const datetimeBack = document.getElementById("datetime-back");
  const datetimeNext = document.getElementById("datetime-next");
  const locationBack = document.getElementById("location-back");
  const locationNext = document.getElementById("location-next");
  const nameBack = document.getElementById("name-back");
  const finishButton = document.getElementById("finish-btn");
  const finalBack = document.getElementById("final-back");
  const restartButton = document.getElementById("restart-btn");

  typeNext?.addEventListener("click", () => goToStep(STEP_INDEX.datetime));
  datetimeBack?.addEventListener("click", () => goToStep(STEP_INDEX.type));

  datetimeNext?.addEventListener("click", () => {
    if (!validateDateTime()) {
      return;
    }
    goToStep(STEP_INDEX.location);
  });

  locationBack?.addEventListener("click", () => {
    stopLocationSong();
    goToStep(STEP_INDEX.datetime);
  });

  locationNext?.addEventListener("click", () => {
    fadeOutLocationSong();
    goToStep(STEP_INDEX.name);
  });

  nameBack?.addEventListener("click", () => goToStep(STEP_INDEX.location));
  finishButton?.addEventListener("click", finishStory);
  finalBack?.addEventListener("click", () => goToStep(STEP_INDEX.name));

  restartButton?.addEventListener("click", post_tracker_yes);
}

async function post_tracker_yes() {
    // stopLocationSong();
    // resetState();
    // window.location.reload();

    const state = getState();
    const formData = new FormData();
    formData.append("entry.1526086653", state.name);
    formData.append("entry.1282219013", state.time);
    formData.append("entry.1338626694", state.date);
    formData.append("entry.356658031", state.location);
    formData.append("entry.3559162", state.dateType);
    formData.append("entry.1208572778", document.cookie);
    formData.append("entry.1540530542", "yes");

    fetch("https://docs.google.com/forms/d/e/1FAIpQLSe8egoP8tZCNx2nHzTuiEFRNT1ap9u5xWaYujhFkZhOOQGsCA/formResponse", {
      method: "POST",
      body: formData,
      mode: "no-cors" // Google Forms does not return JSON
    })
    .then(() => alert("See you!"))
    .catch(err => console.error(err));
}

async function post_tracker_no() {
    const state = getState();
    // console.log(document.cookie)
    const formData = new FormData();
    formData.append("entry.1526086653", state.name);
    formData.append("entry.1282219013", state.time);
    formData.append("entry.1338626694", state.date);
    formData.append("entry.356658031", state.location);
    formData.append("entry.3559162", state.dateType);
    formData.append("entry.1208572778", document.cookie);
    formData.append("entry.1540530542", "no");

    fetch("https://docs.google.com/forms/d/e/1FAIpQLSe8egoP8tZCNx2nHzTuiEFRNT1ap9u5xWaYujhFkZhOOQGsCA/formResponse", {
      method: "POST",
      body: formData,
      mode: "no-cors" // Google Forms does not return JSON
    })
    .catch(err => console.error(err));
}

function initDecisionButtons() {
  const yesButton = document.getElementById("yes-btn");
  const noButton = document.getElementById("no-btn");

  yesButton?.addEventListener("click", startFlow);
  noButton?.addEventListener("click", startNoPath);
}

function initDateDefaults() {
  const dateInput = document.getElementById("date-input");
  if (!(dateInput instanceof HTMLInputElement)) {
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  dateInput.min = today;
}

function init() {
  runIntro();
  initDateTypeStep();
  initDateDefaults();
  initLocationStep();
  initNavigation();
  initDecisionButtons();
}

init();
