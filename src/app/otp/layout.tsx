// app/login/layout.tsx

// @ts-ignore: allow side-effect CSS import in this layout file
import "./otp.css"; // Import any specific styles for the login page

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div>
          {children}
        </div>
      </body>
    </html>
  );
}
