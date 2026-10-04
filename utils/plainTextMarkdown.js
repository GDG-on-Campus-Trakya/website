// Announcements are typed into a plain textarea, not written as Markdown. Before they are
// rendered as Markdown, single line breaks become hard breaks (Markdown would join the lines)
// and bare links with a path, such as "goo.gl/studentsoffer", become clickable.
const BARE_LINK = /(^|\s)((?:[a-z0-9-]+\.)+[a-z]{2,}\/[^\s<>()[\]]*[^\s<>()[\].,;:!?])/gi;

export function plainTextToMarkdown(text = "") {
  return text
    .replace(/\r\n/g, "\n")
    .replace(BARE_LINK, (match, before, link) => `${before}[${link}](https://${link})`)
    .replace(/([^\n])\n(?=[^\n])/g, "$1  \n");
}
