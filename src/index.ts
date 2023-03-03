import { chromium } from "playwright-extra";
import { type Page } from "playwright";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { cookies } from "./cookies";
import { ocr } from "./ocr";

chromium.use(StealthPlugin());

const TEST_CATALOG_URL = "https://m.qidian.com/book/1036010291/catalog";
// const TEST_CHAPTER_URL = "https://m.qidian.com/book/1016530091/745699266.html";
const TEST_CHAPTER_URL = "https://m.qidian.com/book/1016530091/740323163.html";

interface Chapter {
  title: string;
  url: string;
}

async function getAllChapters(page: Page): Promise<Chapter[]> {
  const steps = 10;
  const stepHeight =
    (await (await page.$("li.chapter-li"))!.boundingBox())!.height * steps;
  const chapters = await page.evaluate(
    async ([stepHeight]) => {
      const chapters: Chapter[] = [];
      let totalHeight = 0;
      while (true) {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, stepHeight);
        await new Promise((resolve) => setTimeout(resolve, 500)); // 等待加载完成

        const links: HTMLAnchorElement[] = Array.from(
          document.querySelectorAll("a.chapter-li-a")
        );
        const currentChapters: Chapter[] = links
          .map((link: HTMLAnchorElement) => ({
            url: link.getAttribute("href")!,
            title: link.innerText.split("\n")[0],
          }))
          .filter((chapter) => !chapters.some((c) => c.url === chapter.url));
        console.log(currentChapters);
        chapters.push(...currentChapters);

        totalHeight += stepHeight;
        if (totalHeight >= scrollHeight) break;
      }
      return chapters;
    },
    [stepHeight] as const
  );

  return chapters;
}

async function getChaptersContent(page: Page) {
  await page.evaluate(() => {
    var style = document.createElement("style");
    style.type = "text/css";
    style.innerHTML = `
      .page-read-top,
      .expand-hot-comment,
      .read-author-say,
      #readLoadNext,
      .review-count
      {
        display: none !important;
        opacity: 0;
        height: 0;
        overflow: hidden;
        margin: 0;
        padding: 0;
      }
      .read-article p {
          font-size: 2em !important;
          padding: 10px !important;
      }
    `; // the css content goes here
    document.getElementsByTagName("head")[0].appendChild(style);
  });
  const elements = await page.$$(".read-section>div:first-of-type>p");
  const texts = await Promise.all(
    elements.slice(0, 10).map(async (element, index) => {
      const buffer = await element.screenshot({
        path: `output/screenshot/${index}.png`,
        scale: "device",
      });
      return await ocr(`output/screenshot/${index}.png`);
    })
  );
  console.log(texts);
  // const screenshot = await element.screenshot();

  // require("fs").writeFileSync("output/screenshot.png", screenshot);
  // await page.screenshot({ path: "output/webgl.png", fullPage: true });
}

chromium.launch({ headless: false }).then(async (browser) => {
  const context = await browser.newContext();
  // @ts-ignore
  await context.addCookies(cookies);
  const page = await context.newPage();
  // await page.addStyleTag({
  //   url: "./style.css",
  // });
  await page.setViewportSize({ width: 500, height: 844 });

  console.log("Testing the webgl spoofing feature of the stealth plugin..");
  // await page.goto(TEST_CATALOG_URL, { waitUntil: "networkidle" });

  // const chapters = await getAllChapters(page);

  // console.log(chapters.map((c) => c.title));

  await page.goto(TEST_CHAPTER_URL, { waitUntil: "networkidle" });
  await getChaptersContent(page);

  console.log("All done, check the screenshot. ✨");
  await browser.close();
});
