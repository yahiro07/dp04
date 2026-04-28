export function openFilePicker(options: {
  accept: string;
  onFileSelect: (file: File) => void;
}) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = options.accept;
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      options.onFileSelect(file);
    }
  };
  input.click();
}
