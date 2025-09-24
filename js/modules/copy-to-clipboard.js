/**
 * Copy to Clipboard Module
 * 
 * Single Responsibility: Handles copying incident data to clipboard
 * Open/Closed: Can be extended for different copy formats without modification
 * Dependency Inversion: Depends on browser APIs, not specific implementations
 */

class CopyToClipboard {
    constructor() {
        this.copyIcon = '📋'; // Basic web copy icon
        this.successMessage = 'Copied to clipboard!';
        this.errorMessage = 'Failed to copy to clipboard';
        this.notificationDuration = 2000; // 2 seconds
    }

    /**
     * Create copy button HTML
     * @param {string} incidentId - Unique incident identifier
     * @param {Object} incidentData - Incident data to copy
     * @returns {string} HTML string for copy button
     */
    createCopyButton(incidentId, incidentData) {
        const copyText = this.formatIncidentForCopy(incidentData);
        
        return `
            <button 
                class="copy-button" 
                data-incident-id="${incidentId}"
                data-copy-text="${this.escapeHtml(copyText)}"
                title="Copy incident details to clipboard"
                onclick="copyToClipboard.copyIncident('${incidentId}')"
            >
                ${this.copyIcon}
            </button>
        `;
    }

    /**
     * Format incident data for clipboard copy
     * @param {Object} incident - Incident data
     * @returns {string} Formatted text for clipboard
     */
    formatIncidentForCopy(incident) {
        const lines = [
            `CHP Incident #${incident.id}`,
            `Time: ${incident.time}`,
            `Type: ${incident.type}`,
            `Location: ${incident.location}`,
            incident.location_desc ? `Description: ${incident.location_desc}` : '',
            `Area: ${incident.area}`,
            '',
            'Source: CHP Traffic Incidents Monitor'
        ].filter(line => line !== ''); // Remove empty lines

        return lines.join('\n');
    }

    /**
     * Copy incident data to clipboard
     * @param {string} incidentId - Incident identifier
     */
    async copyIncident(incidentId) {
        try {
            const button = document.querySelector(`[data-incident-id="${incidentId}"]`);
            if (!button) {
                console.error('Copy button not found for incident:', incidentId);
                return;
            }

            const copyText = button.getAttribute('data-copy-text');
            if (!copyText) {
                console.error('Copy text not found for incident:', incidentId);
                return;
            }

            // Use modern clipboard API if available
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(copyText);
            } else {
                // Fallback for older browsers or non-secure contexts
                await this.fallbackCopyTextToClipboard(copyText);
            }

            this.showCopySuccess(button);
            console.log('Incident copied to clipboard:', incidentId);

        } catch (error) {
            console.error('Failed to copy incident to clipboard:', error);
            this.showCopyError(button);
        }
    }

    /**
     * Fallback copy method for older browsers
     * @param {string} text - Text to copy
     */
    async fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        return new Promise((resolve, reject) => {
            try {
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                if (successful) {
                    resolve();
                } else {
                    reject(new Error('Copy command failed'));
                }
            } catch (err) {
                document.body.removeChild(textArea);
                reject(err);
            }
        });
    }

    /**
     * Show copy success feedback
     * @param {HTMLElement} button - Copy button element
     */
    showCopySuccess(button) {
        const originalContent = button.innerHTML;
        const originalClass = button.className;
        
        button.innerHTML = '✓';
        button.className = originalClass + ' copy-success';
        
        setTimeout(() => {
            button.innerHTML = originalContent;
            button.className = originalClass;
        }, 1000);
    }

    /**
     * Show copy error feedback
     * @param {HTMLElement} button - Copy button element
     */
    showCopyError(button) {
        const originalContent = button.innerHTML;
        const originalClass = button.className;
        
        button.innerHTML = '✗';
        button.className = originalClass + ' copy-error';
        
        setTimeout(() => {
            button.innerHTML = originalContent;
            button.className = originalClass;
        }, 1000);
    }

    /**
     * Escape HTML for data attributes
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Initialize copy functionality for all incident cards
     */
    initializeCopyButtons() {
        // This will be called after incidents are rendered
        const copyButtons = document.querySelectorAll('.copy-button');
        copyButtons.forEach(button => {
            // Remove any existing click listeners to prevent duplicates
            button.replaceWith(button.cloneNode(true));
        });
    }
}

// Create global instance
const copyToClipboard = new CopyToClipboard();

// Export for use in other modules
window.CopyToClipboard = CopyToClipboard;
window.copyToClipboard = copyToClipboard;
