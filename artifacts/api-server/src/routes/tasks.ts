import { Router } from "express";
import { clerkMiddleware, getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { tasksTable, reviewsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { runTaskboxAgent } from "../lib/taskboxAgent";

const tasksRouter = Router();
tasksRouter.use(clerkMiddleware());

/** GET /api/tasks  — list recent tasks for user */
tasksRouter.get("/", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const tasks = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.userId, userId))
    .orderBy(desc(tasksTable.createdAt))
    .limit(20);

  return res.json(tasks);
});

/** POST /api/tasks  — create and run a taskbox analysis */
tasksRouter.post("/", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { prompt, inputType = "text", reviewId } = req.body as {
    prompt: string;
    inputType?: "text" | "error_log";
    reviewId?: number;
  };

  if (!prompt?.trim()) return res.status(400).json({ error: "prompt is required" });

  // Create task record as pending
  const [task] = await db.insert(tasksTable).values({
    userId,
    prompt,
    inputType,
    reviewId: reviewId ?? null,
    status: "processing",
  }).returning();

  // Fetch repo context if reviewId provided
  let repoContext: string | undefined;
  let fileList: string[] | undefined;

  if (reviewId) {
    const [review] = await db.select().from(reviewsTable).where(eq(reviewsTable.id, reviewId));
    if (review?.repoUrl) {
      repoContext = `Repository: ${review.repoUrl}\nRepo: ${review.repoName ?? "unknown"}`;
    }
  }

  try {
    const result = await runTaskboxAgent({ prompt, inputType, repoContext, fileList });

    await db.update(tasksTable).set({
      status: "completed",
      result: result as Record<string, unknown>,
      completedAt: new Date(),
    }).where(eq(tasksTable.id, task.id));

    return res.status(201).json({ ...task, status: "completed", result });
  } catch (err) {
    await db.update(tasksTable).set({
      status: "failed",
      errorMessage: err instanceof Error ? err.message : "Unknown error",
    }).where(eq(tasksTable.id, task.id));

    return res.status(500).json({ error: "Task processing failed" });
  }
});

export default tasksRouter;
