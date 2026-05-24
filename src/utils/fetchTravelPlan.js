import { questions } from "../data/questions";

/** GPT-5·o 시리즈는 max_completion_tokens 사용 */
function usesMaxCompletionTokens(model) {
  return /^gpt-5|^o\d|^chatgpt-5/i.test(model);
}

function buildCompletionPayload(model, messages) {
  const payload = {
    model,
    response_format: { type: "json_object" },
    messages,
  };

  if (usesMaxCompletionTokens(model)) {
    payload.max_completion_tokens = 2000;
  } else {
    payload.max_tokens = 1500;
  }

  return payload;
}

export async function fetchTravelPlan(destination, answers) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  const model = import.meta.env.VITE_OPENAI_MODEL || "gpt-4o-mini";

  const labels = answers.map((a, i) => {
    const q = questions[i];
    const opt = q.options.find((o) => o.value === a);
    return `${q.question} → ${opt?.text}`;
  });

  const prompt = `당신은 친절하고 경험 많은 국내 여행 전문가입니다. 아래 여행자의 상세 성향을 바탕으로 ${destination} 여행 계획을 작성해주세요.

여행자 설문 결과:
${labels.join("\n")}

추천 여행지: ${destination}

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요:
{"reason":"이 여행자에게 ${destination}을 추천하는 이유 (설문 결과를 구체적으로 언급하며 2~3문장)","days":[{"day":"Day 1","title":"이 날의 테마 한 줄","schedule":[{"time":"09:00","place":"장소명","desc":"한 줄 설명"},{"time":"11:30","place":"장소명","desc":"한 줄 설명"},{"time":"13:00","place":"장소명","desc":"한 줄 설명"},{"time":"15:00","place":"장소명","desc":"한 줄 설명"},{"time":"18:30","place":"장소명","desc":"한 줄 설명"}]},{"day":"Day 2","title":"이 날의 테마 한 줄","schedule":[{"time":"09:00","place":"장소명","desc":"한 줄 설명"},{"time":"11:00","place":"장소명","desc":"한 줄 설명"},{"time":"13:00","place":"장소명","desc":"한 줄 설명"},{"time":"15:30","place":"장소명","desc":"한 줄 설명"}]}],"tips":["현지 꿀팁 1 (구체적으로)","현지 꿀팁 2 (구체적으로)","현지 꿀팁 3 (구체적으로)"],"food":["대표 먹거리 1","대표 먹거리 2","대표 먹거리 3","대표 먹거리 4"]}`;

  const messages = [
    {
      role: "system",
      content:
        "You are a Korean domestic travel expert. Always respond with valid JSON only.",
    },
    { role: "user", content: prompt },
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(buildCompletionPayload(model, messages)),
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

  try {
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    throw new Error("API_ERROR: JSON 파싱에 실패했습니다.");
  }
}
