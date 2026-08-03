export type OneEuroFilterParameters = Readonly<{
  minCutoffHz: number;
  beta: number;
  derivativeCutoffHz: number;
}>;

export function lowPassAlpha(cutoffHz: number, elapsedSeconds: number) {
  if (!Number.isFinite(cutoffHz) || cutoffHz <= 0) throw new Error("Cutoff must be finite and positive.");
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) throw new Error("Elapsed time must be finite and positive.");
  const timeConstant = 1 / (2 * Math.PI * cutoffHz);
  return 1 / (1 + timeConstant / elapsedSeconds);
}

function validateParameters(parameters: OneEuroFilterParameters) {
  if (!Number.isFinite(parameters.minCutoffHz) || parameters.minCutoffHz <= 0) throw new Error("minCutoffHz must be finite and positive.");
  if (!Number.isFinite(parameters.beta) || parameters.beta < 0) throw new Error("beta must be finite and non-negative.");
  if (!Number.isFinite(parameters.derivativeCutoffHz) || parameters.derivativeCutoffHz <= 0) throw new Error("derivativeCutoffHz must be finite and positive.");
}

export class OneEuroScalarFilter {
  private lastTimestampMs: number | null = null;
  private lastRawValue = 0;
  private filteredValue = 0;
  private filteredDerivative = 0;

  constructor(private readonly parameters: OneEuroFilterParameters) {
    validateParameters(parameters);
  }

  filter(value: number, timestampMs: number) {
    if (!Number.isFinite(value) || !Number.isFinite(timestampMs)) throw new Error("One Euro samples and timestamps must be finite.");
    if (this.lastTimestampMs === null) {
      this.lastTimestampMs = timestampMs;
      this.lastRawValue = value;
      this.filteredValue = value;
      this.filteredDerivative = 0;
      return value;
    }
    if (timestampMs < this.lastTimestampMs) throw new Error("One Euro timestamp regression.");
    if (timestampMs === this.lastTimestampMs) return this.filteredValue;
    const elapsedSeconds = (timestampMs - this.lastTimestampMs) / 1000;
    const derivative = (value - this.lastRawValue) / elapsedSeconds;
    const derivativeAlpha = lowPassAlpha(this.parameters.derivativeCutoffHz, elapsedSeconds);
    const nextDerivative = derivativeAlpha * derivative + (1 - derivativeAlpha) * this.filteredDerivative;
    const cutoff = this.parameters.minCutoffHz + this.parameters.beta * Math.abs(nextDerivative);
    const valueAlpha = lowPassAlpha(cutoff, elapsedSeconds);
    const nextValue = valueAlpha * value + (1 - valueAlpha) * this.filteredValue;
    this.lastTimestampMs = timestampMs;
    this.lastRawValue = value;
    this.filteredDerivative = nextDerivative;
    this.filteredValue = nextValue;
    return nextValue;
  }

  reset() {
    this.lastTimestampMs = null;
    this.lastRawValue = 0;
    this.filteredValue = 0;
    this.filteredDerivative = 0;
  }
}
