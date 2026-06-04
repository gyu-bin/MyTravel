import { loadEnv } from "vite";

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      if (!data) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function createResponseAdapter(res) {
  return {
    status(code) {
      res.statusCode = code;
      return this;
    },
    json(payload) {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(payload));
    },
  };
}

const ROUTES = {
  "/api/prepare-order": {
    methods: ["POST"],
    load: () => import("./api/prepare-order.js"),
  },
  "/api/confirm-payment": {
    methods: ["POST"],
    load: () => import("./api/confirm-payment.js"),
  },
  "/api/verify-paddle": {
    methods: ["POST"],
    load: () => import("./api/verify-paddle.js"),
  },
  "/api/payment-demand": {
    methods: ["POST"],
    load: () => import("./api/payment-demand.js"),
  },
  "/api/payment-demand-stats": {
    methods: ["GET"],
    load: () => import("./api/payment-demand-stats.js"),
  },
};

export function devApiPlugin(mode) {
  const env = loadEnv(mode, process.cwd(), "");
  Object.assign(process.env, env);

  return {
    name: "dev-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || "/", "http://localhost");
        const pathname = url.pathname;
        const route = ROUTES[pathname];
        if (!route) return next();

        if (!route.methods.includes(req.method)) {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: false, error: "Method not allowed" }));
          return;
        }

        try {
          const { default: handler } = await route.load();
          const body =
            req.method === "POST" ? await readJsonBody(req) : undefined;
          await handler(
            {
              method: req.method,
              body,
              headers: req.headers,
              query: Object.fromEntries(url.searchParams),
            },
            createResponseAdapter(res),
          );
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              ok: false,
              error: err.message || "Internal server error",
            }),
          );
        }
      });
    },
  };
}
