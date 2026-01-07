import * as Sentry from "@sentry/node";

export const initSentry = (app) => {
    if (!process.env.SENTRY_DSN) return;

    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        integrations: [
            new Sentry.Integrations.Http({ tracing: true }),
            new Sentry.Integrations.Express({ app }),
        ],
        tracesSampleRate: 1.0,
    });

    // RequestHandler creates a separate execution context
    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.tracingHandler());
};

export const sentryErrorHandler = Sentry.Handlers.errorHandler();
