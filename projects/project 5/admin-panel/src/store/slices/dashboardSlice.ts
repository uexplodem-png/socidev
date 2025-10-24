import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { DashboardStats, ChartData } from '../../types';
import { dashboardAPI } from '../../services/api';

interface DashboardState {
  stats: DashboardStats | null;
  chartData: ChartData[];
  timeRange: '7d' | '30d' | '90d' | 'custom';
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  stats: null,
  chartData: [],
  timeRange: '7d',
  loading: false,
  error: null,
};

export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (timeRange: string) => {
    const response = await dashboardAPI.getStats(timeRange);
    return response;
  }
);

export const fetchChartData = createAsyncThunk(
  'dashboard/fetchChartData',
  async (timeRange: string) => {
    const response = await dashboardAPI.getChartData(timeRange);
    return response;
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setTimeRange: (state, action) => {
      state.timeRange = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch dashboard stats';
      })
      .addCase(fetchChartData.fulfilled, (state, action) => {
        state.chartData = action.payload;
      });
  },
});

export const { setTimeRange, clearError } = dashboardSlice.actions;
export default dashboardSlice.reducer;