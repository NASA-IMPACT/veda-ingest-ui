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

const { Text } = Typography;

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
  additionalProperties: string[] | null;
  setAdditionalProperties: (additionalProperties: string[] | null) => void;
}

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
        (modifiedSchema as any).additionalProperties = true;
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

      // Validate JSON using AJV
      const ajv = new Ajv({ allErrors: true });
      addFormats(ajv);
      const validateSchema = ajv.compile(modifiedSchema);

      const isValid = validateSchema(processedValue);
      let currentSchemaErrors: string[] = [];

      // Extract additional properties manually when strictSchema is false
      if (!strictSchema && typeof processedValue === 'object') {
        const schemaProperties = Object.keys(modifiedSchema.properties || {});
        const userProperties = Object.keys(processedValue);
        const extraProps = userProperties.filter(
          (prop) => !schemaProperties.includes(prop)
        );

        setAdditionalProperties(extraProps.length > 0 ? extraProps : null);
      }

      if (!isValid) {
        currentSchemaErrors = [
          ...currentSchemaErrors,
          ...(validateSchema.errors?.map((err) =>
            err.message === 'must NOT have additional properties'
              ? `${err.params.additionalProperty} is not defined in schema`
              : `${err.instancePath} ${err.message}`
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
        setTimeout(() => {
          additionalPropertyCardRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
          if (additionalPropertyCardRef.current) {
            additionalPropertyCardRef.current.focus();
          }
        }, 0);
        return;
      }

      setSchemaErrors([]);
      onChange(processedValue);
      setHasJSONChanges(false);
    },
    [
      strictSchema,
      setAdditionalProperties,
      setSchemaErrors,
      onChange,
      jsonSchema,
    ]
  );

  // Effect to re-run applyChanges after modal action if needed
  useEffect(() => {
    // This effect will run after handleModalAccept/handleModalLeaveUnchanged
    // cause state updates and the component re-renders.
    if (modalActionType) {
      // Clear the action type to prevent infinite loops
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

    // If "renders.dashboard" is a stringified object, parse it
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
    setSchemaErrors([]); // Clear schema errors on input change
  };

  const applyChanges = () => {
    try {
      setAdditionalProperties(null);
      let parsedValue = JSON.parse(editorValue) as JSONEditorValue;
      setJsonError(null);
      setSchemaErrors([]); // Clear previous schema errors

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

      const hasDashboardRelatedKeys =
        Object.prototype.hasOwnProperty.call(parsedValue, 'is_periodic') ||
        Object.prototype.hasOwnProperty.call(parsedValue, 'time_density');

      if (hasDashboardRelatedKeys) {
        if (strictSchema) {
          setIsModalVisible(true);
          return;
        }
      }

      validateAndApply(parsedValue);
    } catch (err) {
      console.error('error', err);
      setJsonError('Invalid JSON format.');
      setSchemaErrors([]);
    }
  };

  // --- Modal Handlers ---
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

    if (
      Object.prototype.hasOwnProperty.call(
        currentEditorParsedValue,
        'is_periodic'
      )
    ) {
      currentEditorParsedValue['dashboard:is_periodic'] =
        currentEditorParsedValue.is_periodic;
      delete currentEditorParsedValue.is_periodic;
    }
    if (
      Object.prototype.hasOwnProperty.call(
        currentEditorParsedValue,
        'time_density'
      )
    ) {
      currentEditorParsedValue['dashboard:time_density'] =
        currentEditorParsedValue.time_density;
      delete currentEditorParsedValue.time_density;
    }

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
    // User cancelled, so they might want to re-edit. No apply changes are triggered.
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
          backgroundColor: '#00152a',
          fontFamily:
            'ui-monospace,SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace',
          boxShadow: '0px 3px 15px rgba(0, 0, 0, 0.2)',
          borderRadius: '6px',
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
          additionalProperties={schemaErrors}
          style="error"
        />
      )}

      <Modal
        title="Suggestion for Dashboard-Related Keys"
        open={isModalVisible}
        onCancel={handleModalCancel}
        footer={[
          <Button key="leave-unchanged" onClick={handleModalLeaveUnchanged}>
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
          <Typography.Paragraph>
            It looks like you&apos;ve included{' '}
            <Typography.Text strong>&quot;is_periodic&quot;</Typography.Text> or{' '}
            <Typography.Text strong>&quot;time_density&quot;</Typography.Text>{' '}
            at the top level of your JSON. These keys are typically expected to
            be prefixed with{' '}
            <Typography.Text code>&quot;dashboard:&quot;</Typography.Text>{' '}
            (e.g.,{' '}
            <Typography.Text code>
              &quot;dashboard:is_periodic&quot;
            </Typography.Text>
            ).
          </Typography.Paragraph>
          <Typography.Paragraph>
            How would you like to proceed?
          </Typography.Paragraph>
          <Flex vertical gap="small">
            <Typography.Text>
              <Typography.Text strong>
                Option 1: Accept &amp; Add Prefix
              </Typography.Text>
              <br />
              Automatically rename these keys (e.g., &quot;is_periodic&quot;
              becomes &quot;dashboard:is_periodic&quot;).
            </Typography.Text>
            <Typography.Text>
              <Typography.Text strong>
                Option 2: Leave Unchanged
              </Typography.Text>
              <br />
              Keep the keys as they are, and we&apos;ll automatically disable
              the &quot;Enforce strict schema&quot; check to prevent validation
              errors for these properties.
            </Typography.Text>
          </Flex>
        </Flex>
      </Modal>
    </Flex>
  );
};

export default JSONEditor;
