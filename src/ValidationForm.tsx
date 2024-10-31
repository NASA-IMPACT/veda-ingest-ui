import { useState } from 'react'
 
import { withTheme } from '@rjsf/core';
import { Theme as AntDTheme } from '@rjsf/antd';


import ObjectFieldTemplate from "./ObjectFieldTemplate";
import validator from '@rjsf/validator-ajv8';
import { JSONSchema7 } from "json-schema";
import { StyleProvider } from '@ant-design/cssinjs';

import jsonSchema from "./data/jsonschema.json";

import uiSchema from "./data/uischema.json";
const Form = withTheme(AntDTheme);


function ValidationForm() {
const [formData, setFormData] = useState(null);

  return (
    <StyleProvider>
      <Form
        schema={jsonSchema as JSONSchema7}
        uiSchema={uiSchema}
        validator={validator}
        templates={{
          ObjectFieldTemplate: ObjectFieldTemplate,
        }}
        formData={formData}
        onChange={e => {setFormData(e.formData)}}
        onSubmit={ () => {
          console.log(formData)
        }}
      />
    </StyleProvider>
  )
}

export default ValidationForm