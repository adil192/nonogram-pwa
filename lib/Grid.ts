import {Tile} from "./Tile";

export class Grid {
	readonly elem: HTMLElement;
	readonly width: number;
	readonly height: number;
	readonly gridItems: GridItem[][];

	// difficulty between 0.0 (easiest) and 1.0 (hardest)
	public static difficulty: number = 0.5;

	public isCross: boolean = false;

	constructor(elem: HTMLElement, width: number, height: number) {
		this.elem = elem;
		this.width = width;
		this.height = height;

		// set number of css grid columns
		this.elem.style.gridTemplateColumns = "auto "+ "1fr ".repeat(this.width);

		// create grid items
		this.gridItems = [];
		let xStateCounts: number[][] = Array.from(Array(this.width), () => [0]);  // e.g. [ [1,2,1], [3], [1,4] ]
		let yStateCounts: number[][] = Array.from(Array(this.width), () => [0]);
		for (let y = -1; y < this.height; ++y) {
			let yStateCountsCurrent = yStateCounts[y];
			let row: GridItem[] = [];
			for (let x = -1; x < this.width; ++x) {
				let xStateCountsCurrent = xStateCounts[x];
				const isTile: boolean = x >= 0 && y >= 0;
				const gridItem = new GridItem(isTile);

				if (!isTile) {
					if (y < 0) gridItem.elem.classList.add("vertical"); // make top row vertical
					else gridItem.elem.classList.add("horizontal");

					if (x < 0 && y < 0) gridItem.elem.innerText = ""; // top left corner should be left blank
				} else {
					gridItem.state = Math.random() > 1 - Grid.difficulty;
					if (gridItem.state) {
						xStateCountsCurrent[xStateCountsCurrent.length - 1] += 1
						yStateCountsCurrent[yStateCountsCurrent.length - 1] += 1;
					} else {
						if (xStateCountsCurrent[xStateCountsCurrent.length - 1] != 0) {
							xStateCountsCurrent.push(0);
						}
						if (yStateCountsCurrent[yStateCountsCurrent.length - 1] != 0) {
							yStateCountsCurrent.push(0);
						}
					}

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

		let x, y;
		for (y = -1, x = 0; x < this.width; ++x) {
			let label = yStateCounts[x].filter(n => n != 0).join(" ");
			if (!label) label = "0";
			this.getGridItem(x, y).elem.innerText = label;
		}
		for (x = -1, y = 0; y < this.height; ++y) {
			let label = xStateCounts[y].filter(n => n != 0).join("\n");
			if (!label) label = "0";
			this.getGridItem(x, y).elem.innerText = label;
		}
	}

	// indices offset by 1 to allow for ["-1"] to be a label, and ["0"] to be the first game tile
	getGridItem(x: number, y: number) {
		return this.gridItems[x + 1][y + 1];
	}

	onGridItemClicked(gridItem: GridItem) {
		if (this.isCross) gridItem.isCrossed = !gridItem.isCrossed;
		else gridItem.isSelected = !gridItem.isSelected;
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

	public state: boolean = false;
	private _selected: boolean = false;
	private _crossed: boolean = false;
	
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

		if (selected) {
			this.elem.classList.add("selected");
			this.isCrossed = false;
		} else {
			this.elem.classList.remove("selected");
		}
	}
	public get isCrossed(): boolean {
		return this._crossed;
	}
	public set isCrossed(crossed: boolean) {
		this._crossed = crossed;

		if (crossed) {
			this.elem.classList.add("crossed");
			this.isSelected = false;
		} else {
			this.elem.classList.remove("crossed");
		}
	}
}
