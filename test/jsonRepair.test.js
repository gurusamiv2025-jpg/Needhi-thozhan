import { describe, it, expect } from 'vitest';

// Simulating the backend JSON repairing logic
function repairJSON(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch {}
    return null;
  }
}

describe('JSON Repair Logic', () => {
  it('parses valid JSON', () => {
    const valid = '{"reply": "Hello", "urgent": false}';
    expect(repairJSON(valid)).toEqual({ reply: 'Hello', urgent: false });
  });

  it('extracts JSON from markdown fences', () => {
    const withFences = `Here is your JSON:\n\`\`\`json\n{"reply": "Hello", "urgent": true}\n\`\`\``;
    expect(repairJSON(withFences)).toEqual({ reply: 'Hello', urgent: true });
  });

  it('handles invalid trailing characters', () => {
    const trailing = `{"reply": "Hello"}   \n  Some text after`;
    expect(repairJSON(trailing)).toEqual({ reply: 'Hello' });
  });

  it('returns null for completely broken JSON', () => {
    const broken = `{"reply": "Hello"`; // missing closing brace
    expect(repairJSON(broken)).toBeNull();
  });
});
