# 📦 NodeStarter Kit (Example)

✅ **A robust Node.js backend starter project** with:
- 🔐 Multi-method Authentication (Password, OTP, OAuth2)
- 💬 Real-time Chat System (1:1 & Group)
- 🤖 AI Chatbot integration (powered by OpenAI)

---

## 🚀 Features

### ✅ Authentication
- Password-based login & registration
- OTP-based login (via email or SMS gateway)
- OAuth2 login (Google, Facebook, etc.)
- JWT token authentication
- Secure password reset flow

### ✅ Chat System
- Real-time messaging with [Socket.IO](https://socket.io/)
- 1-on-1 personal chats
- Group chats / channels
- Message history stored in MongoDB
- Typing indicators & online status (optional)

### ✅ AI Chatbot
- Human-to-AI chat powered by OpenAI (GPT)
- Realtime AI replies integrated seamlessly in chat
- AI responses stored alongside user messages

---

## 🗂️ Project Structure

```
/src
 ├── /config         # Environment configs
 ├── /controllers    # Route controllers (auth, chat, ai)
 ├── /models         # Mongoose models (User, Message, Group)
 ├── /routes         # API routes
 ├── /sockets        # Socket.IO event handlers
 ├── /middlewares    # Auth middlewares
 ├── app.js          # Express app setup
 └── server.js       # Entry point
```

---

## ⚙️ Tech Stack

- **Node.js** + **Express** — REST API
- **MongoDB** + **Mongoose** — Database
- **Socket.IO** — Real-time communication
- **Passport.js** — OAuth2 strategies
- **OpenAI API** — AI chatbot
- **JWT** — Authentication tokens
- **dotenv** — Environment configuration

---

## 📌 Getting Started

### 1️⃣ Clone the repo
```bash
git clone https://github.com/yourusername/your-repo-name.git
cd your-repo-name
```

### 2️⃣ Install dependencies
```bash
npm install
```

### 3️⃣ Configure environment
Create a `.env` file in the root:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/<dbname>
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
OTP_GATEWAY_API_KEY=your_otp_api_key   # If using real OTP
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### 4️⃣ Run the server
```bash
npm run dev
```
The server runs at [http://localhost:5000](http://localhost:5000)

---

## 📡 API Endpoints

### 🔑 Auth
| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login with password |
| `POST` | `/api/auth/login-otp` | Request OTP login |
| `POST` | `/api/auth/oauth` | OAuth2 login callback |
| `POST` | `/api/auth/reset-password` | Reset password |

### 💬 Chat
| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `GET` | `/api/chat/history` | Fetch message history |
| `POST` | `/api/chat/send` | Send new message |
| **Realtime:** | `Socket.IO` | Send & receive messages |

### 🤖 AI Chat
| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `POST` | `/api/ai/chat` | Send message to AI and get reply |

---

## ✅ TODO
- [ ] Add user roles & permissions
- [ ] Add message attachments (images, files)
- [ ] Add push notifications
- [ ] Add admin dashboard

---

## 🧑‍💻 Contributing

PRs and suggestions welcome!  
If you find bugs or want new features, please [open an issue](https://github.com/yourusername/your-repo-name/issues).

---

## 📝 License

MIT — free to use, modify & distribute.

---

## ❤️ Author

Made with 🧠 & ☕ by **Your Name**  
Feel free to reach out!
