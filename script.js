document.addEventListener("DOMContentLoaded", () => {
  // Audio context for beeps
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // Grab UI elements
  const frequencySlider = document.getElementById("frequency");
  const freqValueDisplay = document.getElementById("freqValue");
  const oscillationSpeedSlider = document.getElementById("oscillationSpeed");
  const speedValueDisplay = document.getElementById("speedValue");
  const visualSelect = document.getElementById("visualSelect");
  const customEmojiInput = document.getElementById("customEmoji");
  const emojiSizeSlider = document.getElementById("emojiSize");
  const emojiSizeValueDisplay = document.getElementById("emojiSizeValue");
  const bgColorInput = document.getElementById("bgColor");
  const toggleButton = document.getElementById("toggleButton");
  const visualElement = document.getElementById("visualElement");
  const visualContainer = document.getElementById("visualContainer");

  // Update displays on input
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
  bgColorInput.addEventListener("input", () => {
    visualContainer.style.backgroundColor = bgColorInput.value;
  });
  customEmojiInput.addEventListener("input", () => {
    if (visualSelect.value === "emoji") {
      visualElement.textContent = customEmojiInput.value;
    }
  });

  // Update visual element based on visual mode
  function updateVisual(mode) {
    // Reset any previous styles and content
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
      // Replace the src URL with your image if desired
      visualElement.innerHTML =
        '<img src="https://via.placeholder.com/100" alt="oscillating image" />';
    }
  }
  // When visual mode changes
  visualSelect.addEventListener("change", () => {
    updateVisual(visualSelect.value);
  });
  // Initial visual mode setup
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

  // Animation loop using requestAnimationFrame
  function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const cycleDuration = parseFloat(oscillationSpeedSlider.value) * 1000; // full cycle in ms
    const halfCycle = cycleDuration / 2;
    const t = elapsed % cycleDuration;

    // Calculate maximum x position (container width minus element width)
    const containerWidth = visualContainer.clientWidth;
    const elementWidth = visualElement.clientWidth;
    const maxX = containerWidth - elementWidth;
    let position;
    if (t < halfCycle) {
      // Moving from left (0) to right (maxX)
      position = (t / halfCycle) * maxX;
    } else {
      // Moving from right (maxX) to left (0)
      position = maxX - ((t - halfCycle) / halfCycle) * maxX;
    }
    visualElement.style.left = position + "px";

    // Threshold (ms) to detect endpoints
    const threshold = 30;

    // Left endpoint (at t near 0 or near cycleDuration)
    if (t < threshold || (cycleDuration - t) < threshold) {
      if (!leftBeepTriggered) {
        playBeep(parseInt(frequencySlider.value, 10), 100);
        leftBeepTriggered = true;
      }
    } else {
      leftBeepTriggered = false;
    }
    // Right endpoint (when t is near halfCycle)
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

  function startOscillation() {
    if (!isAnimating) {
      isAnimating = true;
      startTime = null;
      toggleButton.textContent = "Stop Oscillation";
      animationFrameId = requestAnimationFrame(animate);
    }
  }

  function stopOscillation() {
    isAnimating = false;
    toggleButton.textContent = "Start Oscillation";
    cancelAnimationFrame(animationFrameId);
  }

  // Toggle animation when button is clicked
  toggleButton.addEventListener("click", () => {
    if (isAnimating) {
      stopOscillation();
    } else {
      startOscillation();
    }
  });

  // Update the visual background color on load
  visualContainer.style.backgroundColor = bgColorInput.value;
});
