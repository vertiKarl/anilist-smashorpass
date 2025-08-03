import type { Character } from "./Character";

export type Role = "MAIN" | "SUPPORTING" | "BACKGROUND" | "ALL";

export interface QueryOptions {
  role: Role;
  gender: string;
}

export interface ResponseData {
  MediaListCollection: {
    lists: ListEntry[];
  };
}

export interface ListEntry {
  entries: MediaEntry[];
}

export interface MediaEntry {
  media: {
    title: {
      english: string;
    };
    characters: {
      nodes: Character[];
    };
  };
}

export interface CacheElement {
  character: Character;
  anime: MediaEntry;
}

export class ApiConnector {
  characterCache: CacheElement[] = [];
  private currentCharacter?: CacheElement;

  constructor(username: string, options?: QueryOptions) {
    this.getData(username, options);
  }

  public waitTillReady(): Promise<void> {
    return new Promise((resolve) => {
      setInterval(() => {
        if (this.currentCharacter) resolve();
      });
    });
  }

  private async getData(username: string, options?: QueryOptions) {
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
              age
              bloodType
              dateOfBirth {
                year
                month
                day
              }
              description
              favourites
              modNotes
              siteUrl
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
      role: options?.role !== "ALL" ? options?.role : undefined,
    };

    console.log("Fetching data with variables:", variables);

    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });
    const { data } = await res.json();

    this.generateCharacterList(data, options);
    this.pickNewCharacter();
  }

  private generateCharacterList(data: ResponseData, options?: QueryOptions) {
    let anime: MediaEntry[] = [];
    data.MediaListCollection.lists.forEach((list) => {
      anime = anime.concat(list.entries);
    });

    let characters: any[] = [];
    anime.forEach((entry) => {
      entry.media.characters.nodes.forEach((char) => {
        characters.push({
          anime: entry.media.title.english,
          character: char,
        });
      });
    });

    if (options) {
      characters = characters.filter((obj) => {
        if (obj.character.gender === options.gender) {
          return obj;
        }
      });
    }

    characters = characters.filter((char, index) => {
      characters.forEach((otherChar) => {
        if (
          char.character.id === otherChar.id &&
          index !== characters.indexOf(otherChar)
        ) {
          console.log("DUPLICATE FILTERED");
          return false;
        }
      });
      return true;
    });

    this.characterCache = characters;
  }

  public pickNewCharacter() {
    const index = Math.floor(Math.random() * this.characterCache.length);
    const { character, anime } = this.characterCache.splice(index, 1)[0];

    const img = document.querySelector("#character-image") as HTMLImageElement;
    const name = document.querySelector(
      "#character-name"
    ) as HTMLHeadingElement;

    if (!img || !name) return;

    img.src = character.image.large;
    name.innerHTML = character.name.full + (anime ? ` (${anime})` : "");

    console.log(character, anime);
    this.currentCharacter = { character, anime };
  }

  public getCurrentCharacter() {
    return this.currentCharacter;
  }
}
