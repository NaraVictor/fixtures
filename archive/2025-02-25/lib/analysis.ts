import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import path from "path";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function runAnalysis(gameCount: number = 5) {
  try {
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

    // 3. Configure Gemini
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash", // High-speed, high-reasoning for 2026
      systemInstruction: systemPromptTemplate.replace(
        "{{n}}",
        gameCount.toString(),
      ),
    });

    // 4. Request Analysis
    const result = await model.generateContent([
      `Reference Teams: ${JSON.stringify(teams)}`,
      `Skill Logic: ${skillLogic}`,
      `Task: Generate ${gameCount} predictions for the upcoming fixtures.`,
    ]);

    const text = result.response
      .text()
      .replace(/```json|```/g, "")
      .trim();
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

runAnalysis();
