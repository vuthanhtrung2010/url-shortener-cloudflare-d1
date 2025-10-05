# URL Shortener with Cloudflare D1

This project is a serverless URL shortener built with React Router, Cloudflare Workers, and Cloudflare D1 database. Features include JWT authentication, user management, and a modern admin dashboard.

## ✨ Features

- 🔐 **Secure Authentication** - JWT tokens with bcrypt password hashing
- 👤 **User Management** - First user becomes admin automatically
- 🎨 **Modern UI** - shadcn/ui components with Magic Card effects
- 📊 **Analytics Dashboard** - Track clicks and view performance metrics
- 🎭 **Theme Support** - Dark, light, and system themes
- 🛡️ **Optional CAPTCHA** - Cloudflare Turnstile integration
- ⚡ **Serverless** - Runs on Cloudflare Workers for global scale
- 💾 **D1 Database** - Fast, edge-based SQLite database

## 🚀 Quick Start

### 1. Install dependencies
```bash
bun install
```

### 2. Create D1 database
```bash
npx wrangler d1 create <your-db-name>
```

### 3. Configure environment
Create `.env` file:
```env
# Required
JWT_SECRET=your-secret-key-here

# Optional - Cloudflare Turnstile
VITE_REACT_TURNSTILE_SITE_KEY=your-site-key
TURNSTILE_SECRET_KEY=your-secret-key

# Optional - Registration control
VITE_ACCOUNT_ALLOW_SELF_REGISTERATION=1
```

### 4. Run migrations
```bash
# Local development
bun wrangler d1 migrations apply DB --local

# Production
bun run db:migrate-production
```

### 5. Start development server
```bash
bun run dev
```

### 6. Create your admin account
Visit `http://localhost:5173/register` and create the first user (automatically becomes admin!)

### 7. Deploy to Cloudflare 🚀
```bash
bun run typecheck  # Verify TypeScript
bun run build      # Build for production
bun run deploy     # Deploy to Cloudflare
```

## 📖 Documentation

- [Getting Started Guide](./GETTING_STARTED.md) - Detailed setup instructions
- [Implementation Details](./IMPLEMENTATION_COMPLETE.md) - Technical documentation
- [Auth Setup](./AUTH_SETUP.md) - Authentication configuration

## 🛠️ Tech Stack

- **Frontend**: React Router v7, React, TypeScript
- **Backend**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **ORM**: Drizzle ORM
- **Auth**: JWT (jose library), bcrypt
- **UI**: shadcn/ui, Tailwind CSS, Magic UI
- **Build**: Vite
- **Package Manager**: Bun

## 📱 Routes

### Public
- `/` - Home page
- `/:alias` - Short link redirect
- `/login` - Login page
- `/register` - Registration

### Protected (Admin)
- `/admin/links` - Link management
- `/admin/analytics` - Analytics dashboard

### API
- `/api/create` - Create short link
- `/api/update` - Update link
- `/api/delete` - Delete link

## 🎯 Features in Detail

### Authentication
- JWT tokens with 7-day expiration
- Encrypted session cookies
- Bcrypt password hashing (12 rounds)
- Optional Turnstile CAPTCHA
- First user becomes admin

### Link Management
- Create links with custom aliases
- Edit both alias and destination URL
- Delete with confirmation
- View click statistics
- Admin sees all links, users see their own

### Analytics
- Total clicks tracking
- Per-link statistics
- Top performing links
- Average performance metrics

### UI/UX
- Responsive design
- Dark/light/system themes
- Magic Card gradient effects
- Dialog-based CRUD operations
- Toast notifications
- Breadcrumb navigation

## 🔒 Security

- HTTPS-only cookies
- JWT token validation
- Password strength requirements
- Role-based access control
- Optional CAPTCHA protection

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 👨‍� Author

Made by [Vũ Thành Trung](https://discord.gg/TR8k3MtjNZ)

Original inspiration: [Next.JS URL Shortener](https://github.com/vuthanhtrung2010/url-shortener)
