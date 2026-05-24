import { DESTINATIONS } from "../data/destinations";

export function scoreDestinations(answers) {
  const scores = {};
  const answerSet = new Set(answers.filter(Boolean));

  Object.entries(DESTINATIONS).forEach(([dest, info]) => {
    let score = 0;
    info.tags.forEach((tag) => {
      if (answerSet.has(tag)) score += 1;
    });
    // '숨은 여행지' 성향이면 hidden/explore 태그 가중
    if (answerSet.has("hidden") || answerSet.has("explore")) {
      if (info.tags.includes("hidden")) score += 1;
      if (info.tags.includes("explore")) score += 1;
    }
    scores[dest] = score;
  });

  return Object.entries(scores)
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0], "ko");
    })
    .slice(0, 3)
    .map(([name]) => name);
}
