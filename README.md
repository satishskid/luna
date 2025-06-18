# Luna - AI Journaling Companion 🌙

A compassionate AI-powered journaling companion built with React, TypeScript, and Google's Gemini AI. Luna provides a safe, private space for daily reflection and emotional processing through voice-enabled conversations.

## ✨ Features

- 🎤 **Voice-First Interface**: Natural speech-to-text and text-to-speech interactions
- 🤖 **AI-Powered Companion**: Powered by Google's Gemini AI for empathetic responses
- 🔒 **Privacy-Focused**: Anonymous symbolic names, no data storage
- 📱 **Progressive Web App**: Works on mobile and desktop, installable
- 🎨 **Beautiful UI**: Modern, accessible design with dark theme
- ⚡ **Fast & Responsive**: Built with Vite for optimal performance

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- A Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/satishskid/luna.git
   cd luna
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
npm run preview  # Test the production build locally
```

## 🌐 Deployment on Vercel

### Method 1: Vercel CLI (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from project directory**
   ```bash
   vercel
   ```

4. **Set environment variable**
   ```bash
   vercel env add GEMINI_API_KEY
   # Enter your Gemini API key when prompted
   ```

5. **Redeploy with environment**
   ```bash
   vercel --prod
   ```

### Method 2: Vercel Dashboard

1. Push your code to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com/new)
3. Add `GEMINI_API_KEY` environment variable in project settings
4. Deploy

### Environment Variable Setup

In Vercel dashboard or CLI, set:
- **Name**: `GEMINI_API_KEY`
- **Value**: Your Google Gemini API key
- **Target**: Production (and Preview if needed)

## 🧪 Testing Checklist

### Pre-Deployment Testing

- [x] **Build Success**: `npm run build` completes without errors
- [x] **Type Check**: `npm run type-check` passes
- [x] **Local Preview**: `npm run preview` works correctly
- [ ] **Environment Variables**: API key properly configured

### Post-Deployment Testing

- [ ] **Page Load**: App loads without errors
- [ ] **API Connection**: Gemini API responds correctly
- [ ] **Voice Features**: Speech recognition and synthesis work
- [ ] **Responsive Design**: Works on mobile and desktop
- [ ] **PWA Features**: App can be installed on mobile

### Manual Testing Scenarios

1. **Initial Setup Flow**
   - Select symbolic name
   - Verify Luna's initial greeting

2. **Voice Interaction**
   - Test microphone permissions
   - Speak a message and verify transcription
   - Verify Luna's audio response

3. **Text Interaction**
   - Type messages in voice transcript area
   - Verify Luna responds appropriately

4. **Settings & Controls**
   - Test mute/unmute functionality
   - Adjust voice settings
   - Test different voices (if available)

5. **Error Handling**
   - Test with invalid API key
   - Test with network disconnection
   - Verify graceful error messages

## 📁 Project Structure

```
luna/
├── public/                 # Static assets
│   ├── manifest.json      # PWA manifest
│   ├── service-worker.js  # Service worker for PWA
│   └── index.css         # Global styles
├── components/           # React components
│   ├── ChatView.tsx     # Main chat interface
│   ├── MessageBubble.tsx # Individual message display
│   ├── SettingsDrawer.tsx # Settings panel
│   ├── SymbolicNameInput.tsx # Name selection
│   ├── VoiceInputControls.tsx # Voice controls
│   └── icons.tsx        # Icon components
├── hooks/               # Custom React hooks
│   ├── useSpeechRecognition.ts
│   └── useSpeechSynthesis.ts
├── services/           # API services
│   └── geminiService.ts # Gemini AI integration
├── App.tsx            # Main application component
├── constants.ts       # App constants and prompts
├── types.ts          # TypeScript type definitions
├── index.tsx         # App entry point
├── vite.config.ts    # Vite configuration
└── vercel.json       # Vercel deployment config
```

## 🔒 Privacy & Security

- **No Data Storage**: Conversations are not saved or transmitted
- **Anonymous Identity**: Uses symbolic names only
- **Client-Side Processing**: Speech processing happens in browser
- **Secure API**: API key handled securely in environment variables

## 🐛 Troubleshooting

### Common Issues

1. **API Key Errors**
   - Verify GEMINI_API_KEY is set correctly
   - Check API key permissions in Google Console

2. **Voice Not Working**
   - Ensure HTTPS connection (required for mic access)
   - Check browser permissions for microphone
   - Verify browser supports Web Speech API

3. **Build Failures**
   - Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
   - Check Node.js version: `node --version` (should be 18+)

## 🚀 Future Enhancements

After successful deployment, consider adding:
- User authentication system
- Data persistence and journaling history
- Stripe/Razorpay payment integration
- Advanced AI coaching features
- Multi-language support

---

**Built with ❤️ for mental wellness and self-reflection**
