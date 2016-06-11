class TestCase {
    public static createEmpty() {
        return {
            title: '',
            slug: randomString(10),
            description: '',
            status: 'public',
            harness: {
                html: '',
                setUp: '',
                tearDown: ''
            },
            entries: {
                1: {id: 1, title: '', code: ''},
                2: {id: 2, title: '', code: ''}
            }
        };
    }
}

interface TestCaseInterface {
    
}