import { Router } from "express";
import type { Request, Response } from "express";
import {
  getHomePageData,
  getBrowsePageData,
  getLiveTvData,
  getTitleDetail,
  getSimilarTitles,
  searchContent,
} from "../services/browse.service.js";

export const browseRouter = Router();

// GET / - Home page data
browseRouter.get("/", async (_req: Request, res: Response) => {
  const data = await getHomePageData();
  res.json(data);
});

// GET /movies - Movies browse page
browseRouter.get("/movies", async (_req: Request, res: Response) => {
  const data = await getBrowsePageData("MOVIE");
  res.json(data);
});

// GET /series - Series browse page
browseRouter.get("/series", async (_req: Request, res: Response) => {
  const data = await getBrowsePageData("SERIES");
  res.json(data);
});

// GET /documentaries - Documentaries browse page
browseRouter.get("/documentaries", async (_req: Request, res: Response) => {
  const data = await getBrowsePageData("DOCUMENTARY");
  res.json(data);
});

// GET /live-tv - Live TV page
browseRouter.get("/live-tv", async (_req: Request, res: Response) => {
  const data = await getLiveTvData();
  res.json(data);
});

// GET /search - Search content
browseRouter.get("/search", async (req: Request, res: Response) => {
  const q = req.query.q;
  if (!q || typeof q !== "string" || q.trim().length < 1) {
    res.status(400).json({ error: "Query parameter 'q' is required (min 1 character)" });
    return;
  }
  const data = await searchContent(q.trim());
  res.json(data);
});

// GET /title/:id - Title detail
browseRouter.get("/title/:id", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = await getTitleDetail(id);
  if (!data) {
    res.status(404).json({ error: "Title not found" });
    return;
  }
  res.json(data);
});

// GET /title/:id/similar - Similar titles
browseRouter.get("/title/:id/similar", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = await getSimilarTitles(id);
  res.json(data);
});
