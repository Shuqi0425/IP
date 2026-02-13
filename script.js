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
  // RestDB config
  const API_BASE = "https://drsadrabbit-d6de.restdb.io/rest";
  const API_KEY = "695ca6b37ba9c9d384784748";
  const TIMER_COLLECTION = "ip-js-sq";
  const USER_ID = "student-1";

  const timerSeconds = 25 * 60; // 1500
  let remaining = timerSeconds;
  let isPaused = false;
  let timerInterval = null;
  let timerDocId = null;
  let saveCounter = 0;

  function updateTimer() {
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

      savePlantToForest();
    }
  }

  // ---------- RestDB helpers ----------
  function saveTimerToServer() {
    const payload = {
      userId: USER_ID,
      remaining: remaining,
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
          const loadedRemaining = typeof doc.remaining === "string"
            ? parseInt(doc.remaining, 10)
            : doc.remaining;
          callback(loadedRemaining, doc.isPaused);
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
      if (!isPaused && remaining > 0) {
        remaining--;
        updateTimer();

        // save every 5 seconds
        saveCounter++;
        if (saveCounter >= 5) {
          saveCounter = 0;
          saveTimerToServer();
        }
      } else {
        updateTimer();
        if (remaining <= 0) {
          clearInterval(timerInterval);
          saveTimerToServer();
        }
      }
    }, 1000);
  }

  // ---------- pause / resume ----------
  pauseBtn.addEventListener("click", () => {
    if (remaining <= 0) return;

    isPaused = !isPaused;

    if (isPaused) {
      timerIcon.className = "timer-icon fa-solid fa-play";
      pauseBtn.title = "Resume";
    } else {
      timerIcon.className = "timer-icon fa-solid fa-pause";
      pauseBtn.title = "Pause";
    }

    saveTimerToServer();
  });

  // ---------- init from API ----------
  loadTimerFromServer((savedRemaining, savedPaused) => {
    if (savedRemaining !== null && savedRemaining > 0) {
      remaining = savedRemaining;
      isPaused = !!savedPaused;
    } else {
      remaining = timerSeconds;
      isPaused = false;
    }

    if (isPaused) {
      timerIcon.className = "timer-icon fa-solid fa-play";
      pauseBtn.title = "Resume";
    } else {
      timerIcon.className = "timer-icon fa-solid fa-pause";
      pauseBtn.title = "Pause";
    }

    // DEMO: skip button to jump to end
    const skipBtn = document.getElementById("demo-skip-btn");
  if (skipBtn) {
      skipBtn.addEventListener("click", () => {
          remaining = 0; // jump to end
          updateTimer(); 
          
          skipBtn.innerText = "Completed!";
          skipBtn.style.opacity = "0.5";
      });
  }

    updateTimer();
    startLoop();
  });
}

const seasonCards = document.querySelectorAll(".season-card");

