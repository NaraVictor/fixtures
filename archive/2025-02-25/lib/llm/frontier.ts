/**
 * Optional frontier LLM for short reasoning or confidence explanation.
 * Set OPENAI_API_KEY or ANTHROPIC_API_KEY in env; without key, returns null.
 */

export async function getFrontierExplanation(params: {
  homeTeam: string;
  awayTeam: string;
  league: string;
  predictionType: string;
  predictedValue: string;
  confidenceScore: number;
  localSummary?: string;
}): Promise<string | null> {
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  const prompt = `In one short sentence, explain why this prediction might be reasonable: ${params.league}: ${params.homeTeam} v ${params.awayTeam}. Prediction: ${params.predictionType} ${params.predictedValue} (confidence ${(params.confidenceScore * 100).toFixed(0)}%).${params.localSummary ? ` Context: ${params.localSummary}` : ""}`;

  if (openaiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 80,
        }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const text = data.choices?.[0]?.message?.content?.trim();
      return text || null;
    } catch {
      return null;
    }
  }

  if (anthropicKey) {
    try {
      const res = await fetch(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-3-haiku-20240307",
            max_tokens: 80,
            messages: [{ role: "user", content: prompt }],
          }),
        }
      );
      if (!res.ok) return null;
      const data = (await res.json()) as { content?: Array<{ text?: string }> };
      const text = data.content?.[0]?.text?.trim();
      return text || null;
    } catch {
      return null;
    }
  }

  return null;
}
