// /*eslint-disable*/
// import { HttpClientModule } from '@angular/common/http'
// import { TestBed, getTestBed } from '@angular/core/testing'
// import { PactWeb, Matchers } from '@pact-foundation/pact-web'

// // Project Dependencies
// import { GroupService, GroupList, ImageGroup } from '../shared'

// describe('Group Calls #pact #group', () => {

//     let provider;
//     let _groupService;

//     const expectedPrivateGroupList: GroupList = {
//       'success': true,
//       'total': 3,
//       'groups': [
//         {'tags': [], 'sequence_number': 0, 'update_date': '2017-12-06T13:50:41Z', 'name': 'All PC Assets', 'description': '', 'public': false, 'creation_date': '2017-12-06T13:49:57Z', 'id': 'ba35d77a-7b98-49ee-8102-25c7e4a35ae5', 'access': [], 'items': ['SS36904_36904_35824231'], 'group_type': 200, 'owner_id': '706217', 'owner_name': 'air01@artstor.org'},
//         {'tags': ['PC Test', 'MLK'], 'sequence_number': 0, 'update_date': '2017-08-07T16:03:09Z', 'name': 'PC test', 'description': '', 'public': false, 'creation_date': '2017-01-09T23:45:40Z', 'id': '900590', 'access': [], 'items': ['CARNEGIE_700001', 'MOMA_620002', 'MOMA_600006'], 'group_type': 200, 'owner_id': '706217', 'owner_name': 'air01@artstor.org'},
//         {'tags': [], 'sequence_number': 0, 'update_date': '2017-07-07T17:00:40Z', 'name': 'Some Assets', 'description': '', 'public': false, 'creation_date': '2017-07-07T17:00:40Z', 'id': 'a1fc32cc-8859-49f7-a560-5da0c5928500', 'access': [], 'items': ['AAFOLKAIG_10313142481', 'AAFOLKAIG_10313142791', 'AAFOLKAIG_10313143138', 'AAGOIG_10314000081'], 'group_type': 200, 'owner_id': '706217', 'owner_name': 'air01@artstor.org'},
//       ],
//       'tags': [{'key': 'MLK', 'doc_count': 1}, {'key': 'PC Test', 'doc_count': 1}]
//     }

//     // Image Group with id of f907383d-4412-4875-b7bc-344fda158d40
//     const expectedImageGroupObject: ImageGroup = {
//       'description': '<p>Description for a test image group</p>',
//       'owner_name': 'QA Pact',
//       'tags': [],
//       'owner_id': '706217',
//       'sequence_number': 0,
//       'update_date': '2018-10-26T15:36:05Z',
//       'name': 'Test Image Group',
//       'public': false,
//       'creation_date': '2018-10-25T19:37:38Z',
//       'id': 'f907383d-4412-4875-b7bc-344fda158d40',
//       'access': [
//         {
//           'entity_type': 100,
//           'entity_identifier': '500863455',
//           'access_type': 300
//         }
//       ],
//       'items': [
//         {
//           artstorid: 'SS34888_34888_25943882',
//           zoom: { viewerX: 100, viewerY: 500, pointWidth: 600, pointHeight: 800 }
//         },
//         'ABARNITZ_10310367033',
//         'ABARNITZ_10310366171',
//         'ABARNITZ_10310366099',
//         'ABARNITZ_10310365176',
//         'ASITESPHOTOIG_10312738558',
//         'AAFOLKAIG_10313142791',
//         'AAFOLKAIG_10313143138',
//         'AAGOIG_10314000081'
//       ]
//     }

//     // Data for creating a new image group
//     const newImageGroupObject: ImageGroup = {
//       'name': 'Test Image Group',
//       'description' : '<p>Description for a test image group</p>',
//       'tags' : [],
//       'public': false,
//       'items' : [
//         {
//           artstorid: 'SS34888_34888_25943882',
//           zoom: { viewerX: 100, viewerY: 500, pointWidth: 600, pointHeight: 800 }
//         },
//         'ABARNITZ_10310367033',
//         'ABARNITZ_10310366171',
//         'ABARNITZ_10310366099',
//         'ABARNITZ_10310365176',
//         'ASITESPHOTOIG_10312738558',
//         'AAFOLKAIG_10313142791',
//         'AAFOLKAIG_10313143138',
//         'AAGOIG_10314000081'
//       ]
//       // 'access' : [{
//       //   // Example is "Institutional"
//       //   'entity_type': 200,
//       //   'entity_identifier': '24615',
//       //   'access_type': 100
//       // }]
//     }

//     // Verify types of response properties - Private Group List
//     let matcherPrivateGroupListObject = {}
//     Object.keys(expectedPrivateGroupList).forEach( (key) => {
//       matcherPrivateGroupListObject[key] = Matchers.somethingLike(expectedPrivateGroupList[key])
//     })

//     // Verify types of response properties - Individual Image Group
//     let matcherImageGroupObject = {}
//     Object.keys(expectedImageGroupObject).forEach((key) => {
//       if (key === 'items'){
//         if (Array.isArray(expectedImageGroupObject[key]) && expectedImageGroupObject[key][0]){
//           let itemsArray = Matchers.eachLike(expectedImageGroupObject[key][0])
//           matcherImageGroupObject[key] = Matchers.somethingLike(itemsArray)
//         }
//       } else{
//         matcherImageGroupObject[key] = Matchers.somethingLike(expectedImageGroupObject[key])
//       }
//     })

//     beforeAll(function(done) {
//       provider = new PactWeb({ consumer: 'aiw-ui', provider: 'binder-group', port: 1201 })
//       // Required for slower environments
//       setTimeout(function () { done() }, 2000)
//       // Required if run with `singleRun: false` (see karma config)
//       provider.removeInteractions()
//     })

