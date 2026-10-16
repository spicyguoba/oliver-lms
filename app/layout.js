import "./globals.css";
export const metadata = {
  title: "Oliver’s Adventure Club",
  description:
    "A little learning. A big adventure. A private family learning space.",
  robots: { index: false, follow: false },
};
export default function Layout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
