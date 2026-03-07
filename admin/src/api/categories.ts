import { apiClient } from "./client";

export interface Category {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export async function listCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>("/admin/categories");
  return data;
}

export async function createCategory(name: string): Promise<Category> {
  const { data } = await apiClient.post<Category>("/admin/categories", {
    name,
  });
  return data;
}

export async function updateCategory(
  id: string,
  name: string,
): Promise<Category> {
  const { data } = await apiClient.put<Category>(
    `/admin/categories/${id}`,
    { name },
  );
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/admin/categories/${id}`);
}
