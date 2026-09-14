import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const baseApi = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
        baseUrl: process.env.NEXT_PUBLIC_API_URL,
        credentials: 'include',
        prepareHeaders: (headers) => {
            const token = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : null
            headers.set('Content-Type', 'application/json')
            if (token) headers.set('Authorization', `Bearer ${token}`)
            return headers
        },
    }),
    tagTypes: ['Me', 'ServerInfo', 'Permissions', 'TokenStats', 'Users'],
    endpoints: () => ({}),
})
