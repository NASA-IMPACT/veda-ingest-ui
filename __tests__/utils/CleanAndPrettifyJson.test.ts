import { describe, test, expect, vi } from 'vitest';
import { CleanAndPrettifyJSON } from '@/utils/CleanAndPrettifyJson';

describe("CleanAndPrettifyJSON", () => {
    test("preserves a valid JSON string in renders", () => {
        const input = { name: "Valid", renders: `{"key": "value"}` };
        const output = CleanAndPrettifyJSON(input);
        expect(output).toBe(
            JSON.stringify({ name: "Valid", renders: { key: "value" } }, null, 2)
        );
    });

    test("leaves renders as null if it is null", () => {
        const input = { name: "Null Case", renders: null };
        const output = CleanAndPrettifyJSON(input);
        expect(output).toBe(
            JSON.stringify({ name: "Null Case", renders: null }, null, 2)
        );
    });

    test("leaves renders as empty string if it is empty", () => {
        const input = { name: "Empty String", renders: "" };
        const output = CleanAndPrettifyJSON(input);
        expect(output).toBe(
            JSON.stringify({ name: "Empty String", renders: "" }, null, 2)
        );
    });

    test("does not modify renders if it's already an object", () => {
        const input = { name: "Already Object", renders: { key: "value" } };
        const output = CleanAndPrettifyJSON(input);
        expect(output).toBe(
            JSON.stringify({ name: "Already Object", renders: { key: "value" } }, null, 2)
        );
    });

    test("keeps renders as a string if JSON parsing fails", () => {
        const consoleWarnMock = vi.spyOn(console, "warn").mockImplementation(() => {});
        const input = { name: "Invalid JSON", renders: "{invalid: json}" };
        const output = CleanAndPrettifyJSON(input);
        expect(output).toBe(
            JSON.stringify({ name: "Invalid JSON", renders: "{invalid: json}" }, null, 2)
        );
        expect(consoleWarnMock).toHaveBeenCalledWith("Invalid JSON in 'renders' field. Keeping as string.");
        consoleWarnMock.mockRestore();
    });

    test("does not add renders key if it's missing", () => {
        const input = { name: "Missing Renders Key" }; // No renders key
        const output = CleanAndPrettifyJSON(input);
        expect(output).toBe(
            JSON.stringify({ name: "Missing Renders Key" }, null, 2)
        );
    });
});
