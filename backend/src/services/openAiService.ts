import fs from 'fs';
import OpenAI from 'openai';

export interface AudioAnalysisResult {
  lyrics?: string;
  musicalKey?: string;
  bpmEstimate?: number;
  genre?: string;
  vocalStyle?: string;
  aiNotes?: string;
}

/**
 * Uses OpenAI GPT-4o-mini & Whisper to provide deep audio intelligence,
 * lyrical transcription, and track mastering analysis.
 */
export async function analyzeAudioWithOpenAI(
  audioFilePath: string,
  apiKey: string
): Promise<AudioAnalysisResult> {
  const openai = new OpenAI({ apiKey });

  try {
    console.log('[OpenAI] Transcribing vocal lyrics with Whisper...');
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: 'whisper-1',
    });

    console.log('[OpenAI] Running GPT-4o-mini music analysis...');
    const prompt = `You are a professional audio mastering engineer. Analyze the following lyrics from a song and provide insights.
Lyrics:
"${transcription.text.slice(0, 2000)}"

Respond in pure JSON with:
{
  "genre": "inferred genre",
  "vocalStyle": "vocal character (e.g. emotive male, autotuned, choral)",
  "mood": "emotional vibe",
  "aiNotes": "brief 2-sentence mastering advice for stem mixing"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(completion.choices[0].message.content || '{}');

    return {
      lyrics: transcription.text,
      genre: parsed.genre,
      vocalStyle: parsed.vocalStyle,
      aiNotes: parsed.aiNotes,
    };
  } catch (err: any) {
    console.warn('[OpenAI] Analysis error:', err.message);
    return {
      aiNotes: `OpenAI analysis note: ${err.message}`,
    };
  }
}
