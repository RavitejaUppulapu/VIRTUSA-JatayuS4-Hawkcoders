# Banking Infrastructure Predictive Maintenance (PMBI)

A comprehensive predictive maintenance system for banking infrastructure, leveraging real-time monitoring, analytics, and machine learning to prevent equipment failures and optimize maintenance schedules.

## Features

- **Real-time Monitoring Dashboard**
  - Device status tracking and visualization
  - Sensor data monitoring
  - Health score analysis
  - Alert management system
  - AI-powered chat assistance

- **Advanced Analytics**
  - Predictive maintenance forecasting
  - Failure analysis and prediction
  - Trend analysis and reporting
  - Performance metrics tracking
  - Cost optimization insights

- **Infrastructure Management**
  - Device inventory and status tracking
  - Maintenance scheduling and history
  - Alert history and management
  - Cost tracking and analysis
  - Settings and configuration management

## Tech Stack

### Frontend
- React.js
- Material-UI
- Recharts for data visualization
- Axios for API communication
- TypeScript (partial implementation)

### Backend
- FastAPI (Python)
- TensorFlow for ML models
- SQLAlchemy for database operations
- Pandas for data processing
- Machine Learning models for predictive analysis

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Python 3.8+
- pip
- Git

### Installation

1. Clone the repository
```bash
git clone https://github.com/RavitejaUppulapu/PMBI.git
cd PMBI
```

2. Set up the backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

3. Set up the frontend
```bash
cd frontend
npm install
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Project Structure

```
PMBI/
├── frontend/                 # Frontend application
│   ├── src/                 # Source files
│   │   ├── components/     # React components
│   │   │   ├── Dashboard.js        # Main dashboard with real-time monitoring
│   │   │   ├── Dashboard.tsx       # TypeScript dashboard component
│   │   │   ├── Alerts.js           # Alert management and notifications
│   │   │   ├── FailureAnalysis.js  # Failure prediction and analysis
│   │   │   ├── DeviceStatus.js     # Device health monitoring
│   │   │   ├── DeviceInfo.js       # Detailed device information
│   │   │   ├── AIChat.js           # AI-powered assistance
│   │   │   ├── Reports.js          # Analytics and reporting
│   │   │   ├── Settings.js         # System configuration
│   │   │   ├── MaintenanceTab.js   # Maintenance scheduling
<!-- │   │   │   ├── AlertDialog.js      # Alert notifications UI -->
│   │   │   ├── WhyChooseUs.js      # Feature showcase
│   │   │   ├── Layout.js           # Application layout
│   │   │   └── Navigation.js       # Navigation components
│   ├── public/             # Static assets
│   │   ├── index.html     # HTML template
│   │   └── assets/        # Images and media
│   ├── js/                # JavaScript utilities
│   ├── package.json       # Node.js dependencies
│   ├── package-lock.json  # Dependency lock file
│   └── nginx.conf         # Nginx configuration
├── backend/                # Backend application
│   ├── app.py             # FastAPI main application
│   ├── ml_model.py        # ML model implementation
│   ├── requirements.txt   # Python dependencies
│   ├── ml/                # Machine learning utilities
│   └── alerts.json        # Alert configurations
├── data/                   # Data storage directory
├── models/                 # Trained ML models
├── data_generator.py       # Data generation script
├── run.py                 # Main application runner
├── requirements.txt       # Python dependencies
├── .gitignore            # Git ignore rules
└── training_history.png   # Training history visualization
```

## Key Features

### Real-time Monitoring
- Comprehensive device status tracking
- Real-time sensor data monitoring
- Health score analysis
- Alert generation and management
- AI-powered assistance

### Predictive Analytics
- Advanced failure prediction
- Maintenance scheduling optimization
- Cost analysis and optimization
- Trend analysis and reporting
- Performance metrics tracking

### Infrastructure Management
- Device inventory management
- Maintenance scheduling
- Alert history and management
- Cost tracking and analysis
- Configuration management

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Material-UI for the component library
- Recharts for the charting library
- FastAPI for the backend framework
- TensorFlow for machine learning capabilities
