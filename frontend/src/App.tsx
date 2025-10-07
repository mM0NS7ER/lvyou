import HomePageWithFileUpload from './pages/HomePageWithFileUpload';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <HomePageWithFileUpload />
    </ErrorBoundary>
  );
}

export default App;