export const insertBetween = (arr, separator) => arr.map((e, i) => i < arr.length - 1 ? [e, separator] : [e]).reduce((a, b) => a.concat(b));
