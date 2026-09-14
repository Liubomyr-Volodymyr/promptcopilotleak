import { baseApi } from './base.api'
import {ServerInfo} from "@/types/server.types";

interface LoginRequest {
    email: string
    password: string
}

interface LoginResponse {
    access_token: string
}

interface MeResponse {
    id: string
    firstName: string
    lastName: string
    email: string
}

export const authApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        login: builder.mutation<LoginResponse, LoginRequest>({
            query: (body) => ({
                url: '/admin/auth/login',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Me'],
        }),
        getMe: builder.query<MeResponse, void>({
            query: () => ({
                url: '/admin/auth/me',
            }),
            providesTags: ['Me'],
        }),
        getServerInfo: builder.query<ServerInfo, void>({
            query: () => ({
                url: '/server/info',
            }),
            providesTags: ['ServerInfo'],
        }),
    }),
})

export const { useLoginMutation, useGetMeQuery, useGetServerInfoQuery } = authApi
