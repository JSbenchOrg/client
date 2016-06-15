export class Util {
    public static randomString(len: number, charSet?: string): string {
        charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var randomString = '';
        for (var i = 0; i < len; i++) {
            var randomPoz = Math.floor(Math.random() * charSet.length);
            randomString += charSet.substring(randomPoz, randomPoz + 1);
        }
        return randomString;
    }

    /**
     * Get the real number of properties from an object.
     *
     * @param {object} o
     * @returns {number}
     */
    public static getObjLength(o: Object): number {
        if (typeof o !== 'object' || o === null) {
            return 0;
        }

        var l: number = 0;
        var k: any;

        if (typeof Object.keys === 'function') {
            l = Object.keys(o).length;
        } else {
            for (k in o) {
                if (o.hasOwnProperty(k)) {
                    l++;
                }
            }
        }

        return l;
    }
}