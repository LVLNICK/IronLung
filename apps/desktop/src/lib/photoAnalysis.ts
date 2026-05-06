import { scoreBodyProgressFromFeatures, type BodyAnalysisResult, type PhotoQualityFeatures, type ProgressPhoto } from "@ironlung/core";

export async function analyzeProgressPhotoLocally(photo: ProgressPhoto, consentGiven: boolean): Promise<BodyAnalysisResult> {
  const features = await extractPhotoQualityFeatures(photo.imagePath);
  return scoreBodyProgressFromFeatures({
    consentGiven,
    poseType: photo.poseType,
    age: photo.age,
    height: photo.height,
    bodyweight: photo.bodyweight,
    lightingTag: photo.lightingTag,
    pumpTag: photo.pumpTag,
    features
  });
}

export async function extractPhotoQualityFeatures(imagePath: string): Promise<PhotoQualityFeatures> {
  const image = await loadImage(imagePath);
  const sampleWidth = 128;
  const sampleHeight = Math.max(96, Math.round((image.naturalHeight / image.naturalWidth) * sampleWidth));
  const canvas = document.createElement("canvas");
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Image analysis canvas is unavailable.");
  context.drawImage(image, 0, 0, sampleWidth, sampleHeight);
  const { data } = context.getImageData(0, 0, sampleWidth, sampleHeight);
  const luminance = new Float32Array(sampleWidth * sampleHeight);
  let sum = 0;

  for (let i = 0, pixel = 0; i < data.length; i += 4, pixel += 1) {
    const value = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    luminance[pixel] = value;
    sum += value;
  }

  const mean = sum / luminance.length;
  let variance = 0;
  for (const value of luminance) variance += (value - mean) ** 2;
  const std = Math.sqrt(variance / luminance.length);

  return {
    width: image.naturalWidth,
    height: image.naturalHeight,
    meanLuminance: round((mean / 255) * 100),
    contrast: round(clamp((std / 62) * 100, 0, 100)),
    sharpness: round(estimateSharpness(luminance, sampleWidth, sampleHeight)),
    centerBalance: round(estimateCenterBalance(luminance, sampleWidth, sampleHeight)),
    exposureBalance: round(estimateExposureBalance(mean)),
    aspectQuality: round(estimateAspectQuality(image.naturalWidth, image.naturalHeight))
  };
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load progress photo for analysis."));
    image.src = source;
  });
}

function estimateSharpness(luminance: Float32Array, width: number, height: number): number {
  let gradientTotal = 0;
  let samples = 0;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      const gx = Math.abs(luminance[index + 1] - luminance[index - 1]);
      const gy = Math.abs(luminance[index + width] - luminance[index - width]);
      gradientTotal += gx + gy;
      samples += 1;
    }
  }
  return clamp((gradientTotal / Math.max(samples, 1) / 42) * 100, 0, 100);
}

function estimateCenterBalance(luminance: Float32Array, width: number, height: number): number {
  const center = regionStats(luminance, width, height, 0.28, 0.18, 0.72, 0.82);
  const full = regionStats(luminance, width, height, 0, 0, 1, 1);
  const centerContrast = Math.abs(center.mean - full.mean) + center.std;
  return clamp((centerContrast / 72) * 100, 0, 100);
}

function regionStats(
  luminance: Float32Array,
  width: number,
  height: number,
  x0Ratio: number,
  y0Ratio: number,
  x1Ratio: number,
  y1Ratio: number
): { mean: number; std: number } {
  const x0 = Math.floor(width * x0Ratio);
  const y0 = Math.floor(height * y0Ratio);
  const x1 = Math.floor(width * x1Ratio);
  const y1 = Math.floor(height * y1Ratio);
  let sum = 0;
  let count = 0;
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      sum += luminance[y * width + x];
      count += 1;
    }
  }
  const mean = sum / Math.max(count, 1);
  let variance = 0;
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      variance += (luminance[y * width + x] - mean) ** 2;
    }
  }
  return { mean, std: Math.sqrt(variance / Math.max(count, 1)) };
}

function estimateExposureBalance(meanLuminance: number): number {
  const ideal = 132;
  const distance = Math.abs(meanLuminance - ideal);
  return clamp(100 - (distance / 132) * 100, 0, 100);
}

function estimateAspectQuality(width: number, height: number): number {
  const ratio = height / width;
  const distance = Math.abs(ratio - 1.33);
  return clamp(100 - distance * 45, 45, 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
