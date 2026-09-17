export const ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login/",
    REGISTER: "/auth/register/",
    // TEMP (testing only): OTP-less register, returns JWT directly. Revert to
    // REGISTER + OTP flow when told.
    REGISTER_SIMPLE: "/auth/register-simple/",
    // Like REGISTER_SIMPLE, but the user never types a password — the backend
    // generates one and returns it once alongside the token pair. Used by the
    // landing page's guest quick-apply flow to auto-create an account.
    PHONE_AUTH: "/auth/phone-auth/",
    LOGOUT: "/auth/logout/",
    REFRESH: "/auth/refresh/",
    OTP_VERIFY: "/auth/verify-otp/",
    OTP_RESEND: "/auth/resend-otp/",
    FORGOT_PASSWORD: "/auth/forgot-password/",
    RESET_PASSWORD: "/auth/reset-password/",
  },
  APPLICATION: {
    LIST: "/application/list/",
    MY_LIST: "/application/my-list/",
    CREATE: "/application/create/",
    UPDATE: (guid: string) => `/application/update/${guid}/`,
    DETAIL: (guid: string) => `/application/detail-offers/${guid}/`,
    // Plain detail (no offers/order nested) — any viewer can hit this, not
    // just the listing owner, so it's what the offer-detail page uses.
    DETAIL_PUBLIC: (guid: string) => `/application/detail/${guid}/`,
    // Unpaginated guid+coords projection for the catalog's map view.
    MAP_LIST: "/application/map-list/",
    // Pre-defined listing titles (each pre-attached to a category), searchable
    // via ?q= — powers the title autocomplete in the create/quick-apply wizard.
    TITLE_LIST: "/application/application-title/list/",
    // Ids returned here feed ICreateApplicationRequest/IUpdateApplicationRequest's `images` array.
    IMAGE_CREATE: "/application/image/create/",
    OFFER_CREATE: "/application/offer/create/",
    OFFER_ACCEPT: (guid: string) => `/application/offer/accept/${guid}/`,
    OFFER_MY_LIST: "/application/offer/my-list/",
    OFFER_PRICE_UPDATE: (guid: string) => `/application/offer/price-update/${guid}/`,
    OFFER_AGREEMENT_PREVIEW: (guid: string) => `/application/offer/agreement-preview/${guid}/`,
    ORDER_CREATE: "/application/order/create/",
    ORDER_MY_LIST: "/application/order/my-list/",
    ORDER_MY_MASTER_LIST: "/application/order/my-master-list/",
    ORDER_MASTER_FINISH: (guid: string) => `/application/order/master-finish/${guid}/`,
    ORDER_CUSTOMER_COMPLETE: (guid: string) => `/application/order/customer-complete/${guid}/`,
  },
  MASTER_PROFILE: {
    ME: "/profile/me-profile/",
    CREATE: "/profile/create/",
    UPDATE: (guid: string) => `/profile/update/${guid}/`,
    STATISTICS: (guid: string) => `/profile/statistics/${guid}/`,
  },
  ORGANIZATION: {
    CREATE: "/organization/create/",
    ME: "/organization/me-organization/",
    DETAIL: (guid: string) => `/organization/detail/${guid}/`,
    UPDATE: (guid: string) => `/organization/update/${guid}/`,
    CATALOG_LIST: "/organization/catalog/list/",
    CATALOG_DETAIL: (guid: string) => `/organization/catalog/detail/${guid}/`,
    MEMBER_REGISTER: "/organization/member/register/",
    MEMBER_LIST: "/organization/member/list/",
    MEMBER_DETAIL: (guid: string) => `/organization/member/detail/${guid}/`,
    // guid here is the member's *service* guid, not the member's own guid.
    MEMBER_SERVICE_UPDATE: (guid: string) => `/organization/member/service/update/${guid}/`,
    // profile_guid here — the org owner kicks a member out, or a member
    // leaves on their own; the backend allows either caller.
    MEMBER_LEAVE: (profileGuid: string) => `/organization/member/leave/${profileGuid}/`,
  },
  ORGANIZATION_JOIN_REQUEST: {
    CREATE: "/organization-join-request/create/",
    INVITE: "/organization-join-request/invite/",
    ACCEPT: (guid: string) => `/organization-join-request/accept/${guid}/`,
    REJECT: (guid: string) => `/organization-join-request/reject/${guid}/`,
    CANCEL: (guid: string) => `/organization-join-request/cancel/${guid}/`,
    MY_LIST: "/organization-join-request/my-list/",
    ORG_LIST: "/organization-join-request/org-list/",
  },
  PROPOSAL: {
    CREATE: "/proposal/create/",
  },
  PORTFOLIO: {
    CREATE: "/portfolio/create/",
    DELETE: (guid: string) => `/portfolio/delete/${guid}/`,
    DETAIL: (guid: string) => `/portfolio/detail/${guid}/`,
    LIST: (profileGuid: string) => `/portfolio/list/${profileGuid}/`,
    UPDATE: (guid: string) => `/portfolio/update/${guid}/`,
  },
  // Same shape as ORGANIZATION_DOCUMENT below (title/file/issued_by/issued_at) —
  // an individual master's own certificates/diplomas.
  PROFILE_DOCUMENT: {
    CREATE: "/profile-document/create/",
    DELETE: (guid: string) => `/profile-document/delete/${guid}/`,
    DETAIL: (guid: string) => `/profile-document/detail/${guid}/`,
    LIST: (profileGuid: string) => `/profile-document/list/${profileGuid}/`,
    UPDATE: (guid: string) => `/profile-document/update/${guid}/`,
  },
  // An organization's own certificates/licenses — same shape as
  // PROFILE_DOCUMENT, kept as a separate block since the backend exposes them
  // as two distinct resources.
  ORGANIZATION_DOCUMENT: {
    CREATE: "/organization-document/create/",
    DELETE: (guid: string) => `/organization-document/delete/${guid}/`,
    DETAIL: (guid: string) => `/organization-document/detail/${guid}/`,
    LIST: (organizationGuid: string) => `/organization-document/list/${organizationGuid}/`,
    UPDATE: (guid: string) => `/organization-document/update/${guid}/`,
  },
  // Same shape as ORGANIZATION_INTRO_VIDEO below — a master's own single
  // intro video, shown to clients on their profile.
  PROFILE_INTRO_VIDEO: {
    CREATE: "/profile-intro-video/create/",
    DELETE: (guid: string) => `/profile-intro-video/delete/${guid}/`,
    DETAIL: (guid: string) => `/profile-intro-video/detail/${guid}/`,
    LIST: (profileGuid: string) => `/profile-intro-video/list/${profileGuid}/`,
    UPDATE: (guid: string) => `/profile-intro-video/update/${guid}/`,
  },
  // An organization's own intro video — same shape as PROFILE_INTRO_VIDEO,
  // kept as a separate block since the backend exposes them as two distinct
  // resources.
  ORGANIZATION_INTRO_VIDEO: {
    CREATE: "/organization-intro-video/create/",
    DELETE: (guid: string) => `/organization-intro-video/delete/${guid}/`,
    DETAIL: (guid: string) => `/organization-intro-video/detail/${guid}/`,
    LIST: (organizationGuid: string) => `/organization-intro-video/list/${organizationGuid}/`,
    UPDATE: (guid: string) => `/organization-intro-video/update/${guid}/`,
  },
  USER: {
    PHOTO_UPDATE: "/user/photo-update/",
    ROLE_UPDATE: "/user/role-update/",
  },
  CATEGORY: {
    LIST: "/category/list/",
  },
  JOBS: {
    BASE_CATEGORY_LIST: "/jobs/base-category/list/",
    CATEGORY_LIST: "/jobs/category/list/",
    BASE_CATEGORY_ADDITIONAL_WORK_LIST: "/jobs/base-category-additional-work/list/",
    USER_SERVICE_LIST: (profileGuid: string) => `/jobs/user-service/list/${profileGuid}/`,
    USER_SERVICE_UPDATE: (guid: string) => `/jobs/user-service/update/${guid}/`,
    USER_SERVICE_CATALOG_LIST: "/jobs/user-service/catalog/",
    USER_SERVICE_CATALOG_DETAIL: (guid: string) => `/jobs/user-service/catalog/${guid}/`,
  },
  EXPERIENCE_LEVEL: {
    LIST: "/jobs/experience-leve/list/",
  },
  ADDRESS: {
    COUNTRY_LIST: "/address/country-list/",
    REGION_LIST: "/address/region-list/",
    DISTRICT_LIST: "/address/district-list/",
  },
  WORKERS: {
    LIST: "/workers",
    DETAIL: (id: number) => `/workers/${id}`,
    PROFILE: "/workers/me",
    UPDATE: "/workers/me",
    PORTFOLIO: "/workers/me/portfolio",
    PORTFOLIO_ITEM: (id: number) => `/workers/me/portfolio/${id}`,
    BECOME: "/workers/become",
  },
  CATEGORIES: {
    LIST: "/categories",
    TREE: "/categories/tree",
    DETAIL: (id: number) => `/categories/${id}`,
  },
  BOOKINGS: {
    LIST: "/bookings",
    CREATE: "/bookings",
    DETAIL: (id: number) => `/bookings/${id}`,
    ACCEPT: (id: number) => `/bookings/${id}/accept`,
    COMPLETE: (id: number) => `/bookings/${id}/complete`,
    CANCEL: (id: number) => `/bookings/${id}/cancel`,
    DISPUTE: (id: number) => `/bookings/${id}/dispute`,
  },
  REVIEWS: {
    LIST: "/reviews",
    CREATE: "/reviews",
    WORKER: (workerId: number) => `/reviews/worker/${workerId}`,
  },
  REVIEW: {
    CREATE: "/review/create/",
    LIST: (profileGuid: string) => `/review/list/${profileGuid}/`,
  },
  CUSTOMER_PROFILE: {
    DETAIL: (guid: string) => `/profile/customer-profile/${guid}/`,
  },
  CUSTOMER_REVIEW: {
    LIST: (userGuid: string) => `/customer-review/list/${userGuid}/`,
    // A master rates the customer after finishing the order.
    CREATE: "/customer-review/create/",
  },
  NOTIFICATIONS: {
    LIST: "/notification/list/",
    DETAIL: (guid: string) => `/notification/detail/${guid}/`,
    READ: "/notification/read/",
    UNREAD_COUNT: "/notification/unread-count/",
  },
  DEVICE_TOKEN: {
    REGISTER: "/device-token/register/",
  },
  CONTRACT: {
    DETAIL: (orderGuid: string) => `/contract/detail/${orderGuid}/`,
    MASTER_ACCEPT: (orderGuid: string) => `/contract/master-accept/${orderGuid}/`,
    // guid here is the service's own guid (not an order/contract guid — no
    // order exists yet) — shown to a customer before they place a direct
    // order on a master's priced service.
    USER_SERVICE_PREVIEW: (serviceGuid: string) => `/contract/user-service-preview/${serviceGuid}/`,
  },
  BLOG: {
    LIST: "/blog/list/",
    DETAIL: (guid: string) => `/blog/detail/${guid}/`,
  },
  CHAT: {
    LIST: "/chat/list/",
    START: "/chat/start/",
    IMAGE_CREATE: "/chat/image/create/",
    MESSAGE_CREATE: "/chat/message/create/",
    MESSAGE_UPDATE: (guid: string) => `/chat/message/${guid}/update/`,
    MESSAGE_DELETE: (guid: string) => `/chat/message/${guid}/delete/`,
    MESSAGES: (guid: string) => `/chat/${guid}/messages/`,
    READ: (guid: string) => `/chat/${guid}/read/`,
    // Backend path is literally `/chat/chat/{guid}/delete/` (double "chat").
    DELETE: (guid: string) => `/chat/chat/${guid}/delete/`,
    UNREAD_SUMMARY: "/chat/unread-summary/",
  },
  PROFILE: {
    ME: "/profile/me",
    UPDATE: "/profile/me",
    AVATAR: "/profile/me/avatar",
    CHANGE_PASSWORD: "/profile/me/password",
  },
  FILES: {
    UPLOAD: "/files/upload",
    UPLOAD_MULTIPLE: "/files/upload-multiple",
  },
  MANDATORY_COURSES: {
    LIST: "/mandatory-courses-user/list/",
    DETAIL: (guid: string) => `/mandatory-courses-user/detail/${guid}/`,
    LESSON_PROGRESS_CREATE: "/mandatory-courses-user/lesson-progress/create/",
    COMPLETION_CREATE: "/mandatory-courses-user/completion/create/",
  },
  TERMS_OF_USE: {
    LIST_USER: "/terms-of-use/list-user/",
  },
  PAYMENTS: {
    BALANCE_ME: "/payments/balance/me-balans/",
    BALANCE_DEPOSIT: "/payments/balance/deposit/",
    BALANCE_TRANSACTIONS_MY_LIST: "/payments/balance-transaction/my-list/",
    ESCROW_CREATE: "/payments/escrow/create/",
    ESCROW_DETAIL: (orderGuid: string) => `/payments/escrow/detail/${orderGuid}/`,
    PLATFORM_BALANCE_DEPOSIT: "/payments/platform-balance/deposit/",
  },
  LEGAL_SUPPORT: {
    CATEGORY_LIST: "/legal-support/category/list/",
    REQUEST_CREATE: "/legal-support/request/create/",
    REQUEST_CREATE_BY_ORDER_NUMBER: "/legal-support/request/create-by-order-number/",
    REQUEST_MY_LIST: "/legal-support/request/my-list/",
  },
};
