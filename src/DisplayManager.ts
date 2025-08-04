import {
  ApiConnector,
  type CacheElement,
  type QueryOptions,
} from "./api_connector";

export type InteractionType = "smash" | "pass";

export interface InteractionContent {
  type: InteractionType;
  characters: CacheElement[];
  buttonElement: HTMLButtonElement;
  historyElement: HTMLDivElement;
  amountElement: HTMLParagraphElement;
}

const keys = [
  ...Array.from({ length: 10 }, (_, i) => String(i)), // '0' to '9'
  ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i)), // 'a' to 'z'
  ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)), // 'A' to 'Z'
];

export class DisplayManager {
  private history: Record<InteractionType, InteractionContent>;
  private connector: ApiConnector;
  private currentCharacter: CacheElement | null = null;
  private interactionDisabled = true;

  constructor(username: string, options?: QueryOptions) {
    this.connector = new ApiConnector(username, options);

    this.history = {
      smash: {
        type: "smash",
        characters: [],
        buttonElement: document.querySelector("#smash") as HTMLButtonElement,
        historyElement: document.querySelector(
          "#smashHistory"
        ) as HTMLDivElement,
        amountElement: document.querySelector(
          "#smashedAmount"
        ) as HTMLParagraphElement,
      },
      pass: {
        type: "pass",
        characters: [],
        buttonElement: document.querySelector("#pass") as HTMLButtonElement,
        historyElement: document.querySelector(
          "#passHistory"
        ) as HTMLDivElement,
        amountElement: document.querySelector(
          "#passedAmount"
        ) as HTMLParagraphElement,
      },
    };

    const loader = document.querySelector("#loader") as HTMLSpanElement;
    loader.classList.remove("hide");

    this.connector.waitTillReady().then(() => {
      const char = this.connector.pickNewCharacter();
      this.presentCharacter(char || undefined);

      loader.classList.add("hide");
      this.history.smash.buttonElement.classList.remove("hide");
      this.history.smash.buttonElement.onclick = () => {
        if (!this.interactionDisabled)
          this.handleInteraction(this.history.smash);
      };
      this.history.pass.buttonElement.classList.remove("hide");
      this.history.pass.buttonElement.onclick = () => {
        if (!this.interactionDisabled)
          this.handleInteraction(this.history.pass);
      };

      const characterCard = document.querySelector(
        "#character-card"
      ) as HTMLDivElement;
      characterCard.classList.remove("hide");
      this.interactionDisabled = false;
    });
  }

  /**
   * Enables or disables the ability for the user to "smash" or "pass"
   * @param bool true to enable interaction elements
   */
  private changeInteractionEnabled(bool: boolean) {
    this.interactionDisabled = bool;

    this.history.pass.buttonElement.setAttribute("disabled", `${bool}`);
    this.history.smash.buttonElement.setAttribute("disabled", `${bool}`);
  }

  getAverageAge(type: InteractionType) {
    const chars = this.history[type].characters;
    let averageAge = 0;
    let charAmount = 0;

    chars.forEach((char) => {
      const age = Number(char.character.age);
      if (age) {
        averageAge += age;
        charAmount++;
      }
    });

    return averageAge / charAmount;
  }

  getAmount(type: InteractionType) {
    return this.history[type].characters.length;
  }

  /**
   * Compresses an id and state into a 4 byte ascii string for url generation
   * @param id character id (or other numbers that don't go higher than 14776336)
   * @param smashed a single bit that gets encoded at the end
   * @returns
   */
  private static compress(id: number, smashed: boolean) {
    let result = "";
    id = (id << 1) + (smashed ? 1 : 0);
    while (id > 0) {
      const remainder = id % keys.length;
      result = keys[remainder] + result;
      id = Math.floor(id / keys.length);
    }

    while (4 - result.length !== 0 && result.length < 4) {
      result = "0" + result;
    }

    if (result.length > 4) {
      throw new Error(
        "Compressing failed, invalid packet received: " +
          result +
          " " +
          id +
          " " +
          smashed
      );
    }

    return result;
  }

