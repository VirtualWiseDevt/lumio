import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware.js";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../validators/category.validators.js";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/category.service.js";

export const categoryRouter = Router();

// All category routes require admin
categoryRouter.use(requireAuth, requireAdmin);

// GET / -- list all categories
categoryRouter.get("/", async (req, res) => {
  try {
    const categories = await listCategories();
    res.json(categories);
  } catch (error) {
    throw error;
  }
});

// POST / -- create category
categoryRouter.post("/", async (req, res) => {
  try {
    const result = createCategorySchema.safeParse(req.body);
    if (!result.success) {
      res.status(422).json({
        error: {
          message: result.error.errors[0].message,
          code: "VALIDATION_ERROR",
        },
      });
      return;
    }

    const category = await createCategory(result.data.name);
    res.status(201).json(category);
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as Record<string, unknown>).code === "P2002"
    ) {
      res.status(409).json({
        error: {
          message: "A category with this name already exists",
          code: "CONFLICT",
        },
      });
      return;
    }
    throw error;
  }
});

// PUT /:id -- update category
categoryRouter.put("/:id", async (req, res) => {
  try {
    const result = updateCategorySchema.safeParse(req.body);
    if (!result.success) {
      res.status(422).json({
        error: {
          message: result.error.errors[0].message,
          code: "VALIDATION_ERROR",
        },
      });
      return;
    }

    const category = await updateCategory(req.params.id, result.data.name);
    res.json(category);
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as Record<string, unknown>).code === "P2002"
    ) {
      res.status(409).json({
        error: {
          message: "A category with this name already exists",
          code: "CONFLICT",
        },
      });
      return;
    }
    if (
      error instanceof Error &&
      "code" in error &&
      (error as Record<string, unknown>).code === "P2025"
    ) {
      res.status(404).json({
        error: { message: "Category not found", code: "NOT_FOUND" },
      });
      return;
    }
    throw error;
  }
});

// DELETE /:id -- delete category
categoryRouter.delete("/:id", async (req, res) => {
  try {
    await deleteCategory(req.params.id);
    res.status(204).send();
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as Record<string, unknown>).code === "P2025"
    ) {
      res.status(404).json({
        error: { message: "Category not found", code: "NOT_FOUND" },
      });
      return;
    }
    throw error;
  }
});
