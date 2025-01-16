'use client';
import { useState } from 'react';

import AppLayout from '@/components/Layout';
import { Amplify } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react';
import { config } from '@/utils/aws-exports';
import { SignInHeader } from '@/components/SignInHeader';

import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// Dynamically import react-leaflet components with no SSR
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), {
  ssr: false,
});
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), {
  ssr: false,
});

// Dynamically load the COGOverlay component to prevent SSR issues
const COGOverlay = dynamic(() => import("@/components/COGOverlay"), {
  ssr: false,
});


Amplify.configure({ ...config }, { ssr: true });

import { Spin } from 'antd';

import { IChangeEvent, withTheme } from '@rjsf/core';
import { Theme as AntDTheme } from '@rjsf/antd';
import jsonSchema from '@/FormSchemas/cogSchema.json';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { JSONSchema7 } from 'json-schema';
import COGViewer from '@/components/COGViewer';

const cogUrl = "https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/36/Q/WD/2020/7/S2A_36QWD_20200701_0_L2A/TCI.tif"; // Replace with actual COG URL



const Form = withTheme(AntDTheme);

const CreateIngest = function CreateIngest() {
  const [collectionName, setCollectionName] = useState('');
  const [apiErrorMessage, setApiErrorMessage] = useState('');
  const [pullRequestUrl, setPullRequestUrl] = useState('');

  return (
    <AppLayout>
      <COGViewer/>
    </AppLayout>
  );
};

export default withAuthenticator(CreateIngest, {
  hideSignUp: true,
  components: {
    SignIn: {
      Header: SignInHeader,
    },
  },
});
