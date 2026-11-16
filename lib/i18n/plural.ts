/** Romanian count form for templates with optional "de" before the noun. */
export function pluralRo(n: number): "one" | "few" | "many" {
  if (n === 1) return "one";
  const lastTwo = n % 100;
  if (lastTwo >= 1 && lastTwo <= 19) return "few";
  if (n >= 20) return "many";
  return "few";
}