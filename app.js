let water = 0;
let waterPerClick = 1;
let waterPerSecond = 0;

const clickUpgradeGains = [1, 1, 2, 2, 2, 1];
const passiveUpgradeWpsTargets = [1, 2, 4, 6, 8, 10];

const clickUpgradeCosts = [50, 150, 300, 600, 1100, 1800];
const passiveUpgradeCosts = [100, 200, 400, 750, 1300, 2100];
const themeCosts = {
  dark: 500,
  matrix: 1000,
  holy: 1500
};

const dropletSpawnChance = 0.02;
const baseDropletBonusWater = 5;
let dropletBonusWater = baseDropletBonusWater;
const dropletLifetimeMs = 2200;
const dropletSpawnTapGap = 30;
const rockSpawnChance = 0.02;
const guaranteedDropletTap = 25;
const guaranteedRockTap = 50;
const rockSpawnTapGap = 15;

const difficultySettings = {
  easy: {
    label: "easy",
    multiplier: 0.75
  },
  normal: {
    label: "normal",
    multiplier: 1
  },
  hard: {
    label: "hard",
    multiplier: 1.25
  }
};

let currentDifficulty = "normal";
let shouldRestartOnDifficultySelect = false;
let activeRock = null;
let activeRockClicksLeft = 0;
let hasSeenDropletTutorial = false;
let hasSeenRockTutorial = false;
let tapCount = 0;
let lastDropletSpawnTap = 0;
let lastRockSpawnTap = -rockSpawnTapGap;
let resumeFirstDropletFade = null;
let isSfxMuted = false;

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
const muteButton = document.getElementById("muteButton");
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
const difficultyModal = document.getElementById("difficultyModal");
const difficultyTitle = document.getElementById("difficultyTitle");
const difficultyEasyButton = document.getElementById("difficultyEasyButton");
const difficultyNormalButton = document.getElementById("difficultyNormalButton");
const difficultyHardButton = document.getElementById("difficultyHardButton");
const restartConfirmModal = document.getElementById("restartConfirmModal");
const restartCancelButton = document.getElementById("restartCancelButton");
const restartConfirmButton = document.getElementById("restartConfirmButton");
const dropletTutorialModal = document.getElementById("dropletTutorialModal");
const dropletTutorialButton = document.getElementById("dropletTutorialButton");
const rockTutorialModal = document.getElementById("rockTutorialModal");
const rockTutorialButton = document.getElementById("rockTutorialButton");
const waterDropSound = new Audio("freesound-community-water-drop-89799_nx8Aa4M0.mp3");
waterDropSound.preload = "auto";

function updateMuteButtonLabel() {
  muteButton.textContent = isSfxMuted ? "SFX OFF" : "SFX ON";
  muteButton.setAttribute("aria-pressed", String(isSfxMuted));
}

function playWaterCollectionSound() {
  if (isSfxMuted) {
    return;
  }

  // Clone allows overlap when many water gains happen close together.
  const soundInstance = waterDropSound.cloneNode();
  soundInstance.volume = 0.35;
  soundInstance.play().catch(function ignoreAutoplayError() {
    return;
  });
}

function getAdjustedCost(baseCost) {
  const multiplier = difficultySettings[currentDifficulty].multiplier;
  return Math.max(1, Math.round(baseCost * multiplier));
}

function setDifficultyModalTitle() {
  if (shouldRestartOnDifficultySelect) {
    difficultyTitle.textContent = "restart and choose difficulty";
    return;
  }

  difficultyTitle.textContent = "choose difficulty";
}

function openDifficultyModal(restartAfterPick) {
  shouldRestartOnDifficultySelect = restartAfterPick;
  setDifficultyModalTitle();
  difficultyModal.classList.add("open");
  difficultyModal.setAttribute("aria-hidden", "false");
}

function closeDifficultyModal() {
  difficultyModal.classList.remove("open");
  difficultyModal.setAttribute("aria-hidden", "true");
}

function openRestartConfirmModal() {
  restartConfirmModal.classList.add("open");
  restartConfirmModal.setAttribute("aria-hidden", "false");
}

function closeRestartConfirmModal() {
  restartConfirmModal.classList.remove("open");
  restartConfirmModal.setAttribute("aria-hidden", "true");
}

function showDropletTutorial() {
  dropletTutorialModal.classList.add("open");
  dropletTutorialModal.setAttribute("aria-hidden", "false");
}

function closeDropletTutorial() {
  dropletTutorialModal.classList.remove("open");
  dropletTutorialModal.setAttribute("aria-hidden", "true");

  if (resumeFirstDropletFade) {
    resumeFirstDropletFade();
    resumeFirstDropletFade = null;
  }
}

