import { describe, expect, it } from "vitest";

const SPREADSHEET_ID = process.env.TETRIS_SPREADSHEET_ID ?? "1URyt0NdWjR5JWlAt7inDSi4Uw59dNB2IGFfelixs-FE";
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY ?? "";

describe("Google Sheets API", () => {
  it("can fetch spreadsheet metadata with API key", async () => {
    if (!API_KEY) {
      console.warn("GOOGLE_SHEETS_API_KEY not set, skipping test");
      return;
    }
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?key=${API_KEY}&fields=spreadsheetId,sheets.properties`;
    const res = await fetch(url);
    const data = await res.json() as { spreadsheetId?: string; error?: { message: string } };
    if (data.error) {
      console.error("Sheets API error:", data.error.message);
    }
    expect(res.status).toBe(200);
    expect(data.spreadsheetId).toBe(SPREADSHEET_ID);
  });
});
