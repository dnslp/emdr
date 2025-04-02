document.addEventListener("DOMContentLoaded", () => {
  // Create an AudioContext for generating beeps
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // Grab elements
  const visualContainer = document.getElementById("visualContainer");
  const visualElement = document.getElementById("visualElement");
  const toggleButton = document.getElementById("toggleButton");
  const fullscreenButton = document.getElementById("fullscreenButton");
  const timerDisplay = document.getElementById("timerDisplay");

  // Visual controls
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

  // Auditory controls
  const enableAuditory = document.getElementById("enableAuditory");
  const frequencySlider = document.getElementById("frequency");
  const freqValueDisplay = document.getElementById("freqValue");

  // Session duration control
  const sessionDurationInput = document.getElementById("sessionDuration");

  // Tab switching logic
  const tabs = document.querySelectorAll(".tab");
  const tabPanels = document.querySelectorAll(".tab-panel");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tabPanels.forEach((panel) => panel.classList.remove("active"));
      tab.classList.add("active");
      const panel = document.getElementById("tab-" + tab.dataset.tab);
      if (panel) panel.classList.add("active");
    });
  });

  // Update slider displays
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
  enableGradient.addEventListener("change", () => {
    gradientInputs.style.display = enableGradient.checked ? "flex" : "none";
    if (!enableGradient.checked) {
      visualContainer.style.background = "";
    }
  });

  // Update the visual element based on the chosen mode
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
        '<img src="https://www.bluey.tv/wp-content/uploads/2023/07/Bluey.png" alt="oscillating image" width="40px" />';
    }
  }
  visualMode.addEventListener("change", updateVisual);
  customEmoji.addEventListener("input", updateVisual);
  updateVisual();

  // Animation and session variables
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

    // Compute the current position using the selected oscillation curve
    if (oscillationCurve.value === "linear") {
      position = t < halfCycle ? (t / halfCycle) * maxX : maxX - ((t - halfCycle) / halfCycle) * maxX;
    } else if (oscillationCurve.value === "sinusoidal") {
      position = ((Math.sin(2 * Math.PI * (t / cycleDuration - 0.25)) + 1) / 2) * maxX;
    }
    visualElement.style.left = position + "px";

    // Update background gradient if enabled
    if (enableGradient.checked) {
      const centerX = position + elementWidth / 2;
      const ratio = centerX / containerWidth;
      visualContainer.style.background = `linear-gradient(90deg, ${leftBgColor.value} ${ratio * 100}%, ${rightBgColor.value} ${ratio * 100}%)`;
    }

    // Trigger beep at endpoints (with a small threshold)
    const threshold = 30;
    if (t < threshold || cycleDuration - t < threshold) {
      if (!leftEndpointTriggered) {
        if (enableAuditory.checked) {
          playBeep(parseInt(frequencySlider.value, 10), 100);
        }
        leftEndpointTriggered = true;
      }
    } else {
      leftEndpointTriggered = false;
    }
    if (Math.abs(t - halfCycle) < threshold) {
      if (!rightEndpointTriggered) {
        if (enableAuditory.checked) {
          playBeep(parseInt(frequencySlider.value, 10), 100);
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

  // Audio beep function using the Web Audio API
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

  // Update the session timer display
  function updateTimer() {
    const remaining = sessionEndTime - Date.now();
    if (remaining <= 0) {
      timerDisplay.textContent = "Session Complete";
      stopSession();
    } else {
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      timerDisplay.textContent = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
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

  // Stop the session and clear timers
  function stopSession() {
    isAnimating = false;
    toggleButton.textContent = "Start Session";
    cancelAnimationFrame(animationFrameId);
    clearInterval(sessionIntervalId);
  }

  // Toggle session start/stop
  toggleButton.addEventListener("click", () => {
    isAnimating ? stopSession() : startSession();
  });

  // Fullscreen toggle for the visual container
  fullscreenButton.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      visualContainer.requestFullscreen().catch((err) => {
        console.error(`Error attempting fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  });
});
