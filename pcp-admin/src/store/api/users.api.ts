import { baseApi } from './base.api'
import { User, UsersResponse } from '@/types/users.types'

interface GetUsersParams {
    page?: number
    limit?: number
    search?: string
    role?: string
    isVerified?: boolean
}

interface DeleteUserResponse {
    success: boolean
    message?: string
}

export const usersApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getUsers: builder.query<UsersResponse, GetUsersParams>({
            query: (params) => {
                const queryParams = new URLSearchParams()
                if (params.page) queryParams.append('page', String(params.page))
                if (params.limit) queryParams.append('limit', String(params.limit))
                if (params.search) queryParams.append('search', params.search)
                if (params.role) queryParams.append('role', params.role)
                if (params.isVerified !== undefined) queryParams.append('isVerified', String(params.isVerified))
                
                const queryString = queryParams.toString()
                return {
                    url: `/admin/users${queryString ? `?${queryString}` : ''}`,
                }
            },
            providesTags: ['Users'],
        }),
        deleteUser: builder.mutation<DeleteUserResponse, number>({
            query: (userId) => ({
                url: `/admin/users/${userId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Users'],
        }),
        deleteUsers: builder.mutation<DeleteUserResponse, number[]>({
            query: (userIds) => ({
                url: '/admin/users/bulk-delete',
                method: 'DELETE',
                body: { userIds },
            }),
            invalidatesTags: ['Users'],
        }),
    }),
})

export const { useGetUsersQuery, useDeleteUserMutation, useDeleteUsersMutation } = usersApi
