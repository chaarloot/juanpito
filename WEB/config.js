(() => {
	const isVercelHost = window.location.hostname.endsWith('.vercel.app') || window.location.hostname.endsWith('.vercel.dev');
	const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
	const fallback = (isLocalHost || isVercelHost) ? 'http://127.0.0.1:8000' : window.location.origin;

	window.API_URL = fallback;
})();