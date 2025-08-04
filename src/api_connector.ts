import type { Character } from "./Character";

export type Role = "MAIN" | "SUPPORTING" | "BACKGROUND" | "ALL";

export interface QueryOptions {
  role: Role;
  gender: string;
  minAge: string;
  maxAge: string;
}

export interface ResponseData {
  MediaListCollection: {
    lists: ListEntry[];
  };
}

export interface ListEntry {
  entries: MediaEntry[];
  name: string;
  status?:
    | "CURRENT"
    | "PLANNING"
    | "COMPLETED"
    | "DROPPED"
    | "PAUSED"
    | "REPEATING";
}

export interface MediaEntry {
  media: {
    title: {
      english: string;
      native: string;
    };
    characters: {
      nodes: Character[];
    };
    siteUrl: string;
  };
}

export interface CacheElement {
  character: Character;
  anime: MediaEntry;
  list: ListEntry;
}

export class ApiConnector {
  characterCache: CacheElement[] = [];
  public originalAmount = 0;
  private ready = false;

  constructor(username: string, options?: QueryOptions) {
    this.getData(username, options);
  }

  public waitTillReady(): Promise<void> {
    return new Promise((resolve) => {
      setInterval(() => {
        if (this.ready) resolve();
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
            native
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
          siteUrl
        }
      }
      name
      status
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
    this.ready = true;
  }

  private generateCharacterList(data: ResponseData, options?: QueryOptions) {
    let characters: CacheElement[] = [];
    data.MediaListCollection.lists.forEach((list) => {
      list.entries.forEach((entry) => {
        entry.media.characters.nodes.forEach((char) => {
          characters.push({
            anime: entry,
            character: char,
            list,
          });
        });
      });
    });

    if (options) {
      characters = characters.filter((obj) => {
        // include characters first appearance age (e.g. Sinon 16-17)
        const age = Number(obj.character.age?.split("-")[0]);
        const minAge = Number(options.minAge);
        const maxAge = Number(options.maxAge);
        if (
          // if no gender is specified pass, otherwise filter
          (!options.gender ||
            (options.gender && obj.character.gender === options.gender)) &&
          // if no minAge is specified, it isn't a number or the character doesn't have an age pass, otherwise filter
          (!minAge || (minAge && age && age >= minAge)) &&
          // if no maxAge is specified, it isn't a number or the character doesn't have an age pass, otherwise filter
          (!maxAge || (maxAge && age && age <= maxAge))
        ) {
          return obj;
        }
      });
    }

    // removing duplicate characters by their id
    const seenIds = new Set();
    characters = characters.filter(({ character }) => {
      if (seenIds.has(character.id)) return false;

      seenIds.add(character.id);
      return true;
    });

    this.originalAmount = characters.length;
    this.characterCache = characters;
  }

  public pickNewCharacter(): CacheElement | null {
    const index = Math.floor(Math.random() * this.characterCache.length);
    const cacheItem = this.characterCache.splice(index, 1)?.[0];
    if (!cacheItem) {
      console.log("No more characters!");
      return null;
    }

    return cacheItem;
  }
}
