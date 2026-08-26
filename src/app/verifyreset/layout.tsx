// app/verifyreset/layout.tsx

// @ts-ignore: allow side-effect CSS import in this layout file
import "./verify.css"; // Import any specific styles for the login page

export const metadata = {
  manifest: "/manifest.json",
  themeColor: "#0a0a1a",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div>{children}</div>
      </body>
    </html>
  );
}
