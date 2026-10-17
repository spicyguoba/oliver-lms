import "./globals.css";
import AccountSync from "../components/AccountSync";
export const metadata = {
  title: "Oliver’s Adventure Club",
  description:
    "A little learning. A big adventure. A private family learning space.",
  robots: { index: false, follow: false },
};
export default function Layout({ children }) {
  return (
    <html lang="en">
      <body>
        <AccountSync />
        {children}
      </body>
    </html>
  );
}
