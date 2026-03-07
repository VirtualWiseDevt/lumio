import { rootRoute } from "./routes/__root";
import { loginRoute } from "./routes/login";
import { authenticatedRoute } from "./routes/_authenticated";
import { dashboardRoute } from "./routes/_authenticated/index";
import { categoriesRoute } from "./routes/_authenticated/settings/categories";

export const routeTree = rootRoute.addChildren([
  loginRoute,
  authenticatedRoute.addChildren([dashboardRoute, categoriesRoute]),
]);
