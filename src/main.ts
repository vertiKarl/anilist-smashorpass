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

    const dm = new DisplayManager(props.username as string, {
      role,
      gender: props.gender.toString(),
      minAge: props.minAge.toString(),
      maxAge: props.maxAge.toString(),
    });

    configForm.classList.add("hide");

    (window as any).showShareMenu = () => {
      const smashAvgAge = dm.getAverageAge("smash");
      const passAvgAge = dm.getAverageAge("pass");
      const totalAvgAge = (smashAvgAge + passAvgAge) / 2;

      const smashAmount = document.querySelector(
        "#statSmashAmount"
      ) as HTMLParagraphElement;
      smashAmount.innerText = dm.getAmount("smash").toString() || "0";

      const smashAge = document.querySelector(
        "#statSmashAge"
      ) as HTMLParagraphElement;
      smashAge.innerText = smashAvgAge.toFixed(1).toString();

      const passAmount = document.querySelector(
        "#statPassAmount"
      ) as HTMLParagraphElement;
      passAmount.innerText = dm.getAmount("pass").toString() || "0";

      const passAge = document.querySelector(
        "#statPassAge"
      ) as HTMLParagraphElement;
      passAge.innerText = passAvgAge.toFixed(1).toString();

      const element = document.querySelector("#shareContainer");
      element?.classList.toggle("hide");
    };
    (window as any).share = () => {
      const url = dm.generateShareUrl();

      window.location.href = url;
    };
  };
};

(window as any).showSmashHistory = () => {
  const element = document.querySelector("#smashHistoryContainer");
  element?.classList.toggle("hide");
};

(window as any).showPassHistory = () => {
  const element = document.querySelector("#passHistoryContainer");
  element?.classList.toggle("hide");
};
