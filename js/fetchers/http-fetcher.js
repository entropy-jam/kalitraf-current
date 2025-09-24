/**
 * HTTP Fetcher Implementation
 * Single Responsibility: Handles HTTP requests
 * Dependency Inversion: Implements IDataFetcher interface
 */

class HttpFetcher extends IDataFetcher {
    constructor() {
        super();
        this.defaultOptions = {
            cache: 'no-store',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        };
    }

    /**
     * Fetch data from URL
     * @param {string} url - URL to fetch
     * @param {Object} options - Fetch options
     * @returns {Promise<*>} Fetched data
     */
    async fetch(url, options = {}) {
        const mergedOptions = { ...this.defaultOptions, ...options };
        
        try {
            const response = await fetch(url, mergedOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return await response.text();
            }
        } catch (error) {
            console.error('HTTP fetch error:', error);
            throw error;
        }
    }

    /**
     * Fetch JSON data specifically
     * @param {string} url - URL to fetch
     * @param {Object} options - Fetch options
     * @returns {Promise<Object>} JSON data
     */
    async fetchJson(url, options = {}) {
        const jsonOptions = {
            ...options,
            headers: {
                ...this.defaultOptions.headers,
                ...options.headers
            }
        };
        
        return this.fetch(url, jsonOptions);
    }

    /**
     * Create abortable request
     * @param {string} url - URL to fetch
     * @param {Object} options - Fetch options
     * @returns {Object} Object with promise and abort function
     */
    createAbortableRequest(url, options = {}) {
        const controller = new AbortController();
        const signal = controller.signal;
        
        const promise = this.fetch(url, { ...options, signal });
        
        return {
            promise,
            abort: () => controller.abort()
        };
    }
}

// Export for use in other modules
window.HttpFetcher = HttpFetcher;
