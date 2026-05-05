/**
 * Taskbox Agent — maps natural language input to code locations and generates targeted fixes.
 * Accepts: text prompt | error log text
 * Returns: identified file, line, issue, and proposed fix
 */
import Anthropic from "@anthropic-ai/sdk";
import { logger } from "./logger";

const anthropic = new Anthropic({
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY ?? "dummy",
});

export interface TaskboxResult {
  understood: string;
  mappedFile: string | null;
  mappedLine: number | null;
  issueCategory: string;
  severity: "critical" | "high" | "medium" | "low";
  explanation: string;
  oldCode: string | null;
  newCode: string | null;
  fixSuggestion: string;
  confidenceScore: number;
  dependencyWarning: string | null;
}

export interface TaskboxInput {
  prompt: string;
  inputType: "text" | "error_log";
  repoContext?: string;
  fileList?: string[];
}

export async function runTaskboxAgent(input: TaskboxInput): Promise<TaskboxResult> {
  const fileListContext = input.fileList?.length
    ? `\nKnown repository files:\n${input.fileList.slice(0, 40).join("\n")}`
    : "";

  const repoCtx = input.repoContext
    ? `\nRepository context:\n${input.repoContext.slice(0, 2000)}`
    : "";

  const typeHint =
    input.inputType === "error_log"
      ? "The user has provided an error log. Identify the root cause, the file and line responsible, and generate a fix."
      : "The user has described an issue in natural language. Map it to the most likely file and code location.";

  const prompt = `You are a senior staff engineer performing targeted code review and auto-fix.

${typeHint}

User input:
"""
${input.prompt.slice(0, 1500)}
"""
${repoCtx}
${fileListContext}

Respond ONLY with a single JSON object (no markdown, no explanation):
{
  "understood": "one sentence: what the user is reporting",
  "mappedFile": "src/path/to/file.ts or null if unknown",
  "mappedLine": 42,
  "issueCategory": "security|code_smell|architecture|performance|bug",
  "severity": "critical|high|medium|low",
  "explanation": "detailed technical explanation of the issue",
  "oldCode": "the problematic code snippet or null",
  "newCode": "the corrected code snippet or null",
  "fixSuggestion": "precise actionable fix description",
  "confidenceScore": 0.87,
  "dependencyWarning": "which other files may be impacted, or null if none"
}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("No text response");

    const text = content.text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]) as TaskboxResult;
    return {
      understood: parsed.understood ?? "Issue identified",
      mappedFile: parsed.mappedFile ?? null,
      mappedLine: parsed.mappedLine ?? null,
      issueCategory: parsed.issueCategory ?? "bug",
      severity: (["critical", "high", "medium", "low"].includes(parsed.severity) ? parsed.severity : "medium") as TaskboxResult["severity"],
      explanation: parsed.explanation ?? "",
      oldCode: parsed.oldCode ?? null,
      newCode: parsed.newCode ?? null,
      fixSuggestion: parsed.fixSuggestion ?? "",
      confidenceScore: typeof parsed.confidenceScore === "number" ? Math.min(1, Math.max(0, parsed.confidenceScore)) : 0.7,
      dependencyWarning: parsed.dependencyWarning ?? null,
    };
  } catch (err) {
    logger.error({ err }, "Taskbox agent failed");
    return {
      understood: input.prompt.slice(0, 120),
      mappedFile: null,
      mappedLine: null,
      issueCategory: "bug",
      severity: "medium",
      explanation: "Unable to automatically map this issue. Please provide more context or a file path.",
      oldCode: null,
      newCode: null,
      fixSuggestion: "Manually inspect the reported area and apply the appropriate fix.",
      confidenceScore: 0.1,
      dependencyWarning: null,
    };
  }
}
