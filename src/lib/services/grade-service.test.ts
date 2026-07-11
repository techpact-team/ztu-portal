import { describe, expect, it } from "vitest";
import {
  calculateWeightedScore,
  nextGradeStatus,
  resolveGrade,
} from "@/lib/services/grade-service";

describe("grade-service", () => {
  it("calculates weighted scores on the server-side service", () => {
    expect(
      calculateWeightedScore({
        rawScore: 80,
        maximumScore: 100,
        weightPercentage: 30,
      }),
    ).toBe(24);
  });

  it("rejects scores above the maximum score", () => {
    expect(() =>
      calculateWeightedScore({
        rawScore: 101,
        maximumScore: 100,
        weightPercentage: 30,
      }),
    ).toThrow("Raw score");
  });

  it("resolves the configured grading scale", () => {
    expect(resolveGrade(79)).toEqual({ letterGrade: "A-", gradePoint: 3.7 });
    expect(resolveGrade(44)).toEqual({ letterGrade: "F", gradePoint: 0 });
  });

  it("allows only the approved status workflow", () => {
    expect(nextGradeStatus("draft", "submit")).toBe("submitted");
    expect(nextGradeStatus("submitted", "approve")).toBe("approved");
    expect(nextGradeStatus("approved", "publish")).toBe("published");
    expect(() => nextGradeStatus("published", "approve")).toThrow("Cannot approve");
  });
});
