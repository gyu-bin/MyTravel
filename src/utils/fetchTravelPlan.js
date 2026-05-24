import { questions } from "../data/questions";

const DURATION_DAY_COUNT = {
  day: 1,
  short: 2,
  long: 3,
  week: 4,
};

const SCHEDULE_TEMPLATE = [
  { time: "09:00", place: "장소명", desc: "한 줄 설명" },
  { time: "11:30", place: "장소명", desc: "한 줄 설명" },
  { time: "13:00", place: "장소명", desc: "한 줄 설명" },
  { time: "15:00", place: "장소명", desc: "한 줄 설명" },
  { time: "18:30", place: "장소명", desc: "한 줄 설명" },
];

function usesMaxCompletionTokens(model) {
  return /^gpt-5|^o\d|^chatgpt-5/i.test(model);
}

function getTripDayCount(answers) {
  const durationIndex = questions.findIndex((q) => q.id === 7);
  const durationValue = answers[durationIndex];
  return DURATION_DAY_COUNT[durationValue] ?? 2;
}

function getDurationLabel(answers) {
  const durationIndex = questions.findIndex((q) => q.id === 7);
  const q = questions[durationIndex];
  const value = answers[durationIndex];
  return q?.options.find((o) => o.value === value)?.text ?? "2박 3일";
}

function buildDaysSchemaExample(dayCount) {
  return Array.from({ length: dayCount }, (_, i) => ({
    day: `Day ${i + 1}`,
    title: "이 날의 테마 한 줄",
    schedule: SCHEDULE_TEMPLATE,
  }));
}

function tokenLimitForDays(dayCount) {
  if (dayCount <= 1) return 1500;
  if (dayCount === 2) return 2200;
  if (dayCount === 3) return 3000;
  return 4000;
}

function buildCompletionPayload(model, messages, dayCount) {
  const payload = {
    model,
    response_format: { type: "json_object" },
    messages,
  };

  const limit = tokenLimitForDays(dayCount);
  if (usesMaxCompletionTokens(model)) {
    payload.max_completion_tokens = limit;
  } else {
    payload.max_tokens = limit;
  }

  return payload;
}

export async function fetchTravelPlan(destination, answers) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  const model = import.meta.env.VITE_OPENAI_MODEL || "gpt-4o-mini";
  const dayCount = getTripDayCount(answers);
  const durationLabel = getDurationLabel(answers);
  const daysExample = buildDaysSchemaExample(dayCount);

  const labels = answers.map((a, i) => {
    const q = questions[i];
    const opt = q.options.find((o) => o.value === a);
    return `${q.question} → ${opt?.text}`;
  });

  const jsonExample = JSON.stringify({
    reason: `이 여행자에게 ${destination}을 추천하는 이유 (설문 결과를 구체적으로 언급하며 2~3문장)`,
    days: daysExample,
    tips: [
      "현지 꿀팁 1 (구체적으로)",
      "현지 꿀팁 2 (구체적으로)",
      "현지 꿀팁 3 (구체적으로)",
    ],
    food: [
      "대표 먹거리 1",
      "대표 먹거리 2",
      "대표 먹거리 3",
      "대표 먹거리 4",
    ],
  });

  const prompt = `당신은 친절하고 경험 많은 국내 여행 전문가입니다. 아래 여행자의 상세 성향을 바탕으로 ${destination} 여행 계획을 작성해주세요.

여행자 설문 결과:
${labels.join("\n")}

추천 여행지: ${destination}
여행 기간(설문): ${durationLabel}

중요 — 일정 일수:
- 반드시 Day 1부터 Day ${dayCount}까지 총 ${dayCount}일치 일정을 작성하세요.
- days 배열에는 정확히 ${dayCount}개의 객체가 있어야 합니다. ${dayCount}일보다 적게 작성하지 마세요.
- 각 날짜마다 schedule에 4~5개의 방문·식사 일정을 넣으세요.

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요:
${jsonExample}`;

  const messages = [
    {
      role: "system",
      content:
        "You are a Korean domestic travel expert. Always respond with valid JSON only. The days array length must match the requested number of days exactly.",
    },
    { role: "user", content: prompt },
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(buildCompletionPayload(model, messages, dayCount)),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const apiMessage = data.error?.message || `HTTP ${res.status}`;
    throw new Error(`API_ERROR: ${apiMessage}`);
  }

  const raw = data.choices?.[0]?.message?.content || "";
  if (!raw) {
    throw new Error("API_ERROR: 응답이 비어 있습니다.");
  }

  let plan;
  try {
    plan = JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    throw new Error("API_ERROR: JSON 파싱에 실패했습니다.");
  }

  if (!plan.days || plan.days.length < dayCount) {
    throw new Error(
      `API_ERROR: 요청한 ${dayCount}일 일정이 아닌 ${plan.days?.length ?? 0}일만 생성되었습니다. 다시 시도해주세요.`
    );
  }

  return plan;
}
