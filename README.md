# DeRadar

A decentralized aircraft tracking platform powered by **AR.IO**, **Arweave**, and **Derad Network Ground Stations**.

Track planes, drones, eVTOLs/Air taxis, balloons..

Flight data is uploaded with **ArDrive Turbo**, stored permanently on **Arweave**, and accessed through fast, global **AR.IO gateways**. Data is queried using **GraphQL**, and the app served via **ArNS** for decentralized, human-readable access.


- **Permanent Web Hosting**: The entire application is deployed on the permaweb, accessed via 500+ Ar.io gateways
- **Saving the Sky for Future**: Flight history remains publicly accessible forever.


## Features

- **Real-time Aircraft Tracking** - Live ADS-B data updates every second
- **Interactive Map** - Multiple tile layers with custom aircraft icons
- **Historical Playback** - Access archived flight data from Arweave blockchain
- **Live Statistics** - Real-time flight records and analytics dashboard
- **Mobile Responsive** - Touch-optimized controls for mobile devices
- **Aircraft Details** - Registration lookup, country flags, and aircraft photos
- **Customizable Settings** - Personalized filters and display preferences
- **Decentralized Storage** - Permanent data storage on Arweave network
- **Wallet Connect** - Connect your wallet and save sky snapshots (early development)
- **Many more..**
  
## Structure
```
deradar/
├── 📁 app/                          # Next.js App Router
├── 📁 components/                   # React components
├── 📁 hooks/                        # Custom React hooks
├── 📁 lib/                          # Core libraries
├── 📁 utils/                        # Utility functions
├── 📁 types/                        # TypeScript definitions
├── 📁 config/                       # Application configuration
├── 📁 public/                       # Static assets
└── 📁 .github/                      # GitHub workflows
```
## Pull Request Guide

We welcome contributions! To ensure a smooth review process, please follow these guidelines when opening a Pull Request (PR):

### Prerequisites

- Fork the repository and create a new branch from `main`.
- Write clear, descriptive commit messages.
- Follow the project's coding style and structure.
- Keep changes focused, one feature or fix per PR.
- (For complex code rewrites, open an issue first)

### Testing

- Ensure your code compiles without errors (`npm run build`).
- Run the development server and manually test your changes.
- If applicable, add or update unit/integration tests.

### Deploy to Arweave with permaweb-deploy

This project supports automated deployment to Arweave using the `permaweb-deploy` tool from Forward Research. This allows you to permanently host your application on the Arweave network and update ArNS names automatically.
