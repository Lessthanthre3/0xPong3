# Web3 Pong Game

A modern take on the classic Pong game, built with Web3 integration on the Solana blockchain.

## Features

- Classic Pong gameplay with modern graphics
- Single-player mode against AI
- Phantom wallet integration
- Global leaderboard with blockchain integration
- Daily rewards in $PONG tokens for top players
- Responsive design for all devices

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Phantom wallet browser extension
- Solana CLI tools (optional, for development)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd web3-pong
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/pong_db
NODE_ENV=development
```

4. Make sure MongoDB is running on your system:
```bash
# On Windows, MongoDB should be running as a service
# You can check its status in Services app
```

5. Start the development server:
```bash
npm run dev
```

## Playing the Game

1. Visit `http://localhost:3000` in your browser
2. Connect your Phantom wallet using the button in the top-right corner
3. Use your mouse or arrow keys to control the paddle
4. Try to beat the AI and get on the leaderboard!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
