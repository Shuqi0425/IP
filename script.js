const menuBtn = document.getElementById("menu-btn");
const menuOverlay = document.getElementById("menu-overlay");

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
  });
});