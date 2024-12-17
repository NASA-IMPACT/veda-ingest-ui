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
import { Endpoints } from '@octokit/types';
type PullRequests =
  Endpoints['GET /repos/{owner}/{repo}/pulls']['response']['data'];

import ObjectFieldTemplate from '../../ObjectFieldTemplate';
import jsonSchema from '@/FormSchemas/jsonschema.json';
import uiSchema from '@/FormSchemas/uischema.json';

const Form = withTheme(AntDTheme);

const lockedFormFields = {
  collection: {
    'ui:readonly': true,
  },
  'ui:submitButtonOptions': {
    props: {
      block: 'false',
    },
  },
};

const lockedSchema = { ...uiSchema, ...lockedFormFields };

Amplify.configure({ ...config }, { ssr: true });

const EditIngest = function EditIngest() {
  const [data, setData] = useState<PullRequests[]>();
  const [status, setStatus] = useState<Status>('idle');
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [ref, setRef] = useState('');
  const [fileSha, setFileSha] = useState('');
  const [filePath, setFilePath] = useState('');

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

      const { githubResponse } = await response.json();
      // Type the response data
      const pullRequests: Endpoints['GET /repos/{owner}/{repo}/pulls']['response']['data'][] =
        githubResponse;
      setData(pullRequests);
      setStatus('idle');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

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
      console.log(`trying to update branch with sha: ${sha} and ref: ${ref}`);
      setRef(ref);

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`There was an error on handleClick: ${errorMessage}`);
      }

      const { fileSha, filePath, content } = await response.json();

      setFilePath(filePath);
      setFileSha(fileSha);
      setFormData(content);
      console.log(content);
      setStatus('idle');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  const handleCancel = () => {
    setFilePath('');
    setFileSha('');
    setFormData({});
  };

  // @ts-expect-error RJSF form data typing
  const onFormDataSubmit = async ({ formData }) => {
    setStatus('loading');

    const url = 'api/create-ingest';
    console.log(`creating pr in ${ref} with fileSha: ${fileSha}`);
    console.log(formData);
    const requestOptions = {
      method: 'PUT',
      body: JSON.stringify({ ref, fileSha, filePath, formData }),
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
      console.log(responseJson);
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
    // @ts-expect-error RFJS issue
    setFormData(formState.formData);
  };

  return (
    <AppLayout>
      {Object.keys(formData).length === 0 && (
        <List
          header={
            <div>
              <div>Pending Ingest Requests</div>
            </div>
          }
          bordered
          dataSource={data}
          loading={status === 'loadingPRs'}
          renderItem={(item: PullRequests) => (
            <List.Item>
              <Button
                onClick={() =>
                  handleClick(
                    /* @ts-ignore head does exist */
                    item.head.ref,
                    /* @ts-ignore head does exist*/
                    item.head.sha
                  )
                }
              >
                {/* @ts-expect-error: title does exist */}
                {item.title}
              </Button>
            </List.Item>
          )}
        />
      )}
      {status === 'loadingIngest' && <Spin fullscreen />}
      {Object.keys(formData).length > 0 && (
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
        >
          <div
            style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}
          >
            <Button type="primary" size="large" htmlType="submit">
              Submit
            </Button>
            <Button
              color="danger"
              variant="outlined"
              size="large"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>
        </Form>
      )}
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
