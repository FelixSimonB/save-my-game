import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Save-my-game",
  description: "Create game folders, select a save target, and drag files into the upload panel with live progress feedback.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}