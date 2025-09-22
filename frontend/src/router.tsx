
import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import ChatPage from './pages/ChatPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/chat/:sessionId',
    element: <ChatPage />,
  },
]);

export default router;
