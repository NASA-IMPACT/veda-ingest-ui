'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Typography, Checkbox, Flex, message, Modal } from 'antd';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import AdditionalPropertyCard from '@/components/AdditionalPropertyCard';
import dynamic from 'next/dynamic';
import '@uiw/react-textarea-code-editor/dist.css';

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

interface JSONEditorProps {
  value: JSONEditorValue;
  jsonSchema: Record<string, unknown>;
  onChange: (updatedValue: JSONEditorValue) => void;
  disableCollectionNameChange?: boolean;
  disableIdChange?: boolean;
  hasJSONChanges?: boolean;
  setHasJSONChanges: (hasJSONChanges: boolean) => void;
  additionalProperties: { [key: string]: any } | null;
  setAdditionalProperties: (
    additionalProperties: { [key: string]: any } | null
  ) => void;
}

const codeEditorStyle = {
  backgroundColor: '#00152a',
  fontFamily:
    'ui-monospace,SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace',
  boxShadow: '0px 3px 15px rgba(0, 0, 0, 0.2)',
  borderRadius: '6px',
};

const JSONEditor: React.FC<JSONEditorProps> = ({
  value,
  jsonSchema,
  onChange,
  hasJSONChanges,
  setHasJSONChanges,
  disableCollectionNameChange = false,
  disableIdChange = false,
  additionalProperties,
  setAdditionalProperties,
}) => {
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

  const editorRef = useRef<any>(null);
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
      let processedValue = structuredClone(valueToValidate);

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
      const modifiedSchema = structuredClone(jsonSchema) as Record<
        string,
        unknown
      >;

      if (strictSchema) {
        (modifiedSchema as any).additionalProperties = false;
      } else {
        delete (modifiedSchema as any).additionalProperties;
      }

      // Override "renders.dashboard" property to allow both string & object
      if (
        modifiedSchema.properties &&
        (modifiedSchema.properties as any).renders?.dashboard &&
        (modifiedSchema.properties as any).renders.dashboard.properties
      ) {
        (
          modifiedSchema.properties as any
        ).renders.dashboard.properties.dashboard = {
          oneOf: [
            { type: 'string' },
            { type: 'object', additionalProperties: true },
          ],
        };
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
            {} as { [key: string]: any }
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

      let parsedValue = JSON.parse(editorValue) as JSONEditorValue;

      if (disableCollectionNameChange && initialCollectionValue !== undefined) {
        if (parsedValue.collection !== initialCollectionValue) {
          message.error(
            `Collection name cannot be changed! Expected: "${initialCollectionValue}"`
          );
          return;
        }
      }

      if (disableIdChange && initialIdValue !== undefined) {
        if (parsedValue.id !== initialIdValue) {
          message.error(`ID cannot be changed! Expected: "${initialIdValue}"`);
          return;
        }
      }

      const dashboardKeys = ['is_periodic', 'time_density', 'time_duration'];
      const foundKeys = dashboardKeys.filter((key) =>
        Object.prototype.hasOwnProperty.call(parsedValue, key)
      );

      if (foundKeys.length > 0 && strictSchema) {
        const before: { [key: string]: any } = {};
        const after: { [key: string]: any } = {};

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
      } catch (err) {
        setJsonError('Invalid JSON format after modal action.');
      }
    }
  }, [modalActionType, editorValue, validateAndApply]);

  useEffect(() => {
    let updatedValue = { ...value };
    if (
      value.renders?.dashboard &&
      typeof value.renders.dashboard === 'string'
    ) {
      try {
        updatedValue.renders = {
          ...value.renders,
          dashboard: JSON.parse(value.renders.dashboard),
        };
      } catch (err) {
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
    } catch (err) {
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
