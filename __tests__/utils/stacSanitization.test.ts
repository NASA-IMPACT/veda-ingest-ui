import { describe, it, expect } from 'vitest';
import {
  sanitizeFormData,
  sanitizeDatetime,
  shouldBeArray,
  shouldBeObject,
  findSanitizationChanges,
} from '@/utils/stacSanitization';

describe('STAC Sanitization Utilities', () => {
  describe('shouldBeArray', () => {
    it('should identify array fields correctly', () => {
      expect(shouldBeArray('stac_extensions')).toBe(true);
      expect(shouldBeArray('keywords')).toBe(true);
      expect(shouldBeArray('providers')).toBe(true);
      expect(shouldBeArray('links')).toBe(true);
      expect(shouldBeArray('title')).toBe(false);
      expect(shouldBeArray('description')).toBe(false);
    });
  });

  describe('shouldBeObject', () => {
    it('should identify object fields correctly', () => {
      expect(shouldBeObject('assets')).toBe(true);
      expect(shouldBeObject('item_assets')).toBe(true);
      expect(shouldBeObject('summaries')).toBe(true);
      expect(shouldBeObject('title')).toBe(false);
      expect(shouldBeObject('keywords')).toBe(false);
    });
  });

  describe('sanitizeDatetime', () => {
    it('should fix timezone format from +00 to +00:00', () => {
      expect(sanitizeDatetime('2023-01-01T12:00:00+00')).toBe(
        '2023-01-01T12:00:00+00:00'
      );
      expect(sanitizeDatetime('2023-12-31 23:59:59+00')).toBe(
        '2023-12-31T23:59:59+00:00'
      );
    });

    it('should replace space with T in datetime strings', () => {
      expect(sanitizeDatetime('2023-01-01 12:00:00')).toBe(
        '2023-01-01T12:00:00'
      );
      expect(sanitizeDatetime('2023-12-31 23:59:59+05:30')).toBe(
        '2023-12-31T23:59:59+05:30'
      );
    });

    it('should leave properly formatted datetime strings unchanged', () => {
      const validDatetime = '2023-01-01T12:00:00+00:00';
      expect(sanitizeDatetime(validDatetime)).toBe(validDatetime);

      const anotherValid = '2023-01-01T12:00:00Z';
      expect(sanitizeDatetime(anotherValid)).toBe(anotherValid);
    });

    it('should leave non-datetime strings unchanged', () => {
      expect(sanitizeDatetime('hello world')).toBe('hello world');
      expect(sanitizeDatetime('')).toBe('');
      expect(sanitizeDatetime('123')).toBe('123');
    });
  });

  describe('sanitizeFormData', () => {
    it('should convert null values to empty arrays for array fields', () => {
      const input = {
        stac_extensions: null,
        keywords: null,
        providers: null,
        links: null,
        title: 'Test Collection',
      };

      const result = sanitizeFormData(input);

      expect(result.stac_extensions).toEqual([]);
      expect(result.keywords).toEqual([]);
      expect(result.providers).toEqual([]);
      expect(result.links).toEqual([]);
      expect(result.title).toBe('Test Collection');
    });

    it('should convert null values to empty objects for object fields', () => {
      const input = {
        assets: null,
        item_assets: null,
        summaries: null,
        title: 'Test Collection',
      };

      const result = sanitizeFormData(input);

      expect(result.assets).toEqual({});
      expect(result.item_assets).toEqual({});
      expect(result.summaries).toEqual({});
      expect(result.title).toBe('Test Collection');
    });

    it('should recursively sanitize nested objects', () => {
      const input = {
        extent: {
          temporal: {
            interval: [['2023-01-01 00:00:00+00', '2023-12-31 23:59:59+00']],
          },
          spatial: {
            bbox: [[-180, -90, 180, 90]],
          },
        },
        metadata: {
          keywords: null,
          stac_extensions: null,
        },
      };

      const result = sanitizeFormData(input);

      expect(result.extent.temporal.interval[0][0]).toBe(
        '2023-01-01T00:00:00+00:00'
      );
      expect(result.extent.temporal.interval[0][1]).toBe(
        '2023-12-31T23:59:59+00:00'
      );
      expect(result.metadata.keywords).toEqual([]);
      expect(result.metadata.stac_extensions).toEqual([]);
    });

    it('should handle arrays correctly', () => {
      const input = [
        { keywords: null, title: 'Collection 1' },
        { keywords: ['climate'], title: 'Collection 2' },
        { assets: null, title: 'Collection 3' },
      ];

      const result = sanitizeFormData(input);

      expect(result[0].keywords).toEqual([]);
      expect(result[0].title).toBe('Collection 1');
      expect(result[1].keywords).toEqual(['climate']);
      expect(result[1].title).toBe('Collection 2');
      expect(result[2].assets).toEqual({});
      expect(result[2].title).toBe('Collection 3');
    });

    it('should handle primitive values', () => {
      expect(sanitizeFormData('2023-01-01 12:00:00')).toBe(
        '2023-01-01T12:00:00'
      );
      expect(sanitizeFormData('hello')).toBe('hello');
      expect(sanitizeFormData(123)).toBe(123);
      expect(sanitizeFormData(true)).toBe(true);
      expect(sanitizeFormData(null)).toBe(null);
    });

    it('should handle complex STAC collection structure', () => {
      const stacCollection = {
        id: 'test-collection',
        title: 'Test Collection',
        description: 'A test collection',
        stac_version: '1.0.0',
        stac_extensions: null,
        keywords: null,
        license: 'CC-BY-4.0',
        providers: null,
        extent: {
          spatial: {
            bbox: [[-180, -90, 180, 90]],
          },
          temporal: {
            interval: [['2023-01-01 00:00:00+00', null]],
          },
        },
        links: null,
        assets: null,
        summaries: null,
      };

      const result = sanitizeFormData(stacCollection);

      expect(result.stac_extensions).toEqual([]);
      expect(result.keywords).toEqual([]);
      expect(result.providers).toEqual([]);
      expect(result.links).toEqual([]);
      expect(result.assets).toEqual({});
      expect(result.summaries).toEqual({});
      expect(result.extent.temporal.interval[0][0]).toBe(
        '2023-01-01T00:00:00+00:00'
      );
      expect(result.extent.temporal.interval[0][1]).toBe(null); // null datetime should remain null
      expect(result.title).toBe('Test Collection');
      expect(result.license).toBe('CC-BY-4.0');
    });
  });

  describe('findSanitizationChanges', () => {
    it('should detect null to array conversions', () => {
      const original = { keywords: null, title: 'Test' };
      const sanitized = { keywords: [], title: 'Test' };

      const changes = findSanitizationChanges(original, sanitized);

      expect(changes).toContain('🔧 keywords: null → [] (empty array)');
      expect(changes).toHaveLength(1);
    });

    it('should detect null to object conversions', () => {
      const original = { assets: null, title: 'Test' };
      const sanitized = { assets: {}, title: 'Test' };

      const changes = findSanitizationChanges(original, sanitized);

      expect(changes).toContain('🔧 assets: null → {} (empty object)');
      expect(changes).toHaveLength(1);
    });

    it('should detect datetime format changes', () => {
      const original = {
        datetime: '2023-01-01 12:00:00+00',
        title: 'Test',
      };
      const sanitized = {
        datetime: '2023-01-01T12:00:00+00:00',
        title: 'Test',
      };

      const changes = findSanitizationChanges(original, sanitized);

      expect(changes).toContain(
        '🔧 datetime: "2023-01-01 12:00:00+00" → "2023-01-01T12:00:00+00:00" (datetime format)'
      );
      expect(changes).toHaveLength(1);
    });

    it('should detect nested changes', () => {
      const original = {
        extent: {
          temporal: {
            start_datetime: '2023-01-01 00:00:00',
            end_datetime: '2023-12-31 23:59:59+00',
          },
        },
        keywords: null,
      };
      const sanitized = {
        extent: {
          temporal: {
            start_datetime: '2023-01-01T00:00:00',
            end_datetime: '2023-12-31T23:59:59+00:00',
          },
        },
        keywords: [],
      };

      const changes = findSanitizationChanges(original, sanitized);

      expect(changes).toContain('🔧 keywords: null → [] (empty array)');
      expect(changes).toContain(
        '🔧 extent.temporal.start_datetime: "2023-01-01 00:00:00" → "2023-01-01T00:00:00" (datetime format)'
      );
      expect(changes).toContain(
        '🔧 extent.temporal.end_datetime: "2023-12-31 23:59:59+00" → "2023-12-31T23:59:59+00:00" (datetime format)'
      );
      expect(changes).toHaveLength(3);
    });

    it('should return empty array when no changes are made', () => {
      const original = { title: 'Test', keywords: ['climate'] };
      const sanitized = { title: 'Test', keywords: ['climate'] };

      const changes = findSanitizationChanges(original, sanitized);

      expect(changes).toEqual([]);
    });
  });
});
