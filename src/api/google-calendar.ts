import { useQuery } from '@tanstack/react-query';
import { customInstance } from './axios-instance';

export interface GoogleCalendarConnectResponse {
  url: string;
}

export interface GoogleCalendarStatusResponse {
  connected: boolean;
}

export const connectGoogleCalendar = (signal?: AbortSignal) =>
  customInstance<GoogleCalendarConnectResponse>({
    url: '/google-calendar/connect',
    method: 'GET',
    signal,
  });

export const getGoogleCalendarStatus = (signal?: AbortSignal) =>
  customInstance<GoogleCalendarStatusResponse>({
    url: '/google-calendar/status',
    method: 'GET',
    signal,
  });

export const GOOGLE_CALENDAR_STATUS_QUERY_KEY = ['google-calendar-status'];

export const useGoogleCalendarStatus = () =>
  useQuery({
    queryKey: GOOGLE_CALENDAR_STATUS_QUERY_KEY,
    queryFn: ({ signal }) => getGoogleCalendarStatus(signal),
  });
