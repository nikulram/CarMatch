# CarMatch

CarMatch, originally developed as Vahana, is a full-stack vehicle marketplace and ride comparison platform built as a capstone project. The app combines vehicle buying, selling, renting, messaging, profile management, digital wallet features, invoice generation, 3D and AR vehicle previews, and route-based ride comparison into one web platform.

This repository is published as a portfolio and showcase version of the project. Live production credentials, private environment files, and deployment secrets are intentionally removed.

## Project Overview

CarMatch was designed to make vehicle discovery and transactions more interactive, organized, and user-friendly. Users can browse listings, list vehicles, manage profiles, compare route options, communicate through messages, and view vehicle media through a modern mobile-first interface.

The project uses a MERN-style architecture with a React frontend, Node.js and Express backend, MongoDB database, Cloudinary-based media handling, and third-party API integrations.

## Key Features

- User registration, login, authentication, and email verification
- Vehicle listing creation for sale or rental
- Vehicle search, filtering, and detail pages
- Swipe-based vehicle discovery interface
- User profiles, public profiles, and profile editing
- Favorites, inbox, notifications, and messaging flows
- Admin dashboard and verification request management
- Checkout, order history, wallet, and invoice-related flows
- Hitch route comparison logic using routing data
- 3D and AR vehicle preview support
- Mobile-first UI with custom CSS and reusable components

## Tech Stack

### Frontend

- React
- React Router
- CSS modules and custom CSS
- Framer Motion
- Leaflet
- Axios
- Socket.io client

### Backend

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT authentication
- Bcrypt password hashing
- Multer upload handling
- Cloudinary SDK
- Nodemailer or email service utilities
- Socket.io

### Deployment Used During Development

- Frontend: Netlify
- Backend: Render
- Database: MongoDB Atlas
- Media storage: Cloudinary

## Repository Structure

```text
CarMatch/
├── carmatch-backend/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── carmatch-frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── assets/
│   │   └── images/
│   ├── package.json
│   └── .env.example
├── package.json
├── netlify.toml
└── README.md
```

## Environment Setup

Real environment files are not included in this repository.

Create environment files from the examples:

```bash
cp carmatch-backend/.env.example carmatch-backend/.env
cp carmatch-frontend/.env.example carmatch-frontend/.env
```

Then fill in your own local development values.

### Backend Environment Variables

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
OPENROUTESERVICE_API_KEY=your_openrouteservice_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
EMAIL=your_email_address
EMAIL_PASSWORD=your_email_app_password
```

### Frontend Environment Variables

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_unsigned_upload_preset
```

## Local Development

Install dependencies from the root if using the root scripts, or install separately inside each app.

```bash
npm install
cd carmatch-backend
npm install
cd ../carmatch-frontend
npm install
```

Run the backend:

```bash
cd carmatch-backend
npm start
```

Run the frontend:

```bash
cd carmatch-frontend
npm start
```

## Security Notes

- Real .env files are ignored by Git.
- API keys, database credentials, email passwords, and private deployment secrets are not included.
- node_modules is ignored and should be installed locally with npm.
- This repository is intended as a public showcase version, not an active production deployment.

## Team Contributions

This project was completed as a team capstone project.

- Nikul Ram - Team Leader, Development, Wireframing, DB/App Management, and core application architecture.
- Chris Flores - Hybrid, UI/UX/CSS and Development.
- Ghulam M. Siddiqui - Development and DB/App Management.
- Mihail Karamanolev - UI/UX/CSS and Brightspace/Class related work.


## Project Status

This project was completed on May 10, 2025. It is no longer actively maintained and is published for portfolio, academic, and showcase purposes.

## License

This project is licensed under the MIT License. You may use, copy, modify, and distribute it freely, but the copyright notice and license text must be included with copies or substantial portions of the software.
