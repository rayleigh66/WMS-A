import { WmsProvider } from './context/WmsContext';
import DesktopApp from './components/DesktopApp';

export default function App() {
  return (
    <WmsProvider>
      <div className="min-h-screen bg-[#f0f2f5] flex flex-col font-sans">
        <main className="flex-1 flex flex-col">
          <DesktopApp />
        </main>
      </div>
    </WmsProvider>
  );
}
