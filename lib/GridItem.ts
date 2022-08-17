import {Grid} from "./Grid";

function playAudioFromStart(audio: HTMLAudioElement) {
	if (!window.isSoundEnabled) return;
	try { audio.load(); } catch (e) { }
	audio.play().catch(_ => { });
}

export abstract class GridItem {
	elem: HTMLElement;

	abstract LoadFromSerialized(serialized: Record<string, boolean>);
	abstract Serializable(): Record<string, boolean>;
}
export class GridItemTile extends GridItem {
	static audioNormal: HTMLAudioElement = document.querySelector("#audioNormal");

	private grid: Grid;

	public state: boolean = false;
	private _selected: boolean = false;
	private _crossed: boolean = false;
	private _isLocked: boolean;

	public readonly x: number;
	public readonly y: number;

	constructor(grid: Grid, x: number, y: number, serialized: Record<string, boolean> = null) {
		super();
		this.elem = document.createElement("tile");
		this.grid = grid;
		this.x = x;
		this.y = y;
		this.elem.dataset.x = x + "";
		this.elem.dataset.y = y + "";

		this.elem.draggable = true;
		this.elem.addEventListener("dragstart", (event) => this.onDragStart(event), {passive: true});
		this.elem.addEventListener("dragend", (event) => this.onDragEnd(event), {passive: true});
		this.elem.addEventListener("dragenter", (event) => this.onDragEnter(event), {passive: true});
		this.elem.addEventListener("touchstart", (event) => this.onTouchStart(event), {passive: true});
		this.elem.addEventListener("touchend", (event) => this.onTouchEnd(event), {passive: true});
		this.elem.addEventListener("touchmove", (event) => this.onTouchMove(event), {passive: true});
		this.elem.addEventListener("click", () => this.grid.onTileClicked(this), {passive: true});

		if (serialized != null) this.LoadFromSerialized(serialized);
	}

	LoadFromSerialized(serialized: Record<string, boolean>) {
		this.isSelected = serialized.isSelected ?? this.isSelected;
		this.isCrossed = serialized.isCrossed ?? this.isCrossed;
		this.isLocked = serialized.isLocked ?? this.isLocked;
	}

	private onDragStart(event: DragEvent) {
		this.grid.OnTileDragStart(this);

		// set dragging image as a blank canvas
		let image = new Image();
		image.src = 'images/transparent.webp';
		event.dataTransfer.setDragImage(image, 0, 0);
	}
	private onDragEnd(event: DragEvent) {
		this.grid.OnTileDragEnd();
	}
	private onDragEnter(event: DragEvent) {
		this.grid.OnTileDragEnter(this);
	}

	private onTouchStart(event: TouchEvent) {
		if (event.touches.length > 1) return this.grid.OnTileDragCancel(); // cancel because this is a zoom gesture

		this.grid.touchEnabled = true;
		this.grid.OnTileDragStart(this);
	}
	private onTouchEnd(event: TouchEvent) {
		this.grid.OnTileDragEnd();
	}
	private onTouchMove(event: TouchEvent) {
		if (event.touches.length != 1) return;

		let touch: Touch = event.touches.item(0);
		let newTileElem: HTMLElement = document.elementFromPoint(touch.pageX, touch.pageY) as HTMLElement;
		this.grid.OnTileDragEnterCoords(parseInt(newTileElem.dataset.x), parseInt(newTileElem.dataset.y));
	}

	public get isSelected(): boolean {
		return this._selected;
	}
	public set isSelected(selected: boolean) {
		if (this.isLocked) return;

		if (this._selected == selected) return;
		this._selected = selected;

		playAudioFromStart(GridItemTile.audioNormal);

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
		if (this.isLocked) return;

		this._crossed = crossed;

		if (crossed) {
			this.elem.classList.add("crossed");
			this.isSelected = false;
		} else {
			this.elem.classList.remove("crossed");
		}
	}

	public get isLocked(): boolean {
		return this._isLocked;
	}
	public set isLocked(locked: boolean) {
		this._isLocked = locked;
		if (locked) {
			this.elem.classList.add("locked");
		} else {
			this.elem.classList.remove("locked");
		}
	}

	public get isEmpty(): boolean {
		return !this.isCrossed && !this.isSelected;
	}

	Serializable(): Record<string, boolean> {
		return {
			isSelected: this.isSelected,
			isCrossed: this.isCrossed,
			isLocked: this.isLocked,
		};
	}
}
export class GridItemLabel extends GridItem {
	static audioCorrect: HTMLAudioElement = document.querySelector("#audioCorrect");
	static audioIncorrect: HTMLAudioElement = document.querySelector("#audioIncorrect");

	public counts: number[];
	private _correct: boolean = false;
	private _incorrect: boolean = false;

	constructor(serialized: Record<string, boolean> = null) {
		super();
		this.elem = document.createElement("label");

		if (serialized != null) this.LoadFromSerialized(serialized);
	}

	LoadFromSerialized(serialized: Record<string, boolean>) {
		this.isCorrect = serialized.isCorrect ?? this.isCorrect;
		this.isIncorrect = serialized.isIncorrect ?? this.isIncorrect;
	}

	public get isCorrect(): boolean {
		return this._correct;
	}
	public set isCorrect(correct: boolean) {
		if (this._correct == correct) return;
		this._correct = correct;

		if (correct) {
			this.elem.classList.add("correct");
			this.isIncorrect = false;
			playAudioFromStart(GridItemLabel.audioCorrect);
		} else {
			this.elem.classList.remove("correct");
		}
	}

	public get isIncorrect(): boolean {
		return this._incorrect;
	}
	public set isIncorrect(incorrect: boolean) {
		if (this._incorrect == incorrect) return;
		this._incorrect = incorrect;

		if (incorrect) {
			this.elem.classList.add("incorrect");
			this.isCorrect = false;
			playAudioFromStart(GridItemLabel.audioIncorrect);
		} else {
			this.elem.classList.remove("incorrect");
		}
	}

	resetAnim() {
		// trigger reflow to allow us to restart animation
		void this.elem.offsetWidth;
	}

	Serializable(): Record<string, boolean> {
		return {
			isCorrect: this.isCorrect,
			isIncorrect: this.isIncorrect,
		};
	}
}
