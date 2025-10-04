const minutesInput = document.getElementById('minutesInput');
const secondsInput = document.getElementById('secondsInput');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');
const timeDisplay = document.getElementById('timeDisplay');
const streamEl = document.getElementById('stream');
const flashOverlay = document.getElementById('flashOverlay');

let totalSeconds = 0;
let remainingSeconds = 0;
let intervalId = null;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function sanitizeInputs() {
  // Parse integers and handle NaN
  let mins = parseInt(minutesInput.value, 10);
  let secs = parseInt(secondsInput.value, 10);
  if (isNaN(mins)) mins = 0;
  if (isNaN(secs)) secs = 0;

  mins = clamp(mins, 0, 60);
  secs = clamp(secs, 0, 59);

  // Cap to 1 hour max
  if (mins === 60) secs = 0;

  minutesInput.value = String(mins);
  secondsInput.value = String(secs);

  return { mins, secs };
}

function computeTotalFromInputs() {
  const { mins, secs } = sanitizeInputs();
  return clamp(mins * 60 + secs, 0, 3600);
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function setProgress(progress) {
  const p = clamp(progress, 0, 1);
  document.documentElement.style.setProperty('--progress', String(p));
}

function updateDisplay() {
  timeDisplay.textContent = formatTime(remainingSeconds);
  if (totalSeconds > 0) {
    const progress = 1 - (remainingSeconds / totalSeconds);
    setProgress(progress);
  } else {
    setProgress(0);
  }
}

function setRunning(running) {
  minutesInput.disabled = running;
  secondsInput.disabled = running;
}

function showStream(show) {
  if (show) streamEl.classList.add('show');
  else streamEl.classList.remove('show');
}

function clearTimer() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function onTick() {
  if (remainingSeconds > 0) {
    remainingSeconds -= 1;
    updateDisplay();
  }
  if (remainingSeconds <= 0) {
    remainingSeconds = 0;
    updateDisplay();
    clearTimer();
    setRunning(false);
    setTimeout(() => {
      showStream(false);
      triggerFlash();
    }, 1000);
  }
}

function startTimer() {
  // Recompute total if no total yet
  if (totalSeconds === 0) totalSeconds = computeTotalFromInputs();

  // Nothing to do for zero duration
  if (totalSeconds <= 0) return;

  // If finished, restart from total
  if (remainingSeconds === 0) remainingSeconds = totalSeconds;

  // remainingSeconds += 1  
 
  if (intervalId === null) {
    setRunning(true);
    showStream(true);
    updateDisplay();
    intervalId = setInterval(onTick, 1000);
    // call onTick to start the timer
    onTick();
  }
}

function stopTimer() {
  clearTimer();
  setRunning(false);
  showStream(false);
}

function resetTimer() {
  clearTimer();
  totalSeconds = computeTotalFromInputs();
  remainingSeconds = totalSeconds;
  setRunning(false);
  showStream(false);
  updateDisplay();
}

function triggerFlash() {
  // Delay flash to let the final animation complete
    flashOverlay.classList.add('show');
}

flashOverlay.addEventListener('animationend', () => {
  flashOverlay.classList.remove('show');
});

// Input handlers
function handleInputChange() {
  if (intervalId !== null) return; // ignore changes while running
  totalSeconds = computeTotalFromInputs();
  remainingSeconds = totalSeconds;
  updateDisplay();
}

minutesInput.addEventListener('input', handleInputChange);
secondsInput.addEventListener('input', handleInputChange);
minutesInput.addEventListener('change', handleInputChange);
secondsInput.addEventListener('change', handleInputChange);

// Button handlers
startBtn.addEventListener('click', startTimer);
stopBtn.addEventListener('click', stopTimer);
resetBtn.addEventListener('click', resetTimer);

// Initialize
(function init() {
  totalSeconds = computeTotalFromInputs();
  remainingSeconds = totalSeconds;
  setRunning(false);
  showStream(false);
  updateDisplay();
})();
