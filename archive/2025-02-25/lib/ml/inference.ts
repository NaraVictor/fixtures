/**
 * Local model inference. Uses a rule-based proxy until an ONNX (or other) artifact is added.
 * Load artifact from repo or Supabase Storage on cold start; compute features from DB + odds;
 * run model and return recommended outcome + probabilities for local_model_output and model_version.
 */

const DEFAULT_VERSION = "v0.1.0";

export function getModelVersion(): string {
  return process.env.MODEL_VERSION ?? DEFAULT_VERSION;
}

export interface Prediction1x2 {
  recommended: "1" | "X" | "2";
  probabilities: { "1": number; X: number; "2": number };
  model_version: string;
}

/**
 * Rule-based 1x2 recommendation from composite score (home tendency).
 * Score > 0.6 -> home; < 0.4 -> away; else draw.
 */
export function predict1x2(compositeScore: number): Prediction1x2 {
  const version = getModelVersion();
  const home = Math.max(0, Math.min(1, compositeScore));
  const draw = 0.25;
  const away = Math.max(0, 1 - home - draw);
  const sum = home + draw + away;
  const probabilities = {
    "1": home / sum,
    X: draw / sum,
    "2": away / sum,
  };
  let recommended: "1" | "X" | "2" = "X";
  if (home > draw && home > away) recommended = "1";
  else if (away > draw && away > home) recommended = "2";
  return { recommended, probabilities, model_version: version };
}

export interface PredictionOverUnder {
  recommended: "over" | "under";
  threshold: number;
  model_version: string;
}

/**
 * Simple over/under 2.5 from composite score (higher score -> more goals expected).
 */
export function predictOverUnder(compositeScore: number, threshold = 2.5): PredictionOverUnder {
  const version = getModelVersion();
  const recommended = compositeScore >= 0.5 ? "over" : "under";
  return { recommended, threshold, model_version: version };
}
