document.addEventListener("DOMContentLoaded", () => {
  // Create the Audio Context
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // Grab UI elements
  const frequencySlider = document.getElementById("frequency");
  const freqValueDisplay = document.getElementById("freqValue");
  const visualSelect = document.getElementById("visualSelect");
  const playButton = document.getElementById("playButton");
  const oscillationSpeedSlider = document.getElementById("oscillationSpeed");
  const speedValueDisplay = document.getElementById("speedValue");
  const visualElement = document.getElementById("visualElement");

  // Update frequency display when slider moves
  frequencySlider.addEventListener("input", () => {
    freqValueDisplay.textContent = frequencySlider.value + " Hz";
  });

  // Update oscillation speed display and animation duration
  oscillationSpeedSlider.addEventListener("input", () => {
    speedValueDisplay.textContent = oscillationSpeedSlider.value + " s";
    updateOscillationSpeed();
  });

  // Function to play a beep with given frequency and duration
  function playBeep(frequency = 440, duration = 500) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
    }, duration);

    // Add a pulse animation effect to the visual element
    visualElement.classList.add("pulse");
    setTimeout(() => {
      visualElement.classList.remove("pulse");
    }, 100);
  }

  // Function to update visual element based on selected mode
  function updateVisual(mode) {
    // Reset any previous styles
    visualElement.style.backgroundColor = "transparent";
    visualElement.innerHTML = "";
    visualElement.style.borderRadius = "0";

    switch (mode) {
      case "emoji":
        visualElement.innerHTML = "😊";
        break;
      case "shape":
        // Render a simple circle shape
        visualElement.style.backgroundColor = "#000";
        visualElement.style.borderRadius = "50%";
        break;
      case "picture":
        // Use a placeholder image – you can replace the src URL with your own
        visualElement.innerHTML =
          '<img src="https://via.placeholder.com/100" alt="oscillating image" />';
        break;
      default:
        visualElement.innerHTML = "😊";
    }
  }

  // Function to update the CSS animation speed based on slider value
  function updateOscillationSpeed() {
    const speed = oscillationSpeedSlider.value;
    visualElement.style.animationDuration = speed + "s";
  }

  // Initial setup
  updateOscillationSpeed();

  // Event listener for visual mode change
  visualSelect.addEventListener("change", () => {
    updateVisual(visualSelect.value);
  });

  // Event listener for play button to trigger audio and visual effects
  playButton.addEventListener("click", () => {
    const freq = parseInt(frequencySlider.value, 10);
    playBeep(freq, 500);
  });
});
