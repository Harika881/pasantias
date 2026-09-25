// FILE: packages/providers/src/transcription/mock.ts
import { TranscriptionProvider } from "../interfaces";
import { estimateWordTimestamps } from "../utils/timestamps";
export class MockTranscriptionProvider implements TranscriptionProvider {
  name = "mock";
  async transcribe() { return { words: estimateWordTimestamps("mock narration text here", 3) }; }
}