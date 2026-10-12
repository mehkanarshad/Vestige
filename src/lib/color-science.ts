export interface LabColor {
  l: number;
  a: number;
  b: number;
}

export interface ColorMatchScore {
  score: number;
  deltaE: number;
  lightnessContrast: number;
  hueHarmony: number;
  label: string;
}

export type SkinUndertone = "warm" | "cool" | "neutral" | "olive";

export function classifySkinUndertone(
  lab: LabColor | null | undefined
): SkinUndertone | "not assessed" {
  if (!lab || ![lab.l, lab.a, lab.b].every(Number.isFinite)) return "not assessed";

  const chroma = Math.hypot(lab.a, lab.b);
  if (chroma < 8) return "neutral";
  if (lab.a < 0 && lab.b > 0) return "olive";
  if (lab.b < 0) return "cool";

  const hue = (Math.atan2(lab.b, lab.a) * 180) / Math.PI;
  if (hue >= 50) return "warm";
  if (hue <= 30) return "cool";
  return "neutral";
}

export function hexToLab(hex: string): LabColor {
  const match = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
  if (!match) throw new Error("Expected a six-digit hex color");

  const [red, green, blue] = match.slice(1).map((value) => {
    const channel = parseInt(value, 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });

  const x = (red * 0.4124564 + green * 0.3575761 + blue * 0.1804375) / 0.95047;
  const y = red * 0.2126729 + green * 0.7151522 + blue * 0.072175;
  const z = (red * 0.0193339 + green * 0.119192 + blue * 0.9503041) / 1.08883;
  const fx = labPivot(x);
  const fy = labPivot(y);
  const fz = labPivot(z);

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

function labPivot(value: number): number {
  return value > 216 / 24389
    ? Math.cbrt(value)
    : (841 / 108) * value + 4 / 29;
}

export function deltaE2000(first: LabColor, second: LabColor): number {
  const degrees = 180 / Math.PI;
  const radians = Math.PI / 180;
  const chroma1 = Math.hypot(first.a, first.b);
  const chroma2 = Math.hypot(second.a, second.b);
  const meanChroma = (chroma1 + chroma2) / 2;
  const meanChroma7 = meanChroma ** 7;
  const twentyFive7 = 25 ** 7;
  const g = 0.5 * (1 - Math.sqrt(meanChroma7 / (meanChroma7 + twentyFive7)));
  const a1Prime = (1 + g) * first.a;
  const a2Prime = (1 + g) * second.a;
  const chroma1Prime = Math.hypot(a1Prime, first.b);
  const chroma2Prime = Math.hypot(a2Prime, second.b);
  const hue1Prime = hueAngle(first.b, a1Prime, degrees);
  const hue2Prime = hueAngle(second.b, a2Prime, degrees);

  const deltaLPrime = second.l - first.l;
  const deltaCPrime = chroma2Prime - chroma1Prime;
  let deltaHuePrime = 0;
  if (chroma1Prime * chroma2Prime !== 0) {
    deltaHuePrime = hue2Prime - hue1Prime;
    if (deltaHuePrime > 180) deltaHuePrime -= 360;
    if (deltaHuePrime < -180) deltaHuePrime += 360;
  }
  const deltaHPrime =
    2 * Math.sqrt(chroma1Prime * chroma2Prime) * Math.sin((deltaHuePrime / 2) * radians);

  const meanLPrime = (first.l + second.l) / 2;
  const meanCPrime = (chroma1Prime + chroma2Prime) / 2;
  let meanHuePrime = hue1Prime + hue2Prime;
  if (chroma1Prime * chroma2Prime === 0) {
    meanHuePrime = hue1Prime + hue2Prime;
  } else if (Math.abs(hue1Prime - hue2Prime) <= 180) {
    meanHuePrime /= 2;
  } else if (hue1Prime + hue2Prime < 360) {
    meanHuePrime = (hue1Prime + hue2Prime + 360) / 2;
  } else {
    meanHuePrime = (hue1Prime + hue2Prime - 360) / 2;
  }

  const t =
    1 -
    0.17 * Math.cos((meanHuePrime - 30) * radians) +
    0.24 * Math.cos(2 * meanHuePrime * radians) +
    0.32 * Math.cos((3 * meanHuePrime + 6) * radians) -
    0.2 * Math.cos((4 * meanHuePrime - 63) * radians);
  const deltaTheta = 30 * Math.exp(-(((meanHuePrime - 275) / 25) ** 2));
  const meanCPrime7 = meanCPrime ** 7;
  const rotationC = 2 * Math.sqrt(meanCPrime7 / (meanCPrime7 + twentyFive7));
  const lightnessOffset = meanLPrime - 50;
  const scaleL = 1 + (0.015 * lightnessOffset ** 2) / Math.sqrt(20 + lightnessOffset ** 2);
  const scaleC = 1 + 0.045 * meanCPrime;
  const scaleH = 1 + 0.015 * meanCPrime * t;
  const rotationT = -Math.sin(2 * deltaTheta * radians) * rotationC;
  const normalizedL = deltaLPrime / scaleL;
  const normalizedC = deltaCPrime / scaleC;
  const normalizedH = deltaHPrime / scaleH;

  return Math.sqrt(
    normalizedL ** 2 +
      normalizedC ** 2 +
      normalizedH ** 2 +
      rotationT * normalizedC * normalizedH
  );
}

function hueAngle(b: number, a: number, degrees: number): number {
  if (a === 0 && b === 0) return 0;
  const angle = Math.atan2(b, a) * degrees;
  return angle >= 0 ? angle : angle + 360;
}

export function scoreGarmentColor(skin: LabColor, garment: LabColor): ColorMatchScore {
  const deltaE = deltaE2000(skin, garment);
  const lightnessContrast = Math.min(100, (Math.abs(skin.l - garment.l) / 40) * 100);
  const skinChroma = Math.hypot(skin.a, skin.b);
  const garmentChroma = Math.hypot(garment.a, garment.b);
  let hueHarmony = 82;

  if (skinChroma >= 8 && garmentChroma >= 8) {
    const skinHue = hueAngle(skin.b, skin.a, 180 / Math.PI);
    const garmentHue = hueAngle(garment.b, garment.a, 180 / Math.PI);
    const rawDifference = Math.abs(skinHue - garmentHue);
    const difference = Math.min(rawDifference, 360 - rawDifference);
    const analogous = Math.exp(-0.5 * (difference / 38) ** 2);
    const complementary = Math.exp(-0.5 * ((180 - difference) / 42) ** 2);
    hueHarmony = 55 + 45 * Math.max(analogous, complementary);
  }

  const score = Math.round(0.55 * lightnessContrast + 0.45 * hueHarmony);
  return {
    score,
    deltaE: Math.round(deltaE * 10) / 10,
    lightnessContrast: Math.round(lightnessContrast),
    hueHarmony: Math.round(hueHarmony),
    label: score >= 82 ? "Strong color match" : score >= 65 ? "Good color match" : "Try a different color",
  };
}