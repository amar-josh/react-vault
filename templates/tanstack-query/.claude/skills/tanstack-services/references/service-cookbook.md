# Service cookbook (TanStack)

Templates for common shapes. Copy + adapt.

## List

```ts
export const getKycList = async (): Promise<IKycListResponse> => {
  const raw = await GET<unknown>(KYC_URLS.LIST);
  return kycListResponseSchema.parse(raw);
};
```

## Paginated list

```ts
export const getKycList = async (params: {
  page: number;
  pageSize: number;
  status?: KycStatus;
}): Promise<IKycListResponse> => {
  const raw = await GET<unknown, typeof params>(KYC_URLS.LIST, params);
  return kycListResponseSchema.parse(raw);
};

// Component:
const { data } = useQuery({
  queryKey: kycKeys.list({ page, pageSize, status }),
  queryFn: () => getKycList({ page, pageSize, status }),
  placeholderData: (prev) => prev, // smooth pagination — keep previous data visible
});
```

## Detail

```ts
export const getKycDetail = async (id: string): Promise<IKycRecord> => {
  const raw = await GET<unknown>(KYC_URLS.DETAIL(id));
  return kycRecordSchema.parse(raw);
};
```

## Create

```ts
export const submitKyc = async (payload: IKycSubmitRequest): Promise<IKycRecord> => {
  const raw = await POST<unknown, IKycSubmitRequest>(KYC_URLS.SUBMIT, payload);
  return kycRecordSchema.parse(raw);
};

// Component:
const submit = useMutation({
  mutationFn: submitKyc,
  onSuccess: (newRecord) => {
    queryClient.invalidateQueries({ queryKey: kycKeys.lists() });
    queryClient.setQueryData(kycKeys.detail(newRecord.id), newRecord);
  },
});
```

## Update

```ts
export const updateKyc = async (args: {
  id: string;
  body: IKycUpdateRequest;
}): Promise<IKycRecord> => {
  const raw = await PUT<unknown, IKycUpdateRequest>(KYC_URLS.DETAIL(args.id), args.body);
  return kycRecordSchema.parse(raw);
};

// Component:
const update = useMutation({
  mutationFn: updateKyc,
  onSuccess: (updated, { id }) => {
    queryClient.invalidateQueries({ queryKey: kycKeys.lists() });
    queryClient.setQueryData(kycKeys.detail(id), updated);
  },
});
```

Pattern: mutations that take both an id and a body wrap them in a single object. Keeps `mutationFn` typed as `(args: {...}) => Promise<...>` rather than overloaded.

## Delete

```ts
export const deleteKyc = (id: string): Promise<void> => DELETE<void>(KYC_URLS.DETAIL(id));

// Component:
const del = useMutation({
  mutationFn: deleteKyc,
  onSuccess: (_, id) => {
    queryClient.invalidateQueries({ queryKey: kycKeys.lists() });
    queryClient.removeQueries({ queryKey: kycKeys.detail(id) });
  },
});
```

## Polling (e.g. async job status)

```ts
export const getJobStatus = async (jobId: string): Promise<IJobStatus> => {
  const raw = await GET<unknown>(JOB_URLS.STATUS(jobId));
  return jobStatusSchema.parse(raw);
};

// Component:
const { data } = useQuery({
  queryKey: jobKeys.status(jobId),
  queryFn: () => getJobStatus(jobId),
  refetchInterval: (query) => {
    const status = query.state.data?.status;
    return status === 'completed' || status === 'failed' ? false : 3000;
  },
});
```

## File upload

```ts
export const uploadDocument = async (file: File): Promise<IDocumentRecord> => {
  const form = new FormData();
  form.append('file', file);
  const raw = await POST<unknown, FormData>(DOCS_URLS.UPLOAD, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return documentRecordSchema.parse(raw);
};
```

## File download

```ts
export const downloadStatement = (id: string): Promise<Blob> =>
  GET<Blob, void>(STATEMENT_URLS.DOWNLOAD(id), undefined, { responseType: 'blob' });
```

## Parallel fetches in one query

```ts
export const getDashboardData = async (userId: string): Promise<IDashboardData> => {
  const [profile, accounts, recent] = await Promise.all([
    GET<unknown>(USER_URLS.PROFILE(userId)),
    GET<unknown>(ACCOUNT_URLS.LIST_FOR_USER(userId)),
    GET<unknown>(TX_URLS.RECENT_FOR_USER(userId, { limit: 5 })),
  ]);
  return dashboardSchema.parse({ profile, accounts, recent });
};
```

Components calling this get one queryKey, one loading state, one error — even though it makes 3 HTTP calls.
