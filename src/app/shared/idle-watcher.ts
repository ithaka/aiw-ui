export class IdleWatcherUtil {
  constructor() {}

  /**
   * Generates session length
   */
  public static generateSessionLength() : number {

    let sessionLengthInMins: number = 90
    let sessionLengthInSecs: number = sessionLengthInMins * 60

    return sessionLengthInSecs;
  }

  /**
   * Generates idle time
   */
  public static generateIdleTime() : number {

    let idleTimeLengthInMins: number = 1
    let idleTimeLengthInSecs: number = idleTimeLengthInMins * 60

    return idleTimeLengthInSecs;
  }
}