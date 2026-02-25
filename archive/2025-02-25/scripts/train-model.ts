/**
 * Placeholder for offline model training.
 * Plan: Read historical fixtures + fixture_stats + odds from DB (or CSV export),
 * compute features, train a small model (e.g. sklearn/lightgbm or ONNX for Node),
 * output artifact (model.onnx or pickle) + version manifest.
 * Run: npx tsx scripts/train-model.ts (or ts-node)
 * For now, only writes a version manifest so inference can use MODEL_VERSION.
 */
const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = process.env.MODEL_OUTPUT_DIR || path.join(process.cwd(), "lib", "ml", "artifacts");
const VERSION = process.env.MODEL_VERSION || "v0.1.0";

function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  const manifest = {
    model_version: VERSION,
    created_at: new Date().toISOString(),
    feature_list: ["xg_home", "xg_away", "shots_on_target_home", "shots_on_target_away", "home_advantage"],
    note: "Placeholder. Replace with real training: read from Supabase or CSV, train, write model artifact.",
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log("Wrote manifest:", path.join(OUTPUT_DIR, "manifest.json"), "\n", manifest);
}

main();
