import {Grid} from "./lib/Grid";
import {allowPinchToZoom, PinchToZoomHandler} from "../repo/PinchToZoom";

let board: HTMLElement;
let iconLinks: HTMLDivElement;
let githubAlt: HTMLAnchorElement;

let refreshBtn: HTMLButtonElement;
let soundBtn: HTMLButtonElement;
let lockBtn: HTMLButtonElement;
let difficultyToggle: HTMLInputElement;
let crossToggle: HTMLButtonElement;
let binBtn: HTMLButtonElement;
let newGameBtn: HTMLButtonElement;
let eReaderBtn: HTMLButtonElement;

let pinchToZoomHandler: PinchToZoomHandler = null;

let grid: Grid = null;

const GRID_SIZE = 9;


window.addEventListener("load", function() {
	// set up PWA service worker
	if('serviceWorker' in navigator){
		navigator.serviceWorker.register("sw.js")
			.then(reg => console.log('service worker registered:', reg))
			.catch(err => console.log('service worker not registered', err));
	}

	board = document.querySelector("board");
	iconLinks = document.querySelector(".icon-links");
	githubAlt = document.querySelector("#github-alt");

	refreshBtn = document.querySelector("#refreshBtn");
	soundBtn = document.querySelector("#soundBtn");
	lockBtn = document.querySelector("#lockBtn");
	difficultyToggle = document.querySelector("#difficultyToggle");
	crossToggle = document.querySelector("#crossToggle");
	binBtn = document.querySelector("#binBtn");
	newGameBtn = document.querySelector("#newGameBtn");
	eReaderBtn = document.querySelector("#eReaderBtn");
	Grid.wonModalBtn = newGameBtn;

	init();

	crossToggle.addEventListener("click", function () {
		grid.isCross = !grid.isCross;
		updateCrossIcon();
	})
	binBtn.addEventListener("click", function () {
		grid.Clear();
	})
	soundBtn.addEventListener("click", toggleSound);
	lockBtn.addEventListener("click", toggleLock)
	refreshBtn.addEventListener("click", newGame)
	newGameBtn.addEventListener("click", newGame)
	window.addEventListener("resize", onResize)
	
	difficultyToggle.valueAsNumber = Grid.difficulty * 11;
	difficultyToggle.addEventListener("change", function () {
		let inputValue = Math.min(10, Math.max(1, difficultyToggle.valueAsNumber));
		if (isNaN(inputValue)) difficultyToggle.valueAsNumber = inputValue = 1;
		else if (inputValue != difficultyToggle.valueAsNumber) difficultyToggle.valueAsNumber = inputValue;

		Grid.difficulty = inputValue / 11;

		grid.Clear();
		grid.Destroy();
		grid = new Grid(board, GRID_SIZE);
	})

	eReaderBtn.addEventListener("click", toggleEReaderMode);

	const android = isAndroid();
	const standalone = isStandalone();
	iconLinks.style.display = (android && !standalone) ? "block" : "none";
	githubAlt.style.display = (!android && !standalone) ? "block" : "none";
});

function init() {
	if (grid != null) grid.Destroy();

	loadEReaderMode();

	grid = new Grid(board, GRID_SIZE);

	pinchToZoomHandler = allowPinchToZoom(board, true);
	pinchToZoomHandler.onChange = onZoomChange;

	updateLockIcon();
	onResize();
}

function onZoomChange(scale: number, offset: {x: number, y: number}) {
	// todo: show a "reset zoom" button if scale is not 1 AND !active
	// (i.e. wait until pinch gesture ends and zoomed in to show button)
	// todo: hide the same button if scale is 1
}

function onResize() {
	board.style.transform = "none";
	board.style.fontSize = "1em";
	// make board smaller if it doesn't fit on display
	const widthRatio = board.scrollWidth / document.body.offsetWidth;
	if (widthRatio > 1) {
		board.style.fontSize = (1/widthRatio * 0.99) + "em";
	}
}

function newGame() {
	Grid.ClearSeed();
	grid.Clear();
	grid.Destroy();
	grid.hideWonModal();
	grid = new Grid(board, GRID_SIZE);
	updateLockIcon();
	updateCrossIcon();
}

window.isSoundEnabled = true;
function toggleSound() {
	if (window.isSoundEnabled) {
		window.isSoundEnabled = false;
		soundBtn.classList.add("is-muted");
	} else {
		window.isSoundEnabled = true;
		soundBtn.classList.remove("is-muted");
	}
}

function toggleLock() {
	grid.isLocked = !grid.isLocked;
	updateLockIcon();
}
function updateLockIcon() {
	if (grid.isLocked) lockBtn.classList.add("is-locked");
	else lockBtn.classList.remove("is-locked");
}

function updateCrossIcon() {
	if (grid.isCross) crossToggle.classList.add("is-cross");
	else crossToggle.classList.remove("is-cross");
}

let eReaderModeEnabled: boolean = false;
function toggleEReaderMode() {
	eReaderModeEnabled = !eReaderModeEnabled;
	saveEReaderMode();
	if (eReaderModeEnabled) {
		document.body.classList.add("e-reader");
		eReaderBtn.classList.add("eReaderEnabled");
	} else {
		document.body.classList.remove("e-reader");
		eReaderBtn.classList.remove("eReaderEnabled");
	}
}
function saveEReaderMode() {
	document.cookie = "nonogramEReader=" + eReaderModeEnabled + "; SameSite=Strict; Secure; max-age=31536000";  // max age = 1 year
}
function loadEReaderMode() {
	const nonogramEReader = "nonogramEReader=";
	const nonogramSoundEnabled = "nonogramSoundEnabled=";
	const cookies = decodeURIComponent(document.cookie).split('; ');
	cookies.forEach(val => {
		if (val.indexOf(nonogramEReader) === 0) {
			eReaderModeEnabled = JSON.parse(val.substring(nonogramEReader.length));
		} else if (val.indexOf(nonogramSoundEnabled) === 0) {
			window.isSoundEnabled = !!JSON.parse(val.substring(nonogramSoundEnabled.length));
		}
	});
	eReaderModeEnabled = !eReaderModeEnabled;
	toggleEReaderMode();
	window.isSoundEnabled = !window.isSoundEnabled;
	toggleSound();
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
