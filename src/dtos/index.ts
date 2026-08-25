export {
  createTripDefaultValues,
  createTripSchema,
  type CreateTripDTO,
  type CreateTripFormValues,
} from './trip/CreateTripDTO';

export {
  cloneTripDefaultValues,
  cloneTripFormSchema,
  type CloneActivityDto,
  type CloneTripDto,
  type CloneTripFormDTO,
  type CloneTripFormValues,
  type CloneTripRequestDto,
  type CloneTripResponseDto,
} from './trip/CloneTripDTO';

export type { UploadTripCoverResponseDto } from './trip/UploadTripCoverDTO';

export {
  createActivityDefaultValues,
  createActivitySchema,
  type CreateActivityDTO,
  type CreateActivityFormValues,
} from './activity/CreateActivityDTO';

export {
  signUpDefaultValues,
  signUpFormSchema,
  toSignUpDTO,
  type SignUpDTO,
  type SignUpFormValues,
} from './auth/SignUpDTO';

export {
  signInDefaultValues,
  signInFormSchema,
  toSignInDTO,
  type SignInDTO,
  type SignInFormValues,
} from './auth/SignInDTO';

export {
  SYNC_COVER_IMAGE_PLACEHOLDER,
  mapActivityToSyncDto,
  mapLocalTripsToSyncPayload,
  mapTripToSyncDto,
  type LocalTripWithActivities,
  type SyncActivityDto,
  type SyncActivityResponseDto,
  type SyncTripDto,
  type SyncTripResponseDto,
  type SyncTripsDto,
  type SyncTripsResponseDto,
} from './sync/SyncTripsDTO';

export type {
  GetPublicFeedQuery,
  GetPublicFeedResponseDto,
  PublicFeedAuthorDto,
  PublicFeedItemDto,
} from './social/PublicFeedDTO';

export type {
  PublicTripActivityDto,
  PublicTripCategoryDto,
  PublicTripDto,
} from './social/PublicTripDTO';
