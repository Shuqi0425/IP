// Menu overlay (keep your existing)
const menuBtn = document.getElementById("menu-btn");
const menuOverlay = document.getElementById("menu-overlay");

if (menuBtn && menuOverlay) {
  menuBtn.addEventListener("click", () => {
    menuOverlay.style.display = "block";
  });

  menuOverlay.addEventListener("click", (e) => {
    if (e.target === menuOverlay) {
      menuOverlay.style.display = "none";
    }
  });

  document.querySelectorAll(".menu-item").forEach(item => {
    item.addEventListener("click", () => {
      menuOverlay.style.display = "none";
      // optional: navigate based on item.textContent
    });
  });
}

// TIMER - only run if timer elements exist
const timerDisplay = document.getElementById("timer-display");
const pauseBtn = document.getElementById("pause-btn");
const timerIcon = document.querySelector(".timer-icon");
const progressDot = document.querySelector(".progress-dot");

if (timerDisplay && pauseBtn && timerIcon) {
  // RestDB config  (ip-js-sq is the collection)
  const API_BASE = "https://drsadrabbit-d6de.restdb.io/rest";
  const API_KEY = "695ca6b37ba9c9d384784748";
  const TIMER_COLLECTION = "ip-js-sq";
  const USER_ID = "student-1";

  const timerSeconds = 25 * 60;
  let endTime = null;          // timestamp in ms
  let isPaused = false;
  let timerInterval = null;
  let timerDocId = null;
  let saveCounter = 0;

  function getRemainingSeconds() {
    if (!endTime) return timerSeconds;
    const diff = Math.floor((endTime - Date.now()) / 1000);
    return diff > 0 ? diff : 0;
  }

  function updateTimer() {
    const remaining = getRemainingSeconds();
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;

    if (progressDot) {
      const progressPercent = ((timerSeconds - remaining) / timerSeconds) * 100;
      progressDot.style.transform = `scale(${progressPercent / 100})`;
    }

    if (remaining <= 0 && !isPaused) {
      timerIcon.className = "timer-icon fa-solid fa-check";
      pauseBtn.title = "Complete!";
    }
  }

  // ---------- RestDB helpers ----------
  function saveTimerToServer() {
    const payload = {
      userId: USER_ID,
      endTime: endTime,       // number (Date.now())
      isPaused: isPaused
    };

    const headers = {
      "content-type": "application/json",
      "x-apikey": API_KEY,
      "cache-control": "no-cache"
    };

    const url = timerDocId
      ? `${API_BASE}/${TIMER_COLLECTION}/${timerDocId}`
      : `${API_BASE}/${TIMER_COLLECTION}`;
    const method = timerDocId ? "PATCH" : "POST";

    fetch(url, { method, headers, body: JSON.stringify(payload) })
      .then(res => res.json())
      .then(data => {
        if (!timerDocId && data && data._id) timerDocId = data._id;
      })
      .catch(err => console.error("Save timer error:", err));
  }

  function loadTimerFromServer(callback) {
    const headers = {
      "content-type": "application/json",
      "x-apikey": API_KEY,
      "cache-control": "no-cache"
    };
    const filter = encodeURIComponent(JSON.stringify({ userId: USER_ID }));
    const url = `${API_BASE}/${TIMER_COLLECTION}?q=${filter}`;

    fetch(url, { headers })
      .then(res => res.json())
      .then(docs => {
        if (Array.isArray(docs) && docs.length > 0) {
          const doc = docs[0];
          timerDocId = doc._id;
          // ensure endTime is a number
          const loadedEndTime = typeof doc.endTime === "string"
            ? parseInt(doc.endTime, 10)
            : doc.endTime;
          callback(loadedEndTime, doc.isPaused);
        } else {
          callback(null, null);
        }
      })
      .catch(err => {
        console.error("Load timer error:", err);
        callback(null, null);
      });
  }

  // ---------- timer loop ----------
  function startLoop() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      const remaining = getRemainingSeconds();

      if (!isPaused && remaining > 0) {
        updateTimer();

        saveCounter++;
        if (saveCounter >= 5) {
          saveCounter = 0;
          saveTimerToServer();
        }
      } else {
        updateTimer();
        if (remaining <= 0) clearInterval(timerInterval);
      }
    }, 1000);
  }

  pauseBtn.addEventListener("click", () => {
    const remaining = getRemainingSeconds();
    if (remaining <= 0) return;

    isPaused = !isPaused;

    if (isPaused) {
      timerIcon.className = "timer-icon fa-solid fa-play";
      pauseBtn.title = "Resume";
    } else {
      // resume: set new endTime based on remaining seconds
      endTime = Date.now() + remaining * 1000;
      timerIcon.className = "timer-icon fa-solid fa-pause";
      pauseBtn.title = "Pause";
    }

    saveTimerToServer();
  });

  // ---------- init from API ----------
  loadTimerFromServer((savedEndTime, savedPaused) => {
    if (savedEndTime) {
      endTime = savedEndTime;
      isPaused = !!savedPaused;
    } else {
      // start new timer
      endTime = Date.now() + timerSeconds * 1000;
      isPaused = false;
    }

    if (isPaused) {
      timerIcon.className = "timer-icon fa-solid fa-play";
      pauseBtn.title = "Resume";
    } else {
      timerIcon.className = "timer-icon fa-solid fa-pause";
      pauseBtn.title = "Pause";
    }

    updateTimer();
    startLoop();
  });
}

const seasonCards = document.querySelectorAll(".season-card");

if (seasonCards.length) {
  seasonCards.forEach(card => {
    card.addEventListener("click", () => {
      // remove selection from all
      seasonCards.forEach(c => c.classList.remove("selected"));
      // select this one
      card.classList.add("selected");

      // store choice for later pages
      const chosen = card.dataset.season;
      localStorage.setItem("chosenSeason", chosen);
      // could also send to your API here
    });
  });

  // restore previous choice if saved
  const savedSeason = localStorage.getItem("chosenSeason");
  if (savedSeason) {
    const savedCard = document.querySelector(
      `.season-card[data-season='${savedSeason}']`
    );
    if (savedCard) savedCard.classList.add("selected");
  }
}