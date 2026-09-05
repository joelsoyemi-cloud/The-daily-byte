function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchSourceText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; DailyByteBot/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    return stripHtml(html).slice(0, 6000);
  } catch {
    return "";
  }
}

function extractSection(
  text: string,
  startMarker: string,
  endMarker: string,
): string {
  const startIdx = text.indexOf(startMarker);
  if (startIdx === -1) return "";
  const contentStart = startIdx + startMarker.length;
  const endIdx = text.indexOf(endMarker, contentStart);
  return (
    endIdx === -1 ? text.slice(contentStart) : text.slice(contentStart, endIdx)
  ).trim();
}

export async function generateArticleDraft({
  title,
  sourceUrl,
  category,
}: {
  title: string;
  sourceUrl: string;
  category: string;
}): Promise<{ title: string; excerpt: string; content: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const sourceText = await fetchSourceText(sourceUrl);

  const prompt = `You are an experienced news editor writing for "The Daily Byte", a ${category} section read by a general audience who wants to actually understand the story, not just skim a summary.

Story headline: "${title}"
Source URL: ${sourceUrl}
${sourceText ? `Raw source page text (may include ads/nav junk — use only what's clearly relevant to the story):\n${sourceText}` : "(No source text could be fetched. Write only what a careful editor could responsibly say from the headline alone — keep claims general, and do not invent specific figures, dates, or quotes.)"}

Write a genuinely good blog post about this story — the kind a sharp human editor would write, not a generic AI summary. Guidelines:
- Open with a strong, specific first sentence that tells the reader what actually happened — never start with throat-clearing like "In today's news..." or "It has been reported that...".
- Never copy sentences from the source — paraphrase entirely, in your own words and sentence structure.
- No fixed word count — write as long as the story genuinely warrants. A short update might be 300 words; a complex, multi-angle story might be 1000+. Let the substance decide the length, not an artificial target. Short paragraphs (2-4 sentences) either way. Use as many "##" Markdown subheadings as the story naturally breaks into (usually 2-5) that organize it into a real narrative (what happened, why it matters, what's next) — not generic labels.
- Write with a clear point of view on what's *significant* about the story, not just a list of facts.
- Attribute factual claims naturally where the source supports them (e.g. "according to [outlet]").
- If you're not confident about a specific fact, date, or number, state it more generally rather than inventing precision you don't have.
- Never fabricate quotes.
- End with a sentence that gives the reader something to think about, not just a summary restatement.

Respond in EXACTLY this format — these exact marker lines, nothing else before or after:

###TITLE###
A punchy, accurate headline (can differ slightly from the one given above if you can write a sharper one)

###EXCERPT###
One or two sentences, under 200 characters, that would make someone want to click

###CONTENT###
The full article in Markdown, starting directly with the first paragraph (no repeated title heading)
###END###`;

  const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";

  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 8000 },
        }),
        signal: AbortSignal.timeout(30000),
      },
    );
  } catch (err: any) {
    throw new Error(
      `Could not reach Gemini (network issue) — try again in a moment. (${err.message})`,
    );
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `Gemini API error (${res.status}): ${errText.slice(0, 300)}`,
    );
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  const rawText: string = candidate?.content?.parts?.[0]?.text ?? "";

  if (!rawText) {
    const reason = candidate?.finishReason || data.promptFeedback?.blockReason;
    throw new Error(
      reason
        ? `Gemini returned no text (reason: ${reason}). Try a different headline.`
        : "Gemini returned an empty response. Try again.",
    );
  }

  const draftTitle = extractSection(rawText, "###TITLE###", "###EXCERPT###");
  const excerpt = extractSection(rawText, "###EXCERPT###", "###CONTENT###");
  const content = extractSection(rawText, "###CONTENT###", "###END###");

  if (!draftTitle || !content) {
    throw new Error(
      "Gemini's response didn't match the expected format. Try again.",
    );
  }

  return { title: draftTitle, excerpt, content };
}
