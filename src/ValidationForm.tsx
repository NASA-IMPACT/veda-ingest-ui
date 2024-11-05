import { SetStateAction, useState } from 'react'
 
import { withTheme } from '@rjsf/core';
import { Theme as AntDTheme } from '@rjsf/antd';

import validator from '@rjsf/validator-ajv8';
import { JSONSchema7 } from "json-schema";
import { StyleProvider } from '@ant-design/cssinjs';
import { RequestError } from '@octokit/request-error';

import createNewFile from './utils/CreateNewFile';
import ObjectFieldTemplate from "./ObjectFieldTemplate";
import jsonSchema from "./data/jsonschema.json";
import uiSchema from "./data/uischema.json";
import { Status } from './App';


const Form = withTheme(AntDTheme);


function ValidationForm({
  setStatus,
  setCollectionName,
  setApiErrorMessage,
  setPullRequestUrl
}: {
  setStatus: (status: Status) => void,
  setCollectionName: (collectionName: string) => void,
  setApiErrorMessage: (apiErrorMessage: string) => void,
  setPullRequestUrl: (PullRequestUrl: string) => void
}) {
  const [formData, setFormData] = useState<object>({});

  const onFormDataChanged = (formState: { formData: SetStateAction<object | undefined>; }) => {
    setFormData(formState.formData)
}


const onFormDataSubmit = async ({ formData }) => {
  setStatus('loading')
  setCollectionName(formData.collection)
  console.log(formData)
  try {
    const pr = await createNewFile(formData)
      console.log(`success, PR is available at ${pr.url}` )
      setPullRequestUrl(pr.data.html_url);
      setFormData({});
      setStatus('success')
  } catch (error) {
    if (error instanceof RequestError) {
      // Handle network errors or other exceptions
      console.error(`Request error message: ${error.message}`);
      console.error(`Status: ${error.status}`);
      console.error(`Request: ${JSON.stringify(error.request)}`);
      setApiErrorMessage(error.message)
      setStatus('error');
    } else {
      console.error(error);
      setStatus('error');
      }
    }
  }

  return (
      <StyleProvider >
        <Form
          schema={jsonSchema as JSONSchema7}
          uiSchema={uiSchema}
          validator={validator}
          templates={{
            ObjectFieldTemplate: ObjectFieldTemplate,
          }}
          formData={formData}
          onChange={onFormDataChanged}
          onSubmit={onFormDataSubmit} 
        />
    </StyleProvider>
  )
}

export default ValidationForm