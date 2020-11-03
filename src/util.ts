import * as fs from "fs";
import * as util from "util";

export const mkdtemp = util.promisify(fs.mkdtemp);
export const readdir = util.promisify(fs.readdir);
export const rmdir = util.promisify(fs.rmdir);
export const readfile = util.promisify(fs.readFile);

export function waitFor(predicate: () => Promise<boolean>): Promise<void> {
  let attempts = 0;
  return new Promise((resolve, reject) => {
    async function checkAndResolve() {
      if (await predicate()) {
        resolve();
      } else if (attempts >= 20) {
        reject(new Error("Waited more than 20 seconds"));
      } else {
        attempts++;
        setTimeout(checkAndResolve, 1000);
      }
    }

    setTimeout(checkAndResolve, 1000);
  });
}
