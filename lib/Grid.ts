
export class Grid {
	readonly elem: HTMLElement;
	readonly size: number;
	private readonly gridItems: GridItem[][];

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
		for (let y = -1; y < this.size; ++y) {
			let row: GridItem[] = [];
			for (let x = -1; x < this.size; ++x) {
				const isTile: boolean = x >= 0 && y >= 0;
				const gridItem = isTile ? new GridItemTile(x, y) : new GridItemLabel();

				if (gridItem instanceof GridItemLabel) {
					if (y < 0) gridItem.elem.classList.add("vertical"); // make top row vertical
					else gridItem.elem.classList.add("horizontal");

					if (x < 0 && y < 0) gridItem.elem.innerText = ""; // top left corner should be left blank
				} else {
					gridItem.state = Math.random() > 1 - Grid.difficulty;

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

		for (let x = 0; x < this.size; ++x) {
			let gridItem: GridItemLabel = this.getGridItem(x, -1);

			let counts = this.getVerticalLabel(x, true);
			gridItem.counts = counts.join(",");

			let label: string = counts.join("\n");
			gridItem.elem.innerText = label;

			if (label == this.size + "") { // full row/column
				for (let by = 0; by < this.size; ++by) {
					this.getGridItem<GridItemTile>(x, by).isSelected = true;
				}
			} else if (!label) {
				for (let by = 0; by < this.size; ++by) {
					this.getGridItem<GridItemTile>(x, by).isCrossed = true;
				}
			}
		}
		for (let y = 0; y < this.size; ++y) {
			let gridItem: GridItemLabel = this.getGridItem(-1, y);

			let counts = this.getHorizontalLabel(y, true);
			gridItem.counts = counts.join(",");

			let label: string = counts.join(" ");
			gridItem.elem.innerText = label;

			if (label == this.size + "") { // full row/column
				for (let bx = 0; bx < this.size; ++bx) {
					this.getGridItem<GridItemTile>(bx, y).isSelected = true;
				}
			} else if (!label) {
				for (let bx = 0; bx < this.size; ++bx) {
					this.getGridItem<GridItemTile>(bx, y).isCrossed = true;
				}
			}
		}
	}

	getHorizontalLabel(y: number, isStart: boolean = false): number[] {
		let counts: number[] = [0];

		for (let x = 0; x < this.size; ++x) this._getLabel_countTile(x, y, isStart, counts);

		return counts.filter(n => n != 0);
	}
	getVerticalLabel(x: number, isStart: boolean = false): number[] {
		let counts: number[] = [0];

		for (let y = 0; y < this.size; ++y) this._getLabel_countTile(x, y, isStart, counts);

		return counts.filter(n => n != 0);
	}
	checkHorizontalLabel(y: number): boolean {
		return this.getHorizontalLabel(y).join(",") == this.getGridItem<GridItemLabel>(-1, y).counts;
	}
	checkVerticalLabel(x: number): boolean {
		return this.getVerticalLabel(x).join(",") == this.getGridItem<GridItemLabel>(x, -1).counts;
	}
	private _getLabel_countTile(x: number, y: number, isStart: boolean, counts: number[]) {
		let tile: GridItemTile = this.getGridItem(x, y);
		let counted = isStart ? tile.state : tile.isSelected;

		if (counted) {
			counts[counts.length - 1] += 1
		} else {
			if (counts[counts.length - 1] != 0) {
				counts.push(0);
			}
		}
	}

	// indices offset by 1 to allow for ["-1"] to be a label, and ["0"] to be the first game tile
	getGridItem<T extends GridItem>(x: number, y: number): T {
		return this.gridItems[y + 1][x + 1] as T;
	}

	onGridItemClicked(gridItem: GridItemTile) {
		if (this.isCross) gridItem.isCrossed = !gridItem.isCrossed;
		else gridItem.isSelected = !gridItem.isSelected;

		this.getGridItem<GridItemLabel>(gridItem.x, -1).isCorrect = this.checkVerticalLabel(gridItem.x);
		this.getGridItem<GridItemLabel>(-1, gridItem.y).isCorrect = this.checkHorizontalLabel(gridItem.y);
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
	public counts: string;
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
