import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="p-8 bg-white rounded-lg shadow-md max-w-md w-full">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
          <div className="mb-6">
            <svg 
              className="w-24 h-24 mx-auto text-red-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-4a3 3 0 100-6 3 3 0 000 6z"
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2"
              />
              <circle cx="12" cy="7" r="4" strokeWidth="2" />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M5 15l14 0" 
              />
            </svg>
          </div>
          <p className="text-lg text-gray-700 mb-6">
            You don't have permission to access this page. 
            Please contact your administrator if you believe this is an error.
          </p>
          <div className="space-y-3">
            <Link 
              href="/dashboard" 
              className="block w-full px-4 py-2 text-center text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              Return to Dashboard
            </Link>
            <Link
              href="/"
              className="block w-full px-4 py-2 text-center text-blue-600 bg-transparent border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
            >
              Go to Home Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 