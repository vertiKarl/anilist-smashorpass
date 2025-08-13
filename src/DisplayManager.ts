import { SmashState } from "./Character";
import {
  ApiConnector,
  type CacheElement,
  type QueryOptions,
} from "./api_connector";
import { getDateString, getNumbersAtStartOfString } from "./util";

export type InteractionType = "smash" | "pass";

export interface InteractionContent {
  type: InteractionType;
  buttonElement: HTMLButtonElement;
  historyElement: HTMLDivElement;
  amountElement: HTMLParagraphElement;
}

const keys = [
  ...Array.from({ length: 10 }, (_, i) => String(i)), // '0' to '9'
  ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i)), // 'a' to 'z'
  ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)), // 'A' to 'Z'
];

type Navigation = "PREVIOUS" | "NEXT";

export class DisplayManager {
  private history: Record<InteractionType, InteractionContent>;
  private characters: CacheElement[] = [];
  private connector: ApiConnector;
  private currentCharacter = 0;
  private interactionEnabled = false;
  private navigationButtons: Record<Navigation, HTMLButtonElement | null>;

  constructor(username: string, options?: QueryOptions) {
    this.connector = new ApiConnector(username, options);

    this.history = {
      smash: {
        type: "smash",
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

    this.navigationButtons = {
      PREVIOUS: document.getElementById("previous") as HTMLButtonElement,
      NEXT: document.getElementById("next") as HTMLButtonElement,
    };

    this.connector.waitTillReady().then(() => {
      DEBUG: console.log("[dm-connector] ready");
      const characters = this.connector.getCharacterList();
      if (!characters) throw new Error("Failed retrieving character list!");

      this.characters = characters;
      this.setupAnimations();
      const progress = document.querySelector(
        "#progress"
      ) as HTMLHeadingElement;
      progress.classList.remove("hide");
      this.presentCharacter(0);

      loader.classList.add("hide");

      for (const [type, button] of Object.entries(this.navigationButtons)) {
        if (button) {
          button.classList.remove("hide");
          button.onclick = () => {
            if (this.interactionEnabled) {
              (type as Navigation) === "PREVIOUS" && this.previousCharacter();
              (type as Navigation) === "NEXT" && this.nextCharacter();
            }
          };
        }
      }

      this.history.smash.buttonElement.classList.remove("hide");
      this.history.smash.buttonElement.onclick = () => {
        if (this.interactionEnabled) this.handleInteraction(this.history.smash);
      };
      this.history.pass.buttonElement.classList.remove("hide");
      this.history.pass.buttonElement.onclick = () => {
        if (this.interactionEnabled) this.handleInteraction(this.history.pass);
      };

      const characterCard = document.querySelector(
        "#character-card"
      ) as HTMLDivElement;
      characterCard.classList.remove("hide");
      this.interactionEnabled = true;

      (window as any).showSmashHistory = () => {
        const element = document.querySelector("#smashHistoryContainer");
        if (element?.classList.contains("hide")) {
          this.buildHistoryElement(SmashState.SMASHED);
        }

        element?.classList.toggle("hide");
      };

      (window as any).showPassHistory = () => {
        const element = document.querySelector("#passHistoryContainer");
        if (element?.classList.contains("hide")) {
          this.buildHistoryElement(SmashState.PASSED);
        }

        element?.classList.toggle("hide");
      };
    });
  }

  private setupAnimations() {
    const card = document.querySelector("#character-card") as HTMLDivElement;
    card.onclick = () => {
      if (this.interactionEnabled) card.classList.toggle("flipped");
    };

    let reset = true;
    window.addEventListener("mousemove", (e) => {
      if (card.classList.contains("flipped") || !this.interactionEnabled) {
        if (!reset) {
          card.style.setProperty("--rotateX", `0deg`);
          card.style.setProperty("--rotateY", `0deg`);
        }
        return;
      }

      reset = false;
      const rect = card.getBoundingClientRect();

      // Center of the div
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Calculate offset from center (-1 to 1)
      const offsetX = (e.clientX - centerX) / (rect.width / 2);
      const offsetY = (centerY - e.clientY) / (rect.height / 2); // invert Y for intuitive tilt

      // Maximum rotation angle in degrees
      const maxRotation = 0.6;

      const rotateX = offsetY * maxRotation;
      const rotateY = offsetX * maxRotation;

      card.style.setProperty("--rotateX", `${rotateX}deg`);
      card.style.setProperty("--rotateY", `${rotateY}deg`);
    });
  }

  private buildHistoryElement(type: SmashState) {
    const container =
      type === SmashState.SMASHED
        ? document.querySelector("#smashHistory")
        : document.querySelector("#passHistory");
    if (!container)
      throw new Error("Can't build history element, container is missing");

    this.characters.forEach((char) => {
      if (char.character.smashState === type) {
        const historyEntry = document.createElement("div");
        const historyEntryImg = document.createElement("img");
        const historyEntryText = document.createElement("p");

        const animeName = char.anime.media.title.english
          ? char.anime.media.title.english
          : char.anime.media.title.native;

        historyEntryText.innerHTML = `${char.character.name.full} (${animeName})`;
        historyEntryImg.src = char.character.image.large;

        historyEntry.append(historyEntryImg, historyEntryText);
        container.append(historyEntry);
      }
    });
  }

  private nextCharacter() {
    if (this.currentCharacter < this.characters.length) {
      this.presentCharacter(++this.currentCharacter);
    }
  }

  private previousCharacter() {
    if (this.currentCharacter > 0) {
      this.presentCharacter(--this.currentCharacter);
    }
  }

  /**
   * Enables or disables the ability for the user to "smash" or "pass"
   * @param bool true to enable interaction elements
   */
  private changeInteractionEnabled(bool: boolean) {
    DEBUG: console.log("[dm-changeInteractionEnabled]", bool);
    // need to invert bool so it grammatically makes sense
    this.interactionEnabled = bool;

    // set both buttons to the correct state
    [
      this.history.pass.buttonElement,
      this.history.smash.buttonElement,
      this.navigationButtons.PREVIOUS,
      this.navigationButtons.NEXT,
    ].forEach((button) => {
      bool
        ? button?.removeAttribute("disabled")
        : button?.setAttribute("disabled", "");
    });
  }

  getAverageAge(type: SmashState) {
    const chars = this.characters.filter((element) => {
      return element.character.smashState === type;
    });
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

  getAmount(type: SmashState) {
    return this.characters.filter(
      (element) => element.character.smashState === type
    ).length;
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
    const type: SmashState =
      result % 2 === 1 ? SmashState.SMASHED : SmashState.PASSED;

    return { id, type };
  }

  /**
   * Compresses the ids and states of the character statistics
   * @returns a relative url leading to the shared page
   */
  generateShareUrl() {
    let str = "";
    this.characters
      .filter((char) => char.character.smashState !== SmashState.UNDECIDED)
      .sort((a, b) => {
        const rankA = a.character.smashState === SmashState.SMASHED ? 0 : 1;
        const rankB = b.character.smashState === SmashState.SMASHED ? 0 : 1;
        return rankA - rankB;
      })
      .forEach((char) => {
        const compressedStr = DisplayManager.compress(
          char.character.id,
          char.character.smashState === SmashState.SMASHED
        );

        DEBUG: console.log(char, "compressed to", compressedStr);
        str += compressedStr;
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
      type: SmashState;
    }[] = [];
    for (let i = 0; i < str.length; i += 4) {
      const string = str.slice(i, i + 4);
      arr.push(this.decompress(string));
    }
    return arr;
  }

  private updateProgress() {
    DEBUG: console.log("[dm-updateProgress]");
    const head = document.querySelector("#progress") as HTMLHeadingElement;
    const total = this.characters.length;
    const amountRated = (() =>
      this.characters.filter(
        (c) => c.character.smashState !== SmashState.UNDECIDED
      ).length)();
    head.innerHTML = `${this.currentCharacter}/${total} (${(
      (amountRated / total) *
      100
    ).toFixed(2)}%)`;
  }

  presentCharacter(index: number) {
    DEBUG: console.log(
      "[dm-presentCharacter]",
      index,
      this.characters[index] || null
    );
    this.updateProgress();
    this.currentCharacter = index;
    const char = this.characters[index] || null;
    const img = document.querySelector("#character-image") as HTMLImageElement;
    const name = document.querySelector(
      "#character-name"
    ) as HTMLHeadingElement;
    const age = document.querySelector("#character-age") as HTMLHeadingElement;
    const animeElement = document.querySelector(
      "#character-anime"
    ) as HTMLAnchorElement;
    const listElement = document.querySelector(
      "#detailed-list"
    ) as HTMLParagraphElement;

    const favoriteContainerElement = document.querySelector(
      "#character-favorites-container"
    ) as HTMLParagraphElement;

    const favoriteElement = document.querySelector(
      "#character-favorites"
    ) as HTMLParagraphElement;

    const detailedAge = document.querySelector(
      "#detailed-age"
    ) as HTMLParagraphElement;

    const detailedBloodtype = document.querySelector(
      "#detailed-bloodtype"
    ) as HTMLParagraphElement;

    const detailedDob = document.querySelector(
      "#detailed-dob"
    ) as HTMLParagraphElement;

    const card = document.querySelector("#character-card") as HTMLDivElement;

    if (
      !img ||
      !name ||
      !age ||
      !animeElement ||
      !listElement ||
      !detailedAge ||
      !detailedBloodtype ||
      !detailedDob ||
      !card ||
      !favoriteElement
    ) {
      throw new Error("HTML Element went missing...");
    }

    if (char) {
      const { character, anime, list } = char;

      card.classList.remove("flipped", "smashed", "passed");

      const realSrc = character.image.large;
      const loader = new Image();
      loader.src = character.image.large;

      img.classList.add("blurredImage");

      name.innerHTML = "Loading";
      age.innerHTML = "";
      favoriteElement.innerHTML = "";

      detailedAge.innerHTML = "";
      detailedBloodtype.innerHTML = "";
      detailedDob.innerHTML = "";

      animeElement.classList.add("hide");
      listElement.classList.add("hide");
      favoriteContainerElement.classList.add("hide");

      // needed to not potentially fire twice
      let isWaiting = true;

      loader.onload = () => {
        DEBUG: console.log("[dm-imgFinishedLoading] isWaiting:", isWaiting);
        if (isWaiting) {
          name.innerHTML = character.name.full;
          age.innerHTML = getNumbersAtStartOfString(character.age || "") || "?";
          animeElement.innerHTML =
            anime.media.title.english || anime.media.title.native;
          animeElement.title = "";

          switch (character.smashState) {
            case SmashState.SMASHED:
              card.classList.add("smashed");
              break;

            case SmashState.PASSED:
              card.classList.add("passed");
              break;
            default:
              card.classList.remove("smashed", "passed");
              break;
          }

          const arr = character.related.map(({ media }) => {
            return media.title.english || media.title.native;
          });

          animeElement.title = arr.join("\n");

          detailedAge.innerHTML = character.age || "unknown";
          detailedBloodtype.innerHTML = character.bloodType || "unknown";
          const { year, month, day } = character.dateOfBirth;
          const str = getDateString(day, month, year);

          detailedDob.innerHTML = str;

          if (anime) {
            animeElement.href = anime.media.siteUrl;
            animeElement.classList.remove("hide");
          } else {
            animeElement.classList.add("hide");
          }

          DEBUG: console.log(
            "[dm-presentCharacter] favorites",
            character.favourites
          );
          if (character.favourites) {
            favoriteElement.innerHTML = character.favourites.toString();
            favoriteContainerElement.classList.remove("hide");
          } else {
            favoriteContainerElement.classList.add("hide");
          }

          listElement.classList.remove("hide");
          listElement.innerText = list.name;
          img.src = realSrc;
          img.classList.remove("blurredImage");
          this.changeInteractionEnabled(true);

          if (this.currentCharacter <= 0) {
            this.navigationButtons.PREVIOUS?.setAttribute("disabled", "");
          } else {
            this.navigationButtons.PREVIOUS?.removeAttribute("disabled");
          }

          if (this.currentCharacter >= this.characters.length - 1) {
            this.navigationButtons.NEXT?.setAttribute("disabled", "");
          } else {
            this.navigationButtons.NEXT?.removeAttribute("disabled");
          }
          isWaiting = false;
        }
      };
    } else {
      // placeholder image, will probably be changed later
      img.src =
        "https://cdn.pixabay.com/photo/2025/01/05/10/07/daffodils-9311747_1280.png";
      name.innerHTML = "No more characters";
      age.innerHTML = "";
      favoriteContainerElement.classList.add("hide");
      animeElement.classList.add("hide");
      listElement.classList.add("hide");
      this.changeInteractionEnabled(false);
    }
  }

  handleInteraction(content: InteractionContent) {
    DEBUG: console.log("[dm-handleInteraction]", content.type);
    this.changeInteractionEnabled(false);
    const currentCharacter = this.characters[this.currentCharacter];
    if (!currentCharacter || this.currentCharacter >= this.characters.length) {
      throw new Error("No character to interact with!");
    }

    const card = document.querySelector("#character-card") as HTMLDivElement;
    const app = document.querySelector("#app") as HTMLDivElement;

    if (content.type === "smash") {
      card.classList.add("swipe-smash");
      app.classList.add("smash-border");
      currentCharacter.character.smashState = SmashState.SMASHED;
    } else if (content.type === "pass") {
      card.classList.add("swipe-pass");
      app.classList.add("pass-border");
      currentCharacter.character.smashState = SmashState.PASSED;
    }

    setTimeout(() => {
      app.classList.remove("smash-border", "pass-border");
      card.classList.remove("swipe-smash", "swipe-pass");
    }, 600);

    this.nextCharacter();

    content.amountElement.innerHTML = this.characters
      .filter(
        (el) =>
          el.character.smashState ===
          (content.type === "smash" ? SmashState.SMASHED : SmashState.PASSED)
      )
      .length.toString();
  }
}
