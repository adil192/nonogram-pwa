/*
 * Custom random number generator class, with a settable seed.
 */

export class Rng {
	static seed = 1;

	static seededRandom(max = 1, min = 0) {
		this.seed = (this.seed * 9301 + 49297) % 233280;
		let rnd = this.seed / 233280;

		return min + rnd * (max - min);
	}
}
