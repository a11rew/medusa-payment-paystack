import { Router } from "express";
import bodyParser from "body-parser";
import middlewares from "../../middlewares";

const route = Router();

export default (app) => {
  app.use("/paystack", route);

  route.use(bodyParser.json());
  route.post("/push", middlewares.wrap(require("./push").default));

  return app;
};
