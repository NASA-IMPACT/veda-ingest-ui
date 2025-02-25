// components/FileUpload.js
import { Dropzone, FileWithPath, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { useForm } from '@mantine/form';
import { Button } from '@mantine/core';
import { useState } from 'react';

function FileUpload() {
  const [file, setFile] = useState(null);
  const form = useForm({
    initialValues: {
      file: null,
    },
  });

  const handleAcceptedFiles = (files) => {
    setFile(files[0]);
  };

  const handleSubmit = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        console.log(data.message);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Dropzone
        accept={IMAGE_MIME_TYPE}
        onDrop={(files) => {
          form.setFieldValue('file', files[0]);
          handleAcceptedFiles(files);
        }}
        maxFiles={1}
      >
        {(status) => (
          <p>{status.accepted ? 'Drop files here' : 'Select file'}</p>
        )}
      </Dropzone>
      <Button type="submit" mt="md">
        Upload
      </Button>
    </form>
  );
}

export default FileUpload;
