export interface BodyAnalysisRequest {
  consentGiven: boolean;
  poseType: "front" | "side" | "back" | "other";
  age?: number | null;
  height?: number | null;
  bodyweight?: number | null;
  lightingTag?: string | null;
  pumpTag?: string | null;
  features: PhotoQualityFeatures;
}

export interface PhotoQualityFeatures {
  width: number;
  height: number;
  meanLuminance: number;
  contrast: number;
  sharpness: number;
  centerBalance: number;
  exposureBalance: number;
  aspectQuality: number;
}

export interface BodyAnalysisResult {
  score: number;
  confidence: number;
  modelVersion: string;
  measurementsJson: Record<string, unknown>;
  warningsJson: string[];
}

export function scoreBodyProgressFromFeatures(request: BodyAnalysisRequest): BodyAnalysisResult {
  if (!request.consentGiven) {
    throw new Error("Explicit consent is required before body progress analysis.");
  }

  const { features } = request;
  const imageQualityScore = weightedScore([
    [features.exposureBalance, 0.22],
    [features.contrast, 0.18],
    [features.sharpness, 0.2],
    [features.centerBalance, 0.22],
    [features.aspectQuality, 0.1],
    [resolutionQuality(features.width, features.height), 0.08]
  ]);
  const poseScore = request.poseType === "other" ? 52 : 76;
  const contextScore = request.lightingTag ? 80 : 48;
  const pumpPenalty = request.pumpTag === "pump" ? 4 : 0;
  const score = clamp(round(imageQualityScore * 0.62 + poseScore * 0.23 + contextScore * 0.15 - pumpPenalty), 0, 100);
  const confidence = clamp(
    round((imageQualityScore / 100) * 0.58 + (request.lightingTag ? 0.18 : 0.04) + (request.poseType === "other" ? 0.04 : 0.16)),
    0,
    0.92
  );
  const warnings = buildWarnings(request, imageQualityScore);

  return {
    score,
    confidence,
    modelVersion: "local-vision-v1",
    measurementsJson: {
      progressMetric: {
        score,
        confidence,
        userRelativeOnly: true,
        comparedAgainstOtherUsers: false
      },
      photoQualitySignals: {
        exposureBalance: round(features.exposureBalance),
        contrast: round(features.contrast),
        sharpness: round(features.sharpness),
        centerBalance: round(features.centerBalance),
        aspectQuality: round(features.aspectQuality),
        resolutionQuality: round(resolutionQuality(features.width, features.height)),
        imageQualityScore: round(imageQualityScore)
      },
      captureContext: {
        poseType: request.poseType,
        age: request.age ?? null,
        height: request.height ?? null,
        bodyweight: request.bodyweight ?? null,
        approximateBmi: approximateBmi(request.height, request.bodyweight),
        lightingTag: request.lightingTag ?? "unknown",
        pumpTag: request.pumpTag ?? "unknown"
      },
      approximateVisualComposition: approximateVisualCompositionBand(request, score),
      forbiddenOutputs: {
        attractiveness: "not_computed",
        exactBodyFatPercentage: "not_computed",
        medicalDiagnosis: "not_computed"
      }
    },
    warningsJson: warnings
  };
}

function buildWarnings(request: BodyAnalysisRequest, imageQualityScore: number): string[] {
  const warnings = [
    "Experimental private progress metric only.",
    "Not a medical diagnosis, body-fat measurement, or attractiveness rating.",
    "No comparison is made against other users."
  ];

  if (!request.lightingTag) warnings.push("Lighting tag is missing; consistent lighting improves trend quality.");
  if (request.poseType === "other") warnings.push("Use front, side, or back pose categories for more comparable trends.");
  if (request.pumpTag === "pump") warnings.push("Pump tag is set; compare pumped photos separately from non-pumped photos.");
  if (request.features.exposureBalance < 55) warnings.push("Exposure looks inconsistent; avoid very dim or blown-out photos.");
  if (request.features.sharpness < 42) warnings.push("Image appears soft or blurry; a sharper photo improves confidence.");
  if (request.features.centerBalance < 48) warnings.push("Subject framing appears off-center; try a consistent camera position.");
  if (imageQualityScore < 50) warnings.push("Low photo quality reduced model confidence.");
  if (!request.height || !request.bodyweight) warnings.push("Height and weight are missing; approximate context band is less useful.");

  return warnings;
}

function approximateVisualCompositionBand(request: BodyAnalysisRequest, score: number): Record<string, unknown> {
  const bmi = approximateBmi(request.height, request.bodyweight);
  const contextAdjustment = bmi ? clamp((bmi - 24) * 1.2, -8, 12) : 0;
  const visualIndex = clamp(score - contextAdjustment, 0, 100);
  let band = "developing_consistency";
  if (visualIndex >= 78) band = "high_consistency";
  else if (visualIndex >= 62) band = "moderate_consistency";
  else if (visualIndex >= 46) band = "low_to_moderate_consistency";

  return {
    band,
    visualIndex: round(visualIndex),
    approximateOnly: true,
    label: "Rough visual composition/progress band, not body-fat percentage"
  };
}

function approximateBmi(heightInches?: number | null, bodyweight?: number | null): number | null {
  if (!heightInches || !bodyweight) return null;
  return round((bodyweight / (heightInches * heightInches)) * 703);
}

function weightedScore(values: Array<[number, number]>): number {
  return clamp(
    values.reduce((total, [value, weight]) => total + clamp(value, 0, 100) * weight, 0),
    0,
    100
  );
}

function resolutionQuality(width: number, height: number): number {
  const megapixels = (width * height) / 1_000_000;
  return clamp((megapixels / 1.2) * 100, 35, 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
