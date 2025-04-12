# Predictive Maintenance System

An advanced, multimodal predictive maintenance system that handles diverse data sources (sensor readings, ATM logs, server logs, IoT logs) to forecast potential device failures.

## Features

- Real-time sensor data monitoring
- Log data analysis and correlation
- Predictive maintenance using LSTM-based ML model
- Interactive dashboard with visualizations
- Configurable alert thresholds and rules
- Device status monitoring
- Comprehensive reporting

## System Architecture

The system consists of:

1. **Backend (FastAPI)**

   - RESTful API endpoints
   - ML model for predictions
   - Data processing pipeline

2. **Frontend (React)**
   - Interactive dashboard
   - Real-time data visualization
   - Alert management
   - Settings configuration

## Prerequisites

- Docker and Docker Compose
- Python 3.9+
- Node.js 16+

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd predictive-maintenance-system
   ```

2. Build and start the containers:

   ```bash
   docker-compose up --build
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

## Development Setup

### Backend

1. Create a virtual environment:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Run the backend server:
   ```bash
   uvicorn backend.main:app --reload
   ```

### Frontend

1. Install dependencies:

   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

## API Documentation

The backend API documentation is available at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Data Generation

The system includes a synthetic data generator for testing purposes. To generate sample data:

```python
python data_generator.py
```

This will create a `multimodal_data.csv` file with sample sensor and log data.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
