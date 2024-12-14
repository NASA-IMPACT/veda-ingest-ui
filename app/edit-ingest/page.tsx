'use client';
import { SetStateAction, useEffect, useState } from 'react';
import AppLayout from '@/components/Layout';
import { Amplify } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react';
import { config } from '@/utils/aws-exports';
import { SignInHeader } from '@/components/SignInHeader';
import { Button, List } from 'antd';


import { withTheme } from '@rjsf/core';
import { Theme as AntDTheme } from '@rjsf/antd';

import validator from '@rjsf/validator-ajv8';
import { JSONSchema7 } from 'json-schema';

import ObjectFieldTemplate from '../../ObjectFieldTemplate';
import jsonSchema from '@/FormSchemas/jsonschema.json';
import uiSchema from '@/FormSchemas/uischema.json';

const Form = withTheme(AntDTheme);


Amplify.configure({ ...config }, { ssr: true });

const EditIngest = function EditIngest() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<unknown>({});
  const [ref, updateRef] = useState('');
  const [sha, updateSha] = useState('');

  const fetchPRs = async function () {
    setLoading(true);
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
      setLoading(false);
    } catch (err) {
      console.log(err.message)
    }
  }

  useEffect(() => {
    fetchPRs();
  }, []);

  const handleClick = async (ref: string, sha: string) => {
    const url = `api/retrieve-ingest?ref=${ref}`;
    const requestOptions = {
      method: 'GET',
    };
    try {
      const response = await fetch(url, requestOptions);
      updateSha(sha);
      updateRef(ref)

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`There was an error on handleClick: ${errorMessage}`);
      } 

      const json = await response.json();
      const content = json.content;
      console.log(json)
      setFormData(content);
    } catch (err) {
      console.log(err.message)
    }
  }

    // @ts-expect-error RJSF form data typing
    const onFormDataSubmit = async ({ formData }) => {
      // setStatus('loading');
      // setCollectionName(formData.collection);
  
      const url = 'api/create-ingest';
      console.log(`creating pr in ${ref} with sha ${sha}`)
      console.log(formData);
      const requestOptions = {
        method: 'PUT',
        body: JSON.stringify({ref, sha, formData}),
        headers: { 'Content-Type': 'application/json' },
      };
      try {
        const response = await fetch(url, requestOptions);
  
        if (!response.ok) {
          const errorMessage = await response.text();
          // setApiErrorMessage(errorMessage);
          // setStatus('error');
          throw new Error(`There was an error onSubmit: ${errorMessage}`);
        }
  
        const responseJson = await response.json();
        console.log(responseJson)
        // setPullRequestUrl(responseJson.githubURL);
        setFormData({});
        // setStatus('success');
      } catch (error) {
        console.error(error);
        // setStatus('error');
      }
    };

    const onFormDataChanged = (formState: {
      formData: SetStateAction<object | undefined>;
    }) => {
      setFormData(formState.formData);
    };

  return (
    <AppLayout>
      {Object.keys(formData).length === 0 ? 
              <List
              header={
              <div>
                  <div>Open Pull Requests</div>
              </div>
            }
              // footer={<div>Footer</div>}
              bordered
              dataSource={data}
              loading={loading}
              renderItem={(item) => (
                <List.Item>
                  <Button onClick={() => handleClick(item.head.ref, item.head.sha)}>{item.title}</Button>
                </List.Item>
              )}
            /> : (
              <Form
              schema={jsonSchema as JSONSchema7}
              uiSchema={uiSchema}
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
            )
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
