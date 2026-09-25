// FILE: apps/web/app/settings/voice/page.tsx
"use client";
export default function VoiceSettingsPage() {
  return (
    <div className="max-w-xl mx-auto p-8 space-y-4">
      <h1 className="text-2xl font-bold">Voice Settings</h1>
      <p className="text-gray-500">
        Voice provider (ElevenLabs / OpenAI TTS / Mock) is configured in Provider Settings.
      </p>
    </div>
  );
}