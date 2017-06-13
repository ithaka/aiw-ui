import { BehaviorSubject, Observable } from 'rxjs/Rx'
import { IdleWatcherUtil } from './idle-watcher';

fdescribe('IdleWatcherUtil', () => {
    let idleUtil: IdleWatcherUtil 

    beforeEach(() => {
        idleUtil = new IdleWatcherUtil()
    })

    /**
     * Test generating session length, to logout user after inactivity for time equal session length
     */
    describe("setSessionTimeValues", () => {
        
        it("should have a predefined session length of 90 mins", () => {
            let sessionTime: number = idleUtil.generateSessionLength();
            expect(sessionTime).toBe(5400) // 90mins = 5400sec
        })

        it("should have a predefined idle time of 1 min", () => {
            let idleTime: number = idleUtil.generateIdleTime();
            expect(idleTime).toBe(60) // 1min = 60sec
        })
    })
})