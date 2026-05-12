# Endpoint cookbook

Templates for the common shapes. Copy + adapt.

## List

```ts
getKycList: builder.query<KycListResponse, void>({
  query: () => ({ url: KYC_URLS.LIST, method: GET }),
  transformResponse: (raw: unknown) => kycListResponseSchema.parse(raw),
  providesTags: ['Kyc'],
}),
```

## Paginated list

```ts
getKycList: builder.query<KycListResponse, { page: number; pageSize: number; status?: KycStatus }>({
  query: (params) => ({ url: KYC_URLS.LIST, method: GET, data: params }),
  transformResponse: (raw: unknown) => kycListResponseSchema.parse(raw),
  providesTags: (result) =>
    result
      ? [
          ...result.items.map(({ id }) => ({ type: 'Kyc' as const, id })),
          { type: 'Kyc' as const, id: 'LIST' },
        ]
      : [{ type: 'Kyc' as const, id: 'LIST' }],
}),
```

## Detail

```ts
getKycDetail: builder.query<KycRecord, string>({
  query: (id) => ({ url: KYC_URLS.DETAIL(id), method: GET }),
  transformResponse: (raw: unknown) => kycRecordSchema.parse(raw),
  providesTags: (_, __, id) => [{ type: 'Kyc', id }],
}),
```

## Create (mutation)

```ts
submitKyc: builder.mutation<KycRecord, KycSubmitRequest>({
  query: (body) => ({
    url: KYC_URLS.SUBMIT,
    method: POST,
    data: body,
    showSuccessNotification: true,
    showFailureNotification: true,
  }),
  transformResponse: (raw: unknown) => kycRecordSchema.parse(raw),
  invalidatesTags: [{ type: 'Kyc', id: 'LIST' }],
}),
```

## Update (mutation, per-record + list invalidation)

```ts
updateKyc: builder.mutation<KycRecord, { id: string; body: KycUpdateRequest }>({
  query: ({ id, body }) => ({
    url: KYC_URLS.DETAIL(id),
    method: PUT,
    data: body,
    showFailureNotification: true,
  }),
  transformResponse: (raw: unknown) => kycRecordSchema.parse(raw),
  invalidatesTags: (_, __, { id }) => [
    { type: 'Kyc', id },
    { type: 'Kyc', id: 'LIST' },
  ],
}),
```

## Delete

```ts
deleteKyc: builder.mutation<void, string>({
  query: (id) => ({
    url: KYC_URLS.DETAIL(id),
    method: DELETE,
    showSuccessNotification: true,
    showFailureNotification: true,
  }),
  invalidatesTags: (_, __, id) => [
    { type: 'Kyc', id },
    { type: 'Kyc', id: 'LIST' },
  ],
}),
```

## Polling (e.g. job status)

In the component:

```tsx
const { data } = useGetJobStatusQuery(jobId, {
  pollingInterval: data?.status === 'pending' ? 3000 : 0,
});
```

Skip polling once a terminal state is reached by setting interval to 0.

## File upload

```ts
uploadDocument: builder.mutation<DocumentRecord, FormData>({
  query: (formData) => ({
    url: DOCS_URLS.UPLOAD,
    method: POST,
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
    showFailureNotification: true,
  }),
  transformResponse: (raw: unknown) => documentRecordSchema.parse(raw),
  invalidatesTags: ['Document'],
}),
```

## File download (responseType blob)

```ts
downloadStatement: builder.query<Blob, string>({
  query: (statementId) => ({
    url: STATEMENT_URLS.DOWNLOAD(statementId),
    method: GET,
    responseType: 'blob',
  }),
}),
```

Trigger from component:

```tsx
const [trigger] = useLazyDownloadStatementQuery();
const handleDownload = async (id: string) => {
  const { data: blob } = await trigger(id).unwrap();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `statement-${id}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};
```
