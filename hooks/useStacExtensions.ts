import { useState, useEffect } from 'react';
import { App } from 'antd';
import { JSONSchema7 } from 'json-schema';

export interface ExtensionField {
  name: string;
  required: boolean;
}

export interface Extension {
  title: string;
  fields: ExtensionField[];
}

interface UseStacExtensionsProps {
  setFormData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

export function useStacExtensions({ setFormData }: UseStacExtensionsProps) {
  const { message } = App.useApp();
  const [extensionFields, setExtensionFields] = useState<
    Record<string, Extension>
  >({});
  const [urlsToProcess, setUrlsToProcess] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const processUrl = async (url: string) => {
      setIsLoading(true);
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch schema');
        const schema = (await response.json()) as JSONSchema7;

        const title = schema.title || url;

        const fieldsDefinition = schema?.definitions?.fields;
        const properties =
          typeof fieldsDefinition === 'object' && fieldsDefinition.properties
            ? fieldsDefinition.properties
            : {};

        const requireFieldDefinition = schema?.definitions?.require_field;
        const requiredFields = new Set(
          typeof requireFieldDefinition === 'object' &&
          Array.isArray(requireFieldDefinition.required)
            ? requireFieldDefinition.required
            : []
        );

        const fields: ExtensionField[] = Object.keys(properties).map((key) => ({
          name: key,
          required: requiredFields.has(key),
        }));

        if (fields.length === 0) {
          message.warning(`No specific extension fields found in: ${title}.`);
          return;
        }

        setExtensionFields((prev) => ({ ...prev, [url]: { title, fields } }));

        setFormData((prev) => {
          const existingExtensions = new Set(
            (prev?.stac_extensions as string[]) || []
          );
          existingExtensions.add(url);
          return { ...prev, stac_extensions: Array.from(existingExtensions) };
        });

        message.success(`Extension "${title}" loaded successfully.`);
      } catch (error) {
        console.error(error);
        message.error(`Could not load or parse extension from ${url}`);
      } finally {
        setUrlsToProcess((prev) => prev.filter((u) => u !== url));
        setIsLoading(false);
      }
    };

    if (urlsToProcess.length > 0) {
      const urlToProcess = urlsToProcess[0];
      if (!extensionFields[urlToProcess]) {
        processUrl(urlToProcess);
      } else {
        setUrlsToProcess((prev) => prev.filter((u) => u !== urlToProcess));
      }
    }
  }, [urlsToProcess, extensionFields, setFormData]);

  const addExtension = (url: string) => {
    if (!url || extensionFields[url]) {
      message.warning('Extension already added or URL is empty.');
      return;
    }
    setUrlsToProcess((prev) => [...prev, url]);
  };

  const removeExtension = (urlToRemove: string) => {
    const title = extensionFields[urlToRemove]?.title || 'Extension';
    setExtensionFields((prev) => {
      const newFields = { ...prev };
      delete newFields[urlToRemove];
      return newFields;
    });
    message.info(`"${title}" extension removed.`);
  };

  return {
    extensionFields,
    addExtension,
    removeExtension,
    isLoading,
  };
}
