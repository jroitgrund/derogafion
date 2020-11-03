import * as express from "express";
import * as helmet from "helmet";
import * as path from "path";
import * as process from "process";
import { downloadPdf, IAttestionData } from "./download";
import { hostName } from "./env";
import { logger } from "./logging";
import "source-map-support/register";

const app = express();
app.use(helmet());

app.get("/derogafion", async (req, res, next) => {
  try {
    if (
      req.query.firstName != null &&
      req.query.lastName != null &&
      req.query.birthday != null &&
      req.query.placeOfBirth != null &&
      req.query.address != null &&
      req.query.city != null &&
      req.query.zipcode != null
    ) {
      const data: IAttestionData = {
        firstName: req.query.firstName as string,
        lastName: req.query.lastName as string,
        birthday: req.query.birthday as string,
        placeOfBirth: req.query.placeOfBirth as string,
        address: req.query.address as string,
        city: req.query.city as string,
        zipcode: req.query.zipcode as string,
      };
      const serialized = Buffer.from(JSON.stringify(data), "utf-8").toString(
        "base64"
      );
      res.send(
        `<p>Copiez le lien suivant et ajoutez le a vos favoris:</p>
        <textarea cols="100" rows="20">${hostName}/derogafion/?data=${serialized}</textarea>`
      );
    } else if (req.query.data != null) {
      const data: IAttestionData = JSON.parse(
        Buffer.from(req.query.data as string, "base64").toString("utf-8")
      );
      const { cleanup, path } = await downloadPdf(data);
      res.download(path, function (err) {
        if (err != null) {
          res.status(500).send();
        } else {
          res.status(200).send();
        }
        cleanup().catch(next);
      });
    } else {
      res.sendFile(path.join(process.cwd(), "src", "index.html"));
    }
  } catch (e) {
    return next(e);
  }
});

const handleErrors: express.ErrorRequestHandler = (err, req, res, next) => {
  logger.error(err.stack);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).send();
};

app.use(handleErrors);

app.listen(9876, () => {
  console.log("Listening on 9876");
});
