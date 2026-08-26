export interface ITermsOfUse {
  id: number;
  guid: string;
  title: string;
  // Rich text HTML from the backend's editor field — rendered via
  // dangerouslySetInnerHTML on the terms-of-use page.
  content: string;
  created_at: string;
}
