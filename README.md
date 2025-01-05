# Web3 Pong Game

A modern take on the classic Pong game, built with Web3 integration on the Solana blockchain.

## Features

- Classic Pong gameplay with modern graphics
- Single-player mode against AI
- Phantom wallet integration
- Global leaderboard with blockchain integration
- Daily rewards in $PONG tokens for top players
- Responsive design for all devices
- Real-time updates using WebSocket
- AWS deployment support

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- Phantom wallet browser extension
- AWS account with Elastic Beanstalk access
- AWS CLI installed and configured
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
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>
NODE_ENV=development
```

4. Make sure MongoDB Atlas is properly configured:
   - Create a cluster in MongoDB Atlas
   - Add your IP address to the allowlist
   - Create a database user
   - Get your connection string and update the `.env` file

5. Start the development server:
```bash
npm run dev
```

## AWS Deployment

1. Install and configure AWS CLI:
```bash
aws configure
```

2. Create an Elastic Beanstalk application:
```bash
aws elasticbeanstalk create-application --application-name 0xPong3
```

3. Create an environment:
```bash
aws elasticbeanstalk create-environment \
    --application-name 0xPong3 \
    --environment-name 0xPong3-env \
    --solution-stack-name "64bit Amazon Linux 2 v5.8.0 running Node.js 18"
```

4. Update your `.env` file for production:
```env
PORT=8081
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>
NODE_ENV=production
```

5. Deploy the application:
```bash
# Create a zip of your application
zip -r 0xPong3.zip . -x "node_modules/*"

# Upload to Elastic Beanstalk
aws elasticbeanstalk create-application-version \
    --application-name 0xPong3 \
    --version-label v1 \
    --source-bundle S3Bucket=elasticbeanstalk-us-east-1-YOUR_ACCOUNT_ID,S3Key=0xPong3.zip

# Update the environment
aws elasticbeanstalk update-environment \
    --environment-name 0xPong3-env \
    --version-label v1
```

6. Access your application at the Elastic Beanstalk URL provided in the AWS Console

## Playing the Game

1. Visit the application URL in your browser
2. Connect your Phantom wallet using the button in the top-right corner
3. Use your mouse or arrow keys to control the paddle
4. Try to beat the AI and get on the leaderboard!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
