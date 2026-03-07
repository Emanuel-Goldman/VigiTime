# VigiTime

A simple, single-page React application for tracking and managing your working hours with PDF export functionality.

## Overview

VigiTime is a lightweight web application that helps you track your working hours. Unlike traditional calendar-based tracking, VigiTime uses a custom monthly cycle that runs from the 15th of one month to the 15th of the next month, giving you more flexibility in how you manage your work period tracking.

## Features

- **Working Hours Tracking**: Update and manage your working hours for the current period (15th to 15th)
- **PDF Generation**: Generate a PDF report of your working hours for easy sharing and record-keeping
- **Single Page Application**: All functionality is contained in one intuitive webpage
- **Firebase Hosting**: Deployed and hosted on Firebase for reliable access

## Technology Stack

- **React**: Frontend framework
- **Firebase**: Hosting platform

## Getting Started

### Prerequisites

- Node.js and npm installed
- Firebase CLI (for deployment)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd VigiTime
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The app will be available at `http://localhost:3000`

## Usage

### Tracking Hours

1. Navigate to the main page
2. Enter your working hours for the current period (15th to 15th)
3. Update your hours as needed throughout the period

### Generating PDF Reports

1. Click the "Generate PDF" button
2. A PDF file will be generated showing your working hours
3. Download and save the PDF for your records

## Deployment

This application is configured to be deployed on Firebase Hosting.

### Deploy to Firebase

1. Build the production version:
```bash
npm run build
```

2. Deploy to Firebase:
```bash
firebase deploy
```

## Project Structure

```
VigiTime/
├── README.md
└── [React app files]
```

## License

[Add your license information here]

## Contributing

[Add contribution guidelines if applicable]
