(() => {
	const isVercelHost = window.location.hostname.endsWith('.vercel.app') || window.location.hostname.endsWith('.vercel.dev');
	const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
	const fallback = isLocalHost
		? 'http://127.0.0.1:8000'
		: 'https://vitalia-juanpito-backend.onrender.com';

	window.API_URL = fallback;
})();