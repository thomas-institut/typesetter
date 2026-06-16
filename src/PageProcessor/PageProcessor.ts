import {TypesetterPage} from "@/TypesetterPage";

export class PageProcessor {

  /**
   * Performs an operation on the page
   */
  async process(page: TypesetterPage): Promise<TypesetterPage> {
    return page;
  }
}