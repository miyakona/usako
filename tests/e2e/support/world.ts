import { setWorldConstructor, World, IWorldOptions } from "@cucumber/cucumber";
import { APIRequestContext, APIResponse } from "@playwright/test";

export interface CustomWorld extends World {
  apiContext?: APIRequestContext;
  response?: APIResponse;
  baseURL: string;
}

class PlaywrightWorld extends World implements CustomWorld {
  baseURL: string;
  apiContext?: APIRequestContext;
  response?: APIResponse;

  constructor(options: IWorldOptions) {
    super(options);
    this.baseURL = "http://localhost:8787";
  }
}

setWorldConstructor(PlaywrightWorld);
