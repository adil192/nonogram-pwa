import {Grid} from "./lib/Grid";

let main: HTMLElement;
let iconLinks: HTMLDivElement;

let refreshBtn: HTMLButtonElement;
let difficultyToggle: HTMLInputElement;
let crossToggle: HTMLButtonElement;
let binBtn: HTMLButtonElement;
let newGameBtn: HTMLButtonElement;

let grid: Grid = null;

const GRID_SIZE = 10;


window.addEventListener("load", function() {
	// set up PWA service worker
	if('serviceWorker' in navigator){
		navigator.serviceWorker.register("sw.js")
			.then(reg => console.log('service worker registered:', reg))
			.catch(err => console.log('service worker not registered', err));
	}

	main = document.querySelector("main");
	iconLinks = document.querySelector(".icon-links");

	refreshBtn = document.querySelector("#refreshBtn");
	difficultyToggle = document.querySelector("#difficultyToggle");
	crossToggle = document.querySelector("#crossToggle");
	binBtn = document.querySelector("#binBtn");
	newGameBtn = document.querySelector("#newGameBtn");
	Grid.wonModalBtn = newGameBtn;

	init();

	crossToggle.addEventListener("click", function () {
		grid.isCross = !grid.isCross;

		if (grid.isCross) crossToggle.classList.add("is-cross");
		else crossToggle.classList.remove("is-cross");
	})
	binBtn.addEventListener("click", function () {
		grid.Clear();
	})
	refreshBtn.addEventListener("click", newGame)
	newGameBtn.addEventListener("click", newGame)
	
	difficultyToggle.valueAsNumber = Grid.difficulty * 11;
	difficultyToggle.addEventListener("change", function () {
		let inputValue = difficultyToggle.valueAsNumber;
		inputValue = Math.min(10, Math.max(1, inputValue));
		if (inputValue != difficultyToggle.valueAsNumber) {
			difficultyToggle.valueAsNumber = inputValue;
		}

		Grid.difficulty = difficultyToggle.valueAsNumber / 11;

		grid.Clear();
		grid.Destroy();
		grid = new Grid(main, GRID_SIZE);
	})

	iconLinks.style.display = (isAndroid() && !isStandalone()) ? "block" : "none";
});

function init() {
	if (grid != null) grid.Destroy();

	grid = new Grid(main, GRID_SIZE);
}

function newGame() {
	Grid.ClearSeed();
	grid.Clear();
	grid.Destroy();
	grid.hideWonModal();
	grid = new Grid(main, GRID_SIZE);
}

function isStandalone(): boolean {
	if (document.referrer.includes('android-app://')) return true;
	// @ts-ignore
	if (window.navigator.standalone) return true; // ios fallback

	if (location.hash.indexOf("pwa-enabled") !== -1) return true;

	if (window.matchMedia) return ["fullscreen", "standalone", "minimal-ui"].some(
		(displayMode) => window.matchMedia('(display-mode: ' + displayMode + ')').matches
	);

	return false;
}
function isAndroid(): boolean {
	return navigator.userAgent.toLowerCase().indexOf("android") !== -1;
}
