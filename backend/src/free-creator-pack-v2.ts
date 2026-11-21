export type CreatorStyle = "educational" | "storytelling" | "motivation" | "facts";
export type CreatorDuration = 30 | 60;
type CreatorPackInput = { idea: string; language: string; platform: string; tone: string; style: CreatorStyle; duration: CreatorDuration };
type Script = { hook: string; context: string; points: string[]; example: string; takeaway: string };

const styleNames: Record<CreatorStyle, { en: string; hi: string }> = {
  educational: { en: "Educational", hi: "शिक्षाप्रद" }, storytelling: { en: "Storytelling", hi: "कहानी" },
  motivation: { en: "Motivation", hi: "प्रेरणा" }, facts: { en: "Facts", hi: "तथ्य" },
};

function makeScript(idea: string, hindi: boolean, style: CreatorStyle): Script {
  const reels = /short\s*reels?|reels?|short[- ]form videos?|instagram reels?/i.test(idea);
  if (hindi && reels) return {
    hook: "कम समय में असरदार वीडियो बनाना चाहते हैं? Short Reels का यह आसान तरीका अपनाइए।",
    context: "Short Reels छोटे वीडियो होते हैं, जिनमें एक मुख्य विचार को जल्दी और साफ तरीके से पेश किया जाता है।",
    points: ["शुरुआत के 2–3 सेकंड में दर्शक को बताइए कि वीडियो किस काम का है।", "एक वीडियो में एक मुख्य बात रखें और उसे छोटे, आसान वाक्यों में समझाएँ।"],
    example: "जैसे, मोबाइल की किसी उपयोगी सेटिंग पर Reel बनाते समय समस्या दिखाएँ, सेटिंग कहाँ मिलेगी बताएं और उसका उपयोग समझाएँ।",
    takeaway: "अच्छी Short Reel का फोकस है—एक स्पष्ट विचार, आसान प्रस्तुति और बिना भटकाव का संदेश।",
  };
  if (!hindi && reels) return {
    hook: "Want to make short videos that are easy to follow? Start with this simple structure.",
    context: "Short Reels are brief videos built around one clear idea and a focused message.",
    points: ["Use the opening seconds to tell viewers what they will learn or see.", "Keep one main point per video and explain it with concise, clear language."],
    example: "For a useful phone setting, show the problem, where to find the setting, and what it helps with.",
    takeaway: "A useful Short Reel has one clear idea, a simple explanation, and no unnecessary detours.",
  };
  return {
    hook: hindi
      ? style === "storytelling" ? `एक छोटी-सी कहानी से ${idea} को समझते हैं।`
        : style === "motivation" ? `अगर आप ${idea} पर काम शुरू करना चाहते हैं, तो यह आसान कदम याद रखें।`
        : style === "facts" ? `आज ${idea} को समझने के लिए जरूरी बातों पर ध्यान देते हैं।`
        : `आज ${idea} को आसान भाषा में समझते हैं।`
      : style === "storytelling" ? `Let's understand ${idea} through a simple everyday example.`
        : style === "motivation" ? `If you want to make progress with ${idea}, begin with one practical step.`
        : style === "facts" ? `Here is a clear way to think about ${idea}.`
        : `Let's break ${idea} into a few practical steps.`,
    context: hindi ? `${idea} को समझने के लिए पहले इसका उद्देश्य और अपने लिए इसकी उपयोगिता पहचानिए।`
      : `Start by identifying what ${idea} is meant to help you understand or accomplish.`,
    points: hindi
      ? ["पहला कदम: विषय को छोटे हिस्सों में बाँटें और सबसे जरूरी बात पहले समझें।", "दूसरा कदम: हर बात के साथ एक सरल, रोजमर्रा का उदाहरण जोड़ें।"]
      : ["First, divide the topic into smaller parts and focus on the most useful point.", "Second, explain each point with a simple everyday example."],
    example: hindi ? "एक छोटा नोट बनाइए: लक्ष्य क्या है, कौन-से विकल्प उपलब्ध हैं और अगला व्यावहारिक कदम क्या होगा।"
      : "Make a quick note: what is the goal, what options are available, and what is the next practical step?",
    takeaway: hindi ? `याद रखें—${idea} पर आगे बढ़ने का तरीका है स्पष्ट जानकारी, छोटा कदम और नियमित समीक्षा।`
      : `The best way to approach ${idea} is to stay clear, take one practical step, and review what you learn.`,
  };
}

