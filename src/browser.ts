import * as puppeteer from "puppeteer";
import { logger } from "./logging";

let browserPromise = puppeteer.launch({
  headless: true,
  args: ["--lang=fr-FR,fr"],
});

export function runWithBrowser<T>(
  runnable: (browser: puppeteer.Browser) => Promise<T>
): Promise<T> {
  const originalBrowserPromise = browserPromise;
  const result = browserPromise.then((browser) => {
    logger.info("Got browser instance");
    return runnable(browser);
  });
  browserPromise = result
    .then(() => {
      logger.info("Relinquishing browser instance");
      return originalBrowserPromise;
    })
    .catch(() => {
      logger.info("Relinquishing browser instance");
      return originalBrowserPromise;
    });
  return result;
}
