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

function buildDetailedVisualPrompts(idea: string, hindi: boolean, style: CreatorStyle, tone: string, count: number): string[] {
  const scenes = hindi ? [
    { subject: "एक ही creator, साफ और सहज appearance में", location: "साफ-सुथरा indoor creator setup", camera: "eye-level medium close-up, सीधा कैमरे की ओर", action: "Hook बोलते हुए हल्का natural hand gesture", overlay: "एक विचार, एक Reel", background: "सादा, हल्का और distraction-free background" },
    { subject: "वही creator और वही outfit", location: "उसी setup में desk या phone के पास", camera: "over-the-shoulder medium shot", action: "विषय का संदर्भ एक वाक्य में बताते हुए phone या नोट की ओर इशारा", overlay: "पहले संदर्भ समझें", background: "कम सामान वाला साफ desk, कोई readable brand नहीं" },
    { subject: "वही creator; जरूरत हो तो हाथों का close-up", location: "desk पर practical demonstration area", camera: "close-up / insert shot, मुख्य वस्तु स्पष्ट focus में", action: "पहला मुख्य बिंदु step-by-step दिखाना", overlay: "पहला कदम", background: "साफ surface और सीमित props" },
    { subject: "वही creator", location: "उसी demonstration area में", camera: "medium shot से close-up cut", action: "दूसरा बिंदु रोजमर्रा के छोटे उदाहरण से समझाना", overlay: "एक आसान उदाहरण", background: "पहले scenes जैसा consistent setup" },
    { subject: "वही creator", location: "पहले वाले creator setup में", camera: "eye-level medium shot, stable framing", action: "दो मुख्य सीखों का recap और CTA की ओर संकेत", overlay: "मुख्य सीख: सरल और स्पष्ट", background: "सादा background, text के लिए खाली जगह" },
    { subject: "वही creator", location: "पहले वाले creator setup में", camera: "medium close-up, हल्का natural push-in feel", action: "कैमरे की ओर देखकर सीख दोहराना और follow करने का इशारा", overlay: "ऐसे और वीडियो के लिए Follow करें", background: "consistent lighting और uncluttered frame" },
  ] : [
    { subject: "The same creator with a consistent, natural appearance", location: "A clean indoor creator setup", camera: "Eye-level medium close-up, facing camera", action: "Deliver the hook with a small natural hand gesture", overlay: "One idea. One Reel.", background: "Simple, bright, distraction-free background" },
    { subject: "The same creator in the same outfit", location: "The same setup beside a desk or phone", camera: "Over-the-shoulder medium shot", action: "Introduce the context in one sentence and point to the phone or notes", overlay: "Set the context", background: "Tidy desk with no readable brands" },
    { subject: "The same creator; hands may appear in close-up", location: "A practical demonstration area on the desk", camera: "Close-up insert shot with the key object in clear focus", action: "Demonstrate the first main point step by step", overlay: "Step 1", background: "Clean surface with only a few relevant props" },
    { subject: "The same creator", location: "The same demonstration area", camera: "Cut from medium shot to close-up", action: "Explain the second point through a simple everyday example", overlay: "A simple example", background: "Match the previous scenes for visual continuity" },
    { subject: "The same creator", location: "Return to the original creator setup", camera: "Stable eye-level medium shot", action: "Recap the two key takeaways and indicate the CTA", overlay: "Keep it clear and simple", background: "Plain background with clear space for text" },
    { subject: "The same creator", location: "Return to the original creator setup", camera: "Medium close-up with a subtle push-in feel", action: "Repeat the lesson to camera and gesture toward the follow CTA", overlay: "Follow for more", background: "Consistent lighting and an uncluttered frame" },
  ];
  return scenes.slice(0, count).map((scene, i) => {
    const sceneTitle = hindi ? `दृश्य ${i + 1}` : `Scene ${i + 1}`;
    const topic = hindi ? `विषय: "${idea}"` : `Topic: "${idea}"`;
    const toneLabel = hindi ? `भाव: ${tone}` : `Tone: ${tone}`;
    const styleLabel = hindi ? `शैली: ${styleNames[style].hi}` : `Style: ${styleNames[style].en}`;
    return `${sceneTitle} | Vertical 9:16. ${topic}. Subject: ${scene.subject}. Location: ${scene.location}. Camera: ${scene.camera}. Action: ${scene.action}. Background: ${scene.background}. On-screen text (short and readable): "${scene.overlay}". ${styleLabel}; ${toneLabel}. Natural, even lighting; realistic proportions; clear subject separation; leave safe margins for platform UI and captions. Keep the same creator, outfit, and visual identity across all scenes. No logos, watermarks, fake statistics, fabricated labels, or extra text.`;
  });
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
  const count = input.duration === 30 ? 5 : 6;
  const prompts = buildDetailedVisualPrompts(idea, hindi, input.style, input.tone, count);
  const caption = hindi ? `आज का विषय: ${idea}। इस Reel में इसे आसान चरणों और एक रोजमर्रा के उदाहरण से समझाया गया है। आपको कौन-सा हिस्सा उपयोगी लगा? कमेंट में बताएं।`
    : `Today's topic: ${idea}. This Reel breaks it into simple steps with an everyday example. Which part was most useful? Share below.`;
  const tags = input.style === "facts" ? "#FactCheck #LearnInHindi #UsefulFacts #CreatorCommunity"
    : input.style === "storytelling" ? "#Storytelling #HindiStories #ReelsIndia #CreatorCommunity"
    : input.style === "motivation" ? "#Motivation #DailyLearning #HindiContent #CreatorCommunity"
    : "#LearnWithMe #HindiContent #UsefulTips #CreatorCommunity";
  return [
    "SANDY CREATIVE STUDIO — FREE CREATOR PACK 2.2",
    "MODE: Local curated content patterns · Not AI-generated · No inference · No credits spent",
    `LANGUAGE: ${input.language} | PLATFORM: ${input.platform} | STYLE: ${style} | DURATION: ${input.duration}s | TONE: ${input.tone}`,
    "", "1. THREE HOOK OPTIONS", ...hooks.map((h, i) => `${i + 1}. ${h}`),
    "", `2. ${input.duration}-SECOND SCRIPT OUTLINE`, ...timeline,
    "", "3. SCENE-BY-SCENE VISUAL PLAN", ...prompts,
    "", "4. DETAILED IMAGE PROMPTS (TEXT ONLY — NO IMAGE GENERATED)", ...prompts.map((p, i) => `Prompt ${i + 1}: ${p}`),
    "", "5. VOICEOVER-READY SCRIPT", [s.hook, s.context, ...s.points, s.example, s.takeaway, cta].join("\n\n"),
    "", "6. INSTAGRAM / SHORT-VIDEO CAPTION", caption,
    "", "SUGGESTED HASHTAGS", tags,
    "", "EDITORIAL CHECK",
    "- This is a ready-to-record general draft; review it for your exact audience and context.",
    "- Do not present general examples as research findings, statistics, or expert advice.",
    "- Verify additional factual, current, financial, health, or safety claims with reliable sources before publishing.",
    "- Image prompts are detailed text only; no image or video file is created.",
    "- Check spelling, audio rights, accessibility captions, and platform-safe framing.",
    "", "STATUS", "Generated locally from curated templates. Provider was not called; billing was not triggered.",
  ].join("\n");
}
