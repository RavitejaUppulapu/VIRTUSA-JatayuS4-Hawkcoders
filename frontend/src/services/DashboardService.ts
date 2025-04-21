import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export interface DashboardFilters {
  device?: string;
  location?: string;
  severity?: string;
  dateRange?: string;
}

export interface DeviceStatus {
  id: string;
  name: string;
  location: string;
  status: "operational" | "warning" | "critical";
  last_updated: string;
}

export interface PredictedFailure {
  id: string;
  device_id: string;
  device_name: string;
  prediction_time: string;
  location: string;
  severity: "critical" | "high" | "medium" | "low";
  risk_score: number;
  effects: string[];
  time_sensitivity: number;
  recommended_actions: string[];
  work_order_id?: string;
}

export interface EnvironmentalAlert {
  id: string;
  type: "weather" | "power" | "network" | "other";
  start_time: string;
  end_time?: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  affected_devices: string[];
  resolution_status: "active" | "resolved" | "investigating";
}

export interface SensorHealth {
  device_id: string;
  sensor_type: string;
  status: "healthy" | "warning" | "critical";
  last_calibration: string;
  next_calibration: string;
  data_gaps: Array<{ start: string; end: string }>;
  connectivity_status: "connected" | "disconnected" | "intermittent";
  calibration_status: "calibrated" | "needs_calibration" | "overdue";
}

export interface KPI {
  mtbf: number;
  mttr: number;
  oee: number;
  predictive_ratio: number;
  failure_rate: number;
  sla_compliance: number;
}

export interface TrendData {
  date: string;
  failure_rate: number;
  predictive_accuracy: number;
  mtbf: number;
  mttr: number;
}

class DashboardService {
  async getKPIs(): Promise<KPI> {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboard/kpis`);
      return response.data;
    } catch (error) {
      console.error("Error fetching KPIs:", error);
      throw error;
    }
  }

  async getPredictions(
    filters?: DashboardFilters
  ): Promise<PredictedFailure[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/dashboard/predictions`,
        {
          params: filters,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching predictions:", error);
      throw error;
    }
  }

  async getEnvironmentalAlerts(): Promise<EnvironmentalAlert[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/dashboard/environmental`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching environmental alerts:", error);
      throw error;
    }
  }

  async getSensorHealth(): Promise<SensorHealth[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/dashboard/sensor-health`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching sensor health:", error);
      throw error;
    }
  }

  async getDeviceStatus(): Promise<Record<string, DeviceStatus>> {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboard/devices`);
      return response.data;
    } catch (error) {
      console.error("Error fetching device status:", error);
      throw error;
    }
  }

  async getTrendData(filters?: DashboardFilters): Promise<TrendData[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboard/trends`, {
        params: filters,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching trend data:", error);
      throw error;
    }
  }

  async exportData(filters: DashboardFilters): Promise<Blob> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/dashboard/export`,
        filters,
        {
          responseType: "blob",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error exporting data:", error);
      throw error;
    }
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    try {
      await axios.post(
        `${API_BASE_URL}/dashboard/alerts/${alertId}/acknowledge`
      );
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      throw error;
    }
  }

  async createWorkOrder(failureId: string): Promise<string> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/dashboard/work-orders`,
        { failure_id: failureId }
      );
      return response.data.work_order_id;
    } catch (error) {
      console.error("Error creating work order:", error);
      throw error;
    }
  }
}

export const dashboardService = new DashboardService();
