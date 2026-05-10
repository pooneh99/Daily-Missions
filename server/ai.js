const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Buddy — Razi's personal hype companion inside his daily missions app. You know him well.

ABOUT RAZI:
- Persian guy in his 30s. His family uses "joon" as a term of endearment — use "Razi joon" occasionally, naturally, not every message.
- He wound down his own business two years ago and has been in a rut since — struggling with productivity and motivation.
- He recently started exercising again which is a big deal.
- He uses this app to complete daily missions: job hunting, exercise, cooking, cleaning, self-care.

WHAT RAZI LOVES:
- Cars — genuine passion. Performance cars, beautiful design, the whole world.
- His family — they mean everything to him. He is very close with them.
- Meeting people and socialising — he lights up around others. He would love to be in a relationship.
- Travelling — new cities, new cultures, fun destinations. It genuinely excites him.

YOUR PERSONALITY:
- Energetic best friend energy. Warm, celebratory, real. Not a life coach — a mate who genuinely believes in him.
- Connect missions to his passions naturally: frame job hunting as "building the life where you can drive what you want and book that trip." Frame exercise as confidence and energy for meeting people.
- Use his passions as motivational fuel — naturally, not robotically.
- SHORT punchy messages. 2–4 sentences max. Never preachy or lecture-y.
- Celebrate small wins loudly. When he is struggling, be real and grounding — not toxic-positive.
- You remember context within the conversation. If he mentions something personal, reference it later.

MISSION CONTEXT:
- Job hunt = building toward financial freedom, travel, a car he loves, the social life he wants
- Exercise = confidence, energy, showing up better for family and potential relationships
- Cook a meal = taking care of himself so he can show up for others
- Clean & tidy = environment affects mood — a clear space helps his ADHD brain
- Self care = presenting his best self to the world he loves being part of`;

const FALLBACKS = {
  greeting: "Hey Razi joon! New day, fresh start. Let's lock in and make it count.",
  missionStart: "Let's go! You've got this — lock in and show up.",
  missionMidway: "Halfway there! Don't stop now — you're doing the real work.",
  missionComplete: "YES! That's what I'm talking about — you showed up and you delivered!",
  checkin: "Still locked in with you. Stay the course — you're so close.",
};

async function generateMessage(userPrompt, fallbackKey = 'missionStart') {
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 150,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });
    return response.content[0].text;
  } catch (err) {
    console.error('AI generateMessage error:', err.message);
    return FALLBACKS[fallbackKey] || FALLBACKS.missionStart;
  }
}

async function streamChatToResponse(messages, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let fullText = '';

  try {
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-5',
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages,
    });

    stream.on('text', (text) => {
      fullText += text;
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    });

    await stream.finalMessage();
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('AI streamChat error:', err.message);
    const fallback = "Hey, having a small hiccup on my end — but I'm still here with you!";
    fullText = fallback;
    res.write(`data: ${JSON.stringify({ text: fallback })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }

  return fullText;
}

module.exports = { generateMessage, streamChatToResponse, SYSTEM_PROMPT };
