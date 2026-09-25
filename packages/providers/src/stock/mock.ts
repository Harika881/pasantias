// FILE: packages/providers/src/stock/mock.ts
import { StockMediaProvider } from "../interfaces";
export class MockStockProvider implements StockMediaProvider {
  name = "mock";
  async searchVideo() { return null; }
  async searchImage() { return null; }
}