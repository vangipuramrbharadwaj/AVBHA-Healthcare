export function printCurrentPage(title?: string) {
  const previousTitle = document.title;

  if (title) {
    document.title = title;
  }

  window.print();

  window.setTimeout(() => {
    document.title = previousTitle;
  }, 300);
}

export function downloadJson(
  filename: string,
  value: unknown,
) {
  const blob = new Blob(
    [JSON.stringify(value, null, 2)],
    { type: "application/json;charset=utf-8" },
  );
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
