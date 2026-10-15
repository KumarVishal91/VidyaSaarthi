import './globals.css';
import Providers from '../components/Providers';

export const metadata = {
  title: 'VidyaSaarthi',
  description: 'School support platform for student records, attendance, resources and parent messages.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
