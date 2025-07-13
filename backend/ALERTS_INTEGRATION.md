# Alerts Integration with OpenAI API

This document explains how the `alerts.json` file is integrated with the OpenAI API to provide intelligent responses in the AI chat functionality.

## Overview

The system now uses the actual alerts data from `alerts.json` to provide context-aware responses through the OpenAI API. This enables the AI assistant to give more accurate and relevant information based on the current state of the predictive maintenance system.

## Key Features

### 1. OpenAI API Integration
- **API Key**: The OpenAI API key is directly configured in `app.py`
- **Model**: Uses GPT-3.5-turbo for intelligent responses
- **Context**: Provides alerts data and device information to the AI

### 2. Alerts Data Analysis
- **Loading**: Alerts are loaded from `alerts.json` file
- **Analysis**: Provides statistics, insights, and trends
- **Real-time**: Uses current alerts data for responses

### 3. Enhanced AI Chat
The AI chat now supports:
- **Alert queries**: "Show me critical alerts", "How many warning alerts?"
- **Device queries**: "Show critical devices", "What devices are operational?"
- **Maintenance queries**: "What needs maintenance?", "Show maintenance alerts"
- **Statistics**: "Show alert statistics", "Give me a summary"
- **Intelligent responses**: Uses OpenAI for complex queries

## API Endpoints

### 1. AI Chat Endpoint
```
POST /ai-chat
```
- Accepts user messages
- Provides intelligent responses based on alerts data
- Uses OpenAI API for complex analysis

### 2. Alerts Analysis Endpoint
```
GET /alerts/analysis
```
- Returns detailed analysis of alerts data
- Includes statistics, insights, and trends
- Provides device-wise analysis

## How It Works

### 1. Data Flow
1. User sends message to `/ai-chat`
2. System loads current alerts from `alerts.json`
3. Analyzes alerts data for context
4. Prepares prompt with alerts and device information
5. Sends to OpenAI API for intelligent response
6. Returns contextual response to user

### 2. Context Preparation
The system provides the following context to OpenAI:
- **Current alerts**: List of active alerts with severity and messages
- **Device information**: Status, type, and location of all devices
- **Analysis**: Statistics and insights from alerts data
- **User question**: The specific query from the user

### 3. Response Types
- **Direct queries**: For specific alert/device questions
- **Statistical analysis**: For summary and trend questions
- **Intelligent analysis**: For complex maintenance questions
- **Fallback responses**: For general maintenance topics

## Example Queries and Responses

### Alert Queries
- **Input**: "Show me critical alerts"
- **Response**: Lists critical alerts with device names and severity

### Device Queries
- **Input**: "What devices are in warning status?"
- **Response**: Lists devices with warning status and locations

### Maintenance Queries
- **Input**: "What needs maintenance attention?"
- **Response**: Lists alerts requiring maintenance with recommendations

### Statistical Queries
- **Input**: "Show me alert statistics"
- **Response**: Provides comprehensive statistics and insights

## Configuration

### OpenAI API Key
The API key is configured in `app.py`:
```python
openai.api_key = "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"
```

### Alerts File
The system automatically loads alerts from `alerts.json` in the backend directory.

## Testing

Run the test script to verify integration:
```bash
python test_alerts_integration.py
```

This will test:
- Loading alerts from `alerts.json`
- Analyzing alerts data
- OpenAI API configuration
- Integration functionality

## Benefits

1. **Context-Aware Responses**: AI provides responses based on actual system state
2. **Intelligent Analysis**: Uses OpenAI for complex maintenance questions
3. **Real-time Data**: Uses current alerts data for accurate information
4. **Comprehensive Insights**: Provides statistics and trends from alerts
5. **User-Friendly**: Natural language queries with helpful responses

## Error Handling

The system includes robust error handling:
- Falls back to keyword-based responses if OpenAI fails
- Provides helpful error messages for data issues
- Gracefully handles missing or corrupted alerts data
- Logs errors for debugging

## Future Enhancements

Potential improvements:
- Add more sophisticated alert analysis
- Include historical trends and patterns
- Provide predictive maintenance recommendations
- Add support for more complex queries
- Integrate with additional data sources 