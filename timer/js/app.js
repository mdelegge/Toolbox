const minutesInput = document.getElementById('minutesInput');
const secondsInput = document.getElementById('secondsInput');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');
const timeDisplay = document.getElementById('timeDisplay');
const streamEl = document.getElementById('stream');
const flashOverlay = document.getElementById('flashOverlay');
// DEBUG: Progress display element
// const debugProgress = document.getElementById('debugProgress');
// END DEBUG

let totalSeconds = 0;
let remainingSeconds = 0;
let remainingMilliseconds = 0;
let intervalId = null;
let lastTickTime = null;

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

function formatTime(s, ms) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  const centiseconds = Math.floor(ms / 10);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}

function setProgress(progress) {
  const p = clamp(progress, 0, 1);
  document.documentElement.style.setProperty('--progress', String(p));
}

function updateDisplay() {
  timeDisplay.textContent = formatTime(remainingSeconds, remainingMilliseconds);
  if (totalSeconds > 0) {
    const totalMs = totalSeconds * 1000;
    const currentMs = remainingSeconds * 1000 + remainingMilliseconds;
    const progress = 1 - (currentMs / totalMs);

    setProgress(progress);

    // DEBUG: Update progress display
    // debugProgress.textContent = progress.toFixed(6);
    // END DEBUG
  } else {
    setProgress(0);
    // DEBUG: Update progress display
    // debugProgress.textContent = '0';
    // END DEBUG
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
  const now = Date.now();
  if (lastTickTime === null) {
    lastTickTime = now;
    return;
  }
  
  const elapsed = now - lastTickTime;
  lastTickTime = now;
  
  if (remainingSeconds > 0 || remainingMilliseconds > 0) {
    remainingMilliseconds -= elapsed;
    
    while (remainingMilliseconds < 0 && remainingSeconds > 0) {
      remainingSeconds -= 1;
      remainingMilliseconds += 1000;
    }
    
    if (remainingSeconds <= 0 && remainingMilliseconds <= 0) {
      remainingSeconds = 0;
      remainingMilliseconds = 0;
      updateDisplay();
      clearTimer();
      setRunning(false);
      showStream(false);
      triggerFlash();
    } else {
      updateDisplay();
    }
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
    lastTickTime = Date.now();
    updateDisplay();
    intervalId = setInterval(onTick, 10); // Update every 10ms for smooth milliseconds
  }
}

function stopTimer() {
  clearTimer();
  lastTickTime = null;
  setRunning(false);
  showStream(false);
}

function resetTimer() {
  clearTimer();
  lastTickTime = null;
  totalSeconds = computeTotalFromInputs();
  remainingSeconds = totalSeconds;
  remainingMilliseconds = 0;
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
  remainingMilliseconds = 0;
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
  remainingMilliseconds = 0;
  setRunning(false);
  showStream(false);
  updateDisplay();
})();