export function buildFreeCreatorPackV2(input: CreatorPackInput): string {
  const hindi = /hindi/i.test(input.language);
  const idea = input.idea.replace(/\s+/g, " ").trim();
  const style = styleNames[input.style][hindi ? "hi" : "en"];
  const s = makeScript(idea, hindi, input.style);
  const hooks = [s.hook, hindi ? `${idea} को समझने का एक आसान तरीका जानिए।` : `Here is one simple way to understand ${idea}.`,
    hindi ? `चलिए ${idea} को छोटे और उपयोगी चरणों में समझते हैं।` : `Let's explore ${idea} in a few useful steps.`];
  const cta = hindi ? "यह तरीका उपयोगी लगा हो तो वीडियो सेव करें और ऐसे ही आसान कंटेंट के लिए फॉलो करें।"
    : "Save this if it was useful, and follow for more clear, practical content.";
  const timeline = input.duration === 30
    ? [`0–3s HOOK: ${s.hook}`, `3–8s CONTEXT: ${s.context}`, `8–18s MAIN POINTS: ${s.points.join(" ")}`,
      `18–25s EXAMPLE + TAKEAWAY: ${s.example} ${s.takeaway}`, `25–30s CTA: ${cta}`]
    : [`0–5s HOOK: ${s.hook}`, `5–15s CONTEXT: ${s.context}`, `15–30s MAIN POINT 1: ${s.points[0]}`,
      `30–40s MAIN POINT 2: ${s.points[1]}`, `40–52s EXAMPLE + TAKEAWAY: ${s.example} ${s.takeaway}`, `52–60s CTA: ${cta}`];
  const scenes = hindi
    ? ["कैमरे की ओर देखकर Hook बोलें और स्क्रीन पर छोटा शीर्षक दिखाएँ।", "विषय का संदर्भ एक साफ वाक्य में दें।", "पहला मुख्य बिंदु टेक्स्ट और दृश्य के साथ समझाएँ।", "दूसरा बिंदु और रोजमर्रा का उदाहरण दिखाएँ।", "मुख्य सीख का Recap दें और CTA दिखाएँ।", "अंत में सीख दोहराएँ और फॉलो करने को कहें।"]
    : ["Deliver the hook to camera with a short title.", "Set the context in one clear sentence.", "Explain the first point with a relevant visual.", "Show the second point and an everyday example.", "Recap the takeaway and show the CTA.", "Repeat the key lesson and invite viewers to follow."];
  const count = input.duration === 30 ? 5 : 6;
  const prompts = Array.from({ length: count }, (_, i) => `Scene ${i + 1}: Vertical 9:16 visual about "${idea}". ${scenes[i]} Style: ${input.style}; uncluttered composition, natural lighting, readable negative space. No logos, watermark, or invented factual labels.`);
  const caption = hindi ? `आज का विषय: ${idea}। इस Reel में इसे आसान चरणों और एक रोजमर्रा के उदाहरण से समझाया गया है। आपको कौन-सा हिस्सा उपयोगी लगा? कमेंट में बताएं।`
    : `Today's topic: ${idea}. This Reel breaks it into simple steps with an everyday example. Which part was most useful? Share below.`;
  const tags = input.style === "facts" ? "#FactCheck #LearnInHindi #UsefulFacts #CreatorCommunity"
    : input.style === "storytelling" ? "#Storytelling #HindiStories #ReelsIndia #CreatorCommunity"
    : input.style === "motivation" ? "#Motivation #DailyLearning #HindiContent #CreatorCommunity"
    : "#LearnWithMe #HindiContent #UsefulTips #CreatorCommunity";
  return [
    "SANDY CREATIVE STUDIO — FREE CREATOR PACK 2.1",
    "MODE: Local curated content patterns · Not AI-generated · No inference · No credits spent",
    `LANGUAGE: ${input.language} | PLATFORM: ${input.platform} | STYLE: ${style} | DURATION: ${input.duration}s | TONE: ${input.tone}`,
    "", "1. THREE HOOK OPTIONS", ...hooks.map((h, i) => `${i + 1}. ${h}`),
    "", `2. ${input.duration}-SECOND SCRIPT OUTLINE`, ...timeline,
    "", "3. SCENE-BY-SCENE VISUAL PLAN", ...prompts,
    "", "4. IMAGE PROMPTS (TEXT ONLY — NO IMAGE GENERATED)", ...prompts.map((p, i) => `Prompt ${i + 1}: ${p}`),
    "", "5. VOICEOVER-READY SCRIPT", [s.hook, s.context, ...s.points, s.example, s.takeaway, cta].join("\n\n"),
    "", "6. INSTAGRAM / SHORT-VIDEO CAPTION", caption,
    "", "SUGGESTED HASHTAGS", tags,
    "", "EDITORIAL CHECK",
    "- This is a ready-to-record general draft; review it for your exact audience and context.",
    "- Do not present general examples as research findings, statistics, or expert advice.",
    "- Verify additional factual, current, financial, health, or safety claims with reliable sources before publishing.",
    "- Image prompts are text only; no image or video file is created.",
    "- Check spelling, audio rights, accessibility captions, and platform-safe framing.",
    "", "STATUS", "Generated locally from curated templates. Provider was not called; billing was not triggered.",
  ].join("\n");
}
