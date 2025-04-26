# Nectr: Social Matching App

## Overview
Nectr is an innovative social matching platform designed to connect users based on shared interests, cuisine preferences, and social dynamics.

## Features
- User profile creation
- Interest-based matching
- Drop events for social connections
- Admin management of drops
- Compatibility scoring algorithm

## Tech Stack
- React
- TypeScript
- Vite
- Chakra UI
- Firebase (Authentication, Firestore)
- React Icons

## Getting Started

### Prerequisites
- Node.js (v14+)
- npm or yarn

### Installation
1. Clone the repository
```bash
git clone https://github.com/yourusername/nectr.git
cd nectr
```

2. Install dependencies
```bash
npm install
```

3. Set up Firebase
- Create a Firebase project
- Add your Firebase configuration to `src/firebase.ts`

4. Run the application
```bash
npm run dev
```

## Contributing

### Branch Structure
- `main`: Production-ready code
- `develop`: Integration branch for new features
- Feature branches:
  - `feature/user-profiles`: User profile creation and management
  - `feature/match-system`: Match-making functionality
  - `feature/landing-page`: Landing page and UI updates
  - `feature/calendar-integration`: Calendar invite system
  - `feature/notifications`: User notification system

### Development Workflow
1. Create a new feature branch from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit them:
   ```bash
   git add .
   git commit -m 'Description of your changes'
   ```

3. Push your changes and create a pull request:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Create a pull request on GitHub targeting the `develop` branch

### Active Development Areas
- User Profile System: Profile creation and management
- Match System: Core matching functionality and algorithms
- Calendar Integration: Meeting scheduling and calendar invites
- Notification System: Real-time user notifications
- Landing Page: UI/UX improvements

### Code Style
- Use TypeScript for type safety
- Follow React best practices and hooks
- Implement proper error handling
- Add comments for complex logic
- Write unit tests for new features

## Contact
Your Name - kakeda@usc.edu

