import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * POST /api/tts — voz del agente
 * Body: { text: string, voice?: string }
 * Prioridad: ElevenLabs (ELEVEN_API_KEY) > OpenAI (OPENAI_API_KEY) > 501 (usa Web Speech en cliente)
 * StarShop FloatingButtons hará fallback a speechSynthesis si este endpoint falla.
 */
export async function POST(req: NextRequest) {
  try {
    const { text, voice } = await req.json();
    const clean = String(text ?? "").replace(/[*#_]/g, "").slice(0, 900).trim();
    if (!clean) return NextResponse.json({ error: "Falta text" }, { status: 400 });

    const elevenKey = process.env.ELEVEN_API_KEY || process.env.ELEVENLABS_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    // 1) ElevenLabs (voz más natural es-CL)
    if (elevenKey) {
      const voiceId = voice || process.env.ELEVEN_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // Rachel default
      const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "xi-api-key": elevenKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: clean,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.7 },
        }),
      });
      if (!r.ok) {
        const t = await r.text().catch(() => "");
        console.warn("[tts] ElevenLabs", r.status, t.slice(0, 200));
        // fallback a OpenAI
      } else {
        const buf = Buffer.from(await r.arrayBuffer());
        return new NextResponse(buf, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-cache" } });
      }
    }

    // 2) OpenAI TTS
    if (openaiKey) {
      const r = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "tts-1", input: clean, voice: voice || "nova", response_format: "mp3" }),
      });
      if (!r.ok) {
        const t = await r.text().catch(() => "");
        console.warn("[tts] OpenAI", r.status, t.slice(0, 200));
        return NextResponse.json({ error: `TTS cloud ${r.status}` }, { status: 502 });
      }
      const buf = Buffer.from(await r.arrayBuffer());
      return new NextResponse(buf, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-cache" } });
    }

    return NextResponse.json({ error: "Sin ELEVEN_API_KEY ni OPENAI_API_KEY — usa voz del navegador", fallback: "webspeech" }, { status: 501 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
