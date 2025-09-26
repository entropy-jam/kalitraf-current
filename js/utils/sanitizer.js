/**
 * HTML Sanitizer Utility
 * Prevents XSS attacks by sanitizing HTML content
 */

class HTMLSanitizer {
    /**
     * Sanitize HTML content to prevent XSS attacks
     * @param {string} html - HTML content to sanitize
     * @returns {string} Sanitized HTML content
     */
    static sanitize(html) {
        if (!html || typeof html !== 'string') {
            return '';
        }

        // Remove potentially dangerous tags and attributes
        const dangerousTags = ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'];
        const dangerousAttributes = ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur'];
        
        let sanitized = html;
        
        // Remove dangerous tags completely
        dangerousTags.forEach(tag => {
            const regex = new RegExp(`<\\/?${tag}[^>]*>`, 'gi');
            sanitized = sanitized.replace(regex, '');
        });
        
        // Remove dangerous attributes
        dangerousAttributes.forEach(attr => {
            const regex = new RegExp(`\\s*${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
            sanitized = sanitized.replace(regex, '');
        });
        
        // Remove javascript: protocols
        sanitized = sanitized.replace(/javascript:/gi, '');
        
        // Remove data: protocols (except safe image types)
        sanitized = sanitized.replace(/data:(?!image\/(png|jpg|jpeg|gif|svg))/gi, '');
        
        return sanitized;
    }
    
    /**
     * Sanitize text content (strip all HTML)
     * @param {string} text - Text content to sanitize
     * @returns {string} Plain text content
     */
    static sanitizeText(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }
        
        // Create temporary div to strip HTML tags
        const temp = document.createElement('div');
        temp.textContent = text;
        return temp.textContent || temp.innerText || '';
    }
    
    /**
     * Safely set innerHTML with sanitization
     * @param {HTMLElement} element - Element to update
     * @param {string} html - HTML content to set
     */
    static setInnerHTML(element, html) {
        if (!element || !element.innerHTML !== undefined) {
            return;
        }
        
        element.innerHTML = this.sanitize(html);
    }
    
    /**
     * Safely set text content
     * @param {HTMLElement} element - Element to update
     * @param {string} text - Text content to set
     */
    static setTextContent(element, text) {
        if (!element || !element.textContent !== undefined) {
            return;
        }
        
        element.textContent = this.sanitizeText(text);
    }
}

// Export for use in other modules
window.HTMLSanitizer = HTMLSanitizer;
