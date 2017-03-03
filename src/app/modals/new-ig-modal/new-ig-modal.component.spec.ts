import { NewIgModal } from './new-ig-modal.component';
import { BehaviorSubject, Observable } from 'rxjs/Rx';

describe('NewIgModal', () => {
    let newIgModal: NewIgModal;
    let mockFormBuilder: any;
    let mockAuth: any;
    let mockAssets: any;

    beforeEach(() => {
        mockFormBuilder = {
            group: () => { return {}; }
        };
        mockAuth = {
            getUser: () => { return  {
                    institutionId: 24615
                }
            }
        };
        mockAssets = {
            selection: new BehaviorSubject([]).asObservable()
        };
        newIgModal = new NewIgModal(mockAssets, mockAuth, mockFormBuilder, null, null);
        // Initialize
        newIgModal.ngOnInit();
    });

    it('should initialize with an empty tags array', () => {
        expect(newIgModal.tags.length).toBe(0);
    });

    it('have a form submission function that toggles "submitted"', () => {
        newIgModal.igFormSubmit({});
        expect(newIgModal.submitted).toBe(true);
    });

    it('should recognize an Artstor institution user', () => {
        // newIgModal.igFormSubmit({});
        expect(newIgModal.isArtstorUser).toBe(true);
    });
});