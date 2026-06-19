import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { setCredentials, clearCredentials } from './authSlice'

/**
 * RTK Query base query with silent token refresh.
 *
 * Flow:
 * 1. Inject Authorization header from Redux auth state on every request
 * 2. If a 401 response is received:
 *    a. Call POST /auth/refresh (the httpOnly cookie is sent automatically)
 *    b. If refresh succeeds: store new accessToken, retry the original request
 *    c. If refresh fails: clear credentials and redirect to login
 *
 * Concurrent refresh handling:
 * RTK Query prevents multiple baseQuery instances from running the refresh simultaneously
 * because we use the `mutex` pattern via a module-level flag.
 */

let isRefreshing = false
let pendingRequests = []

function resolveAll(token) {
  pendingRequests.forEach((resolve) => resolve(token))
  pendingRequests = []
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.accessToken
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    return headers
  },
  credentials: 'include', // Include httpOnly cookies for refresh endpoint
})

const baseQueryWithReauth = async (args, api, extraOptions) => {
  // Wait if another request is currently refreshing
  if (isRefreshing) {
    const newToken = await new Promise((resolve) => {
      pendingRequests.push(resolve)
    })
    // Retry with the new token
    const retryArgs = typeof args === 'string'
      ? args
      : { ...args, headers: { ...args.headers, Authorization: `Bearer ${newToken}` } }
    return rawBaseQuery(retryArgs, api, extraOptions)
  }

  let result = await rawBaseQuery(args, api, extraOptions)

  if (result.error?.status === 401 || result.error?.data?.code === 'TOKEN_EXPIRED') {
    isRefreshing = true

    try {
      // Attempt to refresh the access token
      const refreshResult = await rawBaseQuery(
        { url: '/auth/refresh', method: 'POST' },
        api,
        extraOptions
      )

      if (refreshResult.data?.accessToken) {
        const newToken = refreshResult.data.accessToken
        // Store new credentials in Redux
        api.dispatch(
          setCredentials({
            user: refreshResult.data.user,
            accessToken: newToken,
          })
        )

        // Resolve all queued requests with the new token
        resolveAll(newToken)
        isRefreshing = false

        // Retry the original request with the new token
        result = await rawBaseQuery(args, api, extraOptions)
      } else {
        // Refresh failed — clear auth state and force login
        resolveAll(null)
        isRefreshing = false
        api.dispatch(clearCredentials())
      }
    } catch {
      resolveAll(null)
      isRefreshing = false
      api.dispatch(clearCredentials())
    }
  }

  return result
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Resume', 'Interview', 'Jobs', 'Trainer', 'Community'],
  endpoints: (builder) => ({
    // --- Auth endpoints ---
    register: builder.mutation({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    login: builder.mutation({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    logout: builder.mutation({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      invalidatesTags: ['User', 'Resume'],
    }),
    getMe: builder.query({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    completeOnboarding: builder.mutation({
      query: (body) => ({ url: '/auth/onboarding', method: 'PUT', body }),
      invalidatesTags: ['User'],
    }),

    // --- Resume endpoints ---
    analyzeResumeText: builder.mutation({
      query: (body) => ({ url: '/resumes/analyze', method: 'POST', body }),
      invalidatesTags: ['Resume'],
    }),
    uploadAndAnalyzeResume: builder.mutation({
      query: (formData) => ({
        url: '/resumes/upload-and-analyze',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Resume'],
    }),
    getResumeHistory: builder.query({
      query: () => '/resumes/history',
      providesTags: ['Resume'],
    }),
    getResume: builder.query({
      query: (id) => `/resumes/${id}`,
      providesTags: (result, error, id) => [{ type: 'Resume', id }],
    }),
    submitResumeFeedback: builder.mutation({
      query: (body) => ({ url: '/resumes/feedback', method: 'POST', body }),
    }),

    // --- Interview endpoints ---
    createInterviewSession: builder.mutation({
      query: (body) => ({ url: '/interviews/sessions', method: 'POST', body }),
      invalidatesTags: ['Interview', 'User'],
    }),
    submitInterviewAnswer: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/interviews/sessions/${id}/answer`, method: 'POST', body }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Interview', id }],
    }),
    getInterviewHistory: builder.query({
      query: () => '/interviews/sessions',
      providesTags: ['Interview'],
    }),
    getInterviewSession: builder.query({
      query: (id) => `/interviews/sessions/${id}`,
      providesTags: (result, error, id) => [{ type: 'Interview', id }],
    }),
    completeInterviewSession: builder.mutation({
      query: (id) => ({ url: `/interviews/sessions/${id}/complete`, method: 'PATCH' }),
      invalidatesTags: (result, error, id) => [{ type: 'Interview', id }, 'Interview', 'User'],
    }),

    // --- Job endpoints ---
    getJobs: builder.query({
      query: () => '/jobs',
      providesTags: ['Job'],
    }),
    createJob: builder.mutation({
      query: (body) => ({ url: '/jobs', method: 'POST', body }),
      invalidatesTags: ['Job'],
    }),
    updateJobStatus: builder.mutation({
      query: ({ id, status }) => ({ url: `/jobs/${id}/status`, method: 'PATCH', body: { status } }),
      invalidatesTags: ['Job'],
    }),
    deleteJob: builder.mutation({
      query: (id) => ({ url: `/jobs/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Job'],
    }),
    matchJD: builder.mutation({
      query: (body) => ({ url: '/jobs/match', method: 'POST', body }),
      invalidatesTags: ['User'], // Because it uses AI quota
    }),
    getJobInsight: builder.query({
      query: (roleTitle) => `/jobs/insight?roleTitle=${encodeURIComponent(roleTitle)}`,
    }),

    // --- Dashboard endpoints ---
    getDashboardNews: builder.query({
      query: () => '/dashboard/news',
    }),
    getDashboardEvents: builder.query({
      query: () => '/dashboard/events',
    }),

    // --- Leaderboard endpoints ---
    getGlobalLeaderboard: builder.query({
      query: () => '/leaderboard',
      providesTags: ['User'], // Gamification state is tied to user
    }),
    getCampusLeaderboard: builder.query({
      query: () => '/leaderboard/campus',
      providesTags: ['User'],
    }),

    // --- Community Endpoints ---
    getExperiences: builder.query({
      query: (params) => ({
        url: '/community/experiences',
        params,
      }),
      providesTags: ['Community'],
    }),
    submitExperience: builder.mutation({
      query: (data) => ({
        url: '/community/experiences',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Community'],
    }),
    toggleExperienceUpvote: builder.mutation({
      query: (id) => ({
        url: `/community/experiences/${id}/upvote`,
        method: 'POST',
      }),
      invalidatesTags: ['Community'],
    }),
    getPendingExperiences: builder.query({
      query: () => '/community/admin/pending',
      providesTags: ['CommunityAdmin'],
    }),
    moderateExperience: builder.mutation({
      query: ({ id, status }) => ({
        url: `/community/admin/moderate/${id}`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['CommunityAdmin', 'Community'],
    }),
    getOpenReviewRequests: builder.query({
      query: () => '/community/reviews/open',
      providesTags: ['Reviews'],
    }),
    submitPeerReview: builder.mutation({
      query: ({ id, data }) => ({
        url: `/community/reviews/${id}/submit`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Reviews', 'User'],
    }),

    // --- Payments Endpoints ---
    createRazorpayOrder: builder.mutation({
      query: (data) => ({
        url: '/payments/create-order',
        method: 'POST',
        body: data,
      }),
    }),
    verifyRazorpayPayment: builder.mutation({
      query: (data) => ({
        url: '/payments/verify',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    // --- TPO Dashboard Endpoints ---
    getTpoDashboard: builder.query({
      query: () => '/tpo/dashboard',
      providesTags: ['TPO'],
    }),

    // --- Chat Agent Endpoints ---
    sendChatMessage: builder.mutation({
      query: (data) => ({
        url: '/chat',
        method: 'POST',
        body: data,
      }),
    }),
  }),
})

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useCompleteOnboardingMutation,
  useAnalyzeResumeTextMutation,
  useUploadAndAnalyzeResumeMutation,
  useGetResumeHistoryQuery,
  useGetResumeQuery,
  useSubmitResumeFeedbackMutation,
  useCreateInterviewSessionMutation,
  useSubmitInterviewAnswerMutation,
  useGetInterviewHistoryQuery,
  useGetInterviewSessionQuery,
  useCompleteInterviewSessionMutation,
  useGetJobsQuery,
  useCreateJobMutation,
  useUpdateJobStatusMutation,
  useDeleteJobMutation,
  useMatchJDMutation,
  useGetJobInsightQuery,
  useGetDashboardNewsQuery,
  useGetDashboardEventsQuery,
  useGetGlobalLeaderboardQuery,
  useGetCampusLeaderboardQuery,
  useGetExperiencesQuery,
  useSubmitExperienceMutation,
  useToggleExperienceUpvoteMutation,
  useGetPendingExperiencesQuery,
  useModerateExperienceMutation,
  useGetOpenReviewRequestsQuery,
  useSubmitPeerReviewMutation,
  useCreateRazorpayOrderMutation,
  useVerifyRazorpayPaymentMutation,
  useGetTpoDashboardQuery,
  useSendChatMessageMutation,
} = api
