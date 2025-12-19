import { AsyncLocalStorage } from "node:async_hooks";

export type RequestContext = {
  conversationId: string;
};

export const requestContext =
  new AsyncLocalStorage<RequestContext>();
