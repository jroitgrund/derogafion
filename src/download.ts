import * as dayjs from "dayjs";
import * as timezone from "dayjs/plugin/timezone";
import * as utc from "dayjs/plugin/utc";
import * as lodash from "lodash";
import * as path from "path";
import { runWithBrowser } from "./browser";
import { mkdtemp, readdir, rmdir, waitFor } from "./util";

dayjs.extend(utc);
dayjs.extend(timezone);

export interface IAttestionData {
  firstName: string;
  lastName: string;
  birthday: string;
  placeOfBirth: string;
  address: string;
  city: string;
  zipcode: string;
}

export interface IDownloadedPdf {
  cleanup: () => Promise<void>;
  path: string;
}

export async function downloadPdf(
  data: IAttestionData
): Promise<IDownloadedPdf> {
  const tempDir: string = await mkdtemp("pdfs");
  return runWithBrowser(async (browser) => {
    const page = await browser.newPage();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (page as any)._client.send("Page.setDownloadBehavior", {
        behavior: "allow",
        downloadPath: tempDir,
      });

      const date = dayjs().tz("Europe/Paris").subtract(15, "minute");
      const formattedTime = date.format("HH:mm");

      await page.goto("https://media.interieur.gouv.fr/deplacement-covid-19/");
      await page.type("#field-firstname", data.firstName);
      await page.type("#field-lastname", data.lastName);
      await page.type("#field-birthday", data.birthday);
      await page.type("#field-placeofbirth", data.placeOfBirth);
      await page.type("#field-address-label", data.address);
      await page.type("#field-city-label", data.city);
      await page.type("#field-zipcode-label", data.zipcode);
      await page.evaluate((formattedTimeArg) => {
        (document.getElementById(
          "field-heuresortie"
        ) as HTMLTimeElement).dateTime = formattedTimeArg;
      }, formattedTime);
      await page.click("#checkbox-sport_animaux");
      await page.click("#generate-btn");
      try {
        await waitFor(async () =>
          lodash.some(await readdir(tempDir), (file) => file.endsWith(".pdf"))
        );
      } catch (e) {
        await page.screenshot({
          path: `${new Date().getUTCMilliseconds()}.jpg`,
          type: "jpeg",
          fullPage: true,
        });
        throw e;
      }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const file = lodash.find(await readdir(tempDir), (file) =>
        file.endsWith(".pdf")
      )!;
      return {
        cleanup: () => rmdir(tempDir, { recursive: true }),
        path: path.join(tempDir, file),
      };
    } finally {
      page.close();
    }
  }).catch((e) => {
    rmdir(tempDir, { recursive: true });
    throw e;
  });
}
