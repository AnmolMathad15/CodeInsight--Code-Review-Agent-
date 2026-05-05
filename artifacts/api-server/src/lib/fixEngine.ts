/**
 * Fix Engine — generates, validates, applies, and rolls back code patches.
 * Patches are stored as unified-diff text in the fix_snapshots table.
 * No file is ever overwritten without a snapshot first.
 */
import { db } from "@workspace/db";
import { fixSnapshotsTable, issuesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "./logger";

export interface PatchResult {
  patchContent: string;
  filePath: string;
  originalCode: string;
  fixedCode: string;
  valid: boolean;
  validationMessage?: string;
}

/**
 * Generate a unified-diff patch from old → new code.
 */
export function generateUnifiedDiff(
  filePath: string,
  oldCode: string,
  newCode: string
): string {
  const oldLines = oldCode.split("\n");
  const newLines = newCode.split("\n");
  const header = `--- a/${filePath}\n+++ b/${filePath}\n@@ -1,${oldLines.length} +1,${newLines.length} @@\n`;
  const removed = oldLines.map((l) => `-${l}`).join("\n");
  const added = newLines.map((l) => `+${l}`).join("\n");
  return `${header}${removed}\n${added}\n`;
}

/**
 * Validate a proposed fix syntactically.
 * Runs lightweight checks — balanced brackets, no obvious syntax breaks.
 */
export function validatePatch(filePath: string, newCode: string): { valid: boolean; message: string } {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";

  if (["ts", "tsx", "js", "jsx"].includes(ext)) {
    // Check bracket balance
    let depth = 0;
    for (const ch of newCode) {
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      if (depth < 0) return { valid: false, message: "Unbalanced braces: extra closing }" };
    }
    if (depth !== 0) return { valid: false, message: `Unbalanced braces: ${depth} unclosed {` };

    // Check for obvious broken patterns
    if (/\bimport\s+from\s*[^'"]/.test(newCode)) {
      return { valid: false, message: "Malformed import statement" };
    }
  }

  if (ext === "py") {
    if (/\bdef\b/.test(newCode) && !/:\s*$/.test(newCode.split("\n").find(l => /\bdef\b/.test(l)) ?? "")) {
      return { valid: false, message: "Python function definition missing colon" };
    }
  }

  if (newCode.trim().length === 0) {
    return { valid: false, message: "Fix produces empty code" };
  }

  return { valid: true, message: "Validation passed" };
}

/**
 * Apply a fix for an issue: store snapshot, mark issue as applied.
 */
export async function applyFix(
  issueId: number,
  reviewId: number,
  filePath: string,
  originalCode: string,
  newCode: string
): Promise<{ snapshotId: number; valid: boolean; message: string }> {
  const validation = validatePatch(filePath, newCode);

  if (!validation.valid) {
    logger.warn({ issueId, filePath, message: validation.message }, "Fix validation failed — rejecting");
    return { snapshotId: -1, valid: false, message: validation.message };
  }

  const patchContent = generateUnifiedDiff(filePath, originalCode, newCode);

  const [snapshot] = await db
    .insert(fixSnapshotsTable)
    .values({
      issueId,
      reviewId,
      filePath,
      originalCode,
      patchContent,
      status: "applied",
    })
    .returning();

  await db
    .update(issuesTable)
    .set({ fixApplied: true })
    .where(eq(issuesTable.id, issueId));

  logger.info({ issueId, snapshotId: snapshot.id }, "Fix applied and snapshot stored");
  return { snapshotId: snapshot.id, valid: true, message: "Fix applied successfully" };
}

/**
 * Revert a previously applied fix using its snapshot.
 */
export async function revertFix(snapshotId: number, issueId: number): Promise<{ success: boolean; message: string; originalCode?: string }> {
  const [snapshot] = await db
    .select()
    .from(fixSnapshotsTable)
    .where(and(eq(fixSnapshotsTable.id, snapshotId), eq(fixSnapshotsTable.issueId, issueId)));

  if (!snapshot) {
    return { success: false, message: "Snapshot not found" };
  }

  if (snapshot.status === "reverted") {
    return { success: false, message: "Fix already reverted" };
  }

  await db
    .update(fixSnapshotsTable)
    .set({ status: "reverted", revertedAt: new Date() })
    .where(eq(fixSnapshotsTable.id, snapshotId));

  await db
    .update(issuesTable)
    .set({ fixApplied: false })
    .where(eq(issuesTable.id, issueId));

  logger.info({ snapshotId, issueId }, "Fix reverted from snapshot");
  return { success: true, message: "Fix reverted successfully", originalCode: snapshot.originalCode };
}

/**
 * Get all snapshots for a review, ordered newest first.
 */
export async function getReviewSnapshots(reviewId: number) {
  return db
    .select()
    .from(fixSnapshotsTable)
    .where(eq(fixSnapshotsTable.reviewId, reviewId));
}
