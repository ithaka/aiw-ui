// import { NewIgModal } from './new-ig-modal.component'
import { IgFormUtil, IgFormValue } from './new-ig'
import { BehaviorSubject, Observable } from 'rxjs/Rx'

import { ImageGroup } from '../../shared/datatypes'

fdescribe('IgFormUtil', () => {
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
        let description = "this is a string"
        let mockAssets = [{objectId: "12345"}, {objectId: "67890"}]
        let mockUser = { institutionId: 1234567, baseProfileId: 780280 }
        // this group starts out with access for only the user (private)
        let mockImageGroup: ImageGroup = {
            access: [
                { access_type: 300, entity_identifier: mockUser.baseProfileId.toString(), entity_type: 100 }
            ],
            name: "Some title",
            id: "6e6cfa78-8fcd-4b6c-8a79-b183f766c9fb",
            public: false,
            tags: ["sword"],
            description: ""
        }

        it("should correctly process a private image group made by an artstor user", () => {

            let form: IgFormValue = {
                title: "Private Test Ig",
                artstorPermissions: "private", // this can be global, institution or private
                tags: ["tag1", "tag2"]
            }


            let group = util.prepareGroup(form, description, mockAssets, mockUser)
            
            expect(group.id).toBeFalsy() // negative test

            // basic assertions pertaining to each field that is required for group creation
            expect(group.name).toBe(form.title)
            expect(group.access.length).toBe(1)
            expect(group.public).toBeFalsy()
            expect(group.description).toBe(description)
            expect(group.items.length).toBe(2)
            expect(group.items.indexOf(mockAssets[0].objectId)).toBeGreaterThan(-1)
            expect(group.tags.length).toBe(2)
        })

        it("should correctly process an institutional image group", () => {
            let form: IgFormValue = {
                title: "Institution Test Ig",
                artstorPermissions: "institution",
                tags: ["tag1", "tag2"]
            }

            let group = util.prepareGroup(form, description, mockAssets, mockUser)

            expect(group.id).toBeFalsy() // negative test

            expect(group.access.length).toBe(2)
                expect(group.access[1].entity_type).toBe(200)
                expect(group.access[1].entity_identifier).toBe(mockUser.institutionId.toString())
            expect(group.public).toBeFalsy()
        })

        it("should correctly process a global image group", () => {
            let form: IgFormValue = {
                title: "Global Test Ig",
                artstorPermissions: "global",
                tags: ["tag1", "tag2"]
            }

            let group = util.prepareGroup(form, description, mockAssets, mockUser)

            expect(group.id).toBeFalsy()

            expect(group.access.length).toBe(1)
            expect(group.public).toBeFalsy() // global DOES NOT set public here. It uses an API call after the group is created
        })

        it("should remove the institution's access from an image group", () => {
            let form: IgFormValue = {
                title: "Institution Test Ig",
                artstorPermissions: "institution",
                tags: ["tag1", "tag2"]
            }

            let group = util.prepareGroup(form, description, mockAssets, mockUser, mockImageGroup)

            expect(group.name).toBe(form.title)
            expect(group.access.find((access) => {
                return access.entity_identifier == mockUser.institutionId.toString()
            })).toBeTruthy()

        })

    })
})