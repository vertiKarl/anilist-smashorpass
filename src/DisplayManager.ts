import { ApiConnector, type QueryOptions } from "./api_connector";

export type InteractionType = "smash" | "pass";

export interface InteractionContent {
  type: InteractionType;
  buttonElement: HTMLButtonElement;
  historyElement: HTMLDivElement;
  amount: number;
  amountElement: HTMLParagraphElement;
}

export class DisplayManager {
  private history: Record<InteractionType, InteractionContent>;
  private connector: ApiConnector;

  constructor(username: string, options?: QueryOptions) {
    this.connector = new ApiConnector(username, options);

    this.history = {
      smash: {
        type: "smash",
        buttonElement: document.querySelector("#smash") as HTMLButtonElement,
        historyElement: document.querySelector(
          "#smashHistory"
        ) as HTMLDivElement,
        amount: 0,
        amountElement: document.querySelector(
          "#smashedAmount"
        ) as HTMLParagraphElement,
      },
      pass: {
        type: "pass",
        buttonElement: document.querySelector("#pass") as HTMLButtonElement,
        historyElement: document.querySelector(
          "#passHistory"
        ) as HTMLDivElement,
        amount: 0,
        amountElement: document.querySelector(
          "#passedAmount"
        ) as HTMLParagraphElement,
      },
    };

    const loader = document.querySelector("#loader") as HTMLSpanElement;
    loader.classList.remove("hide");

    this.connector.waitTillReady().then(() => {
      loader.classList.add("hide");
      this.history.smash.buttonElement.classList.remove("hide");
      this.history.smash.buttonElement.onclick = () => {
        this.handleInteraction(this.history.smash);
      };
      this.history.pass.buttonElement.classList.remove("hide");
      this.history.pass.buttonElement.onclick = () => {
        this.handleInteraction(this.history.pass);
      };
    });
  }

  handleInteraction(content: InteractionContent) {
    const historyEntry = document.createElement("div");
    const historyEntryImg = document.createElement("img");
    const historyEntryText = document.createElement("p");
    const currentCharacter = this.connector.getCurrentCharacter();
    if (!currentCharacter) {
      throw new Error("No character to interact with!");
    }

    historyEntryText.innerHTML = `${currentCharacter.character.name.full} (${currentCharacter.anime})`;
    historyEntryImg.src = currentCharacter.character.image.large;

    historyEntry.append(historyEntryImg, historyEntryText);
    content.historyElement.append(historyEntry);

    this.connector.pickNewCharacter();

    content.amountElement.innerHTML = (++content.amount).toString();
    console.log(content.type, content.amount);
  }
}
