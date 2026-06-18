declare module "pagedjs" {
  export class Previewer {
    constructor(settings?: Record<string, unknown>);
    preview(content: string | Node, stylesheets: Array<string | Record<string, string>>, renderTo: HTMLElement): Promise<{ total: number; pages?: unknown[] }>;
  }
}