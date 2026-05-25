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
  "/api/prepare-order": () => import("./api/prepare-order.js"),
  "/api/confirm-payment": () => import("./api/confirm-payment.js"),
};

export function devApiPlugin(mode) {
  const env = loadEnv(mode, process.cwd(), "");
  Object.assign(process.env, env);

  return {
    name: "dev-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url?.split("?")[0];
        const loadHandler = ROUTES[pathname];
        if (!loadHandler) return next();

        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: false, error: "Method not allowed" }));
          return;
        }

        try {
          const { default: handler } = await loadHandler();
          const body = await readJsonBody(req);
          await handler(
            { method: req.method, body },
            createResponseAdapter(res)
          );
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              ok: false,
              error: err.message || "Internal server error",
            })
          );
        }
      });
    },
  };
}
