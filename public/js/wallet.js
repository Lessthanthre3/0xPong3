class WalletManager {
    constructor() {
        this.connection = new solanaWeb3.Connection(
            'https://api.mainnet-beta.solana.com',
            'confirmed'
        );
        this.wallet = null;
        this.init();
    }

    async init() {
        const connectButton = document.getElementById('connect-wallet');
        const startButton = document.getElementById('start-button');
        const walletRequired = document.getElementById('wallet-required');
        
        connectButton.addEventListener('click', () => this.connectWallet());

        // Check wallet connection status periodically
        setInterval(() => {
            const isConnected = this.wallet !== null;
            startButton.disabled = !isConnected;
            walletRequired.classList.toggle('hidden', isConnected);
        }, 1000);
    }

    async connectWallet() {
        try {
            if (!window.solana || !window.solana.isPhantom) {
                throw new Error('Phantom wallet is not installed!');
            }

            const response = await window.solana.connect();
            this.wallet = response.publicKey;
            this.updateWalletDisplay();
            
            // Update player stats display
            if (window.gameStats) {
                window.gameStats.updateCurrentPlayerDisplay(this.wallet.toString());
            }
            
            // Subscribe to wallet connection changes
            window.solana.on('connect', () => {
                this.wallet = window.solana.publicKey;
                this.updateWalletDisplay();
                if (window.gameStats) {
                    window.gameStats.updateCurrentPlayerDisplay(this.wallet.toString());
                }
            });

            window.solana.on('disconnect', () => {
                this.wallet = null;
                this.updateWalletDisplay();
                if (window.gameStats) {
                    window.gameStats.updateCurrentPlayerDisplay(null);
                }
            });

        } catch (error) {
            console.error('Error connecting to wallet:', error);
            alert('Error connecting to wallet. Please make sure Phantom is installed!');
        }
    }

    updateWalletDisplay() {
        const connectButton = document.getElementById('connect-wallet');
        const walletAddress = document.getElementById('wallet-address');

        if (this.wallet) {
            connectButton.style.display = 'none';
            walletAddress.textContent = `${this.wallet.toString().slice(0, 4)}...${this.wallet.toString().slice(-4)}`;
            walletAddress.style.display = 'block';
        } else {
            connectButton.style.display = 'block';
            walletAddress.style.display = 'none';
        }
    }

    getWalletAddress() {
        return this.wallet ? this.wallet.toString() : null;
    }

    async submitScore(score) {
        if (!this.wallet) {
            alert('Please connect your wallet first!');
            return;
        }

        try {
            // Here we would implement the logic to submit the score to the blockchain
            // This is a placeholder for the actual implementation
            console.log('Submitting score to blockchain:', score);
            
            // Simulate blockchain transaction
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            return true;
        } catch (error) {
            console.error('Error submitting score:', error);
            alert('Error submitting score to blockchain');
            return false;
        }
    }
}

// Initialize wallet manager when window loads
window.addEventListener('load', () => {
    window.walletManager = new WalletManager();
});
