// import { NewIgModal } from './new-ig-modal.component'
import { IgFormUtil, IgFormValue } from './new-ig'
import { BehaviorSubject, Observable } from 'rxjs/Rx'

describe('IgFormUtil', () => {
    // let newIgModal: NewIgModal
    // let mockFormBuilder: any
    // let mockAuth: any
    // let mockAssets: any
    let util: IgFormUtil

    beforeEach(() => {
        // WE USED TO CREATE THE COMPONENT AND TEST IT - WE'RE TRYING WITH TESTING A HELPER CLASS NOW
        // mockFormBuilder = {
        //     group: () => { return {} }
        // }
        // mockAuth = {
        //     getUser: () => { return  {
        //             institutionId: 24615
        //         }
        //     }
        // }
        // mockAssets = {
        //     selection: new BehaviorSubject([]).asObservable()
        // }
        // newIgModal = new NewIgModal(mockAssets, mockAuth, mockFormBuilder, null, null, null)
        // // Initialize
        // newIgModal.ngOnInit()
        util = new IgFormUtil()
    })

    describe("prepareGroup", () => {
        it("should correctly process an image group", () => {

            let form: IgFormValue = {
                title: "Test Ig",
                artstorPermissions: "global", // this can be global, institution or private
                institutionView: false,
                tags: ["tag1", "tag2"]
            }
            let description = "this is a string"
            let mockAssets = [{objectId: "12345"}, {objectId: "67890"}]

            let group = util.prepareGroup(form, description, mockAssets, { institutionId: 1234567 })
            
            expect(group.name).toBe(form.title)
            expect(group.access.length).toBe(2)
        })
    })
})