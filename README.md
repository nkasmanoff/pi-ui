## Environment

Set the following environment variables in your shell or `.env.local`:

-   `OPENROUTER_API_KEY` — for chat completions.
-   `OPENROUTER_SITE_URL` — optional, referer header for OpenRouter.
-   `OPENROUTER_SITE_NAME` — optional, title header for OpenRouter.
-   `OPENROUTER_FUNFACTS_MODEL` — optional, override model used by `/api/funfacts`.
-   `TOMORROWIO_API_KEY` — for weather data.
-   `GNEWS_API_KEY` — optional; if set, `/api/news` uses GNews. If unset, it falls back to Hacker News front page (no key needed).

## Notes

-   Chat has a system prompt identifying the user as Noah.
-   The Reset button layout was adjusted to avoid background overlap.
-   News widget pulls from `/api/news` with loading/error/empty states.
