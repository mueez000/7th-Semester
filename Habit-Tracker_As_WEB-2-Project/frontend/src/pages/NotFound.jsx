import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
      <h1 className="text-6xl font-bold text-indigo-600 mb-4">404</h1>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Page Not Found</h2>
      <Link to="/dashboard" className="text-indigo-600 hover:text-indigo-500 font-medium">
        Go back home
      </Link>
    </div>
  );
};

export default NotFound;
