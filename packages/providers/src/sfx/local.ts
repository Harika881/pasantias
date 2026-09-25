// FILE: packages/providers/src/sfx/local.ts
import fs from "fs"; import path from "path";
import { SfxProvider } from "../interfaces";

export class LocalSfxProvider implements SfxProvider {
  name = "local";
  private dir = path.join(__dirname, "../../assets/sfx");
  async getEffect(kind: string) {
    const file = path.join(this.dir, `${kind}.mp3`);
    if (!fs.existsSync(file)) return null;
    return { url: file, localPath: file };
  }
}