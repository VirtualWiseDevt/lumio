import { Router } from "express";
import type { Request, Response } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  getMyList,
  isInMyList,
  addToMyList,
  removeFromMyList,
} from "../services/mylist.service.js";

export const myListRouter = Router();

myListRouter.use(requireAuth);

/** GET / — Get full My List */
myListRouter.get("/", async (req: Request, res: Response) => {
  const items = await getMyList(req.user!.id);
  res.json(items);
});

/** GET /:contentId — Check if content is in My List */
myListRouter.get("/:contentId", async (req: Request, res: Response) => {
  const contentId = req.params.contentId as string;
  const inList = await isInMyList(req.user!.id, contentId);
  res.json({ inList });
});

/** POST /:contentId — Add content to My List */
myListRouter.post("/:contentId", async (req: Request, res: Response) => {
  const contentId = req.params.contentId as string;
  await addToMyList(req.user!.id, contentId);
  res.status(201).json({ success: true });
});

/** DELETE /:contentId — Remove content from My List */
myListRouter.delete("/:contentId", async (req: Request, res: Response) => {
  const contentId = req.params.contentId as string;
  await removeFromMyList(req.user!.id, contentId);
  res.json({ success: true });
});
