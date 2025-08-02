import "./style.css";

window.onload = () => {
  const input = document.querySelector("#username") as HTMLInputElement;
  input.onkeydown = (ev) => {
    if (ev.key === "Enter") {
      const username = input.value;
      getCharacters(username);
    }
  };
};

let g_data = {};

function getCharacters(username: string) {
  const query = `query ExampleQuery($userName: String, $type: MediaType, $sort: [CharacterSort], $role: CharacterRole) {
  MediaListCollection(userName: $userName, type: $type) {
    lists {
      entries {
        media {
          title {
            english
          }
          characters(sort: $sort, role: $role) {
            nodes {
              name {
                full
              }
              image {
                large
              }
              gender
              id
            }
          }
        }
      }
    name
    }
  }
}
`;
  const variables = {
    userName: username,
    type: "ANIME",
    sort: "RELEVANCE",
    role: "MAIN",
  };
  fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
  }).then((r) =>
    r.json().then((data) => {
      //console.log("data returned:", data);
      g_data = data;
      generateCharacterList();
      pickNewCharacter();
      const bSmash = document.querySelector("#smash") as HTMLButtonElement;
      bSmash.onclick = smash;
      const bPass = document.querySelector("#pass") as HTMLButtonElement;
      bPass.onclick = pass;
      const input = document.querySelector("#username") as HTMLInputElement;
      bSmash?.classList.remove("hide");
      bPass?.classList.remove("hide");

      input.classList.add("hide");
    })
  );
}

let smashedCharacterAmount = 0;
let passedCharacterAmount = 0;

let currentCharacter;

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

function smash() {
  const history = document.querySelector("#smashHistory");
  const historyEntry = document.createElement("div");
  const historyEntryImg = document.createElement("img");
  const historyEntryText = document.createElement("p");
  historyEntryText.innerHTML = `${currentCharacter.character.name.full} (${currentCharacter.anime2})`;
  historyEntryImg.src = currentCharacter.character.image.large;

  historyEntry.append(historyEntryImg, historyEntryText);
  history?.append(historyEntry);

  pickNewCharacter();
  const element = document.querySelector(
    "#smashed-amount"
  ) as HTMLParagraphElement;
  element.innerHTML = (++smashedCharacterAmount).toString();
  console.log("SMASHED:", smashedCharacterAmount);
}

function pass() {
  const history = document.querySelector("#passHistory");
  const historyEntry = document.createElement("div");
  const historyEntryImg = document.createElement("img");
  const historyEntryText = document.createElement("p");
  historyEntryText.innerHTML = `${currentCharacter.character.name.full} (${currentCharacter.anime2})`;
  historyEntryImg.src = currentCharacter.character.image.large;

  historyEntry.append(historyEntryImg, historyEntryText);
  history?.append(historyEntry);

  pickNewCharacter();
  const element = document.querySelector(
    "#passed-amount"
  ) as HTMLParagraphElement;
  element.innerHTML = (++passedCharacterAmount).toString();
  console.log("PASSED:", passedCharacterAmount);
}

interface CharacterEntry {
  anime2: string;
  character: {
    image: {
      large: string;
    };
    name: {
      full: string;
    };
  };
}

let characterList: CharacterEntry[] = [];

function generateCharacterList() {
  let anime: any[] = [];
  g_data.data.MediaListCollection.lists.forEach((list) => {
    anime = anime.concat(list.entries);
  });

  let characters: any[] = [];
  anime.forEach((entry) => {
    entry.media.characters.nodes.forEach((char) => {
      characters.push({
        anime2: entry.media.title.english,
        character: char,
      });
    });
  });

  let filteredCharacters = characters.filter((obj) => {
    if (obj.character.gender === "Female") {
      return obj;
    }
  });

  filteredCharacters = filteredCharacters.filter((char, index) => {
    filteredCharacters.forEach((otherChar) => {
      if (
        char.character.id === otherChar.id &&
        index !== filteredCharacters.indexOf(otherChar)
      ) {
        console.log("DUPLICATE FILTERED");
        return false;
      }
    });
    return true;
  });

  characterList = filteredCharacters;
}

function pickNewCharacter() {
  const index = Math.floor(Math.random() * characterList.length);
  console.log(characterList.length, index);
  const { character, anime2 } = characterList.splice(index, 1)[0];

  const img = document.querySelector("#character-image");
  const name = document.querySelector("#character-name");
  if (!img || !name) return;
  img.src = character.image.large;
  name.innerHTML = `${character.name.full} (${anime2})`;
  console.log(character, anime2);
  currentCharacter = { character, anime2 };
}

function presentCharacter(character) {
  console.log(character);
}
