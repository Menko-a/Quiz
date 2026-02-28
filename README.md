# Quiz App (Expo/React Native)

This is a quiz application built with React Hooks targeting Expo (works on iOS/Android/web through the Expo app).

## Features

- Home screen with **Start Quiz** button.
- Quiz screen showing one question at a time with multiple-choice answers.
- **Previous** and **Next** (or **Submit**) navigation buttons.
- Score tracking per attempt and persistent highest score saved using `localStorage` (or AsyncStorage when integrated).
- Results screen displaying current attempt score and highest score.

## Files

- `App.js` – main React Native app using hooks.
- `questions.js` – quiz content array exported as a module.
- `package.json` / `app.json` – Expo configuration and dependencies.

## Running the App

1. Install dependencies:
   ```bash
   npm install
   # or yarn
   yarn
   ```a
2. Start Expo:
   ```bash
   npm run start
   # or yarn start
   ```
3. Open the project in the **Expo Go** app (scan QR code) or use an emulator (`i`, `a`, or `w` for web).

The application uses React Hooks exclusively and is designed to run in the Expo environment without additional configuration.
