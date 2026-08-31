const grid = document.getElementById("gameContainer");
const startBtn = document.getElementById("startBtn");
const levelDisplay = document.getElementById("levelDisplay");

const TOTAL_BUTTONS = 16;
const CORRECT_ARRAY = [1, 2, 4, 7, 8, 11, 13, 14];
const INCORRECT_ARRAY = [0, 3, 5, 6, 9, 10, 12, 15];

const DURATIONS = {
	CORRECT: 600,
	BLINK_ON: 200,
	INTERVAL: 400,
	BLINK_COUNT: 2,
};

let buttons = [];
let sequence = [];
let playerIndex = 0;

let level = 1;
let flashCount = 4;
let canClick = false;

let reStartFlg = false;

function setGridEnabled(enabled) {
	if (enabled) {
		grid.classList.remove("inactive");
	} else {
		grid.classList.add("inactive");
	}
}

function createButtons() {
	grid.innerHTML = "";
	buttons = [];

	for (let i = 0; i < TOTAL_BUTTONS; i++) {
		const btn = document.createElement("button");
		btn.classList.add("pad");
		// スマホでのボタン長押しによるシステムメニュー表示（コピーなど）を防止
		btn.addEventListener("contextmenu", (e) => e.preventDefault());

		btn.addEventListener("click", () => handleClick(i));

		grid.appendChild(btn);
		buttons.push(btn);
	}
}

function updateLevel() {
	levelDisplay.textContent = `LEVEL ${level}`;
}

function flash(index) {
	buttons[index].classList.add("active");

	setTimeout(() => {
		buttons[index].classList.remove("active");
	}, 450);
}

function playSequence() {
	canClick = false;
	setGridEnabled(false);

	playerIndex = 0;

	let i = 0;

	function stepFlash() {
		flash(sequence[i]);
		i++;

		if (i < sequence.length) {
			setTimeout(stepFlash, 750);
		} else {
			setTimeout(() => {
				canClick = true;
				setGridEnabled(true);
			}, 300);
		}
	}

	setTimeout(stepFlash, 500);
}

function toggleClass(indices, className, isOn) {
	indices.forEach(idx => {
		buttons[idx].classList.toggle(className, isOn);
	});
}

function correctAnimation() {
	toggleClass(CORRECT_ARRAY, "correct", true);

	// ▼ バイブ（軽め）
	if (navigator.vibrate) navigator.vibrate(50);

	setTimeout(() => {
		toggleClass(CORRECT_ARRAY, "correct", false);
	}, DURATIONS.CORRECT);
}

function incorrectAnimation() {
	const { BLINK_COUNT, INTERVAL, BLINK_ON } = DURATIONS;

	// ▼ バイブ（強め）
	if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

	for (let step = 0; step < BLINK_COUNT; step++) {
		const base = step * INTERVAL;

		setTimeout(() => {
			toggleClass(INCORRECT_ARRAY, "incorrect", true);
		}, base);

		setTimeout(() => {
			toggleClass(INCORRECT_ARRAY, "incorrect", false);
		}, base + BLINK_ON);
	}

	setTimeout(() => {
		toggleClass(INCORRECT_ARRAY, "incorrect", true);
	}, BLINK_COUNT * INTERVAL);
}

function addNewStep() {
	let rand = Math.floor(Math.random() * TOTAL_BUTTONS);
	sequence.push(rand);
}

function startGame() {
	createButtons();
	startBtn.disabled = true;
	startBtn.classList.add("dissabled");

	if (reStartFlg) {
		startBtn.textContent = "START";
		setTimeout(() => {
			toggleClass(INCORRECT_ARRAY, "incorrect", false);
		});
	}

	level = 1;
	sequence = [];
	flashCount = 4;

	updateLevel();

	for (let i = 0; i < flashCount; i++) {
		addNewStep();
	}

	playSequence();
}

function nextLevel() {
	level++;
	updateLevel();

	sequence = [];
	flashCount++;

	for (let i = 0; i < flashCount; i++) {
		addNewStep();
	}

	playSequence();
}

function handleClick(index) {
	if (!canClick) return;

	flash(index);

	if (index === sequence[playerIndex]) {
		playerIndex++;

		if (playerIndex === sequence.length) {
			correctAnimation();
			setTimeout(nextLevel, 900);
		}
	} else {
		incorrectAnimation();
		gameOver();
	}
}

function gameOver() {
	canClick = false;
	reStartFlg = true;

	levelDisplay.textContent = `GAME OVER (LEVEL ${level})`;

	startBtn.disabled = false;
	startBtn.textContent = "RESTART";
	startBtn.classList.remove("dissabled");
}

startBtn.addEventListener("click", startGame);

// スマホで画面全体のダブルタップズームや不意なスクロールを防ぐ
document.addEventListener('touchstart', (e) => {
	if (e.touches.length > 1) {
		e.preventDefault(); // 2本指でのピンチ操作を禁止
	}
}, { passive: false });



updateLevel();