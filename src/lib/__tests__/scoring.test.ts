import { describe, it, expect } from "vitest";
import { computePoints, scoreBreakdown } from "../scoring";

describe("computePoints — barème cumulatif (max 3)", () => {
  it("score exact -> 3 points (résultat + différence + exact)", () => {
    // réel 2-1, pronostic 2-1
    expect(computePoints(2, 1, 2, 1)).toBe(3);
  });

  it("bon résultat + bonne différence mais pas exact -> 2 points", () => {
    // réel 2-1, pronostic 3-2 : victoire A (+1), diff +1 (+1), pas exact
    expect(computePoints(3, 2, 2, 1)).toBe(2);
  });

  it("mauvais résultat -> 0 point", () => {
    // réel 2-1 (victoire A), pronostic 0-1 (victoire B)
    expect(computePoints(0, 1, 2, 1)).toBe(0);
  });

  it("bon résultat seulement (mauvaise différence) -> 1 point", () => {
    // réel 2-1 (victoire A, diff 1), pronostic 3-0 (victoire A, diff 3)
    expect(computePoints(3, 0, 2, 1)).toBe(1);
  });

  it("jamais plus de 3 points", () => {
    for (let a = 0; a <= 6; a++) {
      for (let b = 0; b <= 6; b++) {
        expect(computePoints(a, b, 2, 1)).toBeLessThanOrEqual(3);
        expect(computePoints(a, b, 2, 1)).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe("cas particulier du match nul", () => {
  it("tout nul pronostiqué pour un nul réel obtient le point de différence + résultat", () => {
    // réel 1-1, pronostic 0-0 : signe 0=0 (+1), diff 0=0 (+1), pas exact -> 2
    expect(computePoints(0, 0, 1, 1)).toBe(2);
    // réel 1-1, pronostic 3-3 : idem -> 2
    expect(computePoints(3, 3, 1, 1)).toBe(2);
  });

  it("nul exact -> 3 points", () => {
    expect(computePoints(1, 1, 1, 1)).toBe(3);
  });

  it("pronostic non nul pour un nul réel -> 0 point", () => {
    // réel 0-0, pronostic 1-0 : signe + != 0, diff 1 != 0, pas exact
    expect(computePoints(1, 0, 0, 0)).toBe(0);
  });

  it("nul pronostiqué pour un match non nul -> 0 point", () => {
    // réel 2-1, pronostic 0-0 : signe 0 != +, diff 0 != 1
    expect(computePoints(0, 0, 2, 1)).toBe(0);
  });
});

describe("scoreBreakdown — détail des points", () => {
  it("décompose correctement un score exact", () => {
    expect(scoreBreakdown(2, 1, 2, 1)).toEqual({
      total: 3,
      correctOutcome: true,
      correctDifference: true,
      exactScore: true,
    });
  });

  it("décompose un bon résultat + bonne différence", () => {
    expect(scoreBreakdown(3, 2, 2, 1)).toEqual({
      total: 2,
      correctOutcome: true,
      correctDifference: true,
      exactScore: false,
    });
  });

  it("décompose un échec total", () => {
    expect(scoreBreakdown(0, 1, 2, 1)).toEqual({
      total: 0,
      correctOutcome: false,
      correctDifference: false,
      exactScore: false,
    });
  });

  it("victoire B exacte -> 3 points", () => {
    expect(computePoints(0, 2, 0, 2)).toBe(3);
  });
});