function showRockTutorial() {
  rockTutorialModal.classList.add("open");
  rockTutorialModal.setAttribute("aria-hidden", "false");
}

function closeRockTutorial() {
  rockTutorialModal.classList.remove("open");
  rockTutorialModal.setAttribute("aria-hidden", "true");
}

function chooseDifficulty(difficultyName) {
  currentDifficulty = difficultyName;
  const shouldRestart = shouldRestartOnDifficultySelect;
  shouldRestartOnDifficultySelect = false;

  closeDifficultyModal();

  if (shouldRestart) {
    restartAllProgress();
    return;
  }

  updateCounter();
}

function updateCounter() {
  waterCount.textContent = String(water);
  multiplierCount.textContent = String(waterPerSecond);
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

function spawnBonusDroplet() {
  lastDropletSpawnTap = tapCount;

  const isFirstDropletTutorial = !hasSeenDropletTutorial;
  if (isFirstDropletTutorial) {
    hasSeenDropletTutorial = true;
    showDropletTutorial();
  }

  const droplet = document.createElement("button");
  droplet.type = "button";
  droplet.classList.add("bonusDroplet");
  droplet.setAttribute("aria-label", `Collect bonus droplet for +${dropletBonusWater} water`);

  const crackRect = crack.getBoundingClientRect();
  const containerRect = gameContainer.getBoundingClientRect();
  const centerX = crackRect.left - containerRect.left + crackRect.width / 2;
  const centerY = crackRect.top - containerRect.top + crackRect.height / 2;
  const randomAngle = Math.random() * Math.PI * 2;
  const randomDistance = 48 + Math.random() * 72;
  const x = centerX + Math.cos(randomAngle) * randomDistance;
  const y = centerY + Math.sin(randomAngle) * randomDistance;

  droplet.style.left = `${x}px`;
  droplet.style.top = `${y}px`;
  gameContainer.appendChild(droplet);

  let fadeTimeoutId = null;

  function removeDroplet() {
    if (!droplet.isConnected) {
      return;
    }

    droplet.remove();
  }

  function startDropletFadeTimer() {
    if (fadeTimeoutId !== null || !droplet.isConnected) {
      return;
    }

    fadeTimeoutId = setTimeout(function fadeAndRemoveDroplet() {
      droplet.classList.add("expiring");
      droplet.addEventListener("animationend", removeDroplet, { once: true });
    }, dropletLifetimeMs);
  }

  droplet.addEventListener("click", function collectDroplet() {
    if (!droplet.isConnected) {
      return;
    }

    if (resumeFirstDropletFade === startDropletFadeTimer) {
      resumeFirstDropletFade = null;
    }

    if (fadeTimeoutId !== null) {
      clearTimeout(fadeTimeoutId);
    }

    water += dropletBonusWater;
    playWaterCollectionSound();
    updateCounter();
    createFloatingText(dropletBonusWater);
    removeDroplet();
  });

  if (isFirstDropletTutorial) {
    resumeFirstDropletFade = startDropletFadeTimer;
    return;
  }

  startDropletFadeTimer();
}

function updateRockLabel() {
  if (!activeRock) {
    return;
  }

  activeRock.textContent = String(activeRockClicksLeft);
}

function breakRockObstacle() {
  if (activeRock) {
    activeRock.remove();
  }

  activeRock = null;
  activeRockClicksLeft = 0;
}

function spawnRockObstacle() {
  if (!hasSeenRockTutorial) {
    hasSeenRockTutorial = true;
    showRockTutorial();
  }

  const rock = document.createElement("button");
  rock.type = "button";
  rock.classList.add("rockObstacle");
  rock.setAttribute("aria-label", "Break rock obstacle");

  const crackRect = crack.getBoundingClientRect();
  const containerRect = gameContainer.getBoundingClientRect();
  const centerX = crackRect.left - containerRect.left + crackRect.width / 2;
  const centerY = crackRect.top - containerRect.top + crackRect.height / 2;

  rock.style.left = `${centerX}px`;
  rock.style.top = `${centerY + 2}px`;
  gameContainer.appendChild(rock);

  lastRockSpawnTap = tapCount;
  activeRock = rock;
  activeRockClicksLeft = Math.min(25, Math.max(1, Math.ceil(water / 6)));
  updateRockLabel();

  rock.addEventListener("click", function hitRock() {
    if (!activeRock) {
      return;
    }

    activeRockClicksLeft -= 1;
    if (activeRockClicksLeft <= 0) {
      breakRockObstacle();
      return;
    }

    updateRockLabel();
  });
}

function clearTransientObjects() {
  const droplets = gameContainer.querySelectorAll(".bonusDroplet");
  droplets.forEach(function removeDroplet(droplet) {
    droplet.remove();
  });

  breakRockObstacle();
}

function tapCrack() {
  if (activeRock) {
    return;
  }

  tapCount += 1;

  water += waterPerClick;
  playWaterCollectionSound();
  updateCounter();
  createFloatingText(waterPerClick);

  const canSpawnDroplet = tapCount >= guaranteedDropletTap;
  const guaranteedDropletNow = tapCount === guaranteedDropletTap;
  const hasDropletTapGap = tapCount - lastDropletSpawnTap >= dropletSpawnTapGap;
  if (
    canSpawnDroplet &&
    (guaranteedDropletNow || hasDropletTapGap || Math.random() < dropletSpawnChance)
  ) {
    spawnBonusDroplet();
  }

  const canSpawnRock = tapCount >= guaranteedRockTap;
  const guaranteedRockNow = tapCount === guaranteedRockTap;
  const hasRockTapGap = tapCount - lastRockSpawnTap >= rockSpawnTapGap;
  if (
    canSpawnRock &&
    hasRockTapGap &&
    (guaranteedRockNow || Math.random() < rockSpawnChance)
  ) {
    spawnRockObstacle();
  }

  crack.classList.add("tapped");
  setTimeout(function removeTapClass() {
    crack.classList.remove("tapped");
  }, 90);
}

function addDevWater() {
  water += 250;
  playWaterCollectionSound();
  updateCounter();
  createFloatingText(250);
}

function restartAllProgress() {
  tapCount = 0;
  lastDropletSpawnTap = 0;
  lastRockSpawnTap = -rockSpawnTapGap;
  water = 0;
  waterPerClick = 1;
  waterPerSecond = 0;
  dropletBonusWater = baseDropletBonusWater;
  clickUpgradeLevel = 0;
  passiveUpgradeLevel = 0;
  hasSeenDropletTutorial = false;
  hasSeenRockTutorial = false;
  resumeFirstDropletFade = null;
  unlockedThemes.dark = false;
  unlockedThemes.matrix = false;
  unlockedThemes.holy = false;
  endgamePromptShown = false;
  endgameModal.classList.remove("open");
  endgameModal.setAttribute("aria-hidden", "true");
  closeRestartConfirmModal();
  closeDifficultyModal();
  closeDropletTutorial();
  closeRockTutorial();
  clearTransientObjects();
  document.body.classList.remove("theme-dark", "theme-matrix", "theme-holy");
  updateCounter();
}

function updateUpgradeMenu() {
  function setUpgradeButtonContent(buttonElement, itemLabel, rightValue) {
    buttonElement.innerHTML = `<span class="shopLabel">${itemLabel}</span><span class="shopValue">${rightValue}</span>`;
  }

  const maxWaterPerClick = 1 + clickUpgradeGains.reduce(function sum(total, gain) {
    return total + gain;
  }, 0);

  if (clickUpgradeLevel >= clickUpgradeCosts.length) {
    setUpgradeButtonContent(buyClickUpgradeButton, `+${maxWaterPerClick} water per click`, "maxed");
    buyClickUpgradeButton.disabled = true;
  } else {
    const clickCost = getAdjustedCost(clickUpgradeCosts[clickUpgradeLevel]);
    const clickGain = clickUpgradeGains[clickUpgradeLevel];
    setUpgradeButtonContent(
      buyClickUpgradeButton,
      `+${clickGain} water per click`,
      String(clickCost)
    );
    buyClickUpgradeButton.disabled = water < clickCost;
  }

  if (passiveUpgradeLevel >= passiveUpgradeCosts.length) {
    setUpgradeButtonContent(
      buyPassiveUpgradeButton,
      `passive +${waterPerSecond} water / sec`,
      "maxed"
    );
    buyPassiveUpgradeButton.disabled = true;
  } else {
    const passiveCost = getAdjustedCost(passiveUpgradeCosts[passiveUpgradeLevel]);
    const passiveTargetWps = passiveUpgradeWpsTargets[passiveUpgradeLevel];
    setUpgradeButtonContent(
      buyPassiveUpgradeButton,
      `passive +${passiveTargetWps} water / sec`,
      String(passiveCost)
    );
    buyPassiveUpgradeButton.disabled = water < passiveCost;
  }
}

function updateShopMenu() {
  function setShopButtonContent(buttonElement, itemLabel, rightValue) {
    buttonElement.innerHTML = `<span class="shopLabel">${itemLabel}</span><span class="shopValue">${rightValue}</span>`;
  }

  if (unlockedThemes.dark) {
    setShopButtonContent(buyDarkThemeButton, "dark", "apply");
    buyDarkThemeButton.disabled = false;
  } else {
    const darkThemeCost = getAdjustedCost(themeCosts.dark);
    setShopButtonContent(buyDarkThemeButton, "dark", String(darkThemeCost));
    buyDarkThemeButton.disabled = water < darkThemeCost;
  }

  if (unlockedThemes.matrix) {
    setShopButtonContent(buyMatrixThemeButton, "matrix", "apply");
    buyMatrixThemeButton.disabled = false;
  } else {
    const matrixThemeCost = getAdjustedCost(themeCosts.matrix);
    setShopButtonContent(buyMatrixThemeButton, "matrix", String(matrixThemeCost));
    buyMatrixThemeButton.disabled = water < matrixThemeCost;
  }

  if (unlockedThemes.holy) {
    setShopButtonContent(buyHolyThemeButton, "holy", "apply");
    buyHolyThemeButton.disabled = false;
  } else {
    const holyThemeCost = getAdjustedCost(themeCosts.holy);
    setShopButtonContent(buyHolyThemeButton, "holy", String(holyThemeCost));
    buyHolyThemeButton.disabled = water < holyThemeCost;
  }
}

function applyTheme(themeName) {
  document.body.classList.remove("theme-dark", "theme-matrix", "theme-holy");
  document.body.classList.add(`theme-${themeName}`);
}

function buyOrApplyTheme(themeName) {
  if (!unlockedThemes[themeName]) {
    const cost = getAdjustedCost(themeCosts[themeName]);
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

  const cost = getAdjustedCost(clickUpgradeCosts[clickUpgradeLevel]);
  if (water < cost) {
    return;
  }

  water -= cost;
  const clickGain = clickUpgradeGains[clickUpgradeLevel];
  clickUpgradeLevel += 1;
  waterPerClick += clickGain;
  dropletBonusWater += 5;
  updateCounter();
  updateUpgradeMenu();
}

function buyPassiveUpgrade() {
  if (passiveUpgradeLevel >= passiveUpgradeCosts.length) {
    return;
  }

  const cost = getAdjustedCost(passiveUpgradeCosts[passiveUpgradeLevel]);
  if (water < cost) {
    return;
  }

  water -= cost;
  const passiveTargetWps = passiveUpgradeWpsTargets[passiveUpgradeLevel];
  passiveUpgradeLevel += 1;
  waterPerSecond = passiveTargetWps;
  updateCounter();
  updateUpgradeMenu();
}

crack.addEventListener("click", tapCrack);

muteButton.addEventListener("click", function toggleSfxMute() {
  isSfxMuted = !isSfxMuted;
  updateMuteButtonLabel();
});

crack.addEventListener("keydown", function handleCrackKeydown(event) {
  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    tapCrack();
  }
});

resetButton.addEventListener("click", function openRestartConfirmation() {
  openRestartConfirmModal();
});

restartCancelButton.addEventListener("click", closeRestartConfirmModal);
restartConfirmButton.addEventListener("click", function chooseDifficultyOnReset() {
  closeRestartConfirmModal();
  upgradesMenu.classList.remove("open");
  upgradesMenu.setAttribute("aria-hidden", "true");
  shopMenu.classList.remove("open");
  shopMenu.setAttribute("aria-hidden", "true");
  endgameModal.classList.remove("open");
  endgameModal.setAttribute("aria-hidden", "true");
  openDifficultyModal(true);
});
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
difficultyEasyButton.addEventListener("click", function pickEasyDifficulty() {
  chooseDifficulty("easy");
});
difficultyNormalButton.addEventListener("click", function pickNormalDifficulty() {
  chooseDifficulty("normal");
});
difficultyHardButton.addEventListener("click", function pickHardDifficulty() {
  chooseDifficulty("hard");
});
dropletTutorialButton.addEventListener("click", closeDropletTutorial);
rockTutorialButton.addEventListener("click", closeRockTutorial);

devButton.addEventListener("click", addDevWater);
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
  if (waterPerSecond === 0) {
    return;
  }

  water += waterPerSecond;
  playWaterCollectionSound();
  updateCounter();
  createFloatingText(waterPerSecond);
}, 1000);

window.addEventListener("resize", function handleResize() {
  if (upgradesMenu.classList.contains("open")) {
    positionMenu(upgradesMenu, upgradesButton, "left");
  }

  if (shopMenu.classList.contains("open")) {
    positionMenu(shopMenu, shopButton, "right");
  }
});

updateCounter();
updateMuteButtonLabel();
openDifficultyModal(false);
