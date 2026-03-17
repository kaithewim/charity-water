let water = 0;
let waterPerClick = 1;
let waterPerHalfSecond = 0;

const tierBonusValues = [1, 1, 2];

const clickUpgradeCosts = [50, 150, 300];
const passiveUpgradeCosts = [100, 200, 400];
const themeCosts = {
  dark: 500,
  matrix: 1000,
  holy: 1500
};

let clickUpgradeLevel = 0;
let passiveUpgradeLevel = 0;
let endgamePromptShown = false;
const unlockedThemes = {
  dark: false,
  matrix: false,
  holy: false
};

const gameContainer = document.getElementById("gameContainer");
const waterCount = document.getElementById("waterCount");
const multiplierCount = document.getElementById("multiplierCount");
const crack = document.getElementById("crack");
const devButton = document.getElementById("devButton");
const resetButton = document.getElementById("resetButton");
const upgradesButton = document.getElementById("upgradesButton");
const upgradesMenu = document.getElementById("upgradesMenu");
const buyClickUpgradeButton = document.getElementById("buyClickUpgradeButton");
const buyPassiveUpgradeButton = document.getElementById("buyPassiveUpgradeButton");
const shopButton = document.getElementById("shopButton");
const donateButton = document.getElementById("donateButton");
const shopMenu = document.getElementById("shopMenu");
const buyDarkThemeButton = document.getElementById("buyDarkThemeButton");
const buyMatrixThemeButton = document.getElementById("buyMatrixThemeButton");
const buyHolyThemeButton = document.getElementById("buyHolyThemeButton");
const endgameModal = document.getElementById("endgameModal");
const continuePlayingButton = document.getElementById("continuePlayingButton");
const restartGameButton = document.getElementById("restartGameButton");

function updateCounter() {
  waterCount.textContent = String(water);
  multiplierCount.textContent = String(waterPerHalfSecond * 2);
  updateUpgradeMenu();
  updateShopMenu();
  checkCompletionState();
}

function isEverythingMaxedAndUnlocked() {
  return (
    clickUpgradeLevel >= clickUpgradeCosts.length &&
    passiveUpgradeLevel >= passiveUpgradeCosts.length &&
    unlockedThemes.dark &&
    unlockedThemes.matrix &&
    unlockedThemes.holy
  );
}

function checkCompletionState() {
  if (endgamePromptShown || !isEverythingMaxedAndUnlocked()) {
    return;
  }

  endgamePromptShown = true;
  endgameModal.classList.add("open");
  endgameModal.setAttribute("aria-hidden", "false");
}

function positionMenu(menuElement, triggerButton, horizontalAnchor) {
  const buttonRect = triggerButton.getBoundingClientRect();
  const menuRect = menuElement.getBoundingClientRect();

  let anchorX = buttonRect.left + buttonRect.width / 2;
  if (horizontalAnchor === "left") {
    anchorX = buttonRect.left;
  }
  if (horizontalAnchor === "right") {
    anchorX = buttonRect.right;
  }

  const targetLeft = anchorX - menuRect.width / 2;
  const clampedLeft = Math.min(Math.max(8, targetLeft), window.innerWidth - menuRect.width - 8);
  const top = buttonRect.top - menuRect.height - 12;

  menuElement.style.left = `${clampedLeft}px`;
  menuElement.style.top = `${Math.max(72, top)}px`;
}

function createFloatingText(amount) {
  const floatingText = document.createElement("div");
  floatingText.classList.add("floatingText");
  floatingText.textContent = `+${amount}`;

  const crackRect = crack.getBoundingClientRect();
  const containerRect = gameContainer.getBoundingClientRect();

  const centerX = crackRect.left - containerRect.left + crackRect.width / 2;
  const centerY = crackRect.top - containerRect.top + crackRect.height / 2;
  const radius = Math.max(crackRect.width * 1.8, 130);
  const randomAngle = Math.PI + Math.random() * Math.PI;
  const randomDistance = Math.random() * radius;
  const offsetX = Math.cos(randomAngle) * randomDistance;
  const offsetY = Math.sin(randomAngle) * randomDistance;

  floatingText.style.left = `${centerX + offsetX}px`;
  floatingText.style.top = `${centerY + offsetY}px`;

  gameContainer.appendChild(floatingText);

  floatingText.addEventListener("animationend", function handleAnimationEnd() {
    floatingText.remove();
  });
}

