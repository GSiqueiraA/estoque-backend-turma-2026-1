import { setWorldConstructor, World } from "@cucumber/cucumber";
import { chromium } from "playwright";
import type { Browser, Page } from "playwright";

const config = {
  baseURL: "http://localhost:5173",
  headless: true,
  slowMo: 0,
};

export class CustomWorld extends World {
  browser?: Browser;
  page?: Page;

  async init(): Promise<void> {
    this.browser = await chromium.launch({
      headless: config.headless,
      slowMo: config.slowMo,
    });
    this.page = await this.browser.newPage({ baseURL: config.baseURL });
  }

  async close(): Promise<void> {
    await this.page?.close();
    await this.browser?.close();
  }
}

setWorldConstructor(CustomWorld);
