import { DisplayManager } from "./DisplayManager";
import type { Role } from "./api_connector";
import "./style.css";

window.onload = () => {
  const configForm = document.querySelector("#configForm") as HTMLFormElement;
  configForm.onsubmit = (event) => {
    event.preventDefault();
    if (!event.target) return;
    const data = new FormData(event.target as HTMLFormElement);
    const props = Object.fromEntries(data);

    let role: Role;
    switch (props.role.toString()) {
      case "Main":
        role = "MAIN";
        break;
      case "Background":
        role = "BACKGROUND";
        break;
      case "Supporting":
        role = "SUPPORTING";
        break;
      default:
        role = "ALL";
        break;
    }

    new DisplayManager(props.username as string, {
      role,
      gender: props.gender.toString(),
    });

    configForm.classList.add("hide");
  };
};

(window as any).showSmashHistory = () => {
  console.log("toggle");
  const element = document.querySelector("#smashHistoryContainer");
  element?.classList.toggle("hide");
};

(window as any).showPassHistory = () => {
  console.log("toggle");
  const element = document.querySelector("#passHistoryContainer");
  element?.classList.toggle("hide");
};