function tapCrack() {
  water += waterPerClick;
  updateCounter();
  createFloatingText(waterPerClick);

  crack.classList.add("tapped");
  setTimeout(function removeTapClass() {
    crack.classList.remove("tapped");
  }, 90);
}

function resetGame() {
  water = 0;
  updateCounter();
}

function addDevWater() {
  water += 250;
  updateCounter();
}

function restartAllProgress() {
  water = 0;
  waterPerClick = 1;
  waterPerHalfSecond = 0;
  clickUpgradeLevel = 0;
  passiveUpgradeLevel = 0;
  unlockedThemes.dark = false;
  unlockedThemes.matrix = false;
  unlockedThemes.holy = false;
  endgamePromptShown = false;
  endgameModal.classList.remove("open");
  endgameModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("theme-dark", "theme-matrix", "theme-holy");
  updateCounter();
}

function updateUpgradeMenu() {
  if (clickUpgradeLevel >= clickUpgradeCosts.length) {
    buyClickUpgradeButton.textContent = "+4 water per click (maxed)";
    buyClickUpgradeButton.disabled = true;
  } else {
    const clickCost = clickUpgradeCosts[clickUpgradeLevel];
    const clickGain = tierBonusValues[clickUpgradeLevel];
    buyClickUpgradeButton.textContent = `+${clickGain} water per click - cost ${clickCost} (tier ${clickUpgradeLevel + 1}/3)`;
    buyClickUpgradeButton.disabled = water < clickCost;
  }

  if (passiveUpgradeLevel >= passiveUpgradeCosts.length) {
    buyPassiveUpgradeButton.textContent = `passive collection +${waterPerHalfSecond * 2} water / sec (maxed)`;
    buyPassiveUpgradeButton.disabled = true;
  } else {
    const passiveCost = passiveUpgradeCosts[passiveUpgradeLevel];
    const passiveGain = tierBonusValues[passiveUpgradeLevel];
    buyPassiveUpgradeButton.textContent = `passive collection +${passiveGain * 2} water / sec - cost ${passiveCost} (tier ${passiveUpgradeLevel + 1}/${passiveUpgradeCosts.length})`;
    buyPassiveUpgradeButton.disabled = water < passiveCost;
  }
}

function updateShopMenu() {
  if (unlockedThemes.dark) {
    buyDarkThemeButton.textContent = "dark - apply";
    buyDarkThemeButton.disabled = false;
  } else {
    buyDarkThemeButton.textContent = `dark - cost ${themeCosts.dark}`;
    buyDarkThemeButton.disabled = water < themeCosts.dark;
  }

  if (unlockedThemes.matrix) {
    buyMatrixThemeButton.textContent = "matrix - apply";
    buyMatrixThemeButton.disabled = false;
  } else {
    buyMatrixThemeButton.textContent = `matrix - cost ${themeCosts.matrix}`;
    buyMatrixThemeButton.disabled = water < themeCosts.matrix;
  }

  if (unlockedThemes.holy) {
    buyHolyThemeButton.textContent = "holy - apply";
    buyHolyThemeButton.disabled = false;
  } else {
    buyHolyThemeButton.textContent = `holy - cost ${themeCosts.holy}`;
    buyHolyThemeButton.disabled = water < themeCosts.holy;
  }
}

function applyTheme(themeName) {
  document.body.classList.remove("theme-dark", "theme-matrix", "theme-holy");
  document.body.classList.add(`theme-${themeName}`);
}

