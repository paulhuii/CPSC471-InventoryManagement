# CPSC471 Inventory Management System

A full-stack web application for managing inventory with user authentication.


## Technology Stack

### Frontend
- **React.js** - UI library for building the user interface
- **React Router** - For client-side routing
- **Axios** - Promise-based HTTP client for API requests
- **Context API** - For state management (authentication)

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **Supabase** - PostgreSQL database with built-in authentication
- **JWT** - For secure user authentication and authorization

## Project Structure
cpsc471project/

├── client/ # React frontend application

├── server/ # Node.js backend application

│ └── server.js # Main server file

└── package.json # Root project config with scripts


## Getting Started

### Prerequisites
- Node.js (v14 or newer)
- npm (v6 or newer)

### Installation & Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/paulhuii/CPSC471-InventoryManagement.git
   cd cpsc471project
   
2. Install dependencies and start the application:

   ```bash
    npm run start
    ```
    This command:
- Installs all dependencies (root, client, and server)
- Starts both client and server concurrently

3. For development (after dependencies are installed):

   ```bash
    npm run dev
    ```
    This starts both client and server without reinstalling dependencies.

## Access Points
- Frontend : http://localhost:3000
- Backend API : http://localhost:5000

## Group Members
- Angie Shin
- Phuong Le
- Paul Hui
- Ananya Jain
