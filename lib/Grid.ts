import {Rng} from "./Rng";

export class Grid {
	readonly elem: HTMLElement;
	readonly size: number;
	private readonly gridItems: GridItem[][];

	private modalBackdrop: HTMLDivElement;
	private wonModal: HTMLDivElement;

	// difficulty between 0.0 (easiest) and 1.0 (hardest)
	public static difficulty: number = 4 / 11;

	public touchEnabled: boolean = false;
	private draggingTile: GridItemTile;
	private draggingAction: (GridItemTile) => void;

	public isCross: boolean = false;

	constructor(elem: HTMLElement, size: number) {
		this.elem = elem;
		this.size = size;

		Grid.LoadSeedFromCookie();

		this.modalBackdrop = document.querySelector("#backdrop");
		this.wonModal = document.querySelector("#wonModal");

		// set number of css grid columns
		this.elem.style.gridTemplateColumns = "auto "+ "1fr ".repeat(this.size);

		// create grid items
		this.gridItems = [];
		for (let y = -1; y < this.size; ++y) {
			let row: GridItem[] = [];
			for (let x = -1; x < this.size; ++x) {
				const isTile: boolean = x >= 0 && y >= 0;
				const gridItem = isTile ? new GridItemTile(this, x, y) : new GridItemLabel();

				if (gridItem instanceof GridItemLabel) {
					if (y < 0) gridItem.elem.classList.add("vertical"); // make top row vertical
					else gridItem.elem.classList.add("horizontal");

					if (x < 0 && y < 0) gridItem.elem.innerText = ""; // top left corner should be left blank
				} else {
					gridItem.state = Rng.seededRandom() > Grid.difficulty;

					// add border around edges
					if (x == 0) gridItem.elem.classList.add("x-start");
					else if (x == this.size - 1) gridItem.elem.classList.add("x-end");
					else if (x == this.size / 2.0) gridItem.elem.classList.add("x-middle");
					if (y == 0) gridItem.elem.classList.add("y-start");
					else if (y == this.size - 1) gridItem.elem.classList.add("y-end");
					else if (y == this.size / 2.0) gridItem.elem.classList.add("y-middle");
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
				this.getGridItem<GridItemLabel>(x, -1).isCorrect = true;
			} else if (!label) {
				for (let by = 0; by < this.size; ++by) {
					this.getGridItem<GridItemTile>(x, by).isCrossed = true;
				}
				this.getGridItem<GridItemLabel>(x, -1).isCorrect = true;
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
				this.getGridItem<GridItemLabel>(-1, y).isCorrect = true;
			} else if (!label) {
				for (let bx = 0; bx < this.size; ++bx) {
					this.getGridItem<GridItemTile>(bx, y).isCrossed = true;
				}
				this.getGridItem<GridItemLabel>(-1, y).isCorrect = true;
			}
		}
		
		this.checkWon();
	}

	static readonly cookieName: string = "nonogramSeed=";
	static LoadSeedFromCookie() {
		let seed: number = 0;
		let cookies = decodeURIComponent(document.cookie).split('; ');
		cookies.forEach(val => {
			if (val.indexOf(this.cookieName) === 0) seed = parseFloat(val.substring(this.cookieName.length));
		});

		if (seed == 0) {
			this.ClearSeed();
		} else {
			Rng.seed = seed;
		}
	}
	static SaveSeed() {
		console.log("save seed:", Rng.seed);
		document.cookie = this.cookieName + Rng.seed + "; SameSite=Strict; Secure; max-age=31536000";  // max age = 1 year
	}
	static ClearSeed() {
		Rng.seed = Math.random() * 1000;
		this.SaveSeed();
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

	onTileClicked(tile: GridItemTile) {
		if (this.touchEnabled) return; // touch screens use custom logic

		if (this.isCross) tile.isCrossed = !tile.isCrossed;
		else tile.isSelected = !tile.isSelected;

		this.onTileChanged(tile);
	}
	onTileChanged(tile: GridItemTile) {
		this.getGridItem<GridItemLabel>(tile.x, -1).isCorrect = this.checkVerticalLabel(tile.x);
		this.getGridItem<GridItemLabel>(-1, tile.y).isCorrect = this.checkHorizontalLabel(tile.y);

		this.checkWon();
	}

	private _hasWon(): boolean {
		let gridItem: GridItemLabel;
		for (let y = 0; y < this.size; ++y) {
			gridItem = this.getGridItem(-1, y);
			if (!gridItem.isCorrect) return false;
		}
		for (let x = 0; x < this.size; ++x) {
			gridItem = this.getGridItem(x, -1);
			if (!gridItem.isCorrect) return false;
		}
		return true;
	}
	checkWon() {
		if (!this._hasWon()) return;

		this.showWonModal();
	}

	showWonModal() {
		this.modalBackdrop.style.display = "block"
		this.wonModal.style.display = "flex"
		void(this.wonModal.offsetHeight) // enable css transition for .modal.show
		this.wonModal.classList.add("show")
	}
	hideWonModal() {
		this.wonModal.classList.remove("show")
		setTimeout(() => {
			this.modalBackdrop.style.display = "none"
			this.wonModal.style.display = "none"
		}, 300)
	}

	public OnTileDragStart(startTile: GridItemTile) {
		this.draggingTile = startTile;

		if (this.isCross) {
			if (startTile.isCrossed) this.draggingAction = (tile) => tile.isCrossed = false;
			else this.draggingAction = (tile) => tile.isCrossed = true;
		} else {
			if (startTile.isSelected) this.draggingAction = (tile) => tile.isSelected = false;
			else this.draggingAction = (tile) => tile.isSelected = true;
		}
		this.draggingAction(startTile);
		this.onTileChanged(startTile);
	}
	public OnTileDragEnd() {
		this.draggingTile = null;
	}
	public OnTileDragEnter(newTile: GridItemTile) {
		// make sure we're dragging a tile
		if (this.draggingTile == null) return;

		// only allow dragging horizontally/vertically
		if (this.draggingTile.x != newTile.x && this.draggingTile.y != newTile.y) return;

		this.draggingAction(newTile);
		this.onTileChanged(newTile);
	}
	public OnTileDragEnterCoords(x: number, y: number) {
		let tile: GridItemTile;
		try {
			tile = this.getGridItem(x, y);
		} catch (e) { return; }

		this.OnTileDragEnter(tile);
	}

	public Clear() {
		for (let x = -1; x < this.size; ++x) {
			for (let y = -1; y < this.size; ++y) {
				let gridItem: GridItemLabel|GridItemTile = this.getGridItem(x, y);
				if (gridItem instanceof GridItemLabel) {
					gridItem.isCorrect = false;
				} else {
					gridItem.isSelected = false;
					gridItem.isCrossed = false;
				}
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
	private grid: Grid;

	public state: boolean = false;
	private _selected: boolean = false;
	private _crossed: boolean = false;

	public readonly x: number;
	public readonly y: number;

	constructor(grid: Grid, x: number, y: number) {
		super();
		this.elem = document.createElement("tile");
		this.grid = grid;
		this.x = x;
		this.y = y;
		this.elem.dataset.x = x + "";
		this.elem.dataset.y = y + "";

		this.elem.draggable = true;
		this.elem.addEventListener("dragstart", (event) => this.onDragStart(event));
		this.elem.addEventListener("dragend", (event) => this.onDragEnd(event));
		this.elem.addEventListener("dragenter", (event) => this.onDragEnter(event));
		this.elem.addEventListener("touchstart", (event) => this.onTouchStart(event));
		this.elem.addEventListener("touchend", (event) => this.onTouchEnd(event));
		this.elem.addEventListener("touchmove", (event) => this.onTouchMove(event));
		this.elem.addEventListener("click", () => this.grid.onTileClicked(this));
	}

	private onDragStart(event: DragEvent) {
		this.grid.OnTileDragStart(this);

		// set dragging image as a blank canvas
		const canvas: HTMLCanvasElement = document.createElement("canvas");
		canvas.width = canvas.height = 1;
		event.dataTransfer.setDragImage(canvas, 0, 0);
	}
	private onDragEnd(event: DragEvent) {
		this.grid.OnTileDragEnd();
	}
	private onDragEnter(event: DragEvent) {
		this.grid.OnTileDragEnter(this);
	}

	private onTouchStart(event: TouchEvent) {
		this.grid.touchEnabled = true;
		this.grid.OnTileDragStart(this);
	}
	private onTouchEnd(event: TouchEvent) {
		this.grid.OnTileDragEnd();
	}
	private onTouchMove(event: TouchEvent) {
		if (event.touches.length < 1) return;
		let touch: Touch = event.touches.item(0);
		let newTileElem: HTMLElement = document.elementFromPoint(touch.pageX, touch.pageY) as HTMLElement;
		this.grid.OnTileDragEnterCoords(parseInt(newTileElem.dataset.x), parseInt(newTileElem.dataset.y));
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

Grid.LoadSeedFromCookie();
