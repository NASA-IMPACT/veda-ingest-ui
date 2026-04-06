'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Typography, Checkbox, Flex, Modal, App } from 'antd';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import AdditionalPropertyCard from '@/components/rjsf-components/AdditionalPropertyCard';
import dynamic from 'next/dynamic';
import '@uiw/react-textarea-code-editor/dist.css';
import { JSONSchema7 } from 'json-schema';

const CodeEditor = dynamic(
  () => import('@uiw/react-textarea-code-editor').then((mod) => mod.default),
  { ssr: false }
);

const { Text, Paragraph } = Typography;

interface Renders {
  dashboard?: string | object;
}

export interface JSONEditorValue {
  collection?: string;
  id?: string;
  renders?: Renders;
  temporal_extent?: {
    startdate?: string;
    enddate?: string;
  };
  is_periodic?: boolean;
  time_density?: string;
  [key: string]: unknown; // Allows additional dynamic properties
}

interface ImmutableFieldConfig {
  value: unknown;
  label?: string;
}

interface JSONEditorProps {
  value: JSONEditorValue;
  jsonSchema: JSONSchema7;
  onChange: (updatedValue: JSONEditorValue) => void;
  disableCollectionNameChange?: boolean;
  disableIdChange?: boolean;
  immutableFields?: Record<string, ImmutableFieldConfig>;
  hasJSONChanges?: boolean;
  setHasJSONChanges: (hasJSONChanges: boolean) => void;
  additionalProperties: Record<string, unknown> | null;
  setAdditionalProperties: (
    additionalProperties: Record<string, unknown> | null
  ) => void;
}

type MutableSchema = {
  additionalProperties?: unknown;
  properties?: Record<string, unknown>;
};

const codeEditorStyle = {
  backgroundColor: '#00152a',
  fontFamily:
    'ui-monospace,SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace',
  boxShadow: '0px 3px 15px rgba(0, 0, 0, 0.2)',
  borderRadius: '6px',
};

const isDeepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;

  if (a === null || b === null) return a === b;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => isDeepEqual(item, b[index]));
  }

  if (
    typeof a === 'object' &&
    typeof b === 'object' &&
    !Array.isArray(a) &&
    !Array.isArray(b)
  ) {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);

    if (aKeys.length !== bKeys.length) return false;

    return aKeys.every(
      (key) =>
        Object.prototype.hasOwnProperty.call(bObj, key) &&
        isDeepEqual(aObj[key], bObj[key])
    );
  }

  return false;
};

