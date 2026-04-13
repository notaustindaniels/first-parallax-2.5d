/**
 * generate-voiceover.ts
 * Generates per-scene ElevenLabs voiceover MP3s into public/voiceover/.
 *
 * Usage:
 *   ELEVENLABS_API_KEY=sk_... node --strip-types generate-voiceover.ts
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";
const MODEL_ID = "eleven_multilingual_v2";

const SCENES: { id: string; text: string }[] = [
  { id: "scene1", text: "Beneath a sky scattered with ancient light, the mountains hold their breath." },
  { id: "scene2", text: "The river carves its memory through stone, patient and relentless." },
  { id: "scene3", text: "Lanterns sway above the old quarter, painting the fog in amber." },
  { id: "scene4", text: "Steel and glass reach upward, dwarfing the figures below." },
  { id: "scene5", text: "The forest floor hums with invisible life, layered in shadow." },
  { id: "scene6", text: "Waves collapse against the cliffs, salt and thunder in the air." },
  { id: "scene7", text: "The desert stretches beyond reckoning, heat rippling off the dunes." },
  { id: "scene8", text: "And the night returns — vast, quiet, full of unnamed stars." },
];

async function main(): Promise<void> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ELEVENLABS_API_KEY environment variable is required.\n" +
        "Export it before running: ELEVENLABS_API_KEY=sk_... node --strip-types generate-voiceover.ts",
    );
  }

  const outputDir = join(process.cwd(), "public", "voiceover");
  mkdirSync(outputDir, { recursive: true });

  for (const scene of SCENES) {
    const outPath = join(outputDir, `${scene.id}.mp3`);
    console.log(`Generating ${scene.id}...`);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: scene.text,
          model_id: MODEL_ID,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
          },
        }),
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(
        `ElevenLabs error ${response.status} for ${scene.id}: ${errText}`,
      );
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    writeFileSync(outPath, audioBuffer);
    console.log(`  ✓ ${outPath} (${(audioBuffer.length / 1024).toFixed(0)} KB)`);
  }

  console.log(
    "\nAll voiceovers generated. Run `npx remotion studio` to preview.",
  );
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
