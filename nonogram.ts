import {Grid} from "./lib/Grid";

let main: HTMLElement;

let difficultyToggle: HTMLInputElement;
let crossToggle: HTMLButtonElement;
let binBtn: HTMLButtonElement;

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
	difficultyToggle = document.querySelector("#difficultyToggle");
	crossToggle = document.querySelector("#crossToggle");
	binBtn = document.querySelector("#binBtn");

	init();

	crossToggle.addEventListener("click", function () {
		grid.isCross = !grid.isCross;

		if (grid.isCross) crossToggle.classList.add("is-cross");
		else crossToggle.classList.remove("is-cross");
	})
	binBtn.addEventListener("click", function () {
		grid.Clear();
	})
	difficultyToggle.addEventListener("change", function () {
		let inputValue = difficultyToggle.valueAsNumber;
		inputValue = Math.min(10, Math.max(1, inputValue));
		if (inputValue != difficultyToggle.valueAsNumber) {
			difficultyToggle.valueAsNumber = inputValue;
		}

		Grid.difficulty = difficultyToggle.valueAsNumber / 11;

		grid.Destroy();
		grid = new Grid(main, GRID_SIZE);
	})
});

function init() {
	if (grid != null) grid.Destroy();

	grid = new Grid(main, GRID_SIZE);

}
