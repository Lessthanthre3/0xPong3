class AdminPanel {
    constructor() {
        this.adminButton = document.querySelector('.admin-button');
        this.adminPanel = document.getElementById('admin-panel');
        this.closeButton = document.getElementById('admin-close');
        this.resetButton = document.getElementById('reset-all');

        // Admin wallet addresses
        this.adminWallets = new Set([
            'GrDWUZZpCsxXR8qnZXREmE3bDgkQxLG6BHve3NLPbHFR'
        ]);

        this.init();
    }

    init() {
        if (!this.adminButton || !this.adminPanel) {
            console.error('Admin elements not found!');
            return;
        }

        this.adminButton.addEventListener('click', () => this.togglePanel());
        this.closeButton.addEventListener('click', () => this.hidePanel());
        this.resetButton.addEventListener('click', () => this.resetAllData());
    }

    isAdmin() {
        const currentWallet = window.walletManager?.getWalletAddress();
        return currentWallet && this.adminWallets.has(currentWallet);
    }

    togglePanel() {
        if (!this.isAdmin()) {
            alert('Access denied. Admin privileges required.');
            return;
        }
        this.adminPanel.classList.toggle('hidden');
    }

    hidePanel() {
        this.adminPanel.classList.add('hidden');
    }

    async resetAllData() {
        if (!confirm('WARNING: This will reset ALL game data!\n\n• All player stats will be reset to 0\n• All wallets will be removed from the leaderboard\n• The AI stats will be reset\n• Local storage will be cleared\n\nAre you absolutely sure?')) {
            return;
        }

        try {
            // Clear localStorage first
            console.log('Clearing localStorage...');
            localStorage.removeItem('pongStats');
            
            const response = await fetch('/api/admin/reset-all-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    adminWallet: window.walletManager.getWalletAddress()
                })
            });

            if (!response.ok) {
                throw new Error('Failed to reset data');
            }

            const result = await response.json();
            console.log('Reset result:', result);

            // Show success message
            const message = document.createElement('div');
            message.className = 'success-message';
            message.textContent = 'All game data has been reset successfully!';
            message.style.position = 'fixed';
            message.style.top = '20px';
            message.style.right = '20px';
            message.style.padding = '10px 20px';
            message.style.background = 'rgba(0, 255, 0, 0.2)';
            message.style.border = '1px solid #00ff00';
            message.style.borderRadius = '5px';
            message.style.color = '#00ff00';
            message.style.zIndex = '9999';
            document.body.appendChild(message);

            // Remove message after 3 seconds
            setTimeout(() => {
                message.remove();
            }, 3000);

            // Force reload the page to reset all stats
            window.location.reload();

        } catch (error) {
            console.error('Error resetting data:', error);
            alert('Failed to reset data. Please try again.');
        }
    }
}

// Initialize admin panel when window loads
window.addEventListener('load', () => {
    window.adminPanel = new AdminPanel();
});
