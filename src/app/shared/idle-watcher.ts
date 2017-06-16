export class IdleWatcherUtil {
  constructor() {}

  /**
   * Generates session length
   */
  public generateSessionLength() : number {

    let sessionLengthInMins: number = 90;
    let sessionLengthInSecs: number = sessionLengthInMins * 60;

    return sessionLengthInSecs;
  }

  /**
   * Generates idle time
   */
  public generateIdleTime() : number {

    let idleTimeLengthInMins: number = 1;
    let idleTimeLengthInSecs: number = idleTimeLengthInMins * 60;

    return idleTimeLengthInSecs;
  }
}