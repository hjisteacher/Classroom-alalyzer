export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { lessonContent } = req.body;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.VITE_ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: `당신은 초등학교 3학년 학생들을 위한 수업 분석 전문가입니다.
교사가 입력한 수업 내용을 분석하여, 홀랜드 직업흥미 유형(R/I/A/S/E/C) 각각에 해당하는 질문을 1개씩, 총 6개 만들어주세요.
각 질문은 초등 3학년이 이해할 수 있는 쉬운 말로, 수업에서 실제로 한 활동과 연결하여 작성해주세요.
반드시 아래 JSON 형식으로만 응답하세요:
{"questions":[{"type":"R","text":"질문"},{"type":"I","text":"질문"},{"type":"A","text":"질문"},{"type":"S","text":"질문"},{"type":"E","text":"질문"},{"type":"C","text":"질문"}]}`,
        messages: [{ role: "user", content: `수업 내용: ${lessonContent}` }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic error:", err);
      return res.status(500).json({ error: "AI 호출 실패", detail: err });
    }

    const data = await response.json();

    if (!data.content || data.content.length === 0) {
      console.error("빈 응답:", data);
      return res.status(500).json({ error: "AI 응답이 비어있어요", detail: data });
    }

    const text = data.content.map((i) => i.text || "").join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    res.status(200).json(parsed);

  } catch (e) {
    console.error("서버 오류:", e);
    res.status(500).json({ error: e.message });
  }
}
