import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import ChatPage from './pages/ChatPage';

const ErrorPage = () => {
  return (
    <div>
      <h2>404 - 页面未找到</h2>
      <p>抱歉，您访问的页面不存在。</p>
      <button onClick={() => window.location.href = '/'}>返回首页</button>
    </div>
  );
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/chat/:sessionId',
    element: <ChatPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: '*',
    element: <ErrorPage />,
  },
]);

export default router;