//     afterAll(function (done) {
//       provider.finalize()
//         .then(function () { done() }, function (err) { done.fail(err) })
//     })

//     beforeEach(() => {
//       TestBed.configureTestingModule({
//         providers: [
//           GroupService
//         ],
//         imports: [
//           HttpClientModule
//         ]
//       });

//       _groupService = getTestBed().get(GroupService)
//     });

//     /**
//      * Create group endpoint
//      */
//     describe('createNewGroup', () => {
//       beforeAll((done) =>  {
//         provider.addInteraction({
//           state: 'I am logged in as qapact@artstor.org',
//           uponReceiving: 'a request to create a new image group',
//           withRequest: {
//             method: 'POST',
//             path: '/api/v1/group',
//             headers: { 'Content-Type': Matchers.somethingLike('application/json') }
//           },
//           willRespondWith: {
//             status: 200,
//             headers: { 'Content-Type': 'application/json;charset=UTF-8' },
//             body: expectedImageGroupObject
//           }
//         })
//         .then(() => { done() }, (err) => { done.fail(err) })
//       })

//       afterEach((done) => {
//         provider.verify()
//         .then(function(a) {
//           done()
//         }, function(e) {
//           done.fail(e)
//         })
//       })

//       it('should create a new image group via PUT', function(done) {
//         _groupService.create(newImageGroupObject)
//           .subscribe(res => {
//             expect(res).toEqual(expectedImageGroupObject)
//             done()
//           })
//       })
//     })

//     /**
//      * Mock and test group listing endpoint
//      */
//     describe('getAllPrivateGroups', () => {
//       beforeAll((done) =>  {
//         provider.addInteraction({
//           state: 'I am logged in as qapact@artstor.org',
//           uponReceiving: 'a request for all private groups',
//           withRequest: {
//             method: 'GET',
//             path: '/api/v1/group',
//             query: 'size=48&level=private&from=0&sort=alpha&order=asc'
//           },
//           willRespondWith: {
//             status: 200,
//             headers: { 'Content-Type': 'application/json;charset=UTF-8' },
//             body: matcherPrivateGroupListObject
//           }
//         })
//         .then(() => { done() }, (err) => { done.fail(err) })
//       })

//       afterEach((done) => {
//         provider.verify()
//         .then(function(a) {
//           done()
//         }, function(e) {
//           done.fail(e)
//         })
//       })

//       it('should return a list of private group objects', function(done) {
//         // Run the tests
//         _groupService.getAll('private', 48, 0, [], '', '', 'alpha', 'asc')
//           .subscribe(res => {
//             // Test if the response object has all the keys / properties
//             let actualResKeys = Object.keys(res).sort();
//             let expectedResKeys = [ 'success', 'total', 'tags', 'groups'].sort()
//             expect(actualResKeys).toEqual(expectedResKeys)

//             // Test success to be true
//             expect(res.success).toBeTruthy()

//             // Test total to be numeric
//             expect(res.total).toEqual(jasmine.any(Number))

//             // Test tags array object keys
//             let actualTagKeys = Object.keys(res.tags[0]).sort()
//             let expectedTagKeys = [ 'key', 'doc_count'].sort()
//             expect(actualTagKeys).toEqual(expectedTagKeys)

//             // Test groups array object keys
//             let actualGroupKeys = Object.keys(res.groups[0]).sort()
//             let expectedGroupKeys = [ 'access', 'creation_date', 'description', 'group_type', 'id', 'items', 'name', 'owner_id', 'owner_name', 'public', 'sequence_number', 'tags', 'update_date'].sort()
//             expect(actualGroupKeys).toEqual(expectedGroupKeys)

//             done()
//           },
//           err => {

//           done.fail(err)
//         })
//       });
//     })

//     /**
//      * Mock and test a group/id enpoint (a single group)
//      */
//     describe('GET /api/v1/group/{id}', () => {
//       beforeAll((done) => {

//         provider.addInteraction({
//           uponReceiving: 'a request for an individual image group',
//           withRequest: {
//             method: 'GET',
//             path: '/api/v1/group/f907383d-4412-4875-b7bc-344fda158d40',
//           },
//           willRespondWith: {
//             status: 200,
//             headers: { 'Content-Type': 'application/json;charset=UTF-8' },
//             body: matcherImageGroupObject
//           }
//         })
//           .then(() => { done() }, (err) => { done.fail(err) })
//       })

//       afterEach((done) => {
//         provider.verify()
//           .then(function (a) {
//             done()
//           }, function (e) {
//             done.fail(e)
//           })
//       })

//       it('should return an image group object',
//         function (done) {

//           _groupService.get('f907383d-4412-4875-b7bc-344fda158d40')
//             .subscribe(res => {

//               let actualResKeys = Object.keys(res) // response object keys
//               let resAccessKeys = Object.keys(res.access[0]) // response 'access' object keys

//               let expectedResKeys = [
//                 'description',
//                 'owner_name',
//                 'tags',
//                 'owner_id',
//                 'sequence_number',
//                 'update_date',
//                 'name',
//                 'public',
//                 'creation_date',
//                 'id',
//                 'access',
//                 'items'
//               ]

//               let expectedAccessKeys = [
//                 'entity_type',
//                 'entity_identifier',
//                 'access_type'
//               ]

//               // Test res.keys match expected keys
//               expect(actualResKeys).toEqual(expectedResKeys)

//               // Test res.access.keys
//               expect(resAccessKeys).toEqual(expectedAccessKeys)

//               // Test res.items length
//               expect(res.items.length).toBeGreaterThan(0)
//               done()
//             },
//               err => {
//                 done.fail(err)
//               }
//           )
//         })
//     })

// })
