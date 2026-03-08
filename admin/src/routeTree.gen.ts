import { rootRoute } from "./routes/__root";
import { loginRoute } from "./routes/login";
import { authenticatedRoute } from "./routes/_authenticated";
import { dashboardRoute } from "./routes/_authenticated/index";
import { categoriesRoute } from "./routes/_authenticated/settings/categories";
import { moviesRoute } from "./routes/_authenticated/movies/index";
import { movieNewRoute } from "./routes/_authenticated/movies/new";
import { movieEditRoute } from "./routes/_authenticated/movies/$movieId";
import { documentariesRoute } from "./routes/_authenticated/documentaries/index";
import { documentaryNewRoute } from "./routes/_authenticated/documentaries/new";
import { documentaryEditRoute } from "./routes/_authenticated/documentaries/$docId";
import { channelsRoute } from "./routes/_authenticated/channels/index";
import { channelNewRoute } from "./routes/_authenticated/channels/new";
import { channelEditRoute } from "./routes/_authenticated/channels/$channelId";
import { seriesRoute } from "./routes/_authenticated/series/index";
import { seriesNewRoute } from "./routes/_authenticated/series/new";
import { seriesDetailRoute } from "./routes/_authenticated/series/$seriesId";
import { seasonDetailRoute } from "./routes/_authenticated/series/$seriesId.seasons.$seasonId";
import { inviteCodesRoute } from "./routes/_authenticated/invite-codes/index";
import { usersRoute } from "./routes/_authenticated/users/index";
import { billingRoute } from "./routes/_authenticated/billing/index";
import { settingsRoute } from "./routes/_authenticated/settings/index";
import { activityLogsRoute } from "./routes/_authenticated/activity-logs/index";

export const routeTree = rootRoute.addChildren([
  loginRoute,
  authenticatedRoute.addChildren([
    dashboardRoute,
    categoriesRoute,
    moviesRoute,
    movieNewRoute,
    movieEditRoute,
    documentariesRoute,
    documentaryNewRoute,
    documentaryEditRoute,
    channelsRoute,
    channelNewRoute,
    channelEditRoute,
    seriesRoute,
    seriesNewRoute,
    seriesDetailRoute,
    seasonDetailRoute,
    inviteCodesRoute,
    usersRoute,
    billingRoute,
    settingsRoute,
    activityLogsRoute,
  ]),
]);
