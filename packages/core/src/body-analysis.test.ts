import { describe, expect, it } from "vitest";
import { scoreBodyProgressFromFeatures } from "./body-analysis";

const features = {
  width: 1600,
  height: 2200,
  meanLuminance: 52,
  contrast: 70,
  sharpness: 64,
  centerBalance: 75,
  exposureBalance: 82,
  aspectQuality: 90
};

describe("local body progress analysis", () => {
  it("returns approximate local scoring with forbidden outputs disabled", () => {
    const result = scoreBodyProgressFromFeatures({
      consentGiven: true,
      poseType: "front",
      age: 30,
      height: 70,
      bodyweight: 185,
      lightingTag: "same room",
      pumpTag: "no pump",
      features
    });

    expect(result.modelVersion).toBe("local-vision-v1");
    expect(result.score).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.measurementsJson.forbiddenOutputs).toMatchObject({
      attractiveness: "not_computed",
      exactBodyFatPercentage: "not_computed",
      medicalDiagnosis: "not_computed"
    });
  });

  it("requires explicit consent", () => {
    expect(() =>
      scoreBodyProgressFromFeatures({
        consentGiven: false,
        poseType: "front",
        features
      })
    ).toThrow("Explicit consent");
  });
});
