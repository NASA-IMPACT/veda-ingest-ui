import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdditionalPropertyCard from '@/components/AdditionalPropertyCard';

// Mock Ant Design's useToken hook
vi.mock('antd', async (importOriginal) => {
  const antd = await importOriginal<typeof import('antd')>();
  return {
    ...antd, // Keep all original AntD components
    theme: {
      ...antd.theme,
      useToken: () => ({
        token: {
          colorWarningText: '#D46B08',
          colorWarningBg: '#FFF7E6',
          colorErrorText: '#A8071A',
          colorErrorBg: '#FFF1F0',
          borderRadiusLG: 8,
          colorFillQuaternary: '#F0F0F0',
          borderRadius: 6,
        },
      }),
    },
  };
});

// Mock the dynamically imported CodeEditor
vi.mock('next/dynamic', async () => {
  // This mock will replace the CodeEditor with a simple textarea
  // This allows us to inspect the 'value' prop passed to it
  const MockEditor = ({ value }: { value: string }) => (
    <textarea data-testid="mock-code-editor" value={value} readOnly />
  );
  return {
    default: () => MockEditor,
  };
});

// --- Test Data ---
const singlePropertyData = {
  property_a: 'single value',
};

const multiplePropertiesData = {
  string_prop: 'hello world',
  number_prop: 123,
  object_prop: { nested: true, array: [1, 2] },
};

describe('AdditionalPropertyCard', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders null if additionalProperties is null or empty', () => {
    const { container: containerNull } = render(
      <AdditionalPropertyCard additionalProperties={null} style="warning" />
    );
    expect(containerNull.firstChild).toBeNull();

    const { container: containerEmpty } = render(
      <AdditionalPropertyCard additionalProperties={{}} style="warning" />
    );
    expect(containerEmpty.firstChild).toBeNull();
  });

  it('displays the correct title for "warning" style', () => {
    render(
      <AdditionalPropertyCard
        additionalProperties={singlePropertyData}
        style="warning"
      />
    );
    expect(
      screen.getByText('Extra Properties set via JSON Editor')
    ).toBeInTheDocument();
  });

  it('displays the correct title for "error" style', () => {
    render(
      <AdditionalPropertyCard
        additionalProperties={singlePropertyData}
        style="error"
      />
    );
    expect(screen.getByText('Schema Validation Errors')).toBeInTheDocument();
  });

  describe('Single Property Mode', () => {
    it('renders the CodeEditor directly without tags', () => {
      render(
        <AdditionalPropertyCard
          additionalProperties={singlePropertyData}
          style="warning"
        />
      );

      expect(screen.getByText('Property Details:')).toBeVisible();

      // Tags should NOT be present
      expect(screen.queryByText('Top-Level Keys (click to view):')).toBeNull();

      // The CodeEditor should be visible by default
      const editor = screen.getByTestId('mock-code-editor');
      expect(editor).toBeInTheDocument();

      // The editor's value should be the full object, pretty-printed
      const expectedValue = JSON.stringify(singlePropertyData, null, 2);
      expect(editor).toHaveValue(expectedValue);
    });
  });

  describe('Multiple Properties Mode', () => {
    it('renders tags for each key and hides the editor by default', () => {
      render(
        <AdditionalPropertyCard
          additionalProperties={multiplePropertiesData}
          style="warning"
        />
      );

      // The title for the multi-key view should be present
      expect(
        screen.getByText('Top-Level Keys (click to view):')
      ).toBeInTheDocument();

      // A tag should exist for each key
      expect(screen.getByText('string_prop')).toBeInTheDocument();
      expect(screen.getByText('number_prop')).toBeInTheDocument();
      expect(screen.getByText('object_prop')).toBeInTheDocument();

      // The CodeEditor should NOT be visible by default
      expect(screen.queryByTestId('mock-code-editor')).toBeNull();
    });

    it('shows the CodeEditor with correct content when a tag is clicked', async () => {
      const user = userEvent.setup();
      render(
        <AdditionalPropertyCard
          additionalProperties={multiplePropertiesData}
          style="warning"
        />
      );

      // Find and click the tag for 'object_prop'
      const objectTag = screen.getByText('object_prop');
      await user.click(objectTag);

      // The CodeEditor should now be visible
      const editor = screen.getByTestId('mock-code-editor');
      expect(editor).toBeInTheDocument();

      // The editor's value should be a JSON object containing ONLY the selected key-value pair
      const expectedValue = JSON.stringify(
        { object_prop: multiplePropertiesData.object_prop },
        null,
        2
      );
      expect(editor).toHaveValue(expectedValue);
    });

    it('toggles the CodeEditor off when the same tag is clicked again', async () => {
      const user = userEvent.setup();
      render(
        <AdditionalPropertyCard
          additionalProperties={multiplePropertiesData}
          style="warning"
        />
      );

      const stringTag = screen.getByText('string_prop');

      // First click: show the editor
      await user.click(stringTag);
      expect(screen.getByTestId('mock-code-editor')).toBeInTheDocument();

      // Second click: hide the editor
      await user.click(stringTag);
      expect(screen.queryByTestId('mock-code-editor')).toBeNull();
    });

    it('switches the CodeEditor content when a different tag is clicked', async () => {
      const user = userEvent.setup();
      render(
        <AdditionalPropertyCard
          additionalProperties={multiplePropertiesData}
          style="warning"
        />
      );

      // Click the first tag
      await user.click(screen.getByText('number_prop'));
      let editor = screen.getByTestId('mock-code-editor');
      let expectedValue = JSON.stringify(
        { number_prop: multiplePropertiesData.number_prop },
        null,
        2
      );
      expect(editor).toHaveValue(expectedValue);

      // Click the second tag
      await user.click(screen.getByText('string_prop'));
      editor = screen.getByTestId('mock-code-editor');
      expectedValue = JSON.stringify(
        { string_prop: multiplePropertiesData.string_prop },
        null,
        2
      );
      expect(editor).toHaveValue(expectedValue);
    });
  });
});
