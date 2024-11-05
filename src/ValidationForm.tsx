import { SetStateAction, useState } from 'react'
 
import { withTheme } from '@rjsf/core';
import { Theme as AntDTheme } from '@rjsf/antd';
import createNewFile from './utils/CreateNewFile';

import validator from '@rjsf/validator-ajv8';
import { JSONSchema7 } from "json-schema";
import { StyleProvider } from '@ant-design/cssinjs';
import { RequestError } from '@octokit/request-error';

import ObjectFieldTemplate from "./ObjectFieldTemplate";
import jsonSchema from "./data/jsonschema.json";
import uiSchema from "./data/uischema.json";
import ErrorModal from './ErrorModal';


const Form = withTheme(AntDTheme);

function ValidationForm() {
  const [formData, setFormData] = useState<object>({});
  const [apiErrors, setApiErrors] = useState(false);

  const onFormDataChanged = (formState: { formData: SetStateAction<object | undefined>; }) => {
    setFormData(formState.formData)
}


const onFormDataSubmit = async ({ formData }) => {
  console.log(formData)
  try {
    const pr = await createNewFile(formData)
      console.log(`success, PR is available at ${pr.url}` )
      setFormData({})
  } catch (error) {
    if (error instanceof RequestError) {
          // Handle network errors or other exceptions
      console.error(`Request error message: ${error.message}`);
      console.error(`Status: ${error.status}`);
      console.error(`Request: ${JSON.stringify(error.request)}`);
      setApiErrors(true)
    } else {
      throw new Error('unknown error')
    }
  }
  }


  return (
    <>
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
    {apiErrors && <ErrorModal collectionName={formData.collection}/>}
    </>
  )
}

export default ValidationForm