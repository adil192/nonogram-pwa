import {Tile} from "./lib/Tile";
import {Grid} from "./lib/Grid";

let main: HTMLElement;
let grid: Grid = null;

const GRID_WIDTH = 10;
const GRID_HEIGHT = 10;


window.addEventListener("load", function() {
	// set up PWA service worker
	if('serviceWorker' in navigator){
		navigator.serviceWorker.register("sw.js")
			.then(reg => console.log('service worker registered:', reg))
			.catch(err => console.log('service worker not registered', err));
	}

	main = document.querySelector("main");

	init();
});

function init() {
	if (grid != null) grid.Destroy();

	grid = new Grid(main, GRID_WIDTH, GRID_HEIGHT);

}
