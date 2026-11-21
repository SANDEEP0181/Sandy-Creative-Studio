export type CreatorStyle = "educational" | "storytelling" | "motivation" | "facts";
export type CreatorDuration = 30 | 60;

type CreatorPackInput = {
  idea: string;
  language: string;
  platform: string;
  tone: string;
  style: CreatorStyle;
  duration: CreatorDuration;
};

const styleNames: Record<CreatorStyle, { en: string; hi: string }> = {
  educational: { en: "Educational", hi: "शिक्षाप्रद" },
  storytelling: { en: "Storytelling", hi: "कहानी" },
  motivation: { en: "Motivation", hi: "प्रेरणा" },
  facts: { en: "Facts", hi: "तथ्य" },
};

export function buildFreeCreatorPackV2(input: CreatorPackInput): string {
  const hindi = /hindi/i.test(input.language);
  const idea = input.idea.replace(/\s+/g, " ").trim();
  const style = styleNames[input.style][hindi ? "hi" : "en"];
  const hooks = hindi
    ? [
        `क्या आप जानते हैं कि ${idea} को समझना इतना आसान हो सकता है?`,
        `एक छोटी-सी बात ${idea} के बारे में आपकी समझ बदल सकती है।`,
        `आज ${idea} को एक आसान और रोचक तरीके से समझते हैं।`,
      ]
    : [
        `Here is a simple way to understand ${idea}.`,
        `One useful thing about ${idea} is worth knowing.`,
        `Let's explore ${idea} in a clear, practical way.`,
      ];
  const setup = hindi
    ? "सबसे पहले इस विषय का संदर्भ समझिए।"
    : "First, set the context in one clear sentence.";
  const main = hindi
    ? "[यहाँ विषय से जुड़ा पहला सत्यापित बिंदु जोड़ें।] [यहाँ दूसरा बिंदु या छोटा उदाहरण दें।]"
    : "[Add the first verified point about the topic.] [Add a second point or a short example.]";
  const takeaway = hindi
    ? "मुख्य बात यह है — [एक वाक्य में सही निष्कर्ष लिखें।]"
    : "The key takeaway is — [write the accurate conclusion in one sentence].";
  const cta = hindi
    ? "ऐसी उपयोगी जानकारी के लिए फॉलो करें।"
    : "Follow for more useful, clear content.";
  const timeline = input.duration === 30
    ? (hindi
      ? ["0–3s HOOK", "3–8s CONTEXT", "8–18s MAIN POINTS", "18–25s TAKEAWAY", "25–30s CTA"]
      : ["0–3s HOOK", "3–8s CONTEXT", "8–18s MAIN POINTS", "18–25s TAKEAWAY", "25–30s CTA"])
    : (hindi
      ? ["0–5s HOOK", "5–15s CONTEXT", "15–35s MAIN POINTS", "35–48s EXAMPLE / STORY", "48–55s TAKEAWAY", "55–60s CTA"]
      : ["0–5s HOOK", "5–15s CONTEXT", "15–35s MAIN POINTS", "35–48s EXAMPLE / STORY", "48–55s TAKEAWAY", "55–60s CTA"]);
  const sceneCount = input.duration === 30 ? 5 : 6;
  const prompts = Array.from({ length: sceneCount }, (_, i) =>
    `Scene ${i + 1}: Create a vertical 9:16 editorial visual about "${idea}". Style: ${input.style}; clear subject, uncluttered composition, natural lighting, readable negative space, consistent visual identity. No logos, no watermark, no invented factual labels.`
  );
  const voiceover = hindi
    ? [hooks[0], setup, main, takeaway, cta].join("\n\n")
    : [hooks[0], setup, main, takeaway, cta].join("\n\n");
  const caption = hindi
    ? `आज का विषय: ${idea}। इसे आसान भाषा में समझें और अपने सवाल कमेंट में लिखें।`
    : `Today's topic: ${idea}. Save this for a clear, simple explanation and share your questions below.`;
  const tags = input.style === "facts"
    ? "#FactCheck #LearnInHindi #UsefulFacts #CreatorCommunity"
    : input.style === "storytelling"
      ? "#Storytelling #HindiStories #ReelsIndia #CreatorCommunity"
      : input.style === "motivation"
        ? "#Motivation #DailyLearning #HindiContent #CreatorCommunity"
        : "#LearnWithMe #HindiContent #UsefulTips #CreatorCommunity";
  return [
    "SANDY CREATIVE STUDIO — FREE CREATOR PACK 2.0",
    "MODE: Local rule-based templates · Not AI-generated · No inference · No credits spent",
    `LANGUAGE: ${input.language} | PLATFORM: ${input.platform} | STYLE: ${style} | DURATION: ${input.duration}s | TONE: ${input.tone}`,
    "",
    "1. THREE HOOK OPTIONS",
    ...hooks.map((hook, i) => `${i + 1}. ${hook}`),
    "",
    `2. ${input.duration}-SECOND SCRIPT OUTLINE`,
    ...timeline.map((item) => `${item}: ${item.includes("HOOK") ? hooks[0] : item.includes("CONTEXT") ? setup : item.includes("MAIN") ? main : item.includes("TAKEAWAY") ? takeaway : item.includes("CTA") ? cta : (hindi ? "[यहाँ छोटा उदाहरण या कहानी जोड़ें।]" : "[Add a short example or story here.]")}`),
    "",
    "3. SCENE-BY-SCENE VISUAL PLAN",
    ...prompts,
    "",
    "4. IMAGE PROMPTS (TEXT ONLY — NO IMAGE GENERATED)",
    ...prompts.map((prompt, i) => `Prompt ${i + 1}: ${prompt}`),
    "",
    "5. VOICEOVER-READY SCRIPT",
    voiceover,
    "",
    "6. INSTAGRAM / SHORT-VIDEO CAPTION",
    caption,
    "",
    "SUGGESTED HASHTAGS",
    tags,
    "",
    "EDITORIAL CHECK",
    "- Replace every bracketed placeholder with accurate, verified information.",
    "- For facts and claims, verify the source and date before publishing.",
    "- Image prompts are text only; no image or video file is created.",
    "- Check spelling, audio rights, accessibility captions, and platform-safe framing.",
    "",
    "STATUS",
    "Generated locally from reusable templates. Provider was not called; billing was not triggered.",
  ].join("\n");
}
