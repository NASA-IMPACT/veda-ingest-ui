'use client';
import { SetStateAction, useEffect, useState } from 'react';
import AppLayout from '@/components/Layout';
import { Amplify } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react';
import { config } from '@/utils/aws-exports';
import { SignInHeader } from '@/components/SignInHeader';
import { Button, List, Spin } from 'antd';


import { withTheme } from '@rjsf/core';
import { Theme as AntDTheme } from '@rjsf/antd';

import validator from '@rjsf/validator-ajv8';
import { JSONSchema7 } from 'json-schema';
import { Status } from '@/types/global';


import ObjectFieldTemplate from '../../ObjectFieldTemplate';
import jsonSchema from '@/FormSchemas/jsonschema.json';
import uiSchema from '@/FormSchemas/uischema.json';

const Form = withTheme(AntDTheme);

const lockedFormFields =   {"collection": {
  "ui:readonly": true
}}

const lockedSchema = {...uiSchema, ...lockedFormFields};

Amplify.configure({ ...config }, { ssr: true });

const EditIngest = function EditIngest() {
  const [data, setData] = useState([])
  const [status, setStatus] = useState<Status>('idle');
  const [formData, setFormData] = useState<unknown>({});
  const [ref, updateRef] = useState('');
  const [fileSha, updateFileSha] = useState('');
  const [filePath, updateFilePath] = useState('');

  const fetchPRs = async function () {
    setStatus('loadingPRs');
    const url = 'api/list-ingests';
    const requestOptions = {
      method: 'GET',
    };
    try {
      const response = await fetch(url, requestOptions);

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`There was an error on fetchPR: ${errorMessage}`);
      } 

      const prs = await response.json();
      const openPRs = prs.githubResponse
      setData(openPRs)
      setStatus('idle');
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  useEffect(() => {
    fetchPRs();
  }, []);

  const handleClick = async (ref: string, sha: string) => {
    setStatus('loadingIngest');
    const url = `api/retrieve-ingest?ref=${ref}`;
    const requestOptions = {
      method: 'GET',
    };
    try {
      const response = await fetch(url, requestOptions);
      console.log(`trying to update branch with sha: ${sha} and ref: ${ref}`)
      updateRef(ref)

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`There was an error on handleClick: ${errorMessage}`);
      } 

      const {fileSha, filePath, content} = await response.json();
 
      updateFilePath(filePath);
      updateFileSha(fileSha);
      setFormData(content);
      setStatus('idle');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  }

    // @ts-expect-error RJSF form data typing
    const onFormDataSubmit = async ({ formData }) => {
      setStatus('loading');
  
      const url = 'api/create-ingest';
      console.log(`creating pr in ${ref} with fileSha: ${fileSha}`)
      console.log(formData);
      const requestOptions = {
        method: 'PUT',
        body: JSON.stringify({ref, fileSha, filePath, formData}),
        headers: { 'Content-Type': 'application/json' },
      };
      try {
        const response = await fetch(url, requestOptions);
  
        if (!response.ok) {
          const errorMessage = await response.text();
          setStatus('error');
          throw new Error(`There was an error onSubmit: ${errorMessage}`);
        }
  
        const responseJson = await response.json();
        console.log(responseJson)
        setFormData({});
        setStatus('success');

      } catch (error) {
        console.error(error);
        setStatus('error');
      }
    };

    const onFormDataChanged = (formState: {
      formData: SetStateAction<object | undefined>;
    }) => {
      setFormData(formState.formData);
    };

  return (
    <AppLayout>
      {Object.keys(formData).length === 0 &&
              <List
              header={
              <div>
                  <div>Open Pull Requests</div>
              </div>
            }
              // footer={<div>Footer</div>}
              bordered
              dataSource={data}
              loading={status === 'loadingPRs'}
              renderItem={(item) => (
                <List.Item>
                  <Button onClick={() => handleClick(item.head.ref, item.head.sha)}>{item.title}</Button>
                </List.Item>
              )}
            /> }
      {status === 'loadingIngest' && <Spin fullscreen />}
      { Object.keys(formData).length > 0 &&
          <Form
          schema={jsonSchema as JSONSchema7}
          uiSchema={lockedSchema}
          validator={validator}
          templates={{
            ObjectFieldTemplate: ObjectFieldTemplate,
          }}
          formData={formData}
          // @ts-expect-error RJSF onChange typing
          onChange={onFormDataChanged}
          // @ts-expect-error RJSF onSubmit typing
          onSubmit={onFormDataSubmit}
        />
      }
    </AppLayout>
  );
};

export default withAuthenticator(EditIngest, {
  hideSignUp: true,
  components: {
    SignIn: {
      Header: SignInHeader,
    },
  },
});
