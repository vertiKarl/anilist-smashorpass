import { SmashState } from "../src/Character";
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

    let type: string;
    switch (result.type) {
      case SmashState.SMASHED:
        type = "smashed";
        break;
      case SmashState.PASSED:
        type = "passed";
        break;
      default:
        type = "undecided";
        break;
    }

    p.innerText = `${result.id} (${type})`;
    li.append(img, p);
    listElement.append(li);
  });
};
