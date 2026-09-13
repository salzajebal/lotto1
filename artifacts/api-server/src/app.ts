import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "node:path";
import { existsSync } from "node:fs";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("trust proxy", 1);

app.use("/api", router);

if (process.env.NODE_ENV === "production") {
  const webDistDir =
    process.env.WEB_DIST_DIR ??
    path.resolve(process.cwd(), "artifacts/lotto-analysis-home/dist/public");
  const indexFile = path.join(webDistDir, "index.html");

  if (!existsSync(indexFile)) {
    throw new Error(
      `Frontend build not found at ${indexFile}. Run the VPS build command first.`,
    );
  }

  app.use(express.static(webDistDir, { index: false, maxAge: "1d" }));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) {
      next();
      return;
    }
    res.sendFile(indexFile);
  });
}

export default app;
