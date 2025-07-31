# Predictive Maintenance Banking Infrastructure (PMBI)

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
- React.js 18.2.0
- Material-UI (MUI) 5.17.1
- Recharts 2.15.2 for data visualization
- Chart.js 4.4.1 with react-chartjs-2 5.2.0
- Axios 1.8.4 for API communication
- React Router DOM 6.30.0 for routing
- Cypress 14.5.1 for E2E testing

### Backend
- FastAPI 0.104.1 (Python)
- TensorFlow 2.10.0+ for ML models
- Scikit-learn 1.3.2 for machine learning
- Pandas 1.5.0+ for data processing
- NumPy 1.21.0+ for numerical operations
- SQLAlchemy 2.0.23 for database operations
- OpenAI 1.1.0+ for AI integration

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Python 3.10+
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

4. Run E2E tests (optional)
```bash
cd frontend
npx cypress open
```

5. Alternative: Use the main runner script
```bash
python run.py
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
│   │   │   ├── Alerts.js           # Alert management and notifications
│   │   │   ├── DeviceStatus.js     # Device health monitoring
│   │   │   ├── DeviceInfo.js       # Detailed device information
│   │   │   ├── AIChat.js           # AI-powered assistance
│   │   │   ├── Reports.js          # Analytics and reporting
│   │   │   ├── Settings.js         # System configuration
│   │   │   ├── MaintenanceTab.js   # Maintenance scheduling
│   │   │   ├── WhyChooseUs.js      # Feature showcase
│   │   │   ├── FailureAnalysis.js  # Failure prediction and analysis
│   │   │   ├── Layout.js           # Application layout
│   │   │   └── Navigation.js       # Navigation components
│   │   ├── App.js          # Main application component
│   │   ├── App.css         # Application styles
│   │   ├── index.js        # Application entry point
│   │   └── index.css       # Global styles
│   ├── public/             # Static assets
│   │   ├── index.html     # HTML template
│   │   ├── manifest.json  # PWA manifest
│   │   └── bank_logo.ico  # Application icon
│   ├── cypress/           # E2E testing
│   │   ├── e2e/          # Test files
│   │   │   ├── alert-resolution.cy.js
│   │   │   ├── alerts.cy.js
│   │   │   ├── chatbot.cy.js
│   │   │   ├── dashboard.cy.js
│   │   │   ├── deviceStatus.cy.js
│   │   │   ├── navigation.cy.js
│   │   │   ├── reports.cy.js
│   │   │   ├── settings.cy.js
│   │   │   └── WhyChooseUs.cy.js
│   │   ├── downloads/     # Test downloads
│   │   └── cypress.config.js # Cypress configuration
│   ├── package.json       # Node.js dependencies
│   ├── package-lock.json  # Dependency lock file
│   └── nginx.conf         # Nginx configuration for Docker
├── backend/                # Backend application
│   ├── app.py             # FastAPI main application
│   ├── ml_model.py        # ML model implementation
│   ├── requirements.txt   # Python dependencies
│   ├── runtime.txt        # Python runtime specification
│   ├── ml/                # Machine learning utilities
│   │   ├── model.py       # Model definitions
│   │   ├── preprocessing.py # Data preprocessing
│   │   └── train.py       # Training scripts
│   ├── tests/             # Backend tests
│   │   ├── tests.py       # Test implementations
│   │   └── __init__.py
│   ├── generated_tests/   # Auto-generated tests
│   │   ├── test_app.py
│   │   ├── test_ml_model.py
│   │   ├── test_model.py
│   │   ├── test_preprocessing.py
│   │   └── test_train.py
│   ├── alerts.json        # Alert configurations
│   ├── generate_backend_tests.py # Test generation script
│   ├── README_GENAI_TESTS.md # Test documentation
│   └── venv/              # Python virtual environment
├── data/                   # Data storage directory
│   ├── models/            # Trained ML models
│   │   ├── predictive_model.h5
│   │   ├── scaler.joblib
│   │   └── training_history.csv
│   ├── processed/         # Processed data
│   └── raw/              # Raw data files
│       ├── combined_data.csv
│       ├── log_data.csv
│       └── sensor_data.csv
├── models/                 # Additional ML models
│   ├── lstm_model.h5
│   └── model_params.joblib
├── data_generator.py       # Synthetic data generation script
├── run.py                 # Main application runner
├── requirements.txt       # Root Python dependencies
├── Dockerfile.backend     # Backend Docker configuration
├── Dockerfile.frontend    # Frontend Docker configuration
├── docker-compose.yml     # Docker Compose configuration
├── training_history.png   # Training history visualization
└── .gitignore            # Git ignore rules
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

### Testing
- Comprehensive E2E testing with Cypress
- Backend unit tests
- Auto-generated test suites
- Test coverage for all major components

### Data Generation
- Synthetic sensor data generation
- Log data simulation
- Realistic banking infrastructure scenarios
- Configurable data parameters

## Docker Deployment

The project includes Docker configuration for easy deployment:

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build individually
docker build -f Dockerfile.backend -t pmbi-backend .
docker build -f Dockerfile.frontend -t pmbi-frontend .
```

### Docker Architecture
- **Backend**: Python 3.10-slim with FastAPI
- **Frontend**: Node.js 18 build with Nginx serving
- **Data Volumes**: Persistent storage for models and data
- **Network**: Frontend proxies API calls to backend

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
- Recharts and Chart.js for the charting libraries
- FastAPI for the backend framework
- TensorFlow and Scikit-learn for machine learning capabilities
- Cypress for E2E testing framework
- Gemini for AI integration
