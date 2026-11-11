This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Tech Provider

Tech Provider is available to every signed-in user with a selected organization. Embedded signup, account details, templates, and messaging share the API base URL configured in `src/lib/tech-provider/config.ts`.

Optional build-time environment variables:

```dotenv
NEXT_PUBLIC_PEAKWHATSAPP_API_BASE_URL=https://peakwhatsappdev-1048592730476.europe-west4.run.app
```

This is the default base URL. Account details load from `/api/v2/accounts/{external_id}`, where `external_id` is the selected account's `selectedAccountId`. The Account section displays the returned details, and template browsing uses that account's `meta_connection_id`. All requests use the current user's session bearer token. There is no fallback connection ID; organizations without a Meta connection are prompted to connect WhatsApp. Account details refresh after embedded signup and can also be refreshed manually. Switching organizations clears account details and templates from the previous organization.

Templates load 25 at a time using the API's pagination cursors. Search and filters apply to the current page. Template creation supports text, JPEG/PNG, MP4, PDF, and copy-code authentication templates. Submission checks the live connection status and uses the selected account's Meta connection. Review samples are uploaded as raw files to `/template-media`; no browser Cloudinary credentials are used. Positional variables require review examples. Successful submission displays Meta's review status and refreshes the list; it does not imply approval. Uncertain outcomes are reconciled by name and language before any explicit retry, and creation POSTs are never automatically retried. Business profile editing remains in preview.

Single-recipient messaging uses `/messages` for text, images, video, and documents, or `/messages/template` for approved templates, under the selected account's Meta connection. Local attachments upload as raw files to `/template-assets` before the send; the returned asset stays in draft state if sending fails and is reused for a manual retry. JPEG/PNG uploads are limited to 5 MiB, and MP4/PDF to 16 MiB. Hosted URLs or existing WhatsApp delivery-media IDs are also supported. Template selection loads approved templates with pagination and actual positional/named values; native component JSON supports advanced parameters and manual template selection without browsing permissions. Reply message IDs are optional.

Sending requires `whatsapp:messages:send` when organization permissions are enabled. Connection lookup requires `whatsapp:connect`; attachment uploads additionally require `whatsapp:templates:write`, and template browsing requires `whatsapp:templates:read`. Send requests are never automatically retried. Uncertain outcomes lock the draft until explicitly resolved by the user; there is no delivery-status lookup or stored message history. A receipt means accepted, not delivered or read. Bulk messaging, campaigns, and inbox persistence remain in preview.

Run the Tech Provider checks with `node --test tests/embedded-signup.test.cjs tests/tech-provider-ui.test.cjs tests/tech-provider-templates.test.cjs tests/tech-provider-account.test.cjs tests/tech-provider-creation.test.cjs tests/tech-provider-messages.test.cjs`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
