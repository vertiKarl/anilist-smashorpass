import { DisplayManager } from "../src/DisplayManager";

window.onload = () => {
  const arr = window.location.href.split("?");
  const compressedString = arr[arr.length - 1];
  const listElement = document.querySelector("#shareList") as HTMLUListElement;

  const results = DisplayManager.resolveShareUrl(compressedString);
  results.forEach((result) => {
    const li = document.createElement("li");
    const img = document.createElement("img");
    const p = document.createElement("p");
    p.innerText = `${result.id} (${result.type})`;
    li.append(img, p);
    listElement.append(li);
  });
};
