import { prisma } from "../config/database.js";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
  });
}

export async function createCategory(name: string) {
  const slug = slugify(name);
  return prisma.category.create({
    data: { name, slug },
  });
}

export async function updateCategory(id: string, name: string) {
  const slug = slugify(name);
  return prisma.category.update({
    where: { id },
    data: { name, slug },
  });
}

export async function deleteCategory(id: string) {
  return prisma.category.delete({ where: { id } });
}
