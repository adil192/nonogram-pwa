import {Tile} from "./Tile";

// Difficulty between 0.0 (easiest) and 1.0 (hardest)
const difficulty = 0.5;

export class Grid {
	readonly elem: HTMLElement;
	readonly width: number;
	readonly height: number;
	readonly gridItems: GridItem[][];

	constructor(elem: HTMLElement, width: number, height: number) {
		this.elem = elem;
		this.width = width;
		this.height = height;

		// set number of css grid columns
		this.elem.style.gridTemplateColumns = "auto "+ "1fr ".repeat(this.width);

		// create grid items
		this.gridItems = [];
		for (let y = -1; y < this.width; ++y) {
			let row: GridItem[] = [];
			for (let x = -1; x < this.height; ++x) {
				const isTile: boolean = x >= 0 && y >= 0;
				const gridItem = new GridItem(isTile);

				if (!isTile) {
					gridItem.elem.innerText = "1 2 1"; // dummy data

					if (y < 0) gridItem.elem.classList.add("vertical"); // make top row vertical
					else gridItem.elem.classList.add("horizontal");

					if (x < 0 && y < 0) gridItem.elem.innerText = ""; // top left corner should be left blank
				} else {
					gridItem.state = Math.random() > 1 - difficulty;

					gridItem.isSelected = gridItem.state; // dummy data

					// add border around edges
					if (x == 0) gridItem.elem.classList.add("x-start");
					else if (x == this.width - 1) gridItem.elem.classList.add("x-end");
					else if (x == this.width / 2.0) gridItem.elem.classList.add("x-middle");
					if (y == 0) gridItem.elem.classList.add("y-start");
					else if (y == this.height - 1) gridItem.elem.classList.add("y-end");
					else if (y == this.height / 2.0) gridItem.elem.classList.add("y-middle");

					// onclick
					gridItem.elem.addEventListener("click", () => {
						this.onGridItemClicked(gridItem);
					});
				}

				this.elem.append(gridItem.elem);

				row.push(gridItem);
			}
			this.gridItems.push(row);
		}
	}

	// indices offset by 1 to allow for ["-1"] to be a label, and ["0"] to be the first game tile
	getGridItem(x: number, y: number) {
		return this.gridItems[x + 1][y + 1];
	}

	onGridItemClicked(gridItem: GridItem) {
		gridItem.isSelected = !gridItem.isSelected;
	}

	public Destroy() {
		for (let x = -1; x < this.width; ++x) {
			for (let y = -1; y < this.height; ++y) {
				let gridItem = this.getGridItem(x, y);
				gridItem.elem.remove();
			}
		}
	}
}

export class GridItem {
	elem: HTMLDivElement;
	tile?: Tile;

	private _selected: boolean = false;
	public state: boolean = false;
	
	constructor(isTile: boolean) {
		this.elem = document.createElement("div");

		if (isTile) {
			this.elem.classList.add("tile");
			this.tile = new Tile(this.elem);
		} else {
			this.elem.classList.add("label");
		}
	}

	public get isSelected(): boolean {
		return this._selected;
	}
	public set isSelected(selected: boolean) {
		this._selected = selected;

		if (selected) this.elem.classList.add("selected");
		else this.elem.classList.remove("selected");
	}
}
