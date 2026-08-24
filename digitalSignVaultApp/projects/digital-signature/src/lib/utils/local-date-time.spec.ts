import { getLocalTimeZone, toLocalIsoString } from './local-date-time';

describe('local date time utilities', () => {
  it('formats the computer local time with its UTC offset', () => {
    const date = new Date(2026, 7, 24, 15, 30, 45, 123);
    const result = toLocalIsoString(date);

    expect(result).toMatch(/^2026-08-24T15:30:45\.123[+-]\d{2}:\d{2}$/);
  });

  it('returns the browser time-zone name', () => {
    expect(getLocalTimeZone().length).toBeGreaterThan(0);
  });
});
