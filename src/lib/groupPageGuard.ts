import { redirect } from "@tanstack/react-router";
import { localePath } from "./locale";
import { localeFromParam } from "./seoHead";
import { isGroupPageAvailable, type GroupPageKey } from "./travelNavigation";

/** beforeLoad guard: unfinished group pages redirect home on the published site. */
export function guardGroupPage(page: GroupPageKey, localeParam: string | undefined) {
  if (!isGroupPageAvailable(page, import.meta.env.PROD)) {
    throw redirect({ href: localePath("/", localeFromParam(localeParam)) });
  }
}

/** Adds noindex to a head() result while the page is not live. */
export function withGroupNoindex<T extends { meta: unknown[] }>(page: GroupPageKey, head: T): T {
  if (isGroupPageAvailable(page, true)) return head;
  return { ...head, meta: [...head.meta, { name: "robots", content: "noindex, nofollow" }] } as T;
}
