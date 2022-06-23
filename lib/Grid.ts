import {Rng} from "./Rng";
import {GridItem, GridItemLabel, GridItemTile} from "./GridItem";

export class Grid {
	readonly elem: HTMLElement;
	readonly size: number;
	private readonly gridItems: GridItem[][];
	private gridItemsBackup: Record<string, boolean>[][];

	private modalBackdrop: HTMLDivElement;
	private wonModal: HTMLDivElement;
	private modalTimeout: number = null;
	public static wonModalBtn: HTMLButtonElement;

	public touchEnabled: boolean = false;
	private draggingTile: GridItemTile;
	private draggingAction: (GridItemTile) => void;

	public isCross: boolean = false;

	static readonly seedCookieName: string = "nonogramSeed=";
	static readonly difficultyCookieName: string = "nonogramDifficulty=";
	readonly gridItemsCookieName: string = "nonogramGridItems=";

	public static _difficulty: number = (() => {
		let difficulty: number = 4 / 11;
		let cookies = decodeURIComponent(document.cookie).split('; ');
		cookies.forEach(val => {
			if (val.indexOf(this.difficultyCookieName) === 0) difficulty = parseFloat(val.substring(this.difficultyCookieName.length));
		});
		return difficulty;
	})();
	// difficulty between 0.0 (easiest) and 1.0 (hardest)
	public static get difficulty(): number {
		return this._difficulty;
	}
	public static set difficulty(difficulty: number) {
		this._difficulty = difficulty;

		document.cookie = this.difficultyCookieName + difficulty + "; SameSite=Strict; Secure; max-age=31536000";  // max age = 1 year
	}

