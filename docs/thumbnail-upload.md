# Thumbnail Upload: Role, Permissions, and Flow

Thumbnail upload uses a server-issued presigned S3 URL. The browser never receives long-lived AWS credentials.

## AWS Role Used

- The app reads `ASSUME_ROLE_ARN` at runtime.
- Server code in `utils/s3.ts` calls STS `AssumeRole` against that ARN.
- The assume-role call includes `ExternalId` from `INGEST_UI_EXTERNAL_ID` (loaded via runtime secret lookup).

In practice there are two AWS IAM roles involved:

1. Amplify SSR runtime role (the role executing Next.js server routes)
2. Thumbnail upload target role (`ASSUME_ROLE_ARN`), assumed by the runtime role

## Application Authorization Expected

Users must be authenticated and have `canCreateIngest` capability.

## IAM Permissions Expected

Minimum expected permissions for correct thumbnail upload behavior:

- On Amplify SSR runtime role:
  - `sts:AssumeRole` on `ASSUME_ROLE_ARN`
- On thumbnail upload target role policy (bucket/object permissions):
  - `s3:PutObject` on `arn:aws:s3:::<bucket-name>/*`
  - `s3:HeadObject` on `arn:aws:s3:::<bucket-name>/*`

Why `HeadObject` is needed:

- The app checks whether a filename already exists before issuing the upload URL, and prompts for overwrite confirmation.

## End-to-End Upload Flow

1. User opens `/upload` (or upload drawer in ingest form) and selects a JPG/PNG.
2. Client validates type and image constraints.
3. Client calls `POST /api/upload-url` with `{ filename, filetype }`.
4. Server authorization gate verifies authenticated session and `canCreateIngest`.
5. Server assumes `ASSUME_ROLE_ARN` with STS + external ID.
6. Server checks object existence with `HeadObject`.
7. Server creates presigned S3 `PUT` URL for the object key.
8. Server returns `{ uploadUrl, fileUrl, fileExists }`.
9. Client optionally confirms overwrite if `fileExists === true`.
10. Client uploads directly to S3 via XHR `PUT` to `uploadUrl`.
11. Client stores resulting `fileUrl` (`https://<bucket>.s3.<region>.amazonaws.com/<filename>`).
12. Client displays the uploaded image preview using the CloudFront base URL (`https://thumbnails.openveda.cloud/`) plus filename.

## Operational Notes

- Presigned URL validity is tied to short-lived STS credentials (`DurationSeconds: 900`).
- Allowed MIME types are `image/jpeg` and `image/png`.
- Bucket name comes from `NEXT_PUBLIC_AWS_S3_BUCKET_NAME` in the selected environment profile.
