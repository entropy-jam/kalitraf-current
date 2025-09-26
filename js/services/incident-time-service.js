/**
 * Incident Time Service
 * Single Responsibility: Handles time parsing and formatting for incidents
 */

class IncidentTimeService {
    /**
     * Parse incident time string to Date object
     * @param {string} timeStr - Time string (e.g., "2:30 PM")
     * @returns {Date|null} Parsed date or null if invalid
     */
    parseIncidentTime(timeStr) {
        try {
            const now = new Date();
            const [time, period] = timeStr.split(' ');
            const [hours, minutes] = time.split(':');
            let hour = parseInt(hours);
            const mins = parseInt(minutes);

            if (period === 'PM' && hour !== 12) hour += 12;
            if (period === 'AM' && hour === 12) hour = 0;

            const incidentTime = new Date(now);
            incidentTime.setHours(hour, mins, 0, 0);

            // If the time is in the future, assume it's from yesterday
            if (incidentTime > now) {
                incidentTime.setDate(incidentTime.getDate() - 1);
            }

            return incidentTime;
        } catch (e) {
            return null;
        }
    }

    /**
     * Format time for display
     * @param {Date} date - Date to format
     * @returns {string} Formatted time string
     */
    formatTime(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins === 1) return '1 minute ago';
        return `${diffMins} minutes ago`;
    }

    /**
     * Format timestamp for display
     * @param {string} timestamp - ISO timestamp
     * @returns {string} Formatted timestamp
     */
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const timeString = date.toLocaleString("en-US", {
            timeZone: "America/Los_Angeles",
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        return `${timeString} PST`;
    }
}

// Export for use in other modules
window.IncidentTimeService = IncidentTimeService;
