/**
 * Main Application Entry Point
 * Initializes the application using the new SOLID architecture
 */

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const app = new AppController();
        await app.initialize();
        
        // Clean up on page unload
        window.addEventListener('beforeunload', () => {
            app.destroy();
        });
    } catch (error) {
        console.error('Failed to start application:', error);
    }
});
