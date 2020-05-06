import { useState, useEffect } from 'react';
export function useFetch(url, opts) {
	const [ response, setResponse ] = useState(null);
	const [ loading, setLoading ] = useState(false);
	const [ hasError, setHasError ] = useState(false);

	useEffect(
		() => {
			setLoading(true);
			fetch(url, opts)
				.then((response) => response.json())
				.then((json) => {
					// console.log(json);
					setResponse(json);
					setLoading(false);
				})
				.catch(() => {
					setHasError(true);
					setLoading(false);
				});
		},
		[ url, opts ]
	);

	return [ response, loading, hasError ];
}