const JSONEditor: React.FC<JSONEditorProps> = ({
  value,
  jsonSchema,
  onChange,
  hasJSONChanges,
  setHasJSONChanges,
  disableCollectionNameChange = false,
  disableIdChange = false,
  immutableFields,
  additionalProperties,
  setAdditionalProperties,
}) => {
  const { message } = App.useApp();
  const [editorValue, setEditorValue] = useState<string>(
    JSON.stringify(value, null, 2)
  );
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [schemaErrors, setSchemaErrors] = useState<string[]>([]);
  const [strictSchema, setStrictSchema] = useState<boolean>(true);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [modalActionType, setModalActionType] = useState<
    'accept' | 'unchanged' | null
  >(null);
  const [modalBeforeCode, setModalBeforeCode] = useState<string>('');
  const [modalAfterCode, setModalAfterCode] = useState<string>('');

  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const additionalPropertyCardRef = useRef<HTMLDivElement>(null);

  // Store initial collection value (only if disableCollectionNameChange is true)
  const initialCollectionValue = useState<string | undefined>(
    disableCollectionNameChange
      ? (value.collection as string | undefined)
      : undefined
  )[0];

  // Store initial ID value if disableIdChange is true
  const initialIdValue = useState<string | undefined>(
    disableIdChange ? (value.id as string | undefined) : undefined
  )[0];

  const validateAndApply = useCallback(
    (valueToValidate: JSONEditorValue) => {
      const processedValue = structuredClone(valueToValidate);

      if (
        processedValue.renders?.dashboard &&
        typeof processedValue.renders.dashboard === 'object'
      ) {
        try {
          processedValue.renders.dashboard = JSON.stringify(
            processedValue.renders.dashboard,
            null,
            2
          );
        } catch (e) {
          console.error('Error stringifying renders.dashboard:', e);
          setSchemaErrors(['Invalid JSON object in renders.dashboard.']);
          return;
        }
      }

      // Create a deep copy of the JSON schema
      const modifiedSchema = structuredClone(jsonSchema) as MutableSchema;

      if (strictSchema) {
        modifiedSchema.additionalProperties = false;
      } else {
        delete modifiedSchema.additionalProperties;
      }

      // Override "renders.dashboard" property to allow both string & object
      const rendersSchema = modifiedSchema.properties?.renders;
      if (typeof rendersSchema === 'object' && rendersSchema !== null) {
        const rendersProperties = (
          rendersSchema as { properties?: Record<string, unknown> }
        ).properties;
        const dashboardSchema = rendersProperties?.dashboard;
        if (typeof dashboardSchema === 'object' && dashboardSchema !== null) {
          (dashboardSchema as { oneOf?: unknown }).oneOf = [
            { type: 'string' },
            { type: 'object', additionalProperties: true },
          ];
        }
      }

      // Extract additional properties manually when strictSchema is false
      if (!strictSchema && typeof processedValue === 'object') {
        const schemaProperties = Object.keys(modifiedSchema.properties || {});
        const userProperties = Object.keys(processedValue);
        const extraPropKeys = userProperties.filter(
          (prop) => !schemaProperties.includes(prop)
        );

        if (extraPropKeys.length > 0) {
          const extraPropsObject = extraPropKeys.reduce(
            (acc, key) => {
              acc[key] = processedValue[key];
              return acc;
            },
            {} as Record<string, unknown>
          );
          setAdditionalProperties(extraPropsObject);
        } else {
          setAdditionalProperties(null);
        }
      }

      const ajv = new Ajv({ allErrors: true });
      addFormats(ajv);
      const validateSchema = ajv.compile(modifiedSchema);
      const isValid = validateSchema(processedValue);
      let currentSchemaErrors: string[] = [];

      if (!isValid) {
        currentSchemaErrors = [
          ...currentSchemaErrors,
          ...(validateSchema.errors?.map((err) =>
            err.message === 'must NOT have additional properties'
              ? `${err.params.additionalProperty} is not defined in schema`
              : `${err.instancePath.substring(1) || ''} ${err.message}`.trim()
          ) || []),
        ];
      }

      // Custom validation for temporal_extent dates
      const startDate = processedValue.temporal_extent?.startdate;
      const endDate = processedValue.temporal_extent?.enddate;

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          currentSchemaErrors.push(
            'Invalid date format in temporal_extent. Please use a valid date string.'
          );
        } else if (start.getTime() >= end.getTime()) {
          currentSchemaErrors.push(
            'End Date must be after Start Date in temporal_extent.'
          );
        }
      }

      if (currentSchemaErrors.length > 0) {
        setSchemaErrors(currentSchemaErrors);
        // Clear additional properties if schema errors exist, as errors are more critical
        setAdditionalProperties(null);
        setTimeout(() => {
          additionalPropertyCardRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
          additionalPropertyCardRef.current?.focus();
        }, 0);
        return;
      }

      setSchemaErrors([]);
      onChange(processedValue);
      setHasJSONChanges(false);
    },
    [
      strictSchema,
      jsonSchema,
      onChange,
      setAdditionalProperties,
      setHasJSONChanges,
    ]
  );

  const applyChanges = () => {
    try {
      // Clear both errors and properties before validation
      setAdditionalProperties(null);
      setJsonError(null);
      setSchemaErrors([]);

      const parsedValue = JSON.parse(editorValue) as JSONEditorValue;

      if (disableCollectionNameChange && initialCollectionValue !== undefined) {
        if (parsedValue.collection !== initialCollectionValue) {
          message?.error?.(
            `Collection name cannot be changed! Expected: "${initialCollectionValue}"`
          );
          return;
        }
      }

      if (disableIdChange && initialIdValue !== undefined) {
        if (parsedValue.id !== initialIdValue) {
          message?.error?.(
            `ID cannot be changed! Expected: "${initialIdValue}"`
          );
          return;
        }
      }

      if (immutableFields) {
        for (const [fieldName, config] of Object.entries(immutableFields)) {
          if (!isDeepEqual(parsedValue[fieldName], config.value)) {
            const fieldLabel = config.label || fieldName;
            const errorMessage = `${fieldLabel} cannot be changed in this mode.`;
            setJsonError(errorMessage);
            message?.error?.(errorMessage);
            return;
          }
        }
      }

      const dashboardKeys = ['is_periodic', 'time_density', 'time_duration'];
      const foundKeys = dashboardKeys.filter((key) =>
        Object.prototype.hasOwnProperty.call(parsedValue, key)
      );

      if (foundKeys.length > 0 && strictSchema) {
        const before: Record<string, unknown> = {};
        const after: Record<string, unknown> = {};

        foundKeys.forEach((key) => {
          before[key] = parsedValue[key as keyof JSONEditorValue];
          after[`dashboard:${key}`] = parsedValue[key as keyof JSONEditorValue];
        });

        setModalBeforeCode(JSON.stringify(before, null, 2));
        setModalAfterCode(JSON.stringify(after, null, 2));
        setIsModalVisible(true);
        return;
      }

      validateAndApply(parsedValue);
    } catch (err) {
      console.error('error', err);
      setJsonError('Invalid JSON format.');
      setSchemaErrors([]);
    }
  };

  useEffect(() => {
    if (modalActionType) {
      setModalActionType(null);
      try {
        const valueFromEditor = JSON.parse(editorValue) as JSONEditorValue;
        validateAndApply(valueFromEditor);
      } catch {
        setJsonError('Invalid JSON format after modal action.');
      }
    }
  }, [modalActionType, editorValue, validateAndApply]);

  useEffect(() => {
    const updatedValue = { ...value };
    if (
      value.renders?.dashboard &&
      typeof value.renders.dashboard === 'string'
    ) {
      try {
        updatedValue.renders = {
          ...value.renders,
          dashboard: JSON.parse(value.renders.dashboard),
        };
      } catch {
        console.warn(
          "Could not parse 'renders.dashboard' as JSON, leaving it as-is."
        );
      }
    }
    setEditorValue(JSON.stringify(updatedValue, null, 2));
  }, [value]);

  const handleInputChange = (value: string) => {
    setEditorValue(value);
    setHasJSONChanges(true);
    setJsonError(null);
    setSchemaErrors([]);
  };

  const handleModalAccept = () => {
    let currentEditorParsedValue: JSONEditorValue;
    try {
      currentEditorParsedValue = JSON.parse(editorValue) as JSONEditorValue;
    } catch {
      setJsonError(
        'Invalid JSON format. Please correct before applying changes.'
      );
      setIsModalVisible(false);
      return;
    }

    const keysToPrefix = ['is_periodic', 'time_density', 'time_duration'];
    keysToPrefix.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(currentEditorParsedValue, key)) {
        currentEditorParsedValue[`dashboard:${key}`] =
          currentEditorParsedValue[key as keyof JSONEditorValue];
        delete currentEditorParsedValue[key as keyof JSONEditorValue];
      }
    });

    setEditorValue(JSON.stringify(currentEditorParsedValue, null, 2));
    setIsModalVisible(false);
    setModalActionType('accept'); // Trigger the useEffect to re-run validation
  };

  const handleModalLeaveUnchanged = () => {
    setIsModalVisible(false);
    setStrictSchema(false);
    setModalActionType('unchanged'); // Trigger the useEffect to re-run validation
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <Flex vertical gap="middle">
      {disableCollectionNameChange && (
        <Typography.Text type="warning" data-testid="collectionName">
          Editing Collection: <strong>{initialCollectionValue}</strong>
        </Typography.Text>
      )}
      {disableIdChange && (
        <Typography.Text type="warning" data-testid="idName">
          Editing ID: <strong>{initialIdValue}</strong>
        </Typography.Text>
      )}
      <Checkbox
        checked={strictSchema}
        onChange={(e) => setStrictSchema(e.target.checked)}
        style={{ marginBottom: '10px' }}
      >
        Enforce strict schema (Disallow extra fields)
      </Checkbox>

      <CodeEditor
        ref={editorRef}
        data-testid="json-editor"
        value={editorValue}
        language="json"
        placeholder="Please enter JSON code."
        onChange={(evn: { target: { value: string } }) =>
          handleInputChange(evn.target.value)
        }
        padding={15}
        style={{
          fontSize: 14,
          ...codeEditorStyle,
        }}
      />
      <Button
        onClick={applyChanges}
        type="primary"
        style={{ marginTop: '10px' }}
        disabled={!hasJSONChanges}
      >
        Apply Changes
      </Button>

      {jsonError && <Text type="danger">{jsonError}</Text>}

      {schemaErrors.length > 0 && (
        <AdditionalPropertyCard
          ref={additionalPropertyCardRef}
          // Transform the error array into an object for the card
          additionalProperties={schemaErrors.reduce(
            (acc, error, index) => {
              acc[`Error ${index + 1}`] = error;
              return acc;
            },
            {} as { [key: string]: string }
          )}
          style="error"
        />
      )}

      {schemaErrors.length === 0 && additionalProperties && (
        <AdditionalPropertyCard
          ref={additionalPropertyCardRef}
          additionalProperties={additionalProperties}
          style="warning"
        />
      )}

      <Modal
        title="Suggestion for Dashboard-Related Keys"
        open={isModalVisible}
        onCancel={handleModalCancel}
        width={700}
        footer={[
          <Button
            key="leave-unchanged"
            onClick={handleModalLeaveUnchanged}
            danger
          >
            Leave Unchanged
          </Button>,
          <Button
            key="accept-prefix"
            type="primary"
            onClick={handleModalAccept}
          >
            Accept & Add Prefix
          </Button>,
        ]}
      >
        <Flex vertical gap="small">
          <Paragraph>
            We noticed some top-level keys that are usually prefixed with{' '}
            <Text code>dashboard:</Text>. We recommend applying this prefix for
            better organization.
          </Paragraph>

          <Flex gap="large" justify="space-around">
            <Flex vertical flex={1}>
              <Text strong>Current</Text>
              <CodeEditor
                value={modalBeforeCode}
                language="json"
                padding={10}
                readOnly
                style={{
                  fontSize: 12,
                  ...codeEditorStyle,
                }}
              />
            </Flex>
            <Flex vertical flex={1}>
              <Text strong>Recommended</Text>
              <CodeEditor
                value={modalAfterCode}
                language="json"
                padding={10}
                readOnly
                style={{
                  fontSize: 12,
                  ...codeEditorStyle,
                }}
              />
            </Flex>
          </Flex>

          <Paragraph style={{ marginTop: '16px' }}>
            <Text strong>Accept & Add Prefix:</Text> Automatically renames these
            keys.
            <br />
            <Text strong>Leave Unchanged:</Text> Keeps the keys as they are and
            disables the strict schema check to prevent validation errors.
          </Paragraph>
        </Flex>
      </Modal>
    </Flex>
  );
};

export default JSONEditor;
