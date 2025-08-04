import type { MediaEntry } from "./api_connector";

export interface Character {
  related: MediaEntry[];
  name: {
    full: string;
    native: string;
  };
  image: {
    large: string;
  };
  gender: string;
  id: number;
  age?: string;
  bloodType?: string;
  dateOfBirth: {
    year: number;
    month: number;
    day: number;
  };
  description: string;
  favourites: number;
  modNotes?: string;
  siteUrl: string;
}
