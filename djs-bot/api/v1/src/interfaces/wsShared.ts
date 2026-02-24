////////////////////////////////////////////////////////////////////////////////////////////////////
// "Shared Types"
// Must be in sync with dashboard interfaces (Lavalink-Client track shape)
////////////////////////////////////////////////////////////////////////////////////////////////////

export interface ITrack {
  id: number;
  duration?: number;
  requesterId?: string;
  encoded?: string;
  identifier?: string;
  isSeekable?: boolean;
  author?: string;
  length?: number;
  isStream?: boolean;
  position?: number;
  title?: string;
  sourceName?: string;
  uri?: string;
  track?: string;
  thumbnail?: string | null;
  requester?: unknown;
}

export const enum ESocketEventType {
  ERROR,
  SEEK,
  GET_QUEUE,
  SEARCH,
  ADD_TRACK,
  PLAYING,
  PLAY,
  PAUSE,
  PROGRESS,
  PREVIOUS,
  NEXT,
  UPDATE_QUEUE,
  REMOVE_TRACK,
}

export const enum ESocketErrorCode {
  NOTHING,
  INVALID_EVENT,
  // these should probably in new field called 'status'?
  INTERNAL_SERVER_ERROR,
  BAD_REQUEST,
}

export interface ISocketData {
  [ESocketEventType.ERROR]: { code: ESocketErrorCode; message?: string };
  [ESocketEventType.SEEK]: number;
  [ESocketEventType.GET_QUEUE]: ITrack[];
  [ESocketEventType.SEARCH]: {
    // query
    q: string;
  };
  [ESocketEventType.ADD_TRACK]: {
    // !TODO: track data
  };
  [ESocketEventType.PLAYING]: ITrack;
  [ESocketEventType.PLAY]: null;
  [ESocketEventType.PAUSE]: boolean;
  [ESocketEventType.PROGRESS]: number;
  [ESocketEventType.PREVIOUS]: null;
  [ESocketEventType.NEXT]: null;
  [ESocketEventType.UPDATE_QUEUE]: number[];
  [ESocketEventType.REMOVE_TRACK]: number;
  // !TODO: other events
}

export interface ISocketEvent<K extends ESocketEventType> {
  e: K;
  d: ISocketData[K] | null;
}

export interface IConstructITrackOptions {
  track: ITrack;
  id: number;
  hqThumbnail?: boolean;
}

////////////////////////////////////////////////////////////////////////////////////////////////////
