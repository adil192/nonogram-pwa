
export class Grid {
	readonly elem: HTMLElement;
	readonly size: number;
	readonly gridItems: GridItem[][];

	// difficulty between 0.0 (easiest) and 1.0 (hardest)
	public static difficulty: number = 0.5;

	public isCross: boolean = false;

	constructor(elem: HTMLElement, size: number) {
		this.elem = elem;
		this.size = size;

		// set number of css grid columns
		this.elem.style.gridTemplateColumns = "auto "+ "1fr ".repeat(this.size);

		// create grid items
		this.gridItems = [];
		let xStateCounts: number[][] = Array.from(Array(this.size), () => [0]);  // e.g. [ [1,2,1], [3], [1,4] ]
		let yStateCounts: number[][] = Array.from(Array(this.size), () => [0]);
		for (let y = -1; y < this.size; ++y) {
			let yStateCountsCurrent = yStateCounts[y];
			let row: GridItem[] = [];
			for (let x = -1; x < this.size; ++x) {
				let xStateCountsCurrent = xStateCounts[x];
				const isTile: boolean = x >= 0 && y >= 0;
				const gridItem = isTile ? new GridItemTile(x, y) : new GridItemLabel();

				if (gridItem instanceof GridItemLabel) {
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

					// add border around edges
					if (x == 0) gridItem.elem.classList.add("x-start");
					else if (x == this.size - 1) gridItem.elem.classList.add("x-end");
					else if (x == this.size / 2.0) gridItem.elem.classList.add("x-middle");
					if (y == 0) gridItem.elem.classList.add("y-start");
					else if (y == this.size - 1) gridItem.elem.classList.add("y-end");
					else if (y == this.size / 2.0) gridItem.elem.classList.add("y-middle");

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
		for (y = -1, x = 0; x < this.size; ++x) {
			let label = yStateCounts[x].filter(n => n != 0).join(" ");
			if (!label) label = "0";
			this.getGridItem(x, y).elem.innerText = label;

			if (label == this.size + "") { // full row/column
				for (let by = 0; by < this.size; ++by) {
					this.getGridItem<GridItemTile>(x, by).isSelected = true;
				}
			}
		}
		for (x = -1, y = 0; y < this.size; ++y) {
			let label = xStateCounts[y].filter(n => n != 0).join("\n");
			if (!label) label = "0";
			this.getGridItem(x, y).elem.innerText = label;

			if (label == this.size + "") { // full row/column
				for (let bx = 0; bx < this.size; ++bx) {
					this.getGridItem<GridItemTile>(bx, y).isSelected = true;
				}
			}
		}
	}

	// indices offset by 1 to allow for ["-1"] to be a label, and ["0"] to be the first game tile
	getGridItem<T extends GridItem>(x: number, y: number): T {
		return this.gridItems[x + 1][y + 1] as T;
	}

	onGridItemClicked(gridItem: GridItemTile) {
		if (this.isCross) gridItem.isCrossed = !gridItem.isCrossed;
		else gridItem.isSelected = !gridItem.isSelected;
	}

	public Clear() {
		for (let x = 0; x < this.size; ++x) {
			for (let y = 0; y < this.size; ++y) {
				let gridItem = this.getGridItem<GridItemTile>(x, y);
				gridItem.isSelected = false;
				gridItem.isCrossed = false;
			}
		}
	}

	public Destroy() {
		for (let x = -1; x < this.size; ++x) {
			for (let y = -1; y < this.size; ++y) {
				let gridItem = this.getGridItem(x, y);
				gridItem.elem.remove();
			}
		}
	}
}

export abstract class GridItem {
	elem: HTMLElement;
}
export class GridItemTile extends GridItem {
	public state: boolean = false;
	private _selected: boolean = false;
	private _crossed: boolean = false;

	public readonly x: number;
	public readonly y: number;

	constructor(x: number, y: number) {
		super();
		this.elem = document.createElement("tile");
		this.x = x;
		this.y = y;
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
export class GridItemLabel extends GridItem {
	private _correct: boolean = false;

	constructor() {
		super();
		this.elem = document.createElement("label");
	}

	public get isCorrect(): boolean {
		return this._correct;
	}
	public set isCorrect(correct: boolean) {
		this._correct = correct;

		if (correct) {
			this.elem.classList.add("correct");
		} else {
			this.elem.classList.remove("correct");
		}
	}
}
