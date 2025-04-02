document.addEventListener("DOMContentLoaded", () => {
  // Audio context for beeps
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // Grab common UI elements
  const visualContainer = document.getElementById("visualContainer");
  const visualElement = document.getElementById("visualElement");
  const toggleButton = document.getElementById("toggleButton");
  const fullscreenButton = document.getElementById("fullscreenButton");
  const timerDisplay = document.getElementById("timerDisplay");

  // Visual tab controls
  const enableVisual = document.getElementById("enableVisual");
  const visualMode = document.getElementById("visualMode");
  const customEmoji = document.getElementById("customEmoji");
  const emojiSize = document.getElementById("emojiSize");
  const emojiSizeValue = document.getElementById("emojiSizeValue");
  const oscillationSpeed = document.getElementById("oscillationSpeed");
  const speedValueDisplay = document.getElementById("speedValue");
  const oscillationCurve = document.getElementById("oscillationCurve");
  const enableGradient = document.getElementById("enableGradient");
  const gradientInputs = document.querySelector(".gradient-inputs");
  const leftBgColor = document.getElementById("leftBgColor");
  const rightBgColor = document.getElementById("rightBgColor");

  // Auditory tab controls
  const enableAuditory = document.getElementById("enableAuditory");
  const frequencySlider = document.getElementById("frequency");
  const freqValueDisplay = document.getElementById("freqValue");

  // Tactile tab controls
  const enableVibration = document.getElementById("enableVibration");
  const vibrationDuration = document.getElementById("vibrationDuration");
  const vibrationDurationValue = document.getElementById("vibrationDurationValue");

  // Session duration control
  const sessionDurationInput = document.getElementById("sessionDuration");

  // Tab switching
  const tabs = document.querySelectorAll(".tab");
  const tabPanels = document.querySelectorAll(".tab-panel");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Remove active from all tabs and panels
      tabs.forEach((t) => t.classList.remove("active"));
      tabPanels.forEach((panel) => panel.classList.remove("active"));

      // Activate current tab and corresponding panel
      tab.classList.add("active");
      const panel = document.getElementById("tab-" + tab.dataset.tab);
      if (panel) panel.classList.add("active");
    });
  });

  // Update displays for sliders
  emojiSize.addEventListener("input", () => {
    emojiSizeValue.textContent = emojiSize.value + " px";
    if (visualMode.value === "emoji") {
      visualElement.style.fontSize = emojiSize.value + "px";
    }
  });
  oscillationSpeed.addEventListener("input", () => {
    speedValueDisplay.textContent = oscillationSpeed.value + " s";
  });
  frequencySlider.addEventListener("input", () => {
    freqValueDisplay.textContent = frequencySlider.value + " Hz";
  });
  vibrationDuration.addEventListener("input", () => {
    vibrationDurationValue.textContent = vibrationDuration.value + " ms";
  });
  enableGradient.addEventListener("change", () => {
    gradientInputs.style.display = enableGradient.checked ? "flex" : "none";
    if (!enableGradient.checked) {
      visualContainer.style.background = "";
    }
  });

  // Update visual element based on visual mode
  function updateVisual() {
    visualElement.style.backgroundColor = "transparent";
    visualElement.style.borderRadius = "0";
    visualElement.innerHTML = "";
    if (visualMode.value === "emoji") {
      visualElement.textContent = customEmoji.value;
      visualElement.style.fontSize = emojiSize.value + "px";
    } else if (visualMode.value === "shape") {
      visualElement.style.backgroundColor = "#000";
      visualElement.style.borderRadius = "50%";
    } else if (visualMode.value === "picture") {
      visualElement.innerHTML =
        '<img src="https://via.placeholder.com/100" alt="oscillating image" />';
    }
  }
  visualMode.addEventListener("change", updateVisual);
  customEmoji.addEventListener("input", updateVisual);
  updateVisual();

  // Animation and session control variables
  let isAnimating = false;
  let animationFrameId;
  let startTime = null;
  let leftEndpointTriggered = false;
  let rightEndpointTriggered = false;
  let sessionIntervalId = null;
  let sessionEndTime = null;

  // Animation loop using requestAnimationFrame
  function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const cycleDuration = parseFloat(oscillationSpeed.value) * 1000;
    const halfCycle = cycleDuration / 2;
    const t = elapsed % cycleDuration;

    const containerWidth = visualContainer.clientWidth;
    const elementWidth = visualElement.clientWidth;
    const maxX = containerWidth - elementWidth;
    let position = 0;

    // Compute position based on selected curve
    if (oscillationCurve.value === "linear") {
      if (t < halfCycle) {
        position = (t / halfCycle) * maxX;
      } else {
        position = maxX - ((t - halfCycle) / halfCycle) * maxX;
      }
    } else if (oscillationCurve.value === "sinusoidal") {
      position =
        ((Math.sin(2 * Math.PI * (t / cycleDuration - 0.25)) + 1) / 2) * maxX;
    }
    visualElement.style.left = position + "px";

    // Update background gradient if enabled (only in visual modality)
    if (enableGradient.checked) {
      const centerX = position + elementWidth / 2;
      const ratio = centerX / containerWidth;
      visualContainer.style.background = `linear-gradient(90deg, ${leftBgColor.value} ${ratio * 100}%, ${rightBgColor.value} ${ratio * 100}%)`;
    }

    // At endpoints, trigger stimuli (with threshold in ms)
    const threshold = 30;
    // Left endpoint
    if (t < threshold || cycleDuration - t < threshold) {
      if (!leftEndpointTriggered) {
        if (enableAuditory.checked) {
          playBeep(parseInt(frequencySlider.value, 10), 100);
        }
        if (enableVibration.checked && navigator.vibrate) {
          navigator.vibrate(parseInt(vibrationDuration.value, 10));
        }
        leftEndpointTriggered = true;
      }
    } else {
      leftEndpointTriggered = false;
    }
    // Right endpoint
    if (Math.abs(t - halfCycle) < threshold) {
      if (!rightEndpointTriggered) {
        if (enableAuditory.checked) {
          playBeep(parseInt(frequencySlider.value, 10), 100);
        }
        if (enableVibration.checked && navigator.vibrate) {
          navigator.vibrate(parseInt(vibrationDuration.value, 10));
        }
        rightEndpointTriggered = true;
      }
    } else {
      rightEndpointTriggered = false;
    }

    if (isAnimating) {
      animationFrameId = requestAnimationFrame(animate);
    }
  }

  // Audio beep function using Web Audio API
  function playBeep(frequency = 440, duration = 100) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    setTimeout(() => oscillator.stop(), duration);
  }

  // Update session timer display
  function updateTimer() {
    const remaining = sessionEndTime - Date.now();
    if (remaining <= 0) {
      timerDisplay.textContent = "Session Complete";
      stopSession();
    } else {
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      timerDisplay.textContent = `${minutes}:${
        seconds < 10 ? "0" : ""
      }${seconds}`;
    }
  }

  // Start the oscillation session and timer
  function startSession() {
    if (!isAnimating) {
      isAnimating = true;
      startTime = null;
      toggleButton.textContent = "Stop Session";
      const sessionDuration = parseFloat(sessionDurationInput.value);
      sessionEndTime = Date.now() + sessionDuration * 60 * 1000;
      timerDisplay.textContent = "";
      sessionIntervalId = setInterval(updateTimer, 1000);
      animationFrameId = requestAnimationFrame(animate);
    }
  }

  function stopSession() {
    isAnimating = false;
    toggleButton.textContent = "Start Session";
    cancelAnimationFrame(animationFrameId);
    clearInterval(sessionIntervalId);
  }

  toggleButton.addEventListener("click", () => {
    if (isAnimating) {
      stopSession();
    } else {
      startSession();
    }
  });

  // Fullscreen toggle
  fullscreenButton.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      visualContainer.requestFullscreen().catch((err) => {
        console.error(
          `Error attempting to enable fullscreen mode: ${err.message} (${err.name})`
        );
      });
    } else {
      document.exitFullscreen();
    }
  });
});
