import type { Status } from '@/types'

/** 되돌리기: status만 wishlist로 바꾸고 별점·후기·방문일은 남겨둔다.
 *  다시 '다녀온 곳'으로 바꾸면 VisitedDialog가 이 값들로 프리필된다. */
export const REVERT_TO_WISHLIST_PATCH: { status: Status } = { status: 'wishlist' }
