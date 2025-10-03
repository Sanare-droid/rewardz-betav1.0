# Rewardz - Lost Pet Recovery Platform

A comprehensive full-stack application for helping reunite lost pets with their owners through community-driven reporting, advanced matching algorithms, and reward systems.

## 🚀 Features

- **Pet Reporting**: Report lost or found pets with detailed information and photos
- **Smart Matching**: AI-powered matching algorithm to connect lost and found pets
- **Reward System**: Integrated payment processing for reward offers
- **Real-time Updates**: Live notifications and updates
- **Community Features**: User profiles, messaging, and community posts
- **Mobile-First Design**: Responsive design optimized for mobile devices
- **Advanced Search**: Location-based search with filters
- **Image Recognition**: Google Vision API integration for automatic pet identification

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **React Router 6** for client-side routing
- **TailwindCSS** for styling
- **Radix UI** component library
- **React Hook Form** for form handling
- **TanStack Query** for data fetching
- **Vite** for build tooling

### Backend
- **Express.js** with TypeScript
- **Firebase** for authentication and database
- **Firebase Storage** for file uploads
- **Stripe** and **PayPal** for payments
- **Google Vision API** for image analysis
- **Resend** for email notifications

### DevOps
- **Docker** for containerization
- **Nginx** for reverse proxy
- **GitHub Actions** for CI/CD
- **Netlify** for deployment

## 📦 Installation

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- Firebase project
- Stripe account
- PayPal account
- Google Cloud account (for Vision API)

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/rewardz.git
cd rewardz
```

2. Install dependencies:
```bash
pnpm install
```

3. Copy environment variables:
```bash
cp env.example .env
```

4. Configure environment variables in `.env`:
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Payment Processing
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal Configuration
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_SECRET=your_paypal_secret

# Google Vision API
GOOGLE_VISION_API_KEY=your_google_vision_api_key
VITE_VISION_ENABLED=1

# Email Service
RESEND_API_KEY=re_...
RESEND_FROM=notifications@rewardz.app
```

### Development

Start the development server:
```bash
pnpm dev
```

The application will be available at `http://localhost:8080`

### Production Build

Build for production:
```bash
pnpm build
```

Start production server:
```bash
pnpm start
```

## 🧪 Testing

Run tests:
```bash
pnpm test
```

Run tests with coverage:
```bash
pnpm test:coverage
```

## 🐳 Docker Deployment

Build Docker image:
```bash
docker build -t rewardz .
```

Run with Docker Compose:
```bash
docker-compose up -d
```

## 📁 Project Structure

```
rewardz/
├── client/                 # React frontend
│   ├── components/         # Reusable components
│   ├── pages/             # Route components
│   ├── lib/               # Utilities and helpers
│   ├── context/           # React context providers
│   └── test/              # Frontend tests
├── server/                # Express backend
│   ├── routes/            # API route handlers
│   ├── middleware/        # Express middleware
│   ├── lib/               # Server utilities
│   └── test/              # Backend tests
├── shared/                # Shared types and utilities
├── netlify/               # Netlify functions
├── .github/               # GitHub Actions workflows
└── docs/                  # Documentation
```

## 🔧 Configuration

### Firebase Setup

1. Create a Firebase project
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Set up Firebase Storage
5. Configure security rules (see `firebase.rules` and `storage.rules`)

### Payment Setup

1. Create Stripe account and get API keys
2. Create PayPal developer account and get credentials
3. Configure webhook endpoints

### Google Vision API

1. Enable Google Vision API in Google Cloud Console
2. Create API key with Vision API permissions
3. Set up billing (required for Vision API)

## 🚀 Deployment

### Netlify Deployment

1. Connect your GitHub repository to Netlify
2. Configure build settings:
   - Build command: `pnpm build`
   - Publish directory: `dist/spa`
3. Set environment variables in Netlify dashboard
4. Deploy!

### Manual Deployment

1. Build the application: `pnpm build`
2. Upload `dist/spa` to your web server
3. Configure your web server to serve the SPA
4. Set up API endpoints to proxy to your Express server

## 🔒 Security

- Input validation with Zod schemas
- Rate limiting on API endpoints
- CORS configuration
- Security headers with Helmet
- Firebase security rules
- Input sanitization
- File upload restrictions

## 📊 Monitoring

- Error tracking and logging
- Performance monitoring
- Request/response logging
- Health check endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@rewardz.app or create an issue in the GitHub repository.

## 🙏 Acknowledgments

- Firebase for backend services
- Stripe and PayPal for payment processing
- Google Vision API for image recognition
- The open-source community for amazing tools and libraries