function buyOrApplyTheme(themeName) {
  if (!unlockedThemes[themeName]) {
    const cost = themeCosts[themeName];
    if (water < cost) {
      return;
    }

    water -= cost;
    unlockedThemes[themeName] = true;
  }

  applyTheme(themeName);
  updateCounter();
}

function buyClickUpgrade() {
  if (clickUpgradeLevel >= clickUpgradeCosts.length) {
    return;
  }

  const cost = clickUpgradeCosts[clickUpgradeLevel];
  if (water < cost) {
    return;
  }

  water -= cost;
  const clickGain = tierBonusValues[clickUpgradeLevel];
  clickUpgradeLevel += 1;
  waterPerClick += clickGain;
  updateCounter();
  updateUpgradeMenu();
}

function buyPassiveUpgrade() {
  if (passiveUpgradeLevel >= passiveUpgradeCosts.length) {
    return;
  }

  const cost = passiveUpgradeCosts[passiveUpgradeLevel];
  if (water < cost) {
    return;
  }

  water -= cost;
  const passiveGain = tierBonusValues[passiveUpgradeLevel];
  passiveUpgradeLevel += 1;
  waterPerHalfSecond += passiveGain;
  updateCounter();
  updateUpgradeMenu();
}

crack.addEventListener("click", tapCrack);

crack.addEventListener("keydown", function handleCrackKeydown(event) {
  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    tapCrack();
  }
});

resetButton.addEventListener("click", resetGame);
devButton.addEventListener("click", addDevWater);

upgradesButton.addEventListener("click", function toggleUpgradesMenu() {
  shopMenu.classList.remove("open");
  shopMenu.setAttribute("aria-hidden", "true");

  const isOpen = upgradesMenu.classList.toggle("open");
  upgradesMenu.setAttribute("aria-hidden", String(!isOpen));

  if (isOpen) {
    positionMenu(upgradesMenu, upgradesButton, "left");
  }
});

shopButton.addEventListener("click", function toggleShopMenu() {
  upgradesMenu.classList.remove("open");
  upgradesMenu.setAttribute("aria-hidden", "true");

  const isOpen = shopMenu.classList.toggle("open");
  shopMenu.setAttribute("aria-hidden", String(!isOpen));

  if (isOpen) {
    positionMenu(shopMenu, shopButton, "right");
  }
});

donateButton.addEventListener("click", function goToDonatePage() {
  window.open("https://www.charitywater.org/donate", "_blank", "noopener,noreferrer");
});

continuePlayingButton.addEventListener("click", function continuePlaying() {
  endgameModal.classList.remove("open");
  endgameModal.setAttribute("aria-hidden", "true");
});

restartGameButton.addEventListener("click", restartAllProgress);

buyClickUpgradeButton.addEventListener("click", buyClickUpgrade);
buyPassiveUpgradeButton.addEventListener("click", buyPassiveUpgrade);
buyDarkThemeButton.addEventListener("click", function buyDarkTheme() {
  buyOrApplyTheme("dark");
});
buyMatrixThemeButton.addEventListener("click", function buyMatrixTheme() {
  buyOrApplyTheme("matrix");
});
buyHolyThemeButton.addEventListener("click", function buyHolyTheme() {
  buyOrApplyTheme("holy");
});

setInterval(function passiveIncomeTick() {
  if (waterPerHalfSecond === 0) {
    return;
  }

  water += waterPerHalfSecond;
  updateCounter();
  createFloatingText(waterPerHalfSecond);
}, 500);

window.addEventListener("resize", function handleResize() {
  if (upgradesMenu.classList.contains("open")) {
    positionMenu(upgradesMenu, upgradesButton, "left");
  }

  if (shopMenu.classList.contains("open")) {
    positionMenu(shopMenu, shopButton, "right");
  }
});

updateCounter();
