document.addEventListener("DOMContentLoaded", () => {
  // Audio context for beeps
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // Grab UI elements
  const frequencySlider = document.getElementById("frequency");
  const freqValueDisplay = document.getElementById("freqValue");
  const oscillationSpeedSlider = document.getElementById("oscillationSpeed");
  const speedValueDisplay = document.getElementById("speedValue");
  const oscillationCurveSelect = document.getElementById("oscillationCurve");
  const visualSelect = document.getElementById("visualSelect");
  const customEmojiInput = document.getElementById("customEmoji");
  const emojiSizeSlider = document.getElementById("emojiSize");
  const emojiSizeValueDisplay = document.getElementById("emojiSizeValue");
  const sessionDurationInput = document.getElementById("sessionDuration");
  const timerDisplay = document.getElementById("timerDisplay");
  const enableGradient = document.getElementById("enableGradient");
  const gradientInputs = document.querySelector(".gradient-inputs");
  const leftBgColor = document.getElementById("leftBgColor");
  const rightBgColor = document.getElementById("rightBgColor");
  const toggleButton = document.getElementById("toggleButton");
  const fullscreenButton = document.getElementById("fullscreenButton");
  const visualElement = document.getElementById("visualElement");
  const visualContainer = document.getElementById("visualContainer");

  // Display updates for inputs
  frequencySlider.addEventListener("input", () => {
    freqValueDisplay.textContent = frequencySlider.value + " Hz";
  });
  oscillationSpeedSlider.addEventListener("input", () => {
    speedValueDisplay.textContent = oscillationSpeedSlider.value + " s";
  });
  emojiSizeSlider.addEventListener("input", () => {
    emojiSizeValueDisplay.textContent = emojiSizeSlider.value + " px";
    if (visualSelect.value === "emoji") {
      visualElement.style.fontSize = emojiSizeSlider.value + "px";
    }
  });
  customEmojiInput.addEventListener("input", () => {
    if (visualSelect.value === "emoji") {
      visualElement.textContent = customEmojiInput.value;
    }
  });
  // Toggle display of gradient color inputs when enabled
  enableGradient.addEventListener("change", () => {
    gradientInputs.style.display = enableGradient.checked ? "flex" : "none";
    if (!enableGradient.checked) {
      // Reset to a default background when gradient is off
      visualContainer.style.background = "";
    }
  });

  // Update visual element based on mode
  function updateVisual(mode) {
    visualElement.style.backgroundColor = "transparent";
    visualElement.style.borderRadius = "0";
    visualElement.innerHTML = "";
    if (mode === "emoji") {
      visualElement.textContent = customEmojiInput.value;
      visualElement.style.fontSize = emojiSizeSlider.value + "px";
    } else if (mode === "shape") {
      visualElement.style.backgroundColor = "#000";
      visualElement.style.borderRadius = "50%";
    } else if (mode === "picture") {
      visualElement.innerHTML =
        '<img src="https://via.placeholder.com/100" alt="oscillating image" />';
    }
  }
  visualSelect.addEventListener("change", () => {
    updateVisual(visualSelect.value);
  });
  updateVisual(visualSelect.value);

  // Audio beep function
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

  // Animation control variables
  let isAnimating = false;
  let animationFrameId;
  let startTime = null;
  let leftBeepTriggered = false;
  let rightBeepTriggered = false;

  // Session timer variables
  let sessionIntervalId = null;
  let sessionEndTime = null;

  // Animation loop using requestAnimationFrame
  function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const cycleDuration =
      parseFloat(oscillationSpeedSlider.value) * 1000; // full cycle in ms
    const halfCycle = cycleDuration / 2;
    const t = elapsed % cycleDuration;

    // Calculate max position (container width minus element width)
    const containerWidth = visualContainer.clientWidth;
    const elementWidth = visualElement.clientWidth;
    const maxX = containerWidth - elementWidth;
    let position = 0;

    // Oscillation based on selected curve
    if (oscillationCurveSelect.value === "linear") {
      if (t < halfCycle) {
        // Moving from left to right
        position = (t / halfCycle) * maxX;
      } else {
        // Moving from right to left
        position = maxX - ((t - halfCycle) / halfCycle) * maxX;
      }
    } else if (oscillationCurveSelect.value === "sinusoidal") {
      // Sinusoidal oscillation: phase shift to start at left edge.
      position =
        ((Math.sin(2 * Math.PI * (t / cycleDuration - 0.25)) + 1) / 2) * maxX;
    }
    visualElement.style.left = position + "px";

    // Update background gradient if enabled
    if (enableGradient.checked) {
      // Calculate element's center ratio relative to container width
      const centerX = position + elementWidth / 2;
      const ratio = centerX / containerWidth;
      visualContainer.style.background = `linear-gradient(90deg, ${leftBgColor.value} ${ratio *
        100}%, ${rightBgColor.value} ${ratio * 100}%)`;
    }

    // Threshold (ms) for endpoint detection
    const threshold = 30;

    // Left endpoint: near t=0 or near cycleDuration
    if (t < threshold || cycleDuration - t < threshold) {
      if (!leftBeepTriggered) {
        playBeep(parseInt(frequencySlider.value, 10), 100);
        leftBeepTriggered = true;
      }
    } else {
      leftBeepTriggered = false;
    }
    // Right endpoint: near halfCycle
    if (Math.abs(t - halfCycle) < threshold) {
      if (!rightBeepTriggered) {
        playBeep(parseInt(frequencySlider.value, 10), 100);
        rightBeepTriggered = true;
      }
    } else {
      rightBeepTriggered = false;
    }

    if (isAnimating) {
      animationFrameId = requestAnimationFrame(animate);
    }
  }

  // Update session timer display
  function updateTimer() {
    const remaining = sessionEndTime - Date.now();
    if (remaining <= 0) {
      timerDisplay.textContent = "Session Complete";
      stopOscillation();
      clearInterval(sessionIntervalId);
    } else {
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      timerDisplay.textContent = `${minutes}:${
        seconds < 10 ? "0" : ""
      }${seconds}`;
    }
  }

  // Start oscillation and session timer
  function startOscillation() {
    if (!isAnimating) {
      isAnimating = true;
      startTime = null;
      toggleButton.textContent = "Stop Session";
      // Set up session timer based on user input (in minutes)
      const sessionDuration = parseFloat(sessionDurationInput.value);
      sessionEndTime = Date.now() + sessionDuration * 60 * 1000;
      timerDisplay.textContent = "";
      sessionIntervalId = setInterval(updateTimer, 1000);
      animationFrameId = requestAnimationFrame(animate);
    }
  }

  function stopOscillation() {
    isAnimating = false;
    toggleButton.textContent = "Start Session";
    cancelAnimationFrame(animationFrameId);
    clearInterval(sessionIntervalId);
  }

  // Toggle session start/stop
  toggleButton.addEventListener("click", () => {
    if (isAnimating) {
      stopOscillation();
    } else {
      startOscillation();
    }
  });

  // Fullscreen toggle for visual container
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