  /**
   * Decompresses a string of variable string length
   * @param str The string to decompress
   * @returns An object containing an id and state
   */
  private static decompress(str: string) {
    let result = 0;
    for (let i = 0; i < str.length; i++) {
      const value = keys.indexOf(str[i]);
      if (value === -1) {
        throw new Error("Invalid character in share url!");
      }
      result = result + Math.pow(keys.length, str.length - i - 1) * value;
    }

    const id = result >> 1;
    const type: InteractionType = result % 2 === 1 ? "smash" : "pass";

    return { id, type };
  }

  /**
   * Compresses the ids and states of the character statistics
   * @returns a relative url leading to the shared page
   */
  generateShareUrl() {
    let str = "";
    this.history.smash.characters.forEach((char) => {
      str += DisplayManager.compress(char.character.id, true);
    });
    this.history.pass.characters.forEach((char) => {
      str += DisplayManager.compress(char.character.id, false);
    });

    return "/anilist-smashorpass/share/?" + str;
  }

  /**
   * Decompresses a generated URL by splitting it into 4 byte blocks
   * @param str the URL string to decompress
   * @returns An array of results
   */
  public static resolveShareUrl(str: string) {
    const arr: {
      id: number;
      type: InteractionType;
    }[] = [];
    for (let i = 0; i < str.length; i += 4) {
      const string = str.slice(i, i + 4);
      arr.push(this.decompress(string));
    }
    return arr;
  }

  presentCharacter(char?: CacheElement) {
    this.currentCharacter = char || null;
    const img = document.querySelector("#character-image") as HTMLImageElement;
    const name = document.querySelector(
      "#character-name"
    ) as HTMLHeadingElement;
    const age = document.querySelector("#character-age") as HTMLHeadingElement;
    const animeElement = document.querySelector(
      "#character-anime"
    ) as HTMLAnchorElement;
    const listElement = document.querySelector(
      "#character-list"
    ) as HTMLParagraphElement;

    if (!img || !name || !age || !animeElement || !listElement) {
      throw new Error("HTML Element went missing...");
    }

    if (char) {
      const { character, anime, list } = char;
      img.src = character.image.large;
      name.innerHTML = character.name.full;
      age.innerHTML = character.age || "?";
      animeElement.innerHTML =
        anime.media.title.english || anime.media.title.native;
      if (anime) {
        animeElement.href = anime.media.siteUrl;
        animeElement.classList.remove("hide");
      } else {
        animeElement.classList.add("hide");
      }

      listElement.classList.remove("hide");
      listElement.innerText = list.name;
    } else {
      // placeholder image, will probably be changed later
      img.src =
        "https://cdn.pixabay.com/photo/2025/01/05/10/07/daffodils-9311747_1280.png";
      name.innerHTML = "No more characters";
      age.innerHTML = "";
      animeElement.classList.add("hide");
      listElement.classList.add("hide");
      this.changeInteractionEnabled(false);
    }
  }

  handleInteraction(content: InteractionContent) {
    const historyEntry = document.createElement("div");
    const historyEntryImg = document.createElement("img");
    const historyEntryText = document.createElement("p");
    const currentCharacter = this.currentCharacter;
    if (!currentCharacter) {
      throw new Error("No character to interact with!");
    }

    content.characters.push(currentCharacter);

    const animeName = currentCharacter.anime.media.title.english
      ? currentCharacter.anime.media.title.english
      : currentCharacter.anime.media.title.native;

    historyEntryText.innerHTML = `${currentCharacter.character.name.full} (${animeName})`;
    historyEntryImg.src = currentCharacter.character.image.large;

    historyEntry.append(historyEntryImg, historyEntryText);
    content.historyElement.append(historyEntry);

    console.log(
      this.history.pass.characters.length +
        this.history.smash.characters.length +
        "/" +
        this.connector.originalAmount
    );

    const char = this.connector.pickNewCharacter();
    this.presentCharacter(char || undefined);

    content.amountElement.innerHTML = content.characters.length.toString();
  }
}
