// src/hooks/types.ts
export const subdivisions = {
  Quarter: 1.0,
  Eighth: 0.5,
  Sixteenth: 0.25,
  Triplet: 1.0 / 3.0,
};
export type Subdivision = keyof typeof subdivisions;

export interface MetronomeSettings {
  bpm: number;
  beats: number;
  accents: number[];
  selectedSubdivision: Subdivision;
}

export interface Preset extends MetronomeSettings {
  id: string;
  name: string;
}
