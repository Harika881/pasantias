// FILE: packages/providers/src/lipsync/mock.ts
import { LipSyncProvider } from "../interfaces";
export class MockLipSyncProvider implements LipSyncProvider {
  name = "mock";
  async sync(params: { videoUrl: string }) { return { videoUrl: params.videoUrl, localPath: params.videoUrl }; }
}