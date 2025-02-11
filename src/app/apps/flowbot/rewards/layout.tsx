// app/login/layout.tsx

import "./rewards.css"; // Import any specific styles for the login page

export default function RewardsLayout({
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
