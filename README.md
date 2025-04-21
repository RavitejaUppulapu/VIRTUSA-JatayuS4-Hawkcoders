# Banking Infrastructure Predictive Maintenance (PMBI)

A comprehensive predictive maintenance system for banking infrastructure, leveraging real-time monitoring, analytics, and machine learning to prevent equipment failures and optimize maintenance schedules.

## Features

- **Real-time Monitoring Dashboard**

  - Device status tracking
  - Sensor data visualization
  - Health score monitoring
  - Alert management

- **Advanced Analytics**

  - Predictive maintenance forecasting
  - Trend analysis
  - Cost optimization
  - Performance metrics

- **Infrastructure Management**
  - Device inventory tracking
  - Maintenance scheduling
  - Alert history
  - Cost tracking

## Tech Stack

### Frontend

- React.js
- Material-UI
- Recharts for data visualization
- Axios for API communication

### Backend

- FastAPI (Python)
- TensorFlow for ML models
- SQLAlchemy for database
- Pandas for data processing

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
│   │   │   ├── Dashboard.js
│   │   │   ├── Alerts.js
│   │   │   ├── FailureAnalysis.js
│   │   │   ├── Layout.js
│   │   │   ├── WhyChooseUs.js
│   │   │   ├── Reports.js
│   │   │   ├── Settings.js
│   │   │   ├── AIChat.js
│   │   │   ├── Navigation.js
│   │   │   └── DeviceStatus.js
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   ├── index.css
│   │   └── reportWebVitals.js
│   ├── public/             # Static files
│   ├── js/                 # JavaScript utilities
│   ├── package.json
│   ├── package-lock.json
│   ├── nginx.conf
│   └── Dockerfile
├── backend/                 # Backend application
│   ├── app.py             # Main FastAPI application
│   ├── ml_model.py        # Machine learning model implementation
│   ├── requirements.txt   # Python dependencies
│   └── ml/                # Machine learning utilities
├── data/                   # Data storage directory
├── models/                 # Trained ML models
├── data_generator.py       # Data generation script
├── test_model.py          # Model testing script
├── run.py                 # Main application runner
├── requirements.txt       # Python dependencies
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Docker compose configuration
├── .gitignore           # Git ignore rules
├── training_history.png  # Training history visualization
├── feature_importance.png # Feature importance visualization
└── confusion_matrix.png  # Model performance visualization
```

## Key Features

### Real-time Monitoring

- Temperature, humidity, and vibration monitoring
- Device status tracking
- Alert generation and management

### Predictive Analytics

- Failure prediction
- Maintenance scheduling
- Cost optimization
- Trend analysis

### Reporting

- Customizable dashboards
- Historical data analysis
- Cost tracking
- Performance metrics

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
