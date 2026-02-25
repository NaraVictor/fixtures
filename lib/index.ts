import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import path from "path";
import { generateContentWithRetry } from "./ai";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function runAnalysis(gameCount: number = 10) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_AI_API_KEY ?? process.env.AI_API_KEY;
    if (!apiKey) throw new Error("NEXT_PUBLIC_AI_API_KEY or AI_API_KEY is not set");

    // 1. Load context files
    const skillLogic = fs.readFileSync(
      path.join(__dirname, "skill.md"),
      "utf8",
    );
    const systemPromptTemplate = fs.readFileSync(
      path.join(__dirname, "prompt.md"),
      "utf8",
    );

    // 2. Fetch team references from Supabase
    const { data: teams, error: dbError } = await supabase
      .from("teams")
      .select("id, name");
    if (dbError) throw dbError;

    // 3. Request analysis via AI SDK (DeepSeek)
    const systemInstruction = systemPromptTemplate.replace(
      "{{n}}",
      gameCount.toString(),
    );
    const genResult = await generateContentWithRetry(
      apiKey,
      [
        `Reference Teams: ${JSON.stringify(teams)}`,
        `Skill Logic: ${skillLogic}`,
        `Task: Generate ${gameCount} predictions for the upcoming fixtures.`,
      ],
      { systemInstruction },
    );
    if (!genResult.ok) throw new Error(genResult.error);

    const text = genResult.text.replace(/```json|```/g, "").trim();
    const predictions = JSON.parse(text);

    // 5. Upsert to Database
    const { error: insertError } = await supabase
      .from("predictions")
      .insert(predictions);
    if (insertError) throw insertError;

    console.log(`Successfully ingested ${predictions.length} picks.`);
  } catch (err) {
    console.error("Pipeline Failure:", err);
  }
}

// // When run directly as a script (node lib/index.js), execute the analysis.
// if (require.main === module) {
//   runAnalysis().catch((err) => {
//     console.error(err);
//     process.exit(1);
//   });
// }
