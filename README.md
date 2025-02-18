## Tech Stack 💻

### Frontend

- React Native (Expo)

### Backend

- Node.js
- Express.js
- MongoDB

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd Frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the frontend directory and add the following:

   ```env
   EXPO_PUBLIC_GOOGLE_GEMINI_API_KEY=
   EXPO_PUBLIC_MY_API_URL=
   ```

   NOTE : To get EXPO_PUBLIC_MY_API_URL:

   1. Open Command Prompt (CMD):

   2. Type ipconfig and press Enter.

   3. Look for the section that says "IPv4 Address":
      If you're on Wi-Fi, check under "Wireless LAN adapter Wi-Fi"
      If you're on Ethernet, check under "Ethernet adapter"
      Find the IP address, which looks like 192.168.X.X or 10.0.X.X. Example: IPv4 Address. . . . . . . . . . . : 192.168.1.100

      Copy this IP address and add port number (Eg: http://192.168.1.100:3000).

      Paste the copied IP address into the .env file for EXPO_PUBLIC_MY_API_URL.

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Install Expo Go on your mobile device and scan the QR code to run the application, make sure both PC and mobile connected to same WiFi.

---

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd Backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory and add the following:
   ```env
   PORT=
   JWT_SECRET=
   MONGODB_URI=
   ```
