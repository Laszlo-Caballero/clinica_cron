import { convert } from "html-to-text";

function fixEncoding(text: string): string {
  return decodeURIComponent(encodeURIComponent(text));
}

export function parseHtml(html: string) {
  const text = convert(html, {
    wordwrap: 130,
  });

  const parsedText = fixEncoding(text);

  return parsedText;
}
