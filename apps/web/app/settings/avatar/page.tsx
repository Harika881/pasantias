// FILE: apps/web/app/settings/avatar/page.tsx
"use client";
export default function AvatarSettingsPage() {
  return (
    <div className="max-w-xl mx-auto p-8 space-y-4">
      <h1 className="text-2xl font-bold">Avatar Settings</h1>
      <p className="text-gray-500">
        Avatar provider (D-ID / HeyGen / Mock) is auto-selected in Provider Settings.
        Presenter style (gender, age, appearance) is chosen per-video on the Create Video page.
      </p>
    </div>
  );
}