if (seasonCards.length) {
  seasonCards.forEach(card => {
  card.addEventListener("click", () => {
    if (card.classList.contains("selected")) {
      const chosen = card.dataset.season;
      localStorage.setItem("chosenSeason", chosen);
      window.location.href = "focus_main.html";
    } else {
      seasonCards.forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
    }
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



// ------------------ Position selection page ------------------
const placeGrid = document.getElementById("place-grid");
const confirmBtn = document.getElementById("confirm-btn");
let selectedIndex = null;

if (placeGrid && confirmBtn) {
  confirmBtn.disabled = true;
  
  for (let i = 0; i <= 15; i++) {
    const slot = document.createElement("div");
    slot.className = "grid-slot";
    slot.dataset.place = i;
    
    slot.addEventListener("click", () => {
      // Deselect all slots
      document.querySelectorAll(".grid-slot").forEach(s => s.classList.remove("active"));
      slot.classList.add("active");
      
      selectedIndex = i;
      confirmBtn.disabled = false;
      confirmBtn.style.background = "#c6eb7c";
    });

    placeGrid.appendChild(slot);
  }

  confirmBtn.addEventListener("click", () => {
    if (selectedIndex !== null) {
      // save choice to localStorage
      localStorage.setItem("chosenPosition", selectedIndex);
      // transition to timer page
      window.location.href = "focus_timer.html";
    }
  });
}

function savePlantToForest() {
    // get data from localStorage
    const finalPosition = localStorage.getItem('chosenPosition'); // corresponds to grid index
    const finalSeason = localStorage.getItem('chosenSeason') || 'spring'; 
    const finalPlant = localStorage.getItem('chosenPlant') || 'tree';

    // save last planted for demo
    let plantedTrees = JSON.parse(localStorage.getItem('allPlantedTrees')) || [];
    plantedTrees.push({
        pos: finalPosition,
        season: finalSeason
    });
    localStorage.setItem('allPlantedTrees', JSON.stringify(plantedTrees));

    localStorage.setItem('lastPlantedSeason', finalSeason);

    const payload = {
        userId: "student-1",
        plantType: finalPlant,
        positionIndex: parseInt(finalPosition),
        season: finalSeason,
        timestamp: new Date().toISOString()
    };

    // API call to save the plant data
    fetch("https://drsadrabbit-d6de.restdb.io/rest/ip-js-forest", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "x-apikey": "695ca6b37ba9c9d384784748",
        },
        body: JSON.stringify(payload)
    }).then(() => {
        // transition to season page
        window.location.href = `${finalSeason}.html`; 
    }).catch(err => {
        console.error("API Error, but redirecting for demo...", err);
        window.location.href = `${finalSeason}.html`;
    });
}


// --- Focus Main page START Button ---
document.addEventListener("DOMContentLoaded", () => {
    const startFocusBtn = document.getElementById("start-focus-btn");

    if (startFocusBtn) {
        console.log("Found Start Focus Button!"); 
        startFocusBtn.addEventListener("click", (e) => {
            e.preventDefault(); 
            console.log("Redirecting to position page...");
            window.location.href = "position.html";
        });
    } else {
        console.warn("Start Focus Button NOT found on this page.");
    }
});

// --- Friend garden ---
const commonGrid = document.getElementById("common-grid");
const startCommonBtn = document.getElementById("start-common-focus");

let selectedCommonIndex = null; 

if (commonGrid) {
    // url friend name
    const params = new URLSearchParams(window.location.search);
    const friendName = params.get('friend') || "Friend";
    
    const gardenTitle = document.getElementById("garden-title");
    if (gardenTitle) {
        gardenTitle.innerText = `With ${friendName}`;
    }

    // 5x5 grid
    for (let i = 0; i < 25; i++) {
        const slot = document.createElement("div");
        slot.className = "grid-slot-small";
        slot.dataset.place = i; 
        
        slot.addEventListener("click", () => {
            // cancel before highlight
            document.querySelectorAll(".grid-slot-small").forEach(s => s.classList.remove("active"));
            // highlight selected
            slot.classList.add("active");
            

            selectedCommonIndex = i; 
            
            // activete start button
            if (startCommonBtn) {
                startCommonBtn.disabled = false;
                startCommonBtn.style.background = "#c8f7a0"; 
                startCommonBtn.style.color = "#40513B"; // 记得改文字颜色
            }
        });

        commonGrid.appendChild(slot);
    }

    // Start common focus button
    if (startCommonBtn) {
        startCommonBtn.disabled = true; // start disabled
        
        startCommonBtn.addEventListener("click", () => {
            if (selectedCommonIndex !== null) {
                const params = new URLSearchParams(window.location.search);
                const friendName = params.get('friend') || "Friend";
                
                console.log("Saving common position:", selectedCommonIndex);
                
                // save to localStorage
                localStorage.setItem("chosenPosition", selectedCommonIndex);
                
                // common timer page
                window.location.href = `common_timer.html?friend=${friendName}`;
            } else {
                alert("Please choose a spot in the garden first!");
            }
        });
    }
}

// --- Common Timer Page Init ---
document.addEventListener("DOMContentLoaded", () => {
    const friendLabel = document.getElementById("friend-name-label");
    const friendCircle = document.getElementById("friend-avatar-circle");

    if (friendLabel && friendCircle) {
        const params = new URLSearchParams(window.location.search);
        const friendName = params.get('friend') || "Friend";
        
        friendLabel.innerText = friendName;
        friendCircle.innerText = friendName.charAt(0).toUpperCase();
    }
});

// seed selection page (focus.html)
document.addEventListener("DOMContentLoaded", () => {
  const seedCard = document.querySelector(".seed-card");
  const arrows = document.querySelectorAll(".focus-main .fa-solid");
  const demoImages = [
    'image/seedblue.png', 
    'image/seedpink.png',
    'image/seedyellow.png'
  ];
  
  let currentIndex = 0;
  if (seedCard && arrows.length > 0) {
    arrows.forEach(arrow => {
      arrow.style.cursor = "pointer";
      arrow.addEventListener("click", () => {
        currentIndex = currentIndex === 0 ? 1 : currentIndex === 1 ? 2 : 0;
        
        // change pic
        seedCard.style.backgroundImage = `url('${demoImages[currentIndex]}')`;
      });
    });
  }
});