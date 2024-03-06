var timerModule = (function () {
  let timerInterval;
  let seconds = 0;
  let startTime = 0;
  let isPaused = false;
  let remainingTime = 0;

  function formatTime(timeInSeconds) {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);

    const formattedHours = hours.toString().padStart(2, "0");
    const formattedMinutes = minutes.toString().padStart(2, "0");
    const formattedSeconds = seconds.toString().padStart(2, "0");

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }

  function startTimer() {
    clearInterval(timerInterval);
    if (!isPaused) {
      seconds = 0;
      remainingTime = 0;
    }
    startTime = Date.now() - remainingTime * 1000;
    timerInterval = setInterval(() => {
      seconds = Math.floor((Date.now() - startTime) / 1000);
      document.getElementById("timer").textContent = formatTime(seconds);
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
    document.getElementById("elapsedTime").textContent = "";
    seconds = 0;
    remainingTime = 0;
    saveTimer();
  }

  function pauseTimer() {
    if (!isPaused) {
      clearInterval(timerInterval);
      remainingTime = seconds;
      document.getElementById("pauseBtn").textContent = "Resume";
    } else {
      startTimer();
      document.getElementById("pauseBtn").textContent = "Pause";
    }
    isPaused = !isPaused;
  }

  function saveTimer() {
    const storedTimes = JSON.parse(localStorage.getItem("storedTimes")) || [];
    storedTimes.push(seconds);
    localStorage.setItem("storedTimes", JSON.stringify(storedTimes));
  }

  function showAllStoredTimes() {
    const storedTimes = JSON.parse(localStorage.getItem("storedTimes")) || [];
    if (storedTimes.length > 0) {
      const timeList = storedTimes.map((time) => formatTime(time)).join("<br>");
      document.getElementById(
        "elapsedTime"
      ).innerHTML = `<strong>All Stored Times:</strong><br>${timeList}`;
    } else {
      document.getElementById("elapsedTime").textContent =
        "No stored times available.";
    }
  }

  function createTimerInterface() {
    const timerContainer = document.getElementById("timerContainer");
    const timerDiv = document.createElement("div");
    timerDiv.id = "timer";
    timerContainer.appendChild(timerDiv);
  }

  return {
    startTimer,
    stopTimer,
    pauseTimer,
    saveTimer,
    showAllStoredTimes,
    createTimerInterface,
  };
})();

timerModule.createTimerInterface();

document
  .getElementById("startBtn")
  .addEventListener("click", timerModule.startTimer);
document
  .getElementById("stopBtn")
  .addEventListener("click", timerModule.stopTimer);
document
  .getElementById("pauseBtn")
  .addEventListener("click", timerModule.pauseTimer);
document
  .getElementById("saveBtn")
  .addEventListener("click", timerModule.saveTimer);
document
  .getElementById("showAllBtn")
  .addEventListener("click", timerModule.showAllStoredTimes);

window.onload = function () {
  localStorage.removeItem("storedTimes");
};
