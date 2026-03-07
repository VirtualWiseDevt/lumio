import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware.js";
import {
  contentQuerySchema,
  createContentSchema,
  updateContentSchema,
} from "../validators/content.validators.js";
import {
  listContent,
  getContent,
  createContent,
  updateContent,
  deleteContent,
  publishContent,
  unpublishContent,
} from "../services/content.service.js";

export const contentRouter = Router();

// All content routes require admin
contentRouter.use(requireAuth, requireAdmin);

// GET / -- list content with filtering/pagination
contentRouter.get("/", async (req, res) => {
  try {
    const result = contentQuerySchema.safeParse(req.query);
    if (!result.success) {
      res.status(422).json({
        error: {
          message: result.error.errors[0].message,
          code: "VALIDATION_ERROR",
        },
      });
      return;
    }

    const data = await listContent(result.data);
    res.json(data);
  } catch (error) {
    throw error;
  }
});

// GET /:id -- get single content
contentRouter.get("/:id", async (req, res) => {
  try {
    const content = await getContent(req.params.id);
    if (!content) {
      res.status(404).json({
        error: { message: "Content not found", code: "NOT_FOUND" },
      });
      return;
    }
    res.json(content);
  } catch (error) {
    throw error;
  }
});

// POST / -- create content
contentRouter.post("/", async (req, res) => {
  try {
    const result = createContentSchema.safeParse(req.body);
    if (!result.success) {
      res.status(422).json({
        error: {
          message: result.error.errors[0].message,
          code: "VALIDATION_ERROR",
        },
      });
      return;
    }

    const content = await createContent(result.data);
    res.status(201).json(content);
  } catch (error) {
    throw error;
  }
});

// PUT /:id -- update content
contentRouter.put("/:id", async (req, res) => {
  try {
    const result = updateContentSchema.safeParse(req.body);
    if (!result.success) {
      res.status(422).json({
        error: {
          message: result.error.errors[0].message,
          code: "VALIDATION_ERROR",
        },
      });
      return;
    }

    const content = await updateContent(req.params.id, result.data);
    res.json(content);
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as Record<string, unknown>).code === "P2025"
    ) {
      res.status(404).json({
        error: { message: "Content not found", code: "NOT_FOUND" },
      });
      return;
    }
    throw error;
  }
});

// DELETE /:id -- delete content
contentRouter.delete("/:id", async (req, res) => {
  try {
    await deleteContent(req.params.id);
    res.status(204).send();
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as Record<string, unknown>).code === "P2025"
    ) {
      res.status(404).json({
        error: { message: "Content not found", code: "NOT_FOUND" },
      });
      return;
    }
    throw error;
  }
});

// PATCH /:id/publish -- publish content
contentRouter.patch("/:id/publish", async (req, res) => {
  try {
    const content = await publishContent(req.params.id);
    res.json(content);
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as Record<string, unknown>).code === "P2025"
    ) {
      res.status(404).json({
        error: { message: "Content not found", code: "NOT_FOUND" },
      });
      return;
    }
    throw error;
  }
});

// PATCH /:id/unpublish -- unpublish content
contentRouter.patch("/:id/unpublish", async (req, res) => {
  try {
    const content = await unpublishContent(req.params.id);
    res.json(content);
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as Record<string, unknown>).code === "P2025"
    ) {
      res.status(404).json({
        error: { message: "Content not found", code: "NOT_FOUND" },
      });
      return;
    }
    throw error;
  }
});
