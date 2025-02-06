import { useState, useEffect } from 'react';
import { Input, Button, Typography, Checkbox } from 'antd';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import jsonSchema from '@/FormSchemas/jsonschema.json';

const { TextArea } = Input;
const { Text } = Typography;

interface JSONEditorProps {
  value: Record<string, unknown>;
  onChange: (updatedValue: Record<string, unknown>) => void;
}

const JSONEditor: React.FC<JSONEditorProps> = ({ value, onChange }) => {
  const [editorValue, setEditorValue] = useState<string>(JSON.stringify(value, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [schemaErrors, setSchemaErrors] = useState<string[]>([]);
  const [strictSchema, setStrictSchema] = useState<boolean>(true); // Default: strict mode

  useEffect(() => {
    setEditorValue(JSON.stringify(value, null, 2));
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditorValue(e.target.value);
  };

  const applyChanges = () => {
    try {
      const parsedValue = JSON.parse(editorValue) as Record<string, unknown>;
      setJsonError(null);

      // Create a deep copy of the JSON schema
      const modifiedSchema = structuredClone(jsonSchema) as Record<string, unknown>;

      // Ensure strict mode affects additional properties
      if (strictSchema) {
        (modifiedSchema as any).additionalProperties = false; // Enforce no extra fields
      } else {
        (modifiedSchema as any).additionalProperties = true; // Allow extra fields
      }

      // Override "renders" property to allow both string & object
      if (modifiedSchema.properties && (modifiedSchema.properties as any).renders) {
        (modifiedSchema.properties as any).renders = {
          oneOf: [
            { type: "string" }, // Original: string
            { type: "object", additionalProperties: true } // Allow object
          ]
        };
      }

      // Dynamically create AJV instance based on strictSchema state
      const ajv = new Ajv({ allErrors: true });
      addFormats(ajv);
      const validateSchema = ajv.compile(modifiedSchema);

      // Validate against schema
      const isValid = validateSchema(parsedValue);
      if (!isValid) {
        setSchemaErrors(validateSchema.errors?.map(err => `${err.instancePath} ${err.message}`) || []);
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
    <div>
      <Checkbox 
        checked={strictSchema} 
        onChange={(e) => setStrictSchema(e.target.checked)}
        style={{ marginBottom: '10px' }}
      >
        Enforce strict schema (Disallow extra fields)
      </Checkbox>

      <TextArea
        rows={15}
        value={editorValue}
        onChange={handleInputChange}
        style={{ fontFamily: 'monospace' }}
      />

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

      <Button onClick={applyChanges} type="primary" style={{ marginTop: '10px' }}>
        Apply Changes
      </Button>
    </div>
  );
};

export default JSONEditor;
