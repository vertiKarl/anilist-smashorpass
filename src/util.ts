const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function getDateString(
  day: number | string,
  month: number,
  year: number
) {
  day = `${day}`;
  if (day) {
    switch (day.charAt(day.length - 1)) {
      case "1":
        if (day === "11") {
          day += "th";
        } else {
          day += "st";
        }
        break;
      case "2":
        if (day === "12") {
          day += "th";
        } else {
          day += "nd";
        }
        break;
      case "3":
        if (day === "13") {
          day += "th";
        } else {
          day += "rd";
        }
        break;
      default:
        day += "th";
        break;
    }
  }

  if (year && month && day) {
    DEBUG: console.log("[util-getDateString] year, month and day");
    return `${monthNames[month - 1]} ${day}, ${year}`;
  } else if (year && month) {
    DEBUG: console.log("[util-getDateString] year and month");
    return `${monthNames[month - 1]} ${year}`;
  } else if (year && day) {
    DEBUG: console.log("[util-getDateString] year and day");
    return `${day}, ${year}`;
  } else if (month && day) {
    DEBUG: console.log("[util-getDateString] month and day");
    return `${monthNames[month - 1]} ${day}`;
  } else if (month) {
    DEBUG: console.log("[util-getDateString] month");
    return `${monthNames[month - 1]}`;
  } else if (year) {
    DEBUG: console.log("[util-getDateString] year");
    return `${year}`;
  } else {
    DEBUG: console.log("[util-getDateString] nothing");
    return "Unknown";
  }
}

export function clamp(num: number, min: number, max: number) {
  return Math.min(Math.max(num, min), max);
}

/**
 * Gets numbers at the start of a string
 * Example: "18.4 apples" → "18"
 * @param str The string to get the numbers from
 * @returns A string of numbers at the start of input string
 */
export function getNumbersAtStartOfString(str: string) {
  return str.match(/^\d+/)?.[0];
}
