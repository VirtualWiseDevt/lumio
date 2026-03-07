import { rootRoute } from "./routes/__root";
import { loginRoute } from "./routes/login";
import { authenticatedRoute } from "./routes/_authenticated";
import { dashboardRoute } from "./routes/_authenticated/index";
import { categoriesRoute } from "./routes/_authenticated/settings/categories";
import { moviesRoute } from "./routes/_authenticated/movies/index";
import { documentariesRoute } from "./routes/_authenticated/documentaries/index";
import { channelsRoute } from "./routes/_authenticated/channels/index";

export const routeTree = rootRoute.addChildren([
  loginRoute,
  authenticatedRoute.addChildren([
    dashboardRoute,
    categoriesRoute,
    moviesRoute,
    documentariesRoute,
    channelsRoute,
  ]),
]);