	constructor(elem: HTMLElement, size: number) {
		this.elem = elem;
		this.size = size;

		Grid.LoadSeedFromCookie();

		this.modalBackdrop = document.querySelector("#backdrop");
		this.wonModal = document.querySelector("#wonModal");

		// set number of css grid columns
		this.elem.style.gridTemplateColumns = "auto "+ "1fr ".repeat(this.size);

		// get saved state
		let serializedGridItems = this.loadSerializedGridItemsFromCookie();

		// create grid items
		this.gridItems = [];
		for (let y = -1; y < this.size; ++y) {
			let row: GridItem[] = [];
			for (let x = -1; x < this.size; ++x) {
				let serialized: Record<string, boolean>;
				try {
					serialized = serializedGridItems[y + 1][x + 1];
				} catch (e) {
					serialized = null;
				}

				const isTile: boolean = x >= 0 && y >= 0;
				const gridItem = isTile ? new GridItemTile(this, x, y, serialized) : new GridItemLabel(serialized);

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
			gridItem.counts = counts;

			let label: string = counts.join("\n");
			gridItem.elem.innerText = label;
		}
		for (let y = 0; y < this.size; ++y) {
			let gridItem: GridItemLabel = this.getGridItem(-1, y);

			let counts = this.getHorizontalLabel(y, true);
			gridItem.counts = counts;

			let label: string = counts.join(" ");
			gridItem.elem.innerText = label;
		}
		for (let x = 0; x < this.size; ++x) {
			let counts: number[] = this.getGridItem<GridItemLabel>(x, -1).counts;
			if (counts.toString() == [this.size].toString()) { // full row/column
				for (let by = 0; by < this.size; ++by) {
					this.getGridItem<GridItemTile>(x, by).isSelected = true;
				}

				let gridItem = this.getGridItem<GridItemLabel>(x, -1);
				gridItem.resetAnim();
				gridItem.isCorrect = true;
			} else if (counts.toString() == [0].toString()) { // empty row/column
				for (let by = 0; by < this.size; ++by) {
					this.getGridItem<GridItemTile>(x, by).isCrossed = true;
				}

				let gridItem = this.getGridItem<GridItemLabel>(x, -1);
				gridItem.resetAnim();
				gridItem.isCorrect = true;
			} else { // check this row/column
				this.onTileChanged(this.getGridItem<GridItemTile>(x, 0));
			}
		}
		for (let y = 0; y < this.size; ++y) {
			let counts: number[] = this.getGridItem<GridItemLabel>(-1, y).counts;
			if (counts.toString() == [this.size].toString()) { // full row/column
				for (let bx = 0; bx < this.size; ++bx) {
					this.getGridItem<GridItemTile>(bx, y).isSelected = true;
				}

				let gridItem = this.getGridItem<GridItemLabel>(-1, y);
				gridItem.resetAnim();
				gridItem.isCorrect = true;
			} else if (counts.toString() == [0].toString()) { // empty row/column
				for (let bx = 0; bx < this.size; ++bx) {
					this.getGridItem<GridItemTile>(bx, y).isCrossed = true;
				}

				let gridItem = this.getGridItem<GridItemLabel>(-1, y);
				gridItem.resetAnim();
				gridItem.isCorrect = true;
			} else { // check this row/column
				this.onTileChanged(this.getGridItem<GridItemTile>(0, y));
			}
		}
		
		this.checkWon();
	}

	static LoadSeedFromCookie() {
		let seed: number = 0;
		let cookies = decodeURIComponent(document.cookie).split('; ');
		cookies.forEach(val => {
			if (val.indexOf(this.seedCookieName) === 0) seed = parseFloat(val.substring(this.seedCookieName.length));
		});

		if (seed == 0) {
			this.ClearSeed();
		} else {
			Rng.seed = seed;
		}
	}
	static SaveSeed() {
		document.cookie = this.seedCookieName + Rng.seed + "; SameSite=Strict; Secure; max-age=31536000";  // max age = 1 year
	}
	static ClearSeed() {
		Rng.seed = Math.random() * 1000;
		this.SaveSeed();
	}

	private loadSerializedGridItemsFromCookie(): Record<string, boolean>[][] {
		let gridItems: Record<string, boolean>[][] = null;
		let cookies = decodeURIComponent(document.cookie).split('; ');
		cookies.forEach(val => {
			if (val.indexOf(this.gridItemsCookieName) === 0) gridItems = JSON.parse(val.substring(this.gridItemsCookieName.length));
		});
		return gridItems;
	}
	private saveGridItemsToCookie() {
		let serialized = this._serializeGridItems();

		document.cookie = this.gridItemsCookieName + JSON.stringify(serialized) + "; SameSite=Strict; Secure; max-age=31536000";  // max age = 1 year
	}
	private saveGridItemsBackup() {
		this.gridItemsBackup = this._serializeGridItems();
	}
	private loadGridItemsBackup() {
		for (let y = -1; y < this.size; ++y) {
			for (let x = -1; x < this.size; ++x) {
				this.getGridItem(x, y).LoadFromSerialized(this.gridItemsBackup[y + 1][x + 1]);
			}
		}
	}
	private _serializeGridItems(): Record<string, boolean>[][] {
		let serializable = [];
		for (let y = -1; y < this.size; ++y) {
			let row = [];
			for (let x = -1; x < this.size; ++x) {
				row.push(this.getGridItem(x, y).Serializable());
			}
			serializable.push(row);
		}
		return serializable;
	}

	getHorizontalLabel(y: number, isStart: boolean = false): number[] {
		let counts: number[] = [0];

		for (let x = 0; x < this.size; ++x) this._getLabel_countTile(x, y, isStart, counts);

		counts = counts.filter(n => n != 0);
		if (!counts.length) counts = [0];
		return counts;
	}
	getVerticalLabel(x: number, isStart: boolean = false): number[] {
		let counts: number[] = [0];

		for (let y = 0; y < this.size; ++y) this._getLabel_countTile(x, y, isStart, counts);

		counts = counts.filter(n => n != 0);
		if (!counts.length) counts = [0];
		return counts;
	}
	checkHorizontalLabel(y: number): [isCorrect: boolean, isIncorrect: boolean] {
		let current = this.getHorizontalLabel(y);
		let correct = this.getGridItem<GridItemLabel>(-1, y).counts;

		return this.checkLabel(current, correct);
	}
	checkVerticalLabel(x: number): [isCorrect: boolean, isIncorrect: boolean] {
		let current = this.getVerticalLabel(x);
		let correct = this.getGridItem<GridItemLabel>(x, -1).counts;

		return this.checkLabel(current, correct);
	}
	private checkLabel(current: number[], correct: number[]): [isCorrect: boolean, isIncorrect: boolean] {
		let isCorrect = current.toString() == correct.toString();
		let isIncorrect = false;
		if (isCorrect) return [isCorrect, isIncorrect];

		if (current.length == correct.length) {
			for (let i = 0; i < current.length; ++i)
				if (current[i] > correct[i]) {
					isIncorrect = true;
					break;
				}
		} else if (current.length > correct.length) {
			isIncorrect = current.reduce((sum, n) => sum + n + 1) > correct.reduce((sum, n) => sum + n + 1);
		} else {
			for (let i = 0; i < current.length; ++i)
				if (current[i] > correct.slice(i).reduce((sum, n) => sum + n)) {
					isIncorrect = true;
					break;
				}
		}
		return [isCorrect, isIncorrect];
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
		let verticalLabel: GridItemLabel = this.getGridItem(tile.x, -1);
		let horizontalLabel: GridItemLabel = this.getGridItem<GridItemLabel>(-1, tile.y);

		[verticalLabel.isCorrect, verticalLabel.isIncorrect] = this.checkVerticalLabel(tile.x);
		[horizontalLabel.isCorrect, horizontalLabel.isIncorrect] = this.checkHorizontalLabel(tile.y);

		this.saveGridItemsToCookie();

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

		clearTimeout(this.modalTimeout);
		this.modalTimeout = setTimeout(() => {
			Grid.wonModalBtn.disabled = false;
		}, 200);
	}
	hideWonModal() {
		this.wonModal.classList.remove("show")
		Grid.wonModalBtn.disabled = true;

		clearTimeout(this.modalTimeout);
		this.modalTimeout = setTimeout(() => {
			this.modalBackdrop.style.display = "none"
			this.wonModal.style.display = "none"
		}, 300)
	}

	public OnTileDragStart(startTile: GridItemTile) {
		this.draggingTile = startTile;
		this.saveGridItemsBackup();

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

		// interpolate between this.draggingTile and newTile to make sure we don't miss any tiles
		let tile: GridItemTile;
		for (let x = Math.min(newTile.x, this.draggingTile.x); x <= Math.max(newTile.x, this.draggingTile.x); ++x) {
			for (let y = Math.min(newTile.y, this.draggingTile.y); y <= Math.max(newTile.y, this.draggingTile.y); ++y) {
				tile = this.getGridItem(x, y);
				this.draggingAction(tile);
				this.onTileChanged(tile);
			}
		}
	}
	public OnTileDragEnterCoords(x: number, y: number) {
		let tile: GridItemTile;
		try {
			tile = this.getGridItem(x, y);
		} catch (e) { return; }

		this.OnTileDragEnter(tile);
	}
	public OnTileDragCancel() {
		console.log("OnTileDragCancel");
		this.OnTileDragEnd();

		// undo any changes because this is actually a zoom gesture
		this.loadGridItemsBackup();
	}

	public Clear() {
		for (let x = 0; x < this.size; ++x) {
			for (let y = 0; y < this.size; ++y) {
				let gridItem: GridItemTile = this.getGridItem(x, y);
				gridItem.isSelected = false;
				gridItem.isCrossed = false;
			}
		}
		for (let n = 0; n < this.size; ++n) { // revalidate diagonals
			this.onTileChanged(this.getGridItem(n, n));
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

Grid.LoadSeedFromCookie();
