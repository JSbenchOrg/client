declare namespace google {
    namespace charts {
        function load(namespace: string, settings: any): any;
        function setOnLoadCallback(handler: Function): void;
        function setOnLoadCallback(handler: () => void): void;
    }

    namespace visualization {
        class BarChart {
            constructor(elem: HTMLElement);
            public draw(a: any, b: any): void;
        }
        function arrayToDataTable(data: any[], firstRowIsData?: boolean): any;
    }
}

declare module 'google' {
    export = google;
}
