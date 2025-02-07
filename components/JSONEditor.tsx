import { useState, useEffect } from 'react';
import { Input, Button, Typography, Checkbox, Flex, message } from 'antd';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import jsonSchema from '@/FormSchemas/jsonschema.json';

const { TextArea } = Input;
const { Text } = Typography;

interface JSONEditorProps {
  value: Record<string, unknown>;
  onChange: (updatedValue: Record<string, unknown>) => void;
  disableCollectionNameChange?: boolean;
  hasJSONChanges?: boolean;
  setHasJSONChanges: (hasJSONChanges: boolean) => void;
}

const JSONEditor: React.FC<JSONEditorProps> = ({
  value,
  onChange,
  hasJSONChanges,
  setHasJSONChanges,
  disableCollectionNameChange = false,
}) => {
  const [editorValue, setEditorValue] = useState<string>(
    JSON.stringify(value, null, 2)
  );
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [schemaErrors, setSchemaErrors] = useState<string[]>([]);
  const [strictSchema, setStrictSchema] = useState<boolean>(true);

  // Store initial collection value (only if disableCollectionNameChange is true)
  const initialCollectionValue = useState<string | undefined>(
    disableCollectionNameChange
      ? (value.collection as string | undefined)
      : undefined
  )[0];

  useEffect(() => {
    // If "renders" is a stringified object, convert it back to an object before displaying in JSON Editor
    let updatedValue = { ...value };
    if (typeof value.renders === 'string') {
      try {
        updatedValue.renders = JSON.parse(value.renders);
      } catch (err) {
        console.warn("Could not parse 'renders' as JSON, leaving it as-is.");
      }
    }

    setEditorValue(JSON.stringify(updatedValue, null, 2));
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditorValue(e.target.value);
    setHasJSONChanges(true);
    setJsonError(null);
  };

  const applyChanges = () => {
    try {
      let parsedValue = JSON.parse(editorValue) as Record<string, unknown>;
      setJsonError(null);

      if (disableCollectionNameChange && initialCollectionValue !== undefined) {
        if (parsedValue.collection !== initialCollectionValue) {
          message.error(
            `Collection name cannot be changed! Expected: "${initialCollectionValue}"`
          );
          return;
        }
      }

      // If "renders" is an object, convert it to a pretty JSON string before saving
      if (parsedValue.renders && typeof parsedValue.renders === 'object') {
        parsedValue.renders = JSON.stringify(parsedValue.renders, null, 2);
      }

      // Create a deep copy of the JSON schema
      const modifiedSchema = structuredClone(jsonSchema) as Record<
        string,
        unknown
      >;

      // Ensure strict mode affects additional properties
      if (strictSchema) {
        (modifiedSchema as any).additionalProperties = false;
      } else {
        (modifiedSchema as any).additionalProperties = true;
      }

      // Override "renders" property to allow both string & object
      if (
        modifiedSchema.properties &&
        (modifiedSchema.properties as any).renders
      ) {
        (modifiedSchema.properties as any).renders = {
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

      const isValid = validateSchema(parsedValue);
      if (!isValid) {
        setSchemaErrors(
          validateSchema.errors?.map(
            (err) => `${err.instancePath} ${err.message}`
          ) || []
        );
        return;
      }

      setSchemaErrors([]);
      onChange(parsedValue);
    } catch (err) {
      setJsonError('Invalid JSON format.');
      setSchemaErrors([]);
    }
  };

  return (
    <Flex vertical gap="middle">
      {disableCollectionNameChange && (
        <Typography.Text type="warning" data-testid="collectionName">
          Editing <strong>{initialCollectionValue}</strong>
        </Typography.Text>
      )}
      <Checkbox
        checked={strictSchema}
        onChange={(e) => setStrictSchema(e.target.checked)}
        style={{ marginBottom: '10px' }}
      >
        Enforce strict schema (Disallow extra fields)
      </Checkbox>

      <TextArea
        data-testid="json-editor"
        rows={15}
        value={editorValue}
        onChange={handleInputChange}
        style={{ fontFamily: 'monospace' }}
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
        <div style={{ marginTop: '10px' }}>
          <Text type="danger">Schema Validation Errors:</Text>
          <ul>
            {schemaErrors.map((error, index) => (
              <li key={index}>
                <Text type="danger">{error}</Text>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Flex>
  );
};

export default JSONEditor;